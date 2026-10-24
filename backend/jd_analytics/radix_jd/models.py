"""Shared RADIX skill and JD output contract (per participant brief, pp. 9-10)."""
from typing import Literal
from pydantic import BaseModel, Field, ConfigDict

CategoryCode = Literal[
    "COD", "DSA", "OOD", "APTI", "COMM", "AI", "CLOUD", "SQL",
    "SWE", "SYSD", "NETW", "OS", "OTHER"
]
Confidence = Literal["high", "medium", "low"]


class Skill(BaseModel):
    model_config = ConfigDict(extra="forbid")
    skill_name: str = Field(min_length=2, max_length=120)
    category_code: CategoryCode
    evidence: str = Field(min_length=3, max_length=500)
    confidence: Confidence


class JDResult(BaseModel):
    model_config = ConfigDict(extra="forbid")
    source_type: Literal["jd"] = "jd"
    source_file: str = Field(min_length=1)
    company: str = Field(min_length=1)
    role: str = Field(min_length=1)
    skills: list[Skill] = Field(default_factory=list)
