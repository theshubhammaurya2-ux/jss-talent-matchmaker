# Role 4 presentation notes

## What to say

“Talent Check compares a saved candidate profile against a selected company's expected levels across all 12 RADIX skillsets. It calculates a readiness score and shows the candidate's level, the company requirement, and whether there is a gap for each category. The company expectations come from the provided local JSON snapshot, so the check does not depend on a live company-data API. The scoring is transparent: candidate levels are estimated from skill confidence, gaps are calculated per category, and the readiness score is the capped achieved level divided by total required level. Results are also saved to Supabase when the configured tables are available.”

## Demo sequence

1. Open Profile Builder and load/save a candidate with categorized skills.
2. Open Talent Check (`/talent`).
3. Select Google LLC, Microsoft Corporation, or Oracle Financial Services Software Limited.
4. Click **Run Talent Check**.
5. Show the readiness gauge, radar chart, and category gap table.
6. Switch company and run again to show that the company bar changes the result.

## Be clear about limitations

This is a rule-based readiness estimate, not an AI verdict or a guarantee of hiring outcomes. Skill level is inferred from the profile's skill confidence values. Supabase result history requires the project's Supabase environment and schema to be configured.
