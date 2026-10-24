"""Offline tests: do not require an API key or internet access."""
from pathlib import Path
from fastapi.testclient import TestClient
import pytest
from radix_jd.api import app
from radix_jd.documents import extract_text, JDDocumentError
from radix_jd.llm import analyze_jd

SAMPLES = Path(__file__).parents[1] / "samples" / "JDs"

@pytest.mark.parametrize("ext", ["PDF", "Word"])
def test_all_six_jds_extract(ext):
    files = sorted((SAMPLES / ext).glob("*"))
    assert len(files) == 6
    for file in files:
        text = extract_text(file.name, file.read_bytes())
        assert "What We're Looking For" in text
        assert "Key Responsibilities" in text
        assert len(text) > 500


def test_invalid_extension():
    with pytest.raises(JDDocumentError):
        extract_text("test.txt", b"Some data")


def test_llm_contract_with_stub():
    source = (SAMPLES / "Word" / "Google LLC - Software Engineer.docx")
    text = extract_text(source.name, source.read_bytes())
    parsed = analyze_jd("Google LLC - Software Engineer.pdf", text, response_override={
        "company": "Google LLC", "role": "Software Engineer (SWE)",
        "skills": [
            {"skill_name": "Data structures and algorithms", "category_code": "DSA",
             "evidence": "Strong grasp of data structures and algorithms", "confidence": "high"},
            {"skill_name": "System design", "category_code": "SYSD",
             "evidence": "system design at scale", "confidence": "high"},
        ],
    })
    assert parsed.source_type == "jd"
    assert parsed.source_file.endswith(".pdf")
    assert len(parsed.skills) == 2
    assert parsed.skills[0].category_code == "DSA"


def test_health_and_text_api():
    client = TestClient(app)
    assert client.get("/health").json()["status"] == "ok"
    example = SAMPLES / "Word" / "Google LLC - Software Engineer.docx"
    with example.open("rb") as fp:
        response = client.post("/api/jd/extract-text", files={
            "file": (example.name, fp, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        })
    assert response.status_code == 200
    assert "data structures and algorithms" in response.json()["text"].lower()


def test_unsubstantiated_skills_are_not_accepted():
    from radix_jd.llm import JDLLMError
    with pytest.raises(JDLLMError):
        analyze_jd("some.pdf", "Real skill: SQL and relational databases.", response_override={
            "company": "Example", "role": "Analyst",
            "skills": [{"skill_name": "Kubernetes", "category_code": "CLOUD",
                        "evidence": "Must be expert in Kubernetes", "confidence": "high"}]
        })
