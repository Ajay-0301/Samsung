from fastapi import APIRouter

from app.utils import root_payload

router = APIRouter()


@router.get("/")
async def root() -> dict[str, str]:
    return root_payload()
