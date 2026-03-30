from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pymongo import ReturnDocument
from pymongo.errors import PyMongoError

from app.database import reports_collection
from app.dependencies import get_current_user, raise_db_unavailable, require_admin
from app.schemas import (
    EvidencePayload,
    ReportPayload,
    StatusUpdatePayload,
    UserContext,
)
from app.utils import next_report_id, normalize_report, now_iso_date

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("")
async def list_reports(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    issue_type: Optional[str] = Query(default=None, alias="issueType"),
    user: UserContext = Depends(get_current_user),
) -> list[dict[str, Any]]:
    query: dict[str, Any] = {}
    if user.role != "admin":
        query["ownerContact"] = user.contact
    if status_filter:
        query["status"] = status_filter
    if issue_type:
        query["issueType"] = issue_type

    try:
        cursor = reports_collection.find(query).sort("reportedAt", -1)
        docs = await cursor.to_list(length=500)
        return [normalize_report(doc) for doc in docs]
    except PyMongoError as exc:
        raise_db_unavailable(exc)


@router.post("")
async def create_report(
    payload: ReportPayload,
    user: UserContext = Depends(get_current_user),
) -> dict[str, Any]:
    report_id = payload.id or next_report_id()
    report_doc = payload.model_dump()
    report_doc["id"] = report_id
    report_doc["reportedAt"] = payload.reportedAt or now_iso_date()
    report_doc["ownerContact"] = user.contact

    try:
        existing = await reports_collection.find_one({"id": report_id})
        if existing:
            report_doc["id"] = next_report_id()

        await reports_collection.insert_one(report_doc)
        return normalize_report(report_doc)
    except PyMongoError as exc:
        raise_db_unavailable(exc)


@router.patch("/{report_id}/status")
async def update_report_status(
    report_id: str,
    payload: StatusUpdatePayload,
    admin: UserContext = Depends(require_admin),
) -> dict[str, Any]:
    update: dict[str, Any] = {"status": payload.status}
    if payload.status == "Resolved":
        update["resolvedAt"] = now_iso_date()

    try:
        result = await reports_collection.find_one_and_update(
            {"id": report_id},
            {"$set": update},
            return_document=ReturnDocument.AFTER,
        )
    except PyMongoError as exc:
        raise_db_unavailable(exc)

    if not result:
        raise HTTPException(status_code=404, detail="Report not found")
    return normalize_report(result)


@router.patch("/{report_id}/confirm")
async def confirm_report(
    report_id: str,
    user: UserContext = Depends(get_current_user),
) -> dict[str, Any]:
    filter_query: dict[str, Any] = {"id": report_id}
    if user.role != "admin":
        filter_query["ownerContact"] = user.contact

    try:
        result = await reports_collection.find_one_and_update(
            filter_query,
            {"$inc": {"upvotes": 1}},
            return_document=ReturnDocument.AFTER,
        )
    except PyMongoError as exc:
        raise_db_unavailable(exc)

    if not result:
        raise HTTPException(status_code=404, detail="Report not found")
    return normalize_report(result)


@router.patch("/{report_id}/evidence")
async def update_resolution_evidence(
    report_id: str,
    payload: EvidencePayload,
    admin: UserContext = Depends(require_admin),
) -> dict[str, Any]:
    try:
        result = await reports_collection.find_one_and_update(
            {"id": report_id},
            {
                "$set": {
                    "resolutionImageUrl": payload.resolutionImageUrl,
                    "status": "Resolved",
                    "resolvedAt": now_iso_date(),
                }
            },
            return_document=ReturnDocument.AFTER,
        )
    except PyMongoError as exc:
        raise_db_unavailable(exc)

    if not result:
        raise HTTPException(status_code=404, detail="Report not found")
    return normalize_report(result)


@router.get("/summary")
async def report_summary(user: UserContext = Depends(get_current_user)) -> dict[str, Any]:
    base_query: dict[str, Any] = {}
    if user.role != "admin":
        base_query["ownerContact"] = user.contact

    try:
        total = await reports_collection.count_documents(base_query)
        resolved = await reports_collection.count_documents({**base_query, "status": "Resolved"})
        pending = await reports_collection.count_documents({**base_query, "status": {"$ne": "Resolved"}})
        critical = await reports_collection.count_documents({**base_query, "priority": "Critical"})
    except PyMongoError as exc:
        raise_db_unavailable(exc)

    return {
        "total": total,
        "resolved": resolved,
        "pending": pending,
        "critical": critical,
    }


@router.get("/recent-solved")
async def recent_solved(
    limit: int = Query(default=5, ge=1, le=50),
    user: UserContext = Depends(get_current_user),
) -> list[dict[str, Any]]:
    base_query: dict[str, Any] = {"status": "Resolved"}
    if user.role != "admin":
        base_query["ownerContact"] = user.contact

    try:
        cursor = reports_collection.find(base_query).sort("resolvedAt", -1).limit(limit)
        docs = await cursor.to_list(length=limit)
        return [normalize_report(doc) for doc in docs]
    except PyMongoError as exc:
        raise_db_unavailable(exc)
