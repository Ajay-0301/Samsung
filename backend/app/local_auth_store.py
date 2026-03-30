import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from app.security import hash_password, verify_password

FALLBACK_FILE = Path(__file__).resolve().parents[1] / "data" / "auth_fallback.json"


def _ensure_store() -> None:
    FALLBACK_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not FALLBACK_FILE.exists():
        FALLBACK_FILE.write_text("[]", encoding="utf-8")


def _load_users() -> list[dict[str, Any]]:
    _ensure_store()
    try:
        raw = FALLBACK_FILE.read_text(encoding="utf-8")
        data = json.loads(raw)
        if isinstance(data, list):
            return data
    except Exception:
        pass
    return []


def _save_users(users: list[dict[str, Any]]) -> None:
    _ensure_store()
    FALLBACK_FILE.write_text(json.dumps(users, indent=2), encoding="utf-8")


def find_user_by_contact(contact: str) -> Optional[dict[str, Any]]:
    users = _load_users()
    contact_l = contact.strip().lower()
    for user in users:
        if user.get("contact", "").lower() == contact_l:
            return user
    return None


def create_fallback_user(full_name: str, contact: str, password: str) -> dict[str, Any]:
    users = _load_users()
    contact_l = contact.strip().lower()

    for user in users:
        if user.get("contact", "").lower() == contact_l:
            raise ValueError("Citizen already exists for this contact")

    user = {
        "role": "citizen",
        "fullName": full_name.strip(),
        "contact": contact_l,
        "passwordHash": hash_password(password),
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "source": "fallback"
    }
    users.append(user)
    _save_users(users)
    return user


def verify_fallback_login(contact: str, password: str) -> Optional[dict[str, Any]]:
    user = find_user_by_contact(contact)
    if not user:
        return None
    if not verify_password(password, user.get("passwordHash", "")):
        return None
    return user
