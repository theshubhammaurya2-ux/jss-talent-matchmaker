export const CATEGORY_CODES = ["DSA", "COD", "OOD", "APTI", "COMM", "AI", "CLOUD", "SQL", "SWE", "SYSD", "NETW", "OS", "OTHER"] as const;
export type CategoryCode = (typeof CATEGORY_CODES)[number];
export const SCORED_CATEGORIES = CATEGORY_CODES.filter((c) => c !== "OTHER");
export type Confidence = "high" | "medium" | "low";

export interface Skill {
  skill_name: string;
  category_code: CategoryCode;
  evidence: string;
  confidence: Confidence;
}

export interface SkillList {
  id?: string;
  source_type: "jd" | "resume";
  source_file: string;
  company: string;
  role: string;
  skills: Skill[];
}

export interface Hackathon { name: string; result: string }
export interface Internship { company: string; role: string; duration: string }
export interface Certification { name: string; issuer: string }

export interface Profile {
  id?: string;
  name: string;
  email: string;
  education: string;
  skills: Skill[];
  hackathons: Hackathon[];
  internships: Internship[];
  certifications: Certification[];
  preferred_roles: string[];
  cv_file: string;
}

export interface ParsedResume extends SkillList {
  name: string;
  email: string;
  education: string;
  projects: { title: string; description: string }[];
  experience: { company: string; role: string; duration: string }[];
}

export interface GapRow {
  category_code: CategoryCode;
  required_level: number;
  candidate_level: number;
  gap: boolean;
}

export interface TalentCheckResult {
  company: string;
  skillset_gap: GapRow[];
  readiness_score: number;
}

export interface MatchResult {
  jd_source_file: string;
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
}
