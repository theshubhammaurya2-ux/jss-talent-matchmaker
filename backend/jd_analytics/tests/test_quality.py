"""Additional offline tests for quality hints and integration endpoints."""
from pathlib import Path
from fastapi.testclient import TestClient
import pytest
from radix_jd import api
from radix_jd.documents import extract_text
from radix_jd.llm import analyze_jd
from radix_jd.quality import quality_report, required_portion

SAMPLE = Path(__file__).parents[1] / "samples/JDs/Word/Google LLC - Software Engineer.docx"


def google_stub():
    text = extract_text(SAMPLE.name, SAMPLE.read_bytes())
    result = analyze_jd(SAMPLE.name, text, response_override={
        "company": "Google LLC", "role": "Software Engineer (SWE)",
        "skills": [{
            "skill_name": "Data Structures and Algorithms", "category_code": "DSA",
            "evidence": "Strong grasp of data structures and algorithms", "confidence": "high",
        }],
    })
    return text, result


def test_quality_hints_find_omitted_networking_and_coding():
    text, result = google_stub()
    report = quality_report(result, text)
    codes = {hint["category_code"] for hint in report["coverage_hints"]}
    assert {"NETW", "COD"}.issubset(codes)
    assert report["total_skills"] == 1
    assert report["category_counts"]["DSA"] == 1
    assert len(result.skills) == 1  # report cannot mutate shared Role 5 JSON


def test_optional_only_requirements_are_not_hinted():
    text = "What We're Looking For\nAdvanced SQL\nNice to Have\nNetworking and TCP/UDP\nBenefits\nPaid leave"
    result = analyze_jd("example.pdf", text, response_override={
        "company": "Example", "role": "Analyst",
        "skills": [{"skill_name": "SQL", "category_code": "SQL", "evidence": "Advanced SQL", "confidence": "high"}],
    })
    assert "Networking" not in required_portion(text)
    report = quality_report(result, text)
    assert "NETW" not in {item["category_code"] for item in report["coverage_hints"]}


def test_possible_synonym_duplicates_flagged_but_not_deleted():
    text = "SQL knowledge and SQL are necessary"
    result = analyze_jd("jd.pdf", text, response_override={
        "company": "Example", "role": "Analyst", "skills": [
            {"skill_name": "SQL", "category_code": "SQL", "evidence": "SQL", "confidence": "high"},
            {"skill_name": "SQL Knowledge", "category_code": "SQL", "evidence": "SQL knowledge", "confidence": "high"},
        ],
    })
    report = quality_report(result, text)
    assert ["SQL", "SQL Knowledge"] in report["possible_duplicates"]
    assert len(result.skills) == 2


def test_report_api_and_original_endpoint_keep_different_schemas(monkeypatch):
    _, result = google_stub()
    monkeypatch.setattr(api, "analyze_jd", lambda filename, text: result)
    client = TestClient(api.app)
    payload = {"file": (SAMPLE.name, SAMPLE.read_bytes(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    original = client.post("/api/jd/analyze", files=payload)
    assert original.status_code == 200
    assert "quality_report" not in original.json()
    assert original.json()["skills"][0]["category_code"] == "DSA"
    additional = client.post("/api/jd/analyze-report", files=payload)
    assert additional.status_code == 200
    assert additional.json()["jd"]["skills"] == original.json()["skills"]
    assert additional.json()["quality_report"]["total_skills"] == 1


def test_invalid_file_api_returns_400():
    client = TestClient(api.app)
    response = client.post("/api/jd/analyze-report", files={"file": ("malicious.txt", b"oops", "text/plain")})
    assert response.status_code == 400
    assert "PDF and DOCX" in response.json()["detail"]


def test_cors_local_frontend():
    client = TestClient(api.app)
    response = client.options("/api/jd/analyze", headers={
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
    })
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_batch_preview_lists_files_without_ai(capsys):
    from radix_jd.batch import candidates, safe_stem
    folder = Path(__file__).parents[1] / "samples/JDs/PDF"
    found = candidates(folder, limit=3)
    assert len(found) == 3
    assert all(f.suffix == ".pdf" for f in found)
    assert safe_stem("Oracle - Associate Software Engineer.pdf") == "oracle_associate_software_engineer"


def test_quality_report_always_lists_12_radix_categories():
    text = "Must know SQL and communicate results."
    result = analyze_jd("jd.pdf", text, response_override={
        "company": "Example", "role": "Data Analyst",
        "skills": [{
            "skill_name": "SQL", "category_code": "SQL",
            "evidence": "Must know SQL", "confidence": "high",
        }],
    })
    report = quality_report(result, text)
    expected_codes = {
        "COD", "DSA", "OOD", "APTI", "COMM", "AI",
        "CLOUD", "SQL", "SWE", "SYSD", "NETW", "OS",
    }
    assert set(report["category_counts"]) == expected_codes
    assert report["category_counts"]["SQL"] == 1
    assert all(report["category_counts"][code] == 0 for code in expected_codes - {"SQL"})
    assert len(result.skills) == 1


def test_other_is_counted_without_becoming_13th_required_category():
    result = analyze_jd("jd.pdf", "Must build dashboards", response_override={
        "company": "Example", "role": "Analyst",
        "skills": [{
            "skill_name": "Dashboard Creation", "category_code": "OTHER",
            "evidence": "Must build dashboards", "confidence": "high",
        }],
    })
    report = quality_report(result, "Must build dashboards")
    assert len(report["category_counts"]) == 13
    assert report["category_counts"]["OTHER"] == 1
    assert sum(report["category_counts"].values()) == 1
