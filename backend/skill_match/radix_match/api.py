"""HTTP API so the React frontend can call Skill Matching.
    uvicorn radix_match.api:app --reload --port 8005
Docs / test page: http://localhost:8005/docs
"""
from typing import Any, Dict
from fastapi import FastAPI, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .models import SkillSource
from .matcher import match

app = FastAPI(title="RADIX Skill Matching (Role 5)")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/match")
def run_match(payload: Dict[str, Any] = Body(...)):
    """Body: {"candidate": <profile or resume skill list>, "jd": <JD skill list from Role 1>}"""
    if "candidate" not in payload or "jd" not in payload:
        raise HTTPException(status_code=422, detail="Body must contain 'candidate' and 'jd'")
    try:
        candidate = SkillSource.from_dict(payload["candidate"])
        jd = SkillSource.from_dict(payload["jd"])
    except (KeyError, TypeError) as e:
        raise HTTPException(status_code=422, detail=f"Bad skill list: {e}")
    return match(candidate, jd).to_dict()
