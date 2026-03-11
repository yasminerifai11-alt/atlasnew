"""
Atlas Command — Ingestion Connectors

All data-source connectors for the Atlas Command intelligence pipeline.
"""

from ingest.base import BaseConnector
from ingest.acled import ACLEDConnector
from ingest.firms import FIRMSConnector
from ingest.usgs import USGSConnector
from ingest.opensky import OpenSkyConnector
from ingest.gdelt import GDELTConnector
from ingest.eia import EIAConnector
from ingest.gdacs import GDACSConnector
from ingest.ukmto import UKMTOConnector
from ingest.opensanctions import OpenSanctionsConnector
from ingest.scheduler import start_scheduler, stop_scheduler

__all__ = [
    "BaseConnector",
    "ACLEDConnector",
    "FIRMSConnector",
    "USGSConnector",
    "OpenSkyConnector",
    "GDELTConnector",
    "EIAConnector",
    "GDACSConnector",
    "UKMTOConnector",
    "OpenSanctionsConnector",
    "start_scheduler",
    "stop_scheduler",
]
