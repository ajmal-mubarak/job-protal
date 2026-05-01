"""Local file storage service (Cloudflare R2 swap-ready)."""
import os
import uuid
import aiofiles
from fastapi import UploadFile, HTTPException, status
from app.config import settings

ALLOWED_RESUME_TYPES = {"application/pdf"}
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_BYTES = settings.MAX_FILE_SIZE_MB * 1024 * 1024


async def save_file(file: UploadFile, subfolder: str) -> str:
    """
    Saves an uploaded file locally.
    Returns the public URL path: /uploads/{subfolder}/{filename}
    """
    # Validate content type
    allowed = ALLOWED_RESUME_TYPES if subfolder == "resumes" else ALLOWED_IMAGE_TYPES
    if file.content_type not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {allowed}",
        )

    # Read and check size
    contents = await file.read()
    if len(contents) > MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Max size: {settings.MAX_FILE_SIZE_MB}MB",
        )

    # Generate unique filename
    ext = os.path.splitext(file.filename or "file")[1].lower() or ".pdf"
    filename = f"{uuid.uuid4().hex}{ext}"

    # Ensure directory exists
    dir_path = os.path.join(settings.UPLOAD_DIR, subfolder)
    os.makedirs(dir_path, exist_ok=True)

    # Write file
    file_path = os.path.join(dir_path, filename)
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(contents)

    return f"{settings.BACKEND_URL}/uploads/{subfolder}/{filename}"


async def delete_file(url_path: str) -> None:
    """Delete a locally stored file by its URL path."""
    if not url_path or "/uploads/" not in url_path:
        return
    # Extract the relative path part after /uploads/
    try:
        file_path = "uploads/" + url_path.split("/uploads/")[1]
    except IndexError:
        return
    if os.path.exists(file_path):
        os.remove(file_path)


# ── Future R2 swap ────────────────────────────────────────────────────────────
# Replace save_file() with an R2 implementation:
#
# async def save_file_r2(file: UploadFile, subfolder: str) -> str:
#     import boto3
#     s3 = boto3.client("s3", ...)
#     key = f"{subfolder}/{uuid.uuid4().hex}{ext}"
#     s3.put_object(Bucket=R2_BUCKET, Key=key, Body=contents, ContentType=file.content_type)
#     return f"{R2_PUBLIC_URL}/{key}"
