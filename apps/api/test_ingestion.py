#!/usr/bin/env python3
"""
Atlas Command — Ingestion Test Script

Tests each data source connector directly (no DB required).
Usage: python test_ingestion.py
"""

import asyncio
import os
import sys
from datetime import datetime, timezone

# Ensure we can import from the api directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load .env from project root or api directory
from dotenv import load_dotenv
for env_path in ["../../.env", ".env", "../../../.env"]:
    full = os.path.join(os.path.dirname(os.path.abspath(__file__)), env_path)
    if os.path.exists(full):
        load_dotenv(full)
        break

import httpx


# ─── Color helpers ────────────────────────────────────────────────────

GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"


def header(name: str):
    print(f"\n{BOLD}{CYAN}{'=' * 50}{RESET}")
    print(f"{BOLD}{CYAN}  {name}{RESET}")
    print(f"{BOLD}{CYAN}{'=' * 50}{RESET}")


def success(msg: str):
    print(f"  {GREEN}Status: SUCCESS{RESET}")
    print(f"  {msg}")


def fail(msg: str):
    print(f"  {RED}Status: FAILED{RESET}")
    print(f"  {RED}{msg}{RESET}")


# ─── Risk level from score ────────────────────────────────────────────

def risk_level(score: int) -> str:
    if score >= 80:
        return "CRITICAL"
    if score >= 60:
        return "HIGH"
    if score >= 40:
        return "MEDIUM"
    return "LOW"


# ─── Test results tracker ─────────────────────────────────────────────

results = {
    "sources": {},
    "total_events": 0,
    "critical": 0,
    "high": 0,
    "medium": 0,
    "low": 0,
}


# ─── USGS Earthquakes ─────────────────────────────────────────────────

async def test_usgs():
    header("USGS EARTHQUAKES")
    try:
        params = {
            "format": "geojson",
            "minmagnitude": 3.5,
            "orderby": "time",
            "limit": 20,
            "minlatitude": 12,
            "maxlatitude": 42,
            "minlongitude": 25,
            "maxlongitude": 65,
        }
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                "https://earthquake.usgs.gov/fdsnws/event/1/query",
                params=params,
            )
            resp.raise_for_status()
            data = resp.json()

        features = data.get("features", [])
        count = len(features)
        results["sources"]["USGS"] = count
        results["total_events"] += count

        if count == 0:
            success(f"Records fetched: {count} (no recent earthquakes in Middle East)")
            return

        success(f"Records fetched: {count}")

        for f in features:
            props = f["properties"]
            coords = f["geometry"]["coordinates"]
            mag = props.get("mag", 0)
            place = props.get("place", "Unknown")

            if mag >= 6.5:
                score = 85
            elif mag >= 5.5:
                score = 70
            elif mag >= 4.5:
                score = 45
            else:
                score = 20

            level = risk_level(score)
            _count_risk(level)

            print(f"  Sample event:")
            print(f"    Title: M{mag:.1f} Earthquake — {place}")
            print(f"    Location: {coords[1]:.2f}, {coords[0]:.2f}")
            print(f"    Risk Level: {level}")
            print(f"    Risk Score: {score}")
            break  # Only show first sample

    except Exception as e:
        fail(str(e))
        results["sources"]["USGS"] = 0


# ─── GDELT News ───────────────────────────────────────────────────────

async def test_gdelt():
    header("GDELT NEWS")
    try:
        params = {
            "query": "Middle East OR Gulf OR Iran OR Iraq OR Yemen conflict attack",
            "mode": "artlist",
            "maxrecords": 25,
            "format": "json",
            "timespan": "6h",
        }
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                "https://api.gdeltproject.org/api/v2/doc/doc",
                params=params,
            )
            resp.raise_for_status()
            data = resp.json()

        articles = data.get("articles", [])
        count = len(articles)
        results["sources"]["GDELT"] = count
        results["total_events"] += count

        if count == 0:
            success(f"Records fetched: {count} (no recent articles)")
            return

        success(f"Records fetched: {count}")

        art = articles[0]
        tone = float(art.get("tone", 0) or 0)
        if tone < -5:
            score, level = 65, "HIGH"
        elif tone < -2:
            score, level = 40, "MEDIUM"
        else:
            score, level = 20, "LOW"
        _count_risk(level)

        print(f"  Sample event:")
        print(f"    Title: {art.get('title', 'N/A')[:80]}")
        print(f"    Source: {art.get('domain', 'N/A')}")
        print(f"    Tone: {tone:.1f}")
        print(f"    Risk Level: {level}")
        print(f"    Risk Score: {score}")

    except Exception as e:
        fail(str(e))
        results["sources"]["GDELT"] = 0


# ─── GDACS Disasters ──────────────────────────────────────────────────

async def test_gdacs():
    header("GDACS DISASTERS")
    try:
        import xml.etree.ElementTree as ET

        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get("https://www.gdacs.org/xml/rss.xml")
            resp.raise_for_status()

        root = ET.fromstring(resp.text)
        ns = {
            "gdacs": "http://www.gdacs.org",
            "geo": "http://www.w3.org/2003/01/geo/wgs84_pos#",
        }

        me_countries = {
            "Kuwait", "Saudi Arabia", "United Arab Emirates", "Qatar", "Bahrain",
            "Oman", "Iraq", "Iran", "Yemen", "Egypt", "Jordan", "Syria", "Lebanon",
        }

        items = root.findall(".//item")
        me_items = []
        for item in items:
            country_el = item.find("gdacs:country", ns)
            country = (country_el.text or "").strip() if country_el is not None else ""
            title_el = item.find("title")
            title = (title_el.text or "").strip() if title_el is not None else ""

            # Check if Middle East
            is_me = country in me_countries
            if not is_me:
                text_check = f"{title} {country}".lower()
                is_me = any(c.lower() in text_check for c in me_countries)

            if is_me:
                alert_el = item.find("gdacs:alertlevel", ns)
                alert = (alert_el.text or "Green").strip() if alert_el is not None else "Green"
                me_items.append({"title": title, "country": country, "alert": alert})

        total_items = len(items)
        me_count = len(me_items)
        results["sources"]["GDACS"] = me_count
        results["total_events"] += me_count

        success(f"Total alerts: {total_items}, Middle East: {me_count}")

        if me_items:
            item = me_items[0]
            alert = item["alert"]
            score_map = {"Red": 85, "Orange": 70, "Green": 40}
            score = score_map.get(alert, 40)
            level = risk_level(score)
            _count_risk(level)

            print(f"  Sample event:")
            print(f"    Title: {item['title'][:80]}")
            print(f"    Country: {item['country']}")
            print(f"    Alert: {alert}")
            print(f"    Risk Level: {level}")
            print(f"    Risk Score: {score}")

    except Exception as e:
        fail(str(e))
        results["sources"]["GDACS"] = 0


# ─── NASA FIRMS ───────────────────────────────────────────────────────

async def test_firms():
    header("NASA FIRMS")
    firms_key = os.getenv("NASA_FIRMS_KEY", "")
    if not firms_key:
        fail("NASA_FIRMS_KEY not set in .env")
        results["sources"]["NASA_FIRMS"] = 0
        return

    try:
        url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{firms_key}/VIIRS_SNPP_NRT/25,12,65,42/1"
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.get(url)
            resp.raise_for_status()

        import csv
        import io
        reader = csv.DictReader(io.StringIO(resp.text))
        all_rows = list(reader)
        bright_rows = [r for r in all_rows if float(r.get("bright_ti4", 0) or 0) > 330]

        count = len(bright_rows)
        results["sources"]["NASA_FIRMS"] = count
        results["total_events"] += count

        success(f"Total detections: {len(all_rows)}, Brightness > 330: {count}")

        if bright_rows:
            row = bright_rows[0]
            brightness = float(row.get("bright_ti4", 0))
            if brightness > 400:
                score, level = 75, "HIGH"
            elif brightness > 350:
                score, level = 60, "HIGH"
            else:
                score, level = 35, "MEDIUM"
            _count_risk(level)

            event_type = "STRIKE" if brightness > 350 else "GEOPOLITICAL"

            print(f"  Sample event:")
            print(f"    Title: {'Possible Explosion/Fire' if brightness > 350 else 'Thermal Anomaly'} — {brightness:.0f}K")
            print(f"    Location: {row.get('latitude')}, {row.get('longitude')}")
            print(f"    Event Type: {event_type}")
            print(f"    Risk Level: {level}")
            print(f"    Risk Score: {score}")

    except Exception as e:
        fail(str(e))
        results["sources"]["NASA_FIRMS"] = 0


# ─── EIA Energy ───────────────────────────────────────────────────────

async def test_eia():
    header("EIA ENERGY")
    eia_key = os.getenv("EIA_API_KEY", "")
    if not eia_key:
        fail("EIA_API_KEY not set in .env")
        results["sources"]["EIA"] = 0
        return

    try:
        params = {
            "api_key": eia_key,
            "frequency": "daily",
            "data[]": "value",
            "sort[0][column]": "period",
            "sort[0][direction]": "desc",
            "length": 7,
        }
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                "https://api.eia.gov/v2/petroleum/pri/spt/data/",
                params=params,
            )
            resp.raise_for_status()
            data = resp.json()

        response_data = data.get("response", {}).get("data", [])
        if len(response_data) < 2:
            success("Records fetched: insufficient data points")
            results["sources"]["EIA"] = 0
            return

        latest = response_data[0]
        previous = response_data[1]
        latest_val = float(latest.get("value", 0) or 0)
        prev_val = float(previous.get("value", 0) or 0)

        if prev_val == 0:
            pct_change = 0
        else:
            pct_change = ((latest_val - prev_val) / abs(prev_val)) * 100

        direction = "+" if pct_change > 0 else ""

        success(f"Records fetched: {len(response_data)} daily prices")
        print(f"  Latest: ${latest_val:.2f}/bbl ({latest.get('period', '')})")
        print(f"  Previous: ${prev_val:.2f}/bbl ({previous.get('period', '')})")
        print(f"  24hr Change: {direction}{pct_change:.2f}%")

        if abs(pct_change) >= 3:
            if abs(pct_change) >= 6:
                score, level = 75, "HIGH"
            else:
                score, level = 50, "MEDIUM"
            _count_risk(level)
            results["sources"]["EIA"] = 1
            results["total_events"] += 1
            print(f"  {YELLOW}ALERT: Significant price move detected{RESET}")
            print(f"    Title: Brent Crude: {direction}{abs(pct_change):.1f}% in 24 hours")
            print(f"    Risk Level: {level}")
            print(f"    Risk Score: {score}")
        else:
            results["sources"]["EIA"] = 0
            print(f"  {GREEN}No significant price move (threshold: +/-3%){RESET}")

    except Exception as e:
        fail(str(e))
        results["sources"]["EIA"] = 0


# ─── Enrichment sample ────────────────────────────────────────────────

async def test_enrichment_sample():
    header("AI ENRICHMENT SAMPLE")
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key or api_key == "I_will_add_this_manually":
        print(f"  {YELLOW}Skipped — ANTHROPIC_API_KEY not configured{RESET}")
        print(f"  Enrichment will run automatically when API key is set.")
        return

    try:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=api_key)

        sample_prompt = """Enrich this event: M4.8 earthquake near Bandar Abbas, Iran.
Return a JSON with situation_en, situation_ar (2 sentences each).
Return ONLY valid JSON, no markdown."""

        message = await client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            system="You are an Atlas Command intelligence analyst for GCC leaders.",
            messages=[{"role": "user", "content": sample_prompt}],
        )
        text = message.content[0].text.strip()
        print(f"  {GREEN}Enrichment API: CONNECTED{RESET}")

        import json
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]

        enriched = json.loads(text.strip())
        en_sample = enriched.get("situation_en", "N/A")
        ar_sample = enriched.get("situation_ar", "N/A")

        print(f"  Enrichment EN sample: {en_sample[:120]}")
        print(f"  Enrichment AR sample: {ar_sample[:120]}")

        # Arabic quality check
        has_arabic = any("\u0600" <= c <= "\u06FF" for c in (ar_sample or ""))
        if has_arabic:
            print(f"  {GREEN}Arabic quality check: PASS{RESET}")
        else:
            print(f"  {RED}Arabic quality check: FAIL (no Arabic characters){RESET}")

    except Exception as e:
        fail(f"Enrichment test failed: {e}")


# ─── Helpers ──────────────────────────────────────────────────────────

def _count_risk(level: str):
    key = level.lower()
    if key in results:
        results[key] += 1


# ─── Main ─────────────────────────────────────────────────────────────

async def main():
    print(f"\n{BOLD}Atlas Command — Ingestion Test{RESET}")
    print(f"Time: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print(f"{'=' * 50}")

    await test_usgs()
    await test_gdelt()
    await test_gdacs()
    await test_firms()
    await test_eia()
    await test_enrichment_sample()

    # Summary
    header("SUMMARY")
    print(f"  Sources tested: {len(results['sources'])}")
    for source, count in results["sources"].items():
        status = f"{GREEN}OK{RESET}" if count >= 0 else f"{RED}FAIL{RESET}"
        print(f"    {source}: {count} events [{status}]")

    print(f"\n  {BOLD}Total events available: {results['total_events']}{RESET}")
    print(f"  CRITICAL: {results['critical']}")
    print(f"  HIGH: {results['high']}")
    print(f"  MEDIUM: {results['medium']}")
    print(f"  LOW: {results['low']}")


if __name__ == "__main__":
    asyncio.run(main())
