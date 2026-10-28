from typing import Literal, List
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

class ResumeResult(BaseModel):
    model_config = ConfigDict(extra="forbid")
    source_type: Literal["resume"] = "resume"
    source_file: str = Field(min_length=1)
    name: str = Field(min_length=1)
    education: List[str] = Field(default_factory=list)
    projects: List[str] = Field(default_factory=list)
    experience: List[str] = Field(default_factory=list)
    skills: List[Skill] = Field(default_factory=list)
