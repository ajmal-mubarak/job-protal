"""Groq AI service — resume parsing and job match scoring.

Groq is free, ultra-fast (sub-second), and uses Llama 3.3 70B which
produces excellent structured JSON output for scoring/parsing tasks.

Get a free API key at: https://console.groq.com
"""
import json
from app.config import settings

_client = None  # Lazy-initialized on first use
_MODEL = "llama-3.3-70b-versatile"   # Best free Groq model for JSON tasks


def _get_client():
    """Return (and lazily create) the Groq client."""
    global _client
    if _client is None:
        from groq import Groq
        if not settings.GROQ_API_KEY:
            raise RuntimeError("GROQ_API_KEY is not set — get a free key at https://console.groq.com")
        _client = Groq(api_key=settings.GROQ_API_KEY)
    return _client


def _parse_json_from_response(raw: str) -> dict:
    """Strip markdown code fences and parse JSON from model response."""
    raw = raw.strip()
    # Strip ```json ... ``` or ``` ... ``` fences
    if raw.startswith("```"):
        lines = raw.split("\n")
        # Remove first and last fence lines
        inner = lines[1:-1] if lines[-1].strip() == "```" else lines[1:]
        raw = "\n".join(inner).strip()
    return json.loads(raw)


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
    prompt = f"""You are an expert recruiter AI. Analyze the candidate's resume against the job description and return a JSON score.

JOB TITLE: {job_title}
JOB DESCRIPTION: {job_description[:2000]}
REQUIRED SKILLS: {", ".join(required_skills)}

CANDIDATE RESUME / PROFILE:
{resume_text[:3000]}

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{{
  "score": <integer between 1 and 100>,
  "strengths": ["<specific strength 1>", "<specific strength 2>", "<specific strength 3>"],
  "gaps": ["<gap or missing skill 1>", "<gap or missing skill 2>"],
  "summary": "<2-3 sentence overall assessment of this candidate for this role>"
}}"""

    try:
        client = _get_client()
        # Groq uses the synchronous SDK — run it directly (FastAPI handles thread pool)
        import asyncio
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.chat.completions.create(
                model=_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a precise recruiter AI. Always respond with valid JSON only. No markdown, no explanation.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                max_tokens=1024,
                response_format={"type": "json_object"},  # Forces pure JSON output
            ),
        )
        raw = response.choices[0].message.content.strip()
        result = _parse_json_from_response(raw)

        # Validate and clamp score
        score = float(result.get("score", 50))
        result["score"] = max(1.0, min(100.0, score))
        result.setdefault("strengths", [])
        result.setdefault("gaps", [])
        result.setdefault("summary", "No summary available.")
        return result

    except Exception as e:
        print(f"[Groq Error] AI scoring error: {e}")
        return {
            "score": None,
            "strengths": [],
            "gaps": ["Could not analyze resume"],
            "summary": "AI scoring failed. Please try again.",
        }


async def parse_resume_text(resume_text: str) -> dict:
    """
    Extracts structured info from raw resume text.
    Returns: { name, email, phone, skills, experience_years, education, summary }
    """
    prompt = f"""Extract structured information from this resume text. Respond ONLY with valid JSON.

RESUME:
{resume_text[:4000]}

Return ONLY valid JSON in this exact format:
{{
  "name": "<full name or null>",
  "email": "<email or null>",
  "phone": "<phone or null>",
  "skills": ["<skill1>", "<skill2>"],
  "experience_years": <number or 0>,
  "education": "<highest education level or null>",
  "summary": "<brief professional summary in 1-2 sentences>"
}}"""

    try:
        client = _get_client()
        import asyncio
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.chat.completions.create(
                model=_MODEL,
                messages=[
                    {"role": "system", "content": "You are a precise resume parser AI. Always respond with valid JSON only."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.1,
                max_tokens=512,
                response_format={"type": "json_object"},
            ),
        )
        raw = response.choices[0].message.content.strip()
        return _parse_json_from_response(raw)

    except Exception as e:
        print(f"[Groq Error] Resume parse error: {e}")
        return {
            "name": None, "email": None, "phone": None,
            "skills": [], "experience_years": 0,
            "education": None, "summary": None,
        }
