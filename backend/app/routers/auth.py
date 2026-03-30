from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pymongo.errors import PyMongoError

from app.config import ADMIN_PASSWORD
from app.database import users_collection
from app.local_auth_store import create_fallback_user, verify_fallback_login
from app.schemas import (
    AdminLoginRequest,
    CitizenLoginRequest,
    CitizenRegisterRequest,
    TokenResponse,
    UserContext,
)
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/citizen/register", response_model=TokenResponse)
async def citizen_register(payload: CitizenRegisterRequest) -> TokenResponse:
    contact = payload.contact.strip().lower()
    if not payload.fullName.strip():
        raise HTTPException(status_code=400, detail="Full name is required")

    try:
        existing = await users_collection.find_one({"contact": contact})
        if existing:
            raise HTTPException(status_code=409, detail="Citizen already exists for this contact")

        doc = {
            "role": "citizen",
            "fullName": payload.fullName.strip(),
            "contact": contact,
            "passwordHash": hash_password(payload.password),
            "createdAt": datetime.now(timezone.utc).isoformat(),
        }
        await users_collection.insert_one(doc)
    except HTTPException:
        raise
    except PyMongoError as exc:
        # If MongoDB is temporarily unavailable, fall back to local store.
        try:
            doc = create_fallback_user(payload.fullName, contact, payload.password)
        except ValueError as fallback_error:
            raise HTTPException(status_code=409, detail=str(fallback_error)) from fallback_error

    user = UserContext(role="citizen", fullName=doc["fullName"], contact=doc["contact"])
    token = create_access_token(user)
    return TokenResponse(token=token, role=user.role, fullName=user.fullName, contact=user.contact)


@router.post("/citizen/login", response_model=TokenResponse)
async def citizen_login(payload: CitizenLoginRequest) -> TokenResponse:
    contact = payload.contact.strip().lower()
    try:
        existing = await users_collection.find_one({"contact": contact, "role": "citizen"})
    except PyMongoError as exc:
        existing = verify_fallback_login(contact, payload.password)
        if not existing:
            raise HTTPException(
                status_code=401,
                detail="Invalid citizen credentials"
            ) from exc
        user = UserContext(role="citizen", fullName=existing["fullName"], contact=existing["contact"])
        token = create_access_token(user)
        return TokenResponse(token=token, role=user.role, fullName=user.fullName, contact=user.contact)

    if not existing or not verify_password(payload.password, existing.get("passwordHash", "")):
        raise HTTPException(status_code=401, detail="Invalid citizen credentials")

    user = UserContext(role="citizen", fullName=existing["fullName"], contact=existing["contact"])
    token = create_access_token(user)
    return TokenResponse(token=token, role=user.role, fullName=user.fullName, contact=user.contact)


@router.post("/admin/login", response_model=TokenResponse)
async def admin_login(payload: AdminLoginRequest) -> TokenResponse:
    if payload.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin password")

    user = UserContext(role="admin", fullName="Admin Officer", contact="municipal-control")
    token = create_access_token(user)
    return TokenResponse(token=token, role=user.role, fullName=user.fullName, contact=user.contact)
