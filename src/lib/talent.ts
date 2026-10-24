import { SCORED_CATEGORIES, type CategoryCode, type Skill, type TalentCheckResult } from "@/types";

export const CONFIDENCE_POINTS = { high: 3, medium: 2, low: 1 } as const;

export function candidateLevel(skills: Skill[], category: CategoryCode): number {
  const sum = skills
    .filter((s) => s.category_code === category)
    .reduce((acc, s) => acc + CONFIDENCE_POINTS[s.confidence], 0);
  return Math.max(1, Math.min(10, sum));
}

export function runTalentCheck(
  skills: Skill[],
  company: string,
  required: Partial<Record<CategoryCode, number>>,
): TalentCheckResult {
  const rows = SCORED_CATEGORIES.filter((c) => required[c] !== undefined).map((c) => {
    const req = required[c]!;
    const cand = candidateLevel(skills, c);
    return { category_code: c, required_level: req, candidate_level: cand, gap: cand < req };
  });
  const totalReq = rows.reduce((a, r) => a + r.required_level, 0);
  const got = rows.reduce((a, r) => a + Math.min(r.candidate_level, r.required_level), 0);
  return {
    company,
    skillset_gap: rows,
    readiness_score: totalReq === 0 ? 0 : Math.round((100 * got) / totalReq),
  };
}
