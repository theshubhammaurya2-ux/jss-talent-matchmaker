"""FastAPI integration for the team's React frontend."""
from pathlib import Path
import os
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from .documents import JDDocumentError, MAX_FILE_BYTES, extract_text
from .llm import JDLLMError, analyze_jd
from .models import JDResult
from .quality import quality_report

# Only explicit trusted web origins may call the local development backend.
# Example for the team's React app: JD_CORS_ORIGINS=http://localhost:8080,http://localhost:5173
_DEFAULT_ORIGINS = [
    "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000",
    "http://localhost:8080", "http://127.0.0.1:8080", "http://localhost:5174",
]
_cors_setting = os.getenv("JD_CORS_ORIGINS", "")
_allowed_origins = [item.strip() for item in _cors_setting.split(",") if item.strip()] or _DEFAULT_ORIGINS

app = FastAPI(title="RADIX JD Analytics — Role 1", version="1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "module": "jd-analytics", "role": 1}


async def _read_and_extract(file: UploadFile) -> tuple[str, str]:
    filename = Path(file.filename or "upload").name
    # Read no more than max+1, even when a client claims a smaller content-length.
    content = await file.read(MAX_FILE_BYTES + 1)
    try:
        return filename, extract_text(filename, content)
    except JDDocumentError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/jd/extract-text")
async def extract_jd_text(file: UploadFile = File(...)):
    filename, text = await _read_and_extract(file)
    return {"source_file": filename, "char_count": len(text), "text": text}


@app.post("/api/jd/analyze", response_model=JDResult)
async def analyze_jd_file(file: UploadFile = File(...)):
    filename, text = await _read_and_extract(file)
    try:
        return analyze_jd(filename, text)
    except JDLLMError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.post("/api/jd/analyze-report")
async def analyze_jd_with_report(file: UploadFile = File(...)):
    """Opt-in explanation dashboard; /api/jd/analyze remains unchanged for Role 5."""
    filename, text = await _read_and_extract(file)
    try:
        result = analyze_jd(filename, text)
    except JDLLMError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return {"jd": result.model_dump(), "quality_report": quality_report(result, text)}
