import os
from pathlib import Path
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from .documents import extract_text, DocumentError, MAX_FILE_BYTES
from .llm import analyze_resume, LLMError
from .models import ResumeResult

_DEFAULT_ORIGINS = [
    "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000",
    "http://localhost:8080", "http://127.0.0.1:8080", "http://localhost:5174",
]
_cors_setting = os.getenv("RESUME_CORS_ORIGINS", "")
_allowed_origins = [item.strip() for item in _cors_setting.split(",") if item.strip()] or _DEFAULT_ORIGINS

app = FastAPI(title="RADIX Resume Parsing — Role 2", version="1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok", "module": "resume-parser", "role": 2}

async def _read_and_extract(file: UploadFile) -> tuple[str, str]:
    filename = Path(file.filename or "upload").name
    content = await file.read(MAX_FILE_BYTES + 1)
    try:
        return filename, extract_text(filename, content)
    except DocumentError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@app.post("/api/resume/analyze", response_model=ResumeResult)
async def analyze_resume_file(file: UploadFile = File(...)):
    filename, text = await _read_and_extract(file)
    try:
        return analyze_resume(filename, text)
    except LLMError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
