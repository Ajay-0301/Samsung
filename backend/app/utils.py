from datetime import datetime, timezone
import random
from typing import Any

from app.config import MONGODB_DB


def now_iso_date() -> str:
    return datetime.now(timezone.utc).date().isoformat()


def next_report_id() -> str:
    return f"RM-{random.randint(1000, 9999)}"


def normalize_report(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": doc.get("id"),
        "reporterName": doc.get("reporterName"),
        "issueType": doc.get("issueType"),
        "description": doc.get("description"),
        "locality": doc.get("locality"),
        "latitude": doc.get("latitude"),
        "longitude": doc.get("longitude"),
        "channel": doc.get("channel"),
        "priority": doc.get("priority"),
        "aiSuggestedPriority": doc.get("aiSuggestedPriority"),
        "aiInsights": doc.get("aiInsights", []),
        "recommendedAction": doc.get("recommendedAction"),
        "status": doc.get("status"),
        "assignedTeam": doc.get("assignedTeam"),
        "upvotes": doc.get("upvotes", 0),
        "reportedAt": doc.get("reportedAt"),
        "resolvedAt": doc.get("resolvedAt"),
        "slaDueDate": doc.get("slaDueDate"),
        "imageUrl": doc.get("imageUrl"),
        "resolutionImageUrl": doc.get("resolutionImageUrl"),
    }


def root_payload() -> dict[str, str]:
    return {"status": "ok", "service": "RoadFix API", "db": MONGODB_DB}
