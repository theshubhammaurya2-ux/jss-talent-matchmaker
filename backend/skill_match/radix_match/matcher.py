"""Core matching logic for Role 5: Skill Matching.

Idea: for every skill the JD asks for, try to find the candidate's best answer.
Three tiers, strongest first:
  1. name match      -> same skill (after normalising aliases like DSA, OOP)
  2. category match  -> candidate has a *related* skill in the same category (half credit)
  3. missing         -> nothing found, goes in the gap list
Each JD skill is weighted by its importance (high=3, medium=2, low=1).
"""
import re
from difflib import SequenceMatcher
from typing import Optional, Tuple

from .models import (Skill, SkillSource, MatchedSkill, MissingSkill, MatchResult)

try:                                   # rapidfuzz is faster/better; difflib is the fallback
    from rapidfuzz import fuzz
    def _similar(a: str, b: str) -> int:
        return int(fuzz.token_sort_ratio(a, b))
except ImportError:                    # pragma: no cover
    def _similar(a: str, b: str) -> int:
        return int(100 * SequenceMatcher(None, a, b).ratio())

# ---- tunable settings (your "design decisions" for the demo) ---------------
IMPORTANCE_WEIGHT = {"high": 3, "medium": 2, "low": 1}
FUZZY_THRESHOLD = 85        # similarity needed to call two names "the same skill"
PARTIAL_CREDIT = 0.5        # credit for a related skill in the same category
PARTIAL_CATEGORIES_EXCLUDED = {"OTHER"}   # OTHER is too vague for category matching

# Words that mean the same thing -> one canonical form.
ALIASES = {
    "dsa": "data structures and algorithms",
    "data structures": "data structures and algorithms",
    "algorithms": "data structures and algorithms",
    "data structures algorithms": "data structures and algorithms",
    "oop": "object oriented",
    "oops": "object oriented",
    "object oriented design": "object oriented",
    "object oriented programming": "object oriented",
    "oo design": "object oriented",
    "os": "operating systems",
    "computer networks": "networking",
    "computer networking": "networking",
    "networking basics": "networking",
    "networking fundamentals": "networking",
    "js": "javascript", "py": "python", "k8s": "kubernetes",
    "postgres": "postgresql", "ml": "machine learning",
    "machine learning basics": "machine learning",
    "basic machine learning": "machine learning",
    "node": "nodejs", "node.js": "nodejs",
    "cicd": "ci/cd", "ci cd": "ci/cd",
    "probability and statistics": "statistics",
    "unit testing": "software testing", "testing": "software testing",
    "verbal communication": "communication",
    "presentation skills": "communication",
}
# Filler words dropped before comparing ("Basic SQL" ~ "SQL")
FILLER = {"basic", "basics", "fundamentals", "and", "of", "the", "knowledge", "skills", "strong"}
# Words too generic to prove two skills are the same ("Schema Design" vs "System Design")
GENERIC = {"systems", "system", "design", "tools", "tool", "software", "reasoning", "analysis",
           "development", "programming", "engineering", "management", "testing", "data"}


def normalize(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r"\(.*?\)", " ", s)                  # drop "(pandas, scikit-learn)" etc.
    s = re.sub(r"[^a-z0-9+#./\s]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    if s in ALIASES:
        return ALIASES[s]
    words = [w for w in s.split() if w not in FILLER]
    s2 = " ".join(words)
    return ALIASES.get(s2, s2 or s)


def _name_similarity(jd_name: str, cand_name: str) -> int:
    a, b = normalize(jd_name), normalize(cand_name)
    if not a or not b:
        return 0
    if a == b:
        return 100
    ta, tb = set(a.split()), set(b.split())
    # "operating systems and linux" contains "operating systems" -> strong match
    if len(tb) >= 2 and tb <= ta or len(ta) >= 2 and ta <= tb:
        return 92
    # a short skill word inside a longer JD phrase, e.g. "sql" in "query optimization sql"
    if (len(ta) == 1 and a in tb) or (len(tb) == 1 and b in ta):
        return 90
    # they share one distinctive keyword, e.g. "ticketing" in "ticketing tools" / "incident ticketing systems"
    shared = {w for w in (ta & tb) if len(w) >= 5 and w not in GENERIC}
    if shared:
        return 88
    return _similar(a, b)


def find_best_name_match(jd_skill: Skill, cand_skills) -> Tuple[int, Optional[Skill]]:
    best, best_skill = 0, None
    for c in cand_skills:
        sc = _name_similarity(jd_skill.skill_name, c.skill_name)
        if sc > best:
            best, best_skill = sc, c
    return best, best_skill


def _best_in_category(jd_skill: Skill, cand_skills) -> Optional[Skill]:
    """Pick the candidate's strongest skill in the same category."""
    rank = {"high": 3, "medium": 2, "low": 1}
    same = [c for c in cand_skills if c.category_code == jd_skill.category_code]
    if not same:
        return None
    return sorted(same, key=lambda c: -rank.get(c.confidence, 2))[0]


def match(candidate: SkillSource, jd: SkillSource) -> MatchResult:
    matched, missing = [], []
    total_w = got_w = 0.0
    cat_total, cat_got = {}, {}
    used = set()                       # candidate skills already used as an exact match

    # Pass 1: exact/fuzzy name matches first, so they get first pick of skills
    decisions = {}
    for i, js in enumerate(jd.skills):
        score, cs = find_best_name_match(js, candidate.skills)
        if cs is not None and score >= FUZZY_THRESHOLD:
            decisions[i] = ("name_match", cs, score, 1.0)
            used.add(cs.skill_name)

    # Pass 2: related-skill (category) matches for what is still unmatched
    for i, js in enumerate(jd.skills):
        if i in decisions:
            continue
        if js.category_code not in PARTIAL_CATEGORIES_EXCLUDED:
            cs = _best_in_category(js, candidate.skills)
            if cs is not None:
                decisions[i] = ("category_match", cs, 0, PARTIAL_CREDIT)

    for i, js in enumerate(jd.skills):
        w = IMPORTANCE_WEIGHT.get(js.confidence, 2)
        total_w += w
        cat_total[js.category_code] = cat_total.get(js.category_code, 0) + w
        if i in decisions:
            kind, cs, score, credit = decisions[i]
            got_w += w * credit
            cat_got[js.category_code] = cat_got.get(js.category_code, 0) + w * credit
            matched.append(MatchedSkill(
                jd_skill=js.skill_name, candidate_skill=cs.skill_name,
                category_code=js.category_code, match_type=kind,
                similarity=score, credit=credit, candidate_evidence=cs.evidence))
        else:
            missing.append(MissingSkill(js.skill_name, js.category_code, js.confidence))

    score_pct = round(100 * got_w / total_w) if total_w else 0
    breakdown = {c: round(100 * cat_got.get(c, 0) / t) for c, t in cat_total.items()}
    missing.sort(key=lambda m: -IMPORTANCE_WEIGHT.get(m.importance, 2))
    matched.sort(key=lambda m: (-m.credit, m.jd_skill))

    top_gaps = [m.skill_name for m in missing if m.importance == "high"][:3]
    summary = f"{score_pct}% match for {jd.company} {jd.role}".strip()
    if top_gaps:
        summary += f". Key gaps: {', '.join(top_gaps)}"
    elif not missing:
        summary += ". No gaps found"

    return MatchResult(jd_source_file=jd.source_file, match_score=score_pct,
                       matched_skills=matched, missing_skills=missing,
                       category_breakdown=breakdown, summary=summary)
