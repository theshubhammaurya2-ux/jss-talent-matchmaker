"""Explainable QA hints for JD extraction. Does NOT modify the shared RADIX result.

The heuristic flags are REVIEW SUGGESTIONS, not missing-skill facts. Only the JD
requirements section is searched; optional-only sections are deliberately excluded.
"""
from __future__ import annotations

from collections import Counter
import re
import unicodedata
from .models import JDResult

# Always show all 12 official RADIX skill categories, even at zero.
RADIX_CATEGORIES = (
    "COD", "DSA", "OOD", "APTI", "COMM", "AI",
    "CLOUD", "SQL", "SWE", "SYSD", "NETW", "OS",
)

# Indicative wording for *specific* skill categories. A match is a cue to review;
# it does not automatically add an LLM-extracted skill to the official result.
SIGNALS: dict[str, tuple[str, ...]] = {
    "COD": (r"\bprogramming\b", r"\bcoding\b", r"\bwrite (?:working |efficient )?code\b", r"\bstring/array manipulation\b"),
    "DSA": (r"\bdata structures\b", r"\balgorithms\b", r"\btime and space complexity\b"),
    "OOD": (r"\bobject[- ]oriented\b", r"\bdesign patterns?\b"),
    "APTI": (r"\bquantitative reasoning\b", r"\bprobability\b", r"\bapplied statistics\b"),
    "COMM": (r"\bcommunication\b", r"\bstakeholders?\b", r"\bexplain a technical tradeoff\b"),
    "AI": (r"\bmachine learning\b", r"\bML literacy\b", r"\bregression vs\. classification\b"),
    "CLOUD": (r"\bcloud computing\b", r"\bAWS\b", r"\bMicrosoft Azure\b", r"\bGoogle Cloud Platform\b"),
    "SQL": (r"\bSQL\b", r"\brelational databases?\b", r"\bindex[- ]aware query\b"),
    "SWE": (r"\bCI/CD\b", r"\bcode review\b", r"\bunit testing\b", r"\bsoftware development lifecycle\b"),
    "SYSD": (r"\bsystem design\b", r"\bdistributed systems?\b", r"\blarge[- ]scale architecture\b"),
    "NETW": (r"\bnetworking\b", r"\bTCP/UDP\b", r"\bHTTP\b", r"\bnetwork protocols?\b"),
    "OS": (r"\boperating systems?\b", r"\bvirtual memory\b", r"\bthreads\b", r"\bprocesses\b"),
}

# Known expressions that might describe the same skill. Suggested for review only.
ALIAS_GROUPS: tuple[tuple[str, ...], ...] = (
    ("sql", "sql knowledge", "structured query language"),
    ("object oriented programming", "oop"),
    ("continuous integration continuous deployment", "ci cd", "cicd"),
    ("data structures and algorithms", "dsa"),
    ("software development lifecycle", "sdlc"),
)


def _norm(value: str) -> str:
    value = unicodedata.normalize("NFKC", value).casefold()
    return re.sub(r"[^\w]+", " ", value).strip()


def required_portion(text: str) -> str:
    """Remove optional-only, compensation and benefits sections when possible."""
    # JDs in the supplied pack use 'Nice to Have' and then 'Benefits'.
    cutoff = re.search(r"(?im)^\s*(?:nice to have|preferred qualifications?|benefits|compensation)\s*:?\s*$", text)
    return text[:cutoff.start()] if cutoff else text


def quality_report(result: JDResult, jd_text: str) -> dict:
    """Deterministic quality dashboard; no AI call and no output-schema change."""
    counts = Counter(s.category_code for s in result.skills)
    confidences = Counter(s.confidence for s in result.skills)
    required = required_portion(jd_text)
    hints = []
    for code, patterns in SIGNALS.items():
        if counts[code]:
            continue
        for pattern in patterns:
            match = re.search(pattern, required, re.IGNORECASE)
            if match:
                hints.append({
                    "category_code": code,
                    "jd_phrase": match.group(0),
                    "note": "Possible coverage gap: review the JD and decide if an additional skill is warranted.",
                })
                break

    possible_duplicates = []
    name_to_skills: dict[str, list[str]] = {}
    for skill in result.skills:
        name_to_skills.setdefault(_norm(skill.skill_name), []).append(skill.skill_name)
    for alias_group in ALIAS_GROUPS:
        hits = [name for alias in alias_group for name in name_to_skills.get(_norm(alias), [])]
        if len(hits) > 1:
            possible_duplicates.append(hits)

    return {
        "total_skills": len(result.skills),
        "category_counts": {
            **{code: counts[code] for code in RADIX_CATEGORIES},
            # OTHER is supported by the shared contract but is not a 13th official category.
            **({"OTHER": counts["OTHER"]} if counts["OTHER"] else {}),
        },
        "confidence_counts": {level: confidences[level] for level in ("high", "medium", "low")},
        "coverage_hints": hints,
        "possible_duplicates": possible_duplicates,
        "note": "Coverage hints are heuristic review suggestions, not proven missing requirements. "
                "They never change the official skills array or Role 5's inputs.",
    }
