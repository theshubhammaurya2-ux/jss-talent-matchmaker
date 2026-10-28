"""Data shapes for Skill Matching (Role 5).

Plain dataclasses on purpose: no extra libraries, easy to read.
Field names follow the shared data contract in the hackathon brief.
"""
from dataclasses import dataclass, field, asdict
from typing import List, Dict


@dataclass
class Skill:
    skill_name: str
    category_code: str = "OTHER"
    evidence: str = ""
    confidence: str = "medium"        # high | medium | low


@dataclass
class SkillSource:
    """Works for a JD skill list (Role 1) AND a candidate profile/resume (Role 2/3)."""
    skills: List[Skill]
    source_file: str = ""
    company: str = ""
    role: str = ""
    name: str = ""                    # candidate name (profiles only)

    @classmethod
    def from_dict(cls, d: dict) -> "SkillSource":
        skills = [Skill(
            skill_name=s["skill_name"],
            category_code=s.get("category_code", "OTHER"),
            evidence=s.get("evidence", ""),
            confidence=s.get("confidence", "medium"),
        ) for s in d.get("skills", [])]
        return cls(skills=skills,
                   source_file=d.get("source_file", ""),
                   company=d.get("company", ""),
                   role=d.get("role", ""),
                   name=d.get("name", ""))


@dataclass
class MatchedSkill:
    jd_skill: str
    candidate_skill: str
    category_code: str
    match_type: str                   # name_match | category_match
    similarity: int                   # 0-100
    credit: float                     # 1.0 full, 0.5 partial
    candidate_evidence: str = ""


@dataclass
class MissingSkill:
    skill_name: str
    category_code: str
    importance: str                   # high | medium | low


@dataclass
class MatchResult:
    jd_source_file: str
    match_score: int                  # 0-100
    matched_skills: List[MatchedSkill] = field(default_factory=list)
    missing_skills: List[MissingSkill] = field(default_factory=list)
    category_breakdown: Dict[str, int] = field(default_factory=dict)
    summary: str = ""

    def to_dict(self) -> dict:
        return asdict(self)
