"""Job schemas."""
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.job import JobType


class JobCreate(BaseModel):
    title: str
    description: str
    location: str
    job_type: JobType
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    skills_required: list[str] = []
    company_name: Optional[str] = None
    company_logo_url: Optional[str] = None


class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[JobType] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    skills_required: Optional[list[str]] = None
    is_active: Optional[bool] = None
    company_name: Optional[str] = None


class JobResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    location: str
    job_type: JobType
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    skills_required: list[str] = []
    company_name: Optional[str] = None
    company_logo_url: Optional[str] = None
    is_featured: bool
    is_active: bool
    views: int
    goes_live_at: datetime
    expires_at: Optional[datetime] = None
    created_at: datetime
    posted_by_user_id: uuid.UUID

    model_config = {"from_attributes": True}


class MyJobResponse(JobResponse):
    applicant_count: int = 0


class JobListResponse(BaseModel):
    jobs: list[JobResponse]
    page: int
    limit: int
    count: int
