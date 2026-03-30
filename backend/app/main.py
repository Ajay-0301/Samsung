from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.database import reports_collection, users_collection
from app.routers.auth import router as auth_router
from app.routers.home import router as home_router
from app.routers.reports import router as reports_router

app = FastAPI(title="RoadFix API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def ensure_indexes() -> None:
    try:
        await users_collection.create_index("contact", unique=True)
        await reports_collection.create_index("id", unique=True)
        await reports_collection.create_index("ownerContact")
        await reports_collection.create_index("status")
        await reports_collection.create_index("reportedAt")
    except Exception as exc:
        # Keep API process up so frontend can run while MongoDB is connected later.
        print(f"[startup-warning] MongoDB unavailable during startup: {exc}")


app.include_router(home_router)
app.include_router(auth_router)
app.include_router(reports_router)
