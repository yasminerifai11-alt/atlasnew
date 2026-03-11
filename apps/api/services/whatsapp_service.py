"""
Atlas Command — WhatsApp Notification Service (Twilio)

Sends WhatsApp alerts for:
  - New CRITICAL events (immediate push)
  - Daily morning brief at 07:00 Gulf time (UTC+3)
  - User-defined custom alerts when triggered

Uses Twilio WhatsApp API. Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
and TWILIO_WHATSAPP_FROM configured in environment / .env.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone, timedelta

from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

from core.config import settings

logger = logging.getLogger("atlas.whatsapp")

GULF_TZ = timezone(timedelta(hours=3))

_client: Client | None = None


def _get_client() -> Client:
    """Lazy-initialise the Twilio REST client."""
    global _client
    if _client is None:
        if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
            raise RuntimeError(
                "Twilio credentials not configured. "
                "Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in environment."
            )
        _client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    return _client


# ═══════════════════════════════════════════════════════════════════════
#  MESSAGE FORMATTING
# ═══════════════════════════════════════════════════════════════════════

def format_whatsapp_message(event: dict) -> str:
    """
    Build a clean WhatsApp message for an event.

    Expected *event* keys:
        id, title, risk_level, situation (or description)
    """
    title = event.get("title", "Untitled Event")
    risk_level = event.get("risk_level", "UNKNOWN")
    event_id = event.get("id", "")

    # Use the AI-generated situation if available; fall back to raw description.
    situation = event.get("situation") or event.get("description") or ""
    # Trim to two lines maximum.
    summary_lines = [l.strip() for l in situation.strip().splitlines() if l.strip()]
    summary = "\n".join(summary_lines[:2])

    risk_emoji = {
        "CRITICAL": "\u26a0\ufe0f",
        "HIGH": "\U0001f534",
        "MEDIUM": "\U0001f7e0",
        "LOW": "\U0001f7e2",
    }.get(risk_level, "\u2139\ufe0f")

    lines = [
        f"{risk_emoji} *{title}*",
        f"Risk: *{risk_level}*",
        "",
        summary,
        "",
        f"Open full brief: atlascommand.ai/event/{event_id}",
    ]
    return "\n".join(lines)


# ═══════════════════════════════════════════════════════════════════════
#  INTERNAL SEND HELPER
# ═══════════════════════════════════════════════════════════════════════

def _send_whatsapp(to: str, body: str) -> str | None:
    """
    Send a single WhatsApp message via Twilio.

    *to* must include the ``whatsapp:`` prefix, e.g. ``whatsapp:+971500000000``.
    Returns the Twilio message SID on success, or ``None`` on failure.
    """
    client = _get_client()
    from_number = settings.TWILIO_WHATSAPP_FROM
    if not from_number.startswith("whatsapp:"):
        from_number = f"whatsapp:{from_number}"
    if not to.startswith("whatsapp:"):
        to = f"whatsapp:{to}"

    try:
        message = client.messages.create(
            body=body,
            from_=from_number,
            to=to,
        )
        logger.info("WhatsApp sent sid=%s to=%s", message.sid, to)
        return message.sid
    except TwilioRestException as exc:
        logger.error("WhatsApp send failed to=%s error=%s", to, exc)
        return None


# ═══════════════════════════════════════════════════════════════════════
#  PUBLIC API
# ═══════════════════════════════════════════════════════════════════════

def send_critical_event_alert(
    event_data: dict,
    recipients: list[str] | None = None,
) -> list[str]:
    """
    Push an immediate alert for a CRITICAL event to all *recipients*.

    Parameters
    ----------
    event_data : dict
        Event payload (must include ``id``, ``title``, ``risk_level``, etc.)
    recipients : list[str], optional
        WhatsApp numbers (E.164 format). If ``None``, no messages are sent.

    Returns
    -------
    list[str]
        Twilio message SIDs for successfully sent messages.
    """
    if not recipients:
        logger.warning("send_critical_event_alert called with no recipients")
        return []

    body = (
        "\U0001f6a8 *ATLAS COMMAND — CRITICAL EVENT*\n"
        "\n"
        f"{format_whatsapp_message(event_data)}"
    )

    sids: list[str] = []
    for number in recipients:
        sid = _send_whatsapp(number, body)
        if sid:
            sids.append(sid)
    return sids


def send_morning_brief_notification(
    brief_data: dict,
    recipients: list[str] | None = None,
) -> list[str]:
    """
    Send the 07:00 Gulf-time daily morning brief summary.

    Parameters
    ----------
    brief_data : dict
        Output of ``llm_service.generate_morning_brief`` — keys:
        ``summary``, ``top_risks``, ``financial_outlook``.
    recipients : list[str], optional
        WhatsApp numbers (E.164 format).

    Returns
    -------
    list[str]
        Twilio message SIDs for successfully sent messages.
    """
    if not recipients:
        logger.warning("send_morning_brief_notification called with no recipients")
        return []

    now_gulf = datetime.now(GULF_TZ).strftime("%A, %d %B %Y")

    summary = brief_data.get("summary", "No summary available.")
    top_risks = brief_data.get("top_risks", "")
    financial = brief_data.get("financial_outlook", "")

    body = (
        f"\u2600\ufe0f *ATLAS COMMAND — Morning Brief*\n"
        f"_{now_gulf}_\n"
        "\n"
        f"*Summary*\n{summary}\n"
        "\n"
        f"*Top Risks*\n{top_risks}\n"
        "\n"
        f"*Financial Outlook*\n{financial}\n"
        "\n"
        "Full brief: atlascommand.ai/brief"
    )

    sids: list[str] = []
    for number in recipients:
        sid = _send_whatsapp(number, body)
        if sid:
            sids.append(sid)
    return sids


def send_custom_alert(
    alert: dict,
    event: dict,
    recipients: list[str] | None = None,
) -> list[str]:
    """
    Send a user-defined custom alert triggered by an event.

    Parameters
    ----------
    alert : dict
        Alert configuration — expected keys: ``name``, ``message`` (optional override).
    event : dict
        The event that triggered this alert.
    recipients : list[str], optional
        WhatsApp numbers (E.164 format).

    Returns
    -------
    list[str]
        Twilio message SIDs for successfully sent messages.
    """
    if not recipients:
        logger.warning("send_custom_alert called with no recipients")
        return []

    alert_name = alert.get("name", "Custom Alert")
    custom_message = alert.get("message")

    if custom_message:
        body = (
            f"\U0001f514 *ATLAS COMMAND — {alert_name}*\n"
            "\n"
            f"{custom_message}\n"
            "\n"
            f"{format_whatsapp_message(event)}"
        )
    else:
        body = (
            f"\U0001f514 *ATLAS COMMAND — {alert_name}*\n"
            "\n"
            f"{format_whatsapp_message(event)}"
        )

    sids: list[str] = []
    for number in recipients:
        sid = _send_whatsapp(number, body)
        if sid:
            sids.append(sid)
    return sids
