"""Recruiter profile (alias import for cleaner model imports)."""
# Recruiter and JobSeeker are defined in employer.py to keep profile models together
from app.models.employer import Recruiter, JobSeeker  # noqa: F401
