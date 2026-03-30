from typing import Literal, Optional

from pydantic import BaseModel, Field


class CitizenRegisterRequest(BaseModel):
    fullName: str
    contact: str
    password: str


class CitizenLoginRequest(BaseModel):
    contact: str
    password: str


class AdminLoginRequest(BaseModel):
    password: str


class TokenResponse(BaseModel):
    token: str
    role: Literal["citizen", "admin"]
    fullName: str
    contact: str


class AIDamageInsight(BaseModel):
    label: Literal["Pothole", "Crack", "Waterlogging", "Surface Wear"]
    confidence: float


class ReportPayload(BaseModel):
    id: Optional[str] = None
    reporterName: str
    issueType: Literal["Pothole", "Crack", "Drainage", "Road Marking", "Streetlight"]
    description: str
    locality: str
    latitude: float
    longitude: float
    channel: Literal["Web", "Mobile App", "Call Center 311"]
    priority: Literal["Low", "Medium", "High", "Critical"]
    aiSuggestedPriority: Literal["Low", "Medium", "High", "Critical"]
    aiInsights: list[AIDamageInsight] = Field(default_factory=list)
    recommendedAction: str
    status: Literal["New", "In Review", "Assigned", "Resolved"] = "New"
    assignedTeam: str
    upvotes: int = 0
    reportedAt: Optional[str] = None
    resolvedAt: Optional[str] = None
    slaDueDate: str
    imageUrl: str
    resolutionImageUrl: Optional[str] = None


class StatusUpdatePayload(BaseModel):
    status: Literal["New", "In Review", "Assigned", "Resolved"]


class EvidencePayload(BaseModel):
    resolutionImageUrl: str


class UserContext(BaseModel):
    role: Literal["citizen", "admin"]
    fullName: str
    contact: str
