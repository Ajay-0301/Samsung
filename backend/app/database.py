from motor.motor_asyncio import AsyncIOMotorClient

from app.config import MONGODB_DB, MONGODB_URI

mongo_client = AsyncIOMotorClient(MONGODB_URI)
db = mongo_client[MONGODB_DB]
users_collection = db["users"]
reports_collection = db["reports"]
