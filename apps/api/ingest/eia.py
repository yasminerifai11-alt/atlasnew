"""
Atlas Command — EIA Connector

US Energy Information Administration — Petroleum Spot Prices
https://www.eia.gov/
API docs: https://www.eia.gov/opendata/documentation.php

Schedule: every 1 hour
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

import httpx

from ingest.base import BaseConnector
from models.schemas import EventType, RiskLevel, Sector

logger = logging.getLogger("atlas.ingest.eia")

# EIA API v2 — Petroleum spot prices
EIA_SPOT_URL = "https://api.eia.gov/v2/petroleum/pri/spt/data/"


class EIAConnector(BaseConnector):
    """Monitor Brent crude spot prices for significant 24hr changes."""

    source_name = "EIA"
    dedup_time_window = timedelta(days=1)
    dedup_distance_km = 1000.0

    def __init__(self, session, eia_api_key: str = "") -> None:
        super().__init__(session)
        self.api_key = eia_api_key

    async def fetch(self) -> list[dict]:
        """Fetch last 7 days of petroleum spot prices and check for significant moves."""
        params = {
            "api_key": self.api_key,
            "frequency": "daily",
            "data[]": "value",
            "sort[0][column]": "period",
            "sort[0][direction]": "desc",
            "length": 7,
        }
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(EIA_SPOT_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

        response_data = data.get("response", {}).get("data", [])
        if len(response_data) < 2:
            return []

        latest = response_data[0]
        previous = response_data[1]

        latest_val = float(latest.get("value", 0) or 0)
        prev_val = float(previous.get("value", 0) or 0)

        if prev_val == 0:
            return []

        pct_change = ((latest_val - prev_val) / abs(prev_val)) * 100

        if abs(pct_change) < 3.0:
            return []

        return [{
            "latest_value": latest_val,
            "previous_value": prev_val,
            "pct_change": pct_change,
            "period": latest.get("period", ""),
            "product_name": latest.get("product-name", "Petroleum"),
        }]

    def normalize(self, raw: dict) -> dict | None:
        """Transform an EIA price change into Atlas event format."""
        pct = raw.get("pct_change", 0)
        abs_pct = abs(pct)
        latest_val = raw.get("latest_value", 0)
        prev_val = raw.get("previous_value", 0)
        period = raw.get("period", "")

        direction = "+" if pct > 0 else "-"

        if abs_pct >= 6:
            risk_score = 75
            severity = RiskLevel.HIGH
        else:
            risk_score = 50
            severity = RiskLevel.MEDIUM

        confidence_score = 95

        try:
            event_time = datetime.strptime(period, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except (ValueError, TypeError):
            event_time = datetime.now(timezone.utc)

        title = f"Brent Crude: {direction}{abs_pct:.1f}% in 24 hours"
        description = (
            f"Brent crude spot price moved {direction}{abs_pct:.1f}% in 24 hours. "
            f"Current: ${latest_val:.2f}/bbl (previous: ${prev_val:.2f}/bbl). "
            f"Period: {period}."
        )

        return {
            "title": title,
            "description": description,
            "event_time": event_time,
            "latitude": 26.07,
            "longitude": 50.55,
            "region": "Middle East",
            "country": "BH",
            "event_type": EventType.ECONOMIC,
            "sector": Sector.ENERGY,
            "source": self.source_name,
            "source_count": 1,
            "confidence_score": confidence_score,
            "severity": severity,
            "situation_en": description,
            "why_matters_en": (
                f"Brent crude has moved {direction}{abs_pct:.1f}% in 24 hours, "
                f"reaching ${latest_val:.2f}/bbl. "
                f"{'This level of volatility signals potential supply disruption or major demand shift. ' if abs_pct >= 6 else ''}"
                "GCC economies are directly exposed to oil price movements."
            ),
            "forecast_en": (
                "Monitor for sustained price trend over next 48-72 hours. "
                "Watch OPEC+ response and geopolitical catalysts."
            ),
            "actions_en": '{"Monitor energy futures","Assess fiscal impact on GCC budgets","Review hedging positions","Check supply chain contracts","Watch OPEC+ statements"}',
        }
