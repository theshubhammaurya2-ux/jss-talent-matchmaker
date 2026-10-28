# Role 4 — Talent Check

Talent Check compares a saved candidate profile against a company's expected level across the 12 RADIX skillsets. It returns a readiness score and a per-skillset gap breakdown.

## Existing app integration

- UI: `src/routes/talent.tsx` (`/talent`)
- Scoring logic used by the UI: `src/lib/talent.ts`
- Local company snapshot used by the UI: `src/data/companySkillLevels.json`
- Persisted result tables: `talent_results` and `talent_result_gaps` (requires Supabase schema/configuration)

The UI loads company expectations from the checked-in JSON snapshot, so it does not need a live company-skillset query. Running and displaying the score works from the profile in app state; persistence requires the configured Supabase tables.

## Standalone Python implementation

This folder contains a portable implementation of the same scoring approach for testing or command-line demonstration. It uses only the Python standard library.

### Input profile JSON

Create `candidate.json` with the same shape as the shared profile contract, for example:

```json
{
  "name": "Demo Candidate",
  "skills": [
    {"skill_name": "Python", "category_code": "COD", "evidence": "Built an API", "confidence": "high"},
    {"skill_name": "SQL", "category_code": "SQL", "evidence": "Used joins", "confidence": "medium"}
  ]
}
```

### Run

From this folder:

```bash
python cli.py --profile candidate.json --company "Google LLC"
```

Company names must match one of the entries in `data/company_skillsets.json` (Google LLC, Microsoft Corporation, Oracle Financial Services Software Limited).

### Tests

```bash
python -m unittest discover -s tests -v
```

## Scoring decision

- Skill confidence points: `high = 3`, `medium = 2`, `low = 1`.
- Candidate category level is the sum of points for skills mapped to that category, clamped to 1–10; a category with no mapped skills gets level 1.
- A gap is reported when candidate level is below the company's required level.
- Readiness is `sum(min(candidate_level, required_level)) / sum(required_level) * 100`, rounded to the nearest whole percent.
- This is a transparent hackathon heuristic, not a validated hiring prediction.
