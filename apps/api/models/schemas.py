"""
Atlas Command — Pydantic Schemas
All request/response models. Mirrors Prisma schema exactly.
"""

from __future__ import annotations

from datetime import datetime, date
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


# ═══════════════════════════════════════════════════════════════════════
#  ENUMS
# ═══════════════════════════════════════════════════════════════════════

class EventType(str, Enum):
    STRIKE = "STRIKE"
    AVIATION = "AVIATION"
    MARITIME = "MARITIME"
    EARTHQUAKE = "EARTHQUAKE"
    CYBER = "CYBER"
    GEOPOLITICAL = "GEOPOLITICAL"
    ECONOMIC = "ECONOMIC"


class Sector(str, Enum):
    ENERGY = "ENERGY"
    MARITIME = "MARITIME"
    AVIATION = "AVIATION"
    CYBER = "CYBER"
    INFRASTRUCTURE = "INFRASTRUCTURE"
    FINANCIAL = "FINANCIAL"
    GEOPOLITICAL = "GEOPOLITICAL"


class RiskLevel(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class Criticality(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class TriggerType(str, Enum):
    REGION = "REGION"
    SECTOR = "SECTOR"
    RISK_LEVEL = "RISK_LEVEL"
    KEYWORD = "KEYWORD"
    ASSET_PROXIMITY = "ASSET_PROXIMITY"


class Relevance(str, Enum):
    DIRECT = "direct"
    SPILLOVER = "spillover"


class ConsequenceDomain(str, Enum):
    ENERGY = "ENERGY"
    MARKETS = "MARKETS"
    TRADE = "TRADE"
    SECURITY = "SECURITY"
    DIPLOMATIC = "DIPLOMATIC"
    HUMANITARIAN = "HUMANITARIAN"


# ═══════════════════════════════════════════════════════════════════════
#  EVENT
# ═══════════════════════════════════════════════════════════════════════

class EventBase(BaseModel):
    title: str
    description: str
    event_time: datetime
    latitude: float
    longitude: float
    region: str
    country: str = Field(max_length=2, description="ISO 3166-1 alpha-2")
    event_type: EventType
    sector: Sector
    source: str
    source_count: int = Field(default=1, ge=1)
    confidence_score: int = Field(ge=0, le=100)
    severity: RiskLevel
    risk_score: int = Field(ge=0, le=100)
    risk_level: RiskLevel

    # Intelligence — English
    situation_en: str
    why_matters_en: str
    forecast_en: str
    actions_en: list[str]
    financial_impact_en: str | None = None
    region_impact_en: str | None = None

    # Intelligence — Arabic
    situation_ar: str | None = None
    why_matters_ar: str | None = None
    forecast_ar: str | None = None
    actions_ar: list[str] = Field(default_factory=list)
    financial_impact_ar: str | None = None
    region_impact_ar: str | None = None


class EventCreate(EventBase):
    pass


class EventResponse(EventBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EventListResponse(BaseModel):
    """Paginated event list."""
    events: list[EventResponse]
    total: int
    page: int
    page_size: int


class EventFilters(BaseModel):
    """Query filters for event list."""
    region: str | None = None
    sector: Sector | None = None
    risk_level: RiskLevel | None = None
    country: str | None = None
    event_type: EventType | None = None
    time_from: datetime | None = None
    time_to: datetime | None = None
    search: str | None = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=50, ge=1, le=200)


# ═══════════════════════════════════════════════════════════════════════
#  INFRASTRUCTURE
# ═══════════════════════════════════════════════════════════════════════

class InfrastructureBase(BaseModel):
    name: str
    infra_type: str
    country: str
    region: str
    latitude: float
    longitude: float
    criticality: Criticality = Criticality.HIGH
    owner: str | None = None
    sector: Sector


class InfrastructureResponse(InfrastructureBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════════════════════════
#  EVENT ↔ INFRASTRUCTURE LINK
# ═══════════════════════════════════════════════════════════════════════

class InfraLinkResponse(BaseModel):
    id: int
    event_id: int
    infrastructure_id: int
    distance_km: float
    impact_type: str
    impact_level: RiskLevel

    # Inline infrastructure details for convenience
    infrastructure: InfrastructureResponse | None = None

    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════════════════════════
#  CONSEQUENCE CHAIN
# ═══════════════════════════════════════════════════════════════════════

class ConsequenceStep(BaseModel):
    step_number: int
    domain: ConsequenceDomain
    consequence_en: str
    consequence_ar: str | None = None
    probability: int = Field(ge=0, le=100)
    timeframe: str  # "0-6h", "6-24h", "24-72h", "1-2w"


class ConsequenceChainResponse(BaseModel):
    event_id: int
    event_title: str
    steps: list[ConsequenceStep]

    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════════════════════════
#  ALERT
# ═══════════════════════════════════════════════════════════════════════

class AlertCreate(BaseModel):
    user_session: str
    name: str
    trigger_type: TriggerType
    trigger_value: str


class AlertResponse(BaseModel):
    id: int
    user_session: str
    name: str
    trigger_type: TriggerType
    trigger_value: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════════════════════════
#  USER PROFILE / ASSETS
# ═══════════════════════════════════════════════════════════════════════

class AssetDefinition(BaseModel):
    """A single user-tracked asset (refinery, port, pipeline, etc.)."""
    name: str
    latitude: float
    longitude: float
    type: str  # "refinery", "port", "pipeline", "office"


class UserProfileCreate(BaseModel):
    session_id: str
    organisation_type: str | None = None
    focus_regions: list[str] = Field(default_factory=list)
    focus_sectors: list[str] = Field(default_factory=list)
    assets: list[AssetDefinition] = Field(default_factory=list)


class UserProfileResponse(BaseModel):
    id: int
    session_id: str
    organisation_type: str | None
    focus_regions: list[str]
    focus_sectors: list[str]
    assets: Any  # Json
    created_at: datetime

    model_config = {"from_attributes": True}


class AssetExposure(BaseModel):
    """Exposure analysis for one user asset."""
    asset: AssetDefinition
    nearby_events: list[NearbyEventSummary]
    threat_level: RiskLevel
    max_risk_score: int


class NearbyEventSummary(BaseModel):
    event_id: int
    title: str
    distance_km: float
    risk_level: RiskLevel
    risk_score: int
    event_type: EventType


class ExposureAnalysis(BaseModel):
    """Full exposure analysis for all user assets."""
    session_id: str
    assets: list[AssetExposure]
    overall_threat: RiskLevel
    generated_at: datetime


# ═══════════════════════════════════════════════════════════════════════
#  MORNING BRIEF
# ═══════════════════════════════════════════════════════════════════════

class MorningBriefResponse(BaseModel):
    id: int
    brief_date: date
    summary_en: str
    summary_ar: str | None
    top_risks_en: Any  # Json list
    top_risks_ar: Any | None
    financial_outlook_en: str | None
    financial_outlook_ar: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class BriefGenerateRequest(BaseModel):
    lang: str = Field(default="en", pattern="^(en|ar)$")


class BriefResponse(BaseModel):
    event_id: int | None = None
    lang: str
    content: str
    generated_at: datetime


# ═══════════════════════════════════════════════════════════════════════
#  ANALYSIS REQUEST/RESPONSE
# ═══════════════════════════════════════════════════════════════════════

class AnalyzeRequest(BaseModel):
    """Request to run full analysis pipeline on an event."""
    event_id: int
    generate_consequences: bool = True
    generate_briefs: bool = True
    langs: list[str] = Field(default=["en", "ar"])


class AnalyzeResponse(BaseModel):
    event_id: int
    risk_score: int
    risk_level: RiskLevel
    consequence_chain: ConsequenceChainResponse | None
    brief_en: str | None
    brief_ar: str | None
    infrastructure_links: list[InfraLinkResponse]
    generated_at: datetime
