"""Gemini AI service — resume parsing and job match scoring."""
import json
from google import genai
from app.config import settings

_client = genai.Client(api_key=settings.GEMINI_API_KEY)
_MODEL = "gemini-2.0-flash"


async def score_resume_against_job(
    resume_text: str,
    job_title: str,
    job_description: str,
    required_skills: list[str],
) -> dict:
    """
    Returns a dict with:
      - score: float (0–100)
      - strengths: list[str]
      - gaps: list[str]
      - summary: str
    """
    prompt = f"""
You are an expert recruiter AI. Analyze the candidate's resume against the job description and return a JSON response.

JOB TITLE: {job_title}
JOB DESCRIPTION: {job_description}
REQUIRED SKILLS: {", ".join(required_skills)}

CANDIDATE RESUME:
{resume_text}

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{{
  "score": <number between 0 and 100>,
  "strengths": [<list of 2-4 specific strengths matching this role>],
  "gaps": [<list of 1-3 missing skills or experience gaps>],
  "summary": "<2-3 sentence overall assessment>"
}}
"""
    try:
        response = await _client.aio.models.generate_content(
            model=_MODEL, contents=prompt
        )
        raw = response.text.strip()
        # Strip markdown code blocks if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        result = json.loads(raw.strip())

        # Validate and clamp score
        result["score"] = max(0.0, min(100.0, float(result.get("score", 0))))
        result.setdefault("strengths", [])
        result.setdefault("gaps", [])
        result.setdefault("summary", "Unable to generate summary.")
        return result

    except Exception as e:
        print(f"❌ Gemini AI error: {e}")
        return {
            "score": 0.0,
            "strengths": [],
            "gaps": ["Could not analyze resume"],
            "summary": "AI scoring failed. Please try again.",
        }


async def parse_resume_text(resume_text: str) -> dict:
    """
    Extracts structured info from raw resume text.
    Returns: { name, email, phone, skills, experience_years, education }
    """
    prompt = f"""
Extract structured information from this resume text. Return ONLY valid JSON:

RESUME:
{resume_text}

Return ONLY valid JSON in this exact format:
{{
  "name": "<full name or null>",
  "email": "<email or null>",
  "phone": "<phone or null>",
  "skills": [<list of technical and soft skills>],
  "experience_years": <number or 0>,
  "education": "<highest education level or null>",
  "summary": "<brief professional summary in 1-2 sentences>"
}}
"""
    try:
        response = await _client.aio.models.generate_content(
            model=_MODEL, contents=prompt
        )
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw.strip())
    except Exception as e:
        print(f"❌ Gemini parse error: {e}")
        return {
            "name": None, "email": None, "phone": None,
            "skills": [], "experience_years": 0,
            "education": None, "summary": None,
        }
