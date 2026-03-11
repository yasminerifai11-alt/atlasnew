"""
Atlas Command — Risk Scoring Engine

Computes risk_score (0–100) and risk_level for events.
Factors: event type severity, source corroboration, confidence,
proximity to critical infrastructure, and regional instability.

CRITICAL: 80–100
HIGH:     60–79
MEDIUM:   40–59
LOW:       0–39
"""

from __future__ import annotations

import math
from dataclasses import dataclass

from models.schemas import EventType, RiskLevel, Criticality


# ─── Weight configuration ────────────────────────────────────────────

EVENT_TYPE_BASE_SCORES: dict[str, int] = {
    EventType.STRIKE:       75,
    EventType.MARITIME:     55,
    EventType.AVIATION:     50,
    EventType.CYBER:        60,
    EventType.EARTHQUAKE:   40,
    EventType.GEOPOLITICAL: 50,
    EventType.ECONOMIC:     35,
}

SEVERITY_MULTIPLIERS: dict[str, float] = {
    RiskLevel.CRITICAL: 1.30,
    RiskLevel.HIGH:     1.10,
    RiskLevel.MEDIUM:   0.90,
    RiskLevel.LOW:      0.65,
}

# Higher source count = more confidence = higher score
SOURCE_COUNT_BONUS = {1: 0, 2: 3, 3: 6, 4: 8, 5: 10}

INFRA_CRITICALITY_WEIGHT: dict[str, float] = {
    Criticality.CRITICAL: 15.0,
    Criticality.HIGH:     10.0,
    Criticality.MEDIUM:    5.0,
    Criticality.LOW:       2.0,
}

# Distance decay — closer infrastructure = more dangerous
# Returns multiplier 0.0–1.0
def _distance_decay(km: float) -> float:
    """Exponential decay: 1.0 at 0km, ~0.5 at 20km, ~0.1 at 50km."""
    if km <= 0:
        return 1.0
    return math.exp(-0.035 * km)


# ─── Scoring functions ───────────────────────────────────────────────

@dataclass
class InfraProximity:
    distance_km: float
    criticality: str  # Criticality enum value


def compute_risk_score(
    event_type: str,
    severity: str,
    confidence_score: int,
    source_count: int,
    nearby_infrastructure: list[InfraProximity] | None = None,
) -> int:
    """
    Compute a 0–100 risk score for an event.

    Formula:
      base = EVENT_TYPE_BASE × SEVERITY_MULTIPLIER
      confidence_factor = confidence_score / 100  (0.0–1.0)
      source_bonus = SOURCE_COUNT_BONUS[min(count, 5)]
      infra_proximity = sum of criticality_weight × distance_decay for each asset
      raw = base × confidence_factor + source_bonus + infra_proximity
      score = clamp(raw, 0, 100)
    """
    # 1. Base score from event type
    base = EVENT_TYPE_BASE_SCORES.get(event_type, 40)

    # 2. Severity multiplier
    mult = SEVERITY_MULTIPLIERS.get(severity, 1.0)
    adjusted = base * mult

    # 3. Confidence factor (0.0–1.0)
    conf_factor = max(0.5, confidence_score / 100)  # floor at 0.5 so low-confidence events still register
    adjusted *= conf_factor

    # 4. Source corroboration bonus
    src_bonus = SOURCE_COUNT_BONUS.get(min(source_count, 5), 10)
    adjusted += src_bonus

    # 5. Infrastructure proximity bonus
    infra_bonus = 0.0
    if nearby_infrastructure:
        for infra in nearby_infrastructure:
            weight = INFRA_CRITICALITY_WEIGHT.get(infra.criticality, 2.0)
            decay = _distance_decay(infra.distance_km)
            infra_bonus += weight * decay
        # Cap infra bonus at 20 points
        infra_bonus = min(infra_bonus, 20.0)
    adjusted += infra_bonus

    return _clamp(round(adjusted), 0, 100)


def score_to_level(score: int) -> RiskLevel:
    """Convert numeric risk score to risk level."""
    if score >= 80:
        return RiskLevel.CRITICAL
    if score >= 60:
        return RiskLevel.HIGH
    if score >= 40:
        return RiskLevel.MEDIUM
    return RiskLevel.LOW


def compute_risk(
    event_type: str,
    severity: str,
    confidence_score: int,
    source_count: int,
    nearby_infrastructure: list[InfraProximity] | None = None,
) -> tuple[int, RiskLevel]:
    """Convenience: returns (score, level) tuple."""
    score = compute_risk_score(
        event_type=event_type,
        severity=severity,
        confidence_score=confidence_score,
        source_count=source_count,
        nearby_infrastructure=nearby_infrastructure,
    )
    return score, score_to_level(score)


# ─── Batch scoring ───────────────────────────────────────────────────

def rescore_event(event_row: dict, infra_links: list[dict]) -> tuple[int, RiskLevel]:
    """
    Re-score an event row (dict from DB) with its infrastructure links.
    Used when infrastructure data changes or new links are added.
    """
    proximities = [
        InfraProximity(
            distance_km=link["distance_km"],
            criticality=link.get("infrastructure_criticality", Criticality.MEDIUM),
        )
        for link in infra_links
    ]
    return compute_risk(
        event_type=event_row["event_type"],
        severity=event_row["severity"],
        confidence_score=event_row["confidence_score"],
        source_count=event_row.get("source_count", 1),
        nearby_infrastructure=proximities,
    )


# ─── Helpers ─────────────────────────────────────────────────────────

def _clamp(value: int, lo: int, hi: int) -> int:
    return max(lo, min(hi, value))
