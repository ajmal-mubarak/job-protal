"""Upload router — resume and logo uploads."""
from fastapi import APIRouter, Depends, UploadFile, File
from app.middleware.auth import get_current_user
from app.models.user import User
from app.services import storage_service

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("/resume")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    url = await storage_service.save_file(file, "resumes")
    return {"url": url, "filename": file.filename}


@router.post("/logo")
async def upload_logo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    url = await storage_service.save_file(file, "logos")
    return {"url": url, "filename": file.filename}


@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    url = await storage_service.save_file(file, "avatars")
    return {"url": url, "filename": file.filename}
