"""Core scoring logic for RADIX Talent Check (Role 4)."""
from __future__ import annotations

from typing import Any

CATEGORY_CODES = ["DSA", "COD", "OOD", "APTI", "COMM", "AI", "CLOUD", "SQL", "SWE", "SYSD", "NETW", "OS"]
CONFIDENCE_POINTS = {"high": 3, "medium": 2, "low": 1}


def candidate_level(skills: list[dict[str, Any]], category_code: str) -> int:
    """Estimate level from parsed/profile skills: high=3, medium=2, low=1; clamp to 1..10."""
    score = sum(
        CONFIDENCE_POINTS.get(str(skill.get("confidence", "low")).lower(), 1)
        for skill in skills
        if skill.get("category_code") == category_code
    )
    return max(1, min(10, score))


def run_talent_check(
    profile: dict[str, Any], company_record: dict[str, Any]
) -> dict[str, Any]:
    """Compare a saved candidate profile against a company's 12 skillset levels."""
    required = company_record.get("required_levels", {})
    skills = profile.get("skills", [])
    gaps = []
    for category in CATEGORY_CODES:
        if category not in required:
            continue
        required_level = int(required[category])
        level = candidate_level(skills, category)
        gaps.append({
            "category_code": category,
            "required_level": required_level,
            "candidate_level": level,
            "gap": level < required_level,
            "gap_amount": max(0, required_level - level),
        })

    total_required = sum(row["required_level"] for row in gaps)
    achieved = sum(min(row["candidate_level"], row["required_level"]) for row in gaps)
    readiness = round(100 * achieved / total_required) if total_required else 0
    gap_count = sum(row["gap"] for row in gaps)
    if readiness >= 80:
        interpretation = "Strong readiness"
    elif readiness >= 60:
        interpretation = "Developing readiness"
    else:
        interpretation = "Needs focused development"

    return {
        "candidate_name": profile.get("name", "Candidate"),
        "company": company_record["company"],
        "readiness_score": readiness,
        "interpretation": interpretation,
        "categories_below_bar": gap_count,
        "total_categories": len(gaps),
        "skillset_gap": gaps,
    }
