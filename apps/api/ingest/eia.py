"""
Atlas Command — EIA Connector

US Energy Information Administration
https://www.eia.gov/
API docs: https://www.eia.gov/opendata/documentation.php

Schedule: daily
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

import httpx

from ingest.base import BaseConnector
from models.schemas import EventType, RiskLevel, Sector

logger = logging.getLogger("atlas.ingest.eia")

# EIA API v2 base URL
EIA_API_URL = "https://api.eia.gov/v2"

# Series IDs for monitoring
EIA_SERIES = {
    "petroleum_stocks": {
        "route": "/petroleum/stoc/wstk/data/",
        "params": {"frequency": "weekly", "data[]": "value", "sort[0][column]": "period", "sort[0][direction]": "desc", "length": 10},
        "description": "Weekly U.S. Ending Stocks of Crude Oil",
    },
    "petroleum_supply": {
        "route": "/petroleum/sum/sndw/data/",
        "params": {"frequency": "weekly", "data[]": "value", "sort[0][column]": "period", "sort[0][direction]": "desc", "length": 10},
        "description": "Weekly U.S. Supply of Crude Oil",
    },
    "natural_gas_storage": {
        "route": "/natural-gas/stor/wkly/data/",
        "params": {"frequency": "weekly", "data[]": "value", "sort[0][column]": "period", "sort[0][direction]": "desc", "length": 10},
        "description": "Weekly Natural Gas Storage",
    },
}

# Thresholds for anomaly detection (percentage change week-over-week)
ANOMALY_THRESHOLD_PCT = 5.0  # flag if > 5% weekly change


class EIAConnector(BaseConnector):
    """Ingest energy market anomalies from the EIA open data API."""

    source_name = "EIA"
    dedup_time_window = timedelta(days=2)
    dedup_distance_km = 1000.0  # national-level data, wide dedup

    def __init__(self, session, eia_api_key: str = "") -> None:
        super().__init__(session)
        self.api_key = eia_api_key

    async def fetch(self) -> list[dict]:
        """Fetch recent EIA data series and flag anomalies."""
        anomalies: list[dict] = []

        async with httpx.AsyncClient(timeout=30) as client:
            for series_key, series_info in EIA_SERIES.items():
                try:
                    url = f"{EIA_API_URL}{series_info['route']}"
                    params = {**series_info["params"], "api_key": self.api_key}
                    resp = await client.get(url, params=params)
                    resp.raise_for_status()
                    data = resp.json()

                    response_data = data.get("response", {}).get("data", [])
                    if len(response_data) < 2:
                        continue

                    # Check for significant week-over-week changes
                    latest = response_data[0]
                    previous = response_data[1]

                    latest_val = float(latest.get("value", 0) or 0)
                    prev_val = float(previous.get("value", 0) or 0)

                    if prev_val == 0:
                        continue

                    pct_change = ((latest_val - prev_val) / abs(prev_val)) * 100

                    if abs(pct_change) >= ANOMALY_THRESHOLD_PCT:
                        anomalies.append({
                            "series_key": series_key,
                            "description": series_info["description"],
                            "latest_value": latest_val,
                            "previous_value": prev_val,
                            "pct_change": pct_change,
                            "period": latest.get("period", ""),
                            "units": latest.get("units", ""),
                            "series_description": latest.get("series-description", ""),
                        })

                except Exception:
                    logger.warning("EIA: failed to fetch series %s", series_key)

        return anomalies

    def normalize(self, raw: dict) -> dict | None:
        """Transform an EIA anomaly into Atlas event format."""
        pct = raw.get("pct_change", 0)
        series_desc = raw.get("description", "Energy data")
        period = raw.get("period", "")
        latest_val = raw.get("latest_value", 0)
        prev_val = raw.get("previous_value", 0)
        units = raw.get("units", "")

        direction = "increase" if pct > 0 else "decrease"
        abs_pct = abs(pct)

        # Severity based on magnitude of change
        if abs_pct >= 15:
            severity = RiskLevel.CRITICAL
            confidence_score = 90
        elif abs_pct >= 10:
            severity = RiskLevel.HIGH
            confidence_score = 85
        elif abs_pct >= 5:
            severity = RiskLevel.MEDIUM
            confidence_score = 80
        else:
            severity = RiskLevel.LOW
            confidence_score = 70

        # Parse period to datetime
        try:
            event_time = datetime.strptime(period, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except (ValueError, TypeError):
            event_time = datetime.now(timezone.utc)

        title = f"EIA: {abs_pct:.1f}% {direction} in {series_desc}"
        description = (
            f"{series_desc}: {abs_pct:.1f}% weekly {direction}. "
            f"Latest: {latest_val:,.0f} {units} (period: {period}). "
            f"Previous: {prev_val:,.0f} {units}."
        )

        return {
            "title": title[:255],
            "description": description,
            "event_time": event_time,
            "latitude": 39.8283,   # US centroid
            "longitude": -98.5795,
            "region": "Americas",
            "country": "US",
            "event_type": EventType.ECONOMIC,
            "sector": Sector.ENERGY,
            "source": self.source_name,
            "source_count": 1,
            "confidence_score": confidence_score,
            "severity": severity,
            "situation_en": description,
            "why_matters_en": (
                f"U.S. energy data shows a significant {abs_pct:.1f}% weekly {direction} "
                f"in {series_desc.lower()}. This may signal supply disruption, demand shift, "
                "or market volatility affecting global energy prices."
            ),
            "forecast_en": (
                "Monitor for sustained trend over next 2-4 weeks. "
                "Watch for corresponding price movements in crude oil and natural gas futures."
            ),
            "actions_en": '{"Monitor energy futures","Review supply chain exposure","Assess price impact on operations"}',
        }
