# Skill Matching (Role 5) - Handoff

## What it does
Compares a candidate's skill list against ONE job's skill list and returns a match score,
which skills matched, and which are missing (the gap list).

## Run the API
    pip install -r requirements.txt
    uvicorn radix_match.api:app --reload --port 8005
Open http://localhost:8005/docs to try it.

## Endpoint
`POST http://localhost:8005/match`

Request (shapes come from the shared data contract):
    {
      "candidate": { "name": "...", "skills": [ {skill_name, category_code, evidence, confidence} ] },
      "jd":        { "source_file": "...", "company": "...", "role": "...", "skills": [ ... ] }
    }
- `candidate` = Role 3 saved profile (or Role 2 resume output)
- `jd` = Role 1 output

Response:
    {
      "jd_source_file": "...",
      "match_score": 0-100,
      "matched_skills": [ {jd_skill, candidate_skill, category_code, match_type, similarity, credit, candidate_evidence} ],
      "missing_skills": [ {skill_name, category_code, importance} ],
      "category_breakdown": { "SQL": 100, "OS": 50, ... },
      "summary": "71% match for Oracle ... Key gaps: ..."
    }

## How the score works
- Every JD skill has a weight: high=3, medium=2, low=1 (from the JD's `confidence`).
- Name match (after aliases like DSA = Data Structures) = full credit.
- Related skill in the same category (e.g. candidate has Linux, JD wants Operating Systems) = half credit,
  marked `match_type: "category_match"`.
- Category `OTHER` never gets partial credit.
- Score = earned weight / total weight.
- Tunable in `radix_match/matcher.py`: FUZZY_THRESHOLD, PARTIAL_CREDIT, ALIASES.

## Test
    python run_tests.py          (or: pytest)
    python -m radix_match.run_all    (4 candidates x 6 JDs table)
    python -m radix_match.cli samples/candidates/priya_menon.json samples/jd_skills/oracle_app_support.json
