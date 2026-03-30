from fastapi import Depends, Header, HTTPException, Query, status
from pymongo.errors import PyMongoError

from app.schemas import UserContext
from app.security import decode_access_token


def raise_db_unavailable(exc: Exception) -> None:
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=f"Database is unavailable. Please verify MongoDB Atlas network access and credentials. ({exc})",
    ) from exc


async def get_current_user(
    token: str = Query(default="", alias="token"),
    authorization: str = Header(default=""),
) -> UserContext:
    bearer_token = ""
    if authorization.lower().startswith("bearer "):
        bearer_token = authorization[7:].strip()

    final_token = bearer_token or token
    if not final_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token is required")
    return decode_access_token(final_token)


async def require_admin(user: UserContext = Depends(get_current_user)) -> UserContext:
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


def db_guard(exc: Exception) -> None:
    if isinstance(exc, PyMongoError):
        raise_db_unavailable(exc)
    raise exc
