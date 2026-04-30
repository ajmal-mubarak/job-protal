"""Application schemas."""
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.job import ApplicationStatus


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus


class ApplicationResponse(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID
    jobseeker_id: uuid.UUID
    # Enriched applicant info (joined from JobSeeker → User)
    applicant_user_id: Optional[uuid.UUID] = None
    applicant_name: Optional[str] = None
    applicant_email: Optional[str] = None
    resume_url: Optional[str] = None
    cover_letter: Optional[str] = None
    status: ApplicationStatus
    ai_score: Optional[float] = None
    ai_feedback: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
