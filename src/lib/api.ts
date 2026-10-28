// All calls to the Python parsing/matching API live here.
// Each function currently returns MOCK data after 1s; swap the body for the real fetch later.
import type { MatchResult, ParsedResume, Skill, SkillList } from "@/types";

export const API_URL = import.meta.env["VITE_API_URL"] ?? "http://localhost:8000";
const delay = (ms = 1000) => new Promise((r) => setTimeout(r, ms));
const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

const JD_PRESETS: Omit<SkillList, "source_file" | "source_type">[] = [
  {
    company: "Google", role: "Software Engineer II",
    skills: [
      { skill_name: "Data Structures", category_code: "DSA", evidence: "Strong grasp of data structures and algorithms", confidence: "high" },
      { skill_name: "Graph Algorithms", category_code: "DSA", evidence: "Experience with graph traversal problems", confidence: "medium" },
      { skill_name: "Java", category_code: "COD", evidence: "Proficiency in Java, C++ or Go", confidence: "high" },
      { skill_name: "C++", category_code: "COD", evidence: "Proficiency in Java, C++ or Go", confidence: "medium" },
      { skill_name: "Distributed Systems", category_code: "SYSD", evidence: "Design large-scale distributed systems", confidence: "high" },
      { skill_name: "Design Patterns", category_code: "OOD", evidence: "Apply OOP design patterns", confidence: "medium" },
      { skill_name: "Kubernetes", category_code: "CLOUD", evidence: "Familiarity with container orchestration", confidence: "low" },
      { skill_name: "Machine Learning", category_code: "AI", evidence: "Exposure to ML pipelines is a plus", confidence: "low" },
      { skill_name: "Code Review", category_code: "SWE", evidence: "Participate in code reviews", confidence: "medium" },
      { skill_name: "Linux", category_code: "OS", evidence: "Comfortable in Linux environments", confidence: "medium" },
    ],
  },
  {
    company: "TCS", role: "Systems Engineer",
    skills: [
      { skill_name: "Python", category_code: "COD", evidence: "Hands-on Python programming", confidence: "high" },
      { skill_name: "SQL", category_code: "SQL", evidence: "Write and optimise SQL queries", confidence: "high" },
      { skill_name: "Quantitative Aptitude", category_code: "APTI", evidence: "Clear aptitude assessment", confidence: "high" },
      { skill_name: "Communication", category_code: "COMM", evidence: "Excellent verbal and written communication", confidence: "high" },
      { skill_name: "OOP", category_code: "OOD", evidence: "Object-oriented programming concepts", confidence: "medium" },
      { skill_name: "Arrays & Strings", category_code: "DSA", evidence: "Basic problem solving", confidence: "medium" },
      { skill_name: "Computer Networks", category_code: "NETW", evidence: "Knowledge of TCP/IP", confidence: "low" },
      { skill_name: "Agile", category_code: "SWE", evidence: "Work in agile teams", confidence: "medium" },
    ],
  },
  {
    company: "Amazon", role: "SDE-1 (AWS)",
    skills: [
      { skill_name: "AWS", category_code: "CLOUD", evidence: "Build services on AWS", confidence: "high" },
      { skill_name: "Docker", category_code: "CLOUD", evidence: "Containerised deployments", confidence: "medium" },
      { skill_name: "Dynamic Programming", category_code: "DSA", evidence: "Solve complex algorithmic problems", confidence: "high" },
      { skill_name: "Java", category_code: "COD", evidence: "Production Java experience", confidence: "high" },
      { skill_name: "System Design", category_code: "SYSD", evidence: "Design scalable, fault-tolerant services", confidence: "high" },
      { skill_name: "NoSQL", category_code: "SQL", evidence: "DynamoDB or similar", confidence: "medium" },
      { skill_name: "Leadership Principles", category_code: "COMM", evidence: "Customer obsession, ownership", confidence: "medium" },
      { skill_name: "Unit Testing", category_code: "SWE", evidence: "Write well-tested code", confidence: "medium" },
      { skill_name: "Operating Systems", category_code: "OS", evidence: "Concurrency and threads", confidence: "low" },
    ],
  },
];

type Persona = Omit<ParsedResume, "source_file" | "source_type" | "company" | "role">;
const RESUME_PRESETS: Persona[] = [
  {
    name: "Aarav Sharma", email: "aarav.sharma@jssateb.ac.in", education: "B.E. Computer Science, JSS Academy of Technical Education (CGPA 8.9)",
    skills: [
      { skill_name: "Java", category_code: "COD", evidence: "3 projects in Java", confidence: "high" },
      { skill_name: "C++", category_code: "COD", evidence: "Competitive programming", confidence: "high" },
      { skill_name: "Data Structures", category_code: "DSA", evidence: "400+ LeetCode problems", confidence: "high" },
      { skill_name: "Graph Algorithms", category_code: "DSA", evidence: "Codeforces Expert", confidence: "high" },
      { skill_name: "Dynamic Programming", category_code: "DSA", evidence: "ICPC regionalist", confidence: "medium" },
      { skill_name: "Design Patterns", category_code: "OOD", evidence: "Library management system", confidence: "medium" },
      { skill_name: "Linux", category_code: "OS", evidence: "Daily driver", confidence: "medium" },
      { skill_name: "Code Review", category_code: "SWE", evidence: "Open-source contributor", confidence: "low" },
    ],
    projects: [
      { title: "Campus Ride Share", description: "Java + Spring app matching students for carpools." },
      { title: "Graph Visualiser", description: "Interactive visualiser for Dijkstra and A*." },
    ],
    experience: [{ company: "CodeChef JSS Chapter", role: "Problem Setter", duration: "1 yr" }],
  },
  {
    name: "Priya Verma", email: "priya.verma@jssateb.ac.in", education: "B.E. Information Science, JSS Academy of Technical Education (CGPA 8.2)",
    skills: [
      { skill_name: "Python", category_code: "COD", evidence: "Data pipelines", confidence: "high" },
      { skill_name: "SQL", category_code: "SQL", evidence: "PostgreSQL in internship", confidence: "high" },
      { skill_name: "Communication", category_code: "COMM", evidence: "Debate club president", confidence: "high" },
      { skill_name: "Quantitative Aptitude", category_code: "APTI", evidence: "AMCAT 95th percentile", confidence: "high" },
      { skill_name: "Machine Learning", category_code: "AI", evidence: "Kaggle notebook bronze", confidence: "medium" },
      { skill_name: "OOP", category_code: "OOD", evidence: "Coursework", confidence: "low" },
      { skill_name: "Agile", category_code: "SWE", evidence: "Scrum in internship", confidence: "medium" },
    ],
    projects: [{ title: "Placement Predictor", description: "ML model predicting placement odds from academics." }],
    experience: [{ company: "Infosys", role: "Data Analyst Intern", duration: "3 months" }],
  },
  {
    name: "Rohan Gupta", email: "rohan.gupta@jssateb.ac.in", education: "B.E. Electronics & Communication, JSS Academy of Technical Education (CGPA 7.6)",
    skills: [
      { skill_name: "AWS", category_code: "CLOUD", evidence: "AWS Cloud Practitioner", confidence: "high" },
      { skill_name: "Docker", category_code: "CLOUD", evidence: "Deployed 4 services", confidence: "high" },
      { skill_name: "Computer Networks", category_code: "NETW", evidence: "CCNA coursework", confidence: "high" },
      { skill_name: "Linux", category_code: "OS", evidence: "Shell scripting", confidence: "high" },
      { skill_name: "Python", category_code: "COD", evidence: "Automation scripts", confidence: "medium" },
      { skill_name: "Arrays & Strings", category_code: "DSA", evidence: "HackerRank 3-star", confidence: "low" },
    ],
    projects: [{ title: "IoT Home Monitor", description: "ESP32 sensors streaming to AWS IoT Core." }],
    experience: [{ company: "Startup Labs", role: "DevOps Intern", duration: "2 months" }],
  },
];

export async function parseJD(file: File): Promise<SkillList> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/api/jd/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`JD analysis failed: ${response.status}`);
  }

  return (await response.json()) as SkillList;
}


export async function parseResume(file: File): Promise<ParsedResume> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    "http://127.0.0.1:8001/api/resume/analyze",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`Resume parsing failed: ${response.status}`);
  }

  const data = await response.json();

  return {
    source_type: "resume",
    source_file: data.source_file,
    name: data.name,
    email: "",
    education: data.education.join("\n"),

    projects: data.projects.map((p: string) => {
      const [title, ...description] = p.split("|");
      return {
        title: (title ?? "").trim(),
        description: description.join("|").trim(),
      };
    }),

    experience: data.experience.map((e: string) => {
      const [role, company, ...duration] = e.split("|");
      return {
        company: company?.trim() || "",
        role: role?.trim() || "",
        duration: duration.join("|").trim(),
      };
    }),

    skills: data.skills,
    company: "",
    role: "",
  };
}

export async function matchSkills(candidateSkills: Skill[], jdSkillList: SkillList): Promise<MatchResult> {
  // Real: POST `${API_URL}/match` with JSON { candidate_skills, jd_skill_list }
  await delay();
  const have = new Set(candidateSkills.map((s) => s.skill_name.trim().toLowerCase()));
  const matched: string[] = [];
  const missing: string[] = [];
  for (const s of jdSkillList.skills) (have.has(s.skill_name.trim().toLowerCase()) ? matched : missing).push(s.skill_name);
  const total = jdSkillList.skills.length || 1;
  return { jd_source_file: jdSkillList.source_file, match_score: Math.round((100 * matched.length) / total), matched_skills: matched, missing_skills: missing };
}
