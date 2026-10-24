/** Role 1 -> Role 5 typed API client (Vite/React). No secrets in frontend code. */
export type RadixCategory =
  | 'COD' | 'DSA' | 'OOD' | 'APTI' | 'COMM' | 'AI' | 'CLOUD'
  | 'SQL' | 'SWE' | 'SYSD' | 'NETW' | 'OS' | 'OTHER';

export interface RadixSkill {
  skill_name: string;
  category_code: RadixCategory;
  evidence: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface JDResult {
  source_type: 'jd';
  source_file: string;
  company: string;
  role: string;
  skills: RadixSkill[];
}

export interface QualityHint {
  category_code: string;
  jd_phrase: string;
  note: string;
}

export interface JDQualityReport {
  total_skills: number;
  category_counts: Record<string, number>;
  confidence_counts: Record<string, number>;
  coverage_hints: QualityHint[];
  possible_duplicates: string[][];
  note: string;
}

export interface AnalysisWithReport {
  jd: JDResult;
  quality_report: JDQualityReport;
}

// For local development. For deployment, configure the actual reachable backend URL.
const baseUrl = (import.meta.env.VITE_JD_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

async function upload(file: File, path: string): Promise<unknown> {
  const form = new FormData();
  form.append('file', file);
  const response = await fetch(`${baseUrl}${path}`, { method: 'POST', body: form });
  if (!response.ok) {
    let message = `JD analysis failed (HTTP ${response.status})`;
    try {
      const body = await response.json();
      if (typeof body.detail === 'string') message = body.detail;
    } catch { /* non-JSON error response */ }
    throw new Error(message);
  }
  return response.json();
}

/** Stable shared RADIX shape for Role 5. */
export async function analyzeJobDescription(file: File): Promise<JDResult> {
  return (await upload(file, '/api/jd/analyze')) as JDResult;
}

/** Optional richer data for a quality-review panel; Role 5 still gets .jd. */
export async function analyzeJobWithReport(file: File): Promise<AnalysisWithReport> {
  return (await upload(file, '/api/jd/analyze-report')) as AnalysisWithReport;
}
