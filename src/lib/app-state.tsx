import { createContext, useContext, useState, type ReactNode } from "react";
import type { MatchResult, ParsedResume, Profile, SkillList, TalentCheckResult } from "@/types";

interface AppState {
  jd: SkillList | null;
  setJd: (j: SkillList | null) => void;
  resume: ParsedResume | null;
  setResume: (r: ParsedResume | null) => void;
  profile: Profile | null;
  setProfile: (p: Profile | null) => void;
  talent: TalentCheckResult | null;
  setTalent: (t: TalentCheckResult | null) => void;
  match: MatchResult | null;
  setMatch: (m: MatchResult | null) => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [jd, setJd] = useState<SkillList | null>(null);
  const [resume, setResume] = useState<ParsedResume | null>(null);
  const [profile, setProfileRaw] = useState<Profile | null>(null);
  const [talent, setTalent] = useState<TalentCheckResult | null>(null);
  const [match, setMatch] = useState<MatchResult | null>(null);
  const setProfile = (p: Profile | null) => {
    setProfileRaw(p);
    setTalent(null);
    setMatch(null);
  };
  return (
    <Ctx.Provider value={{ jd, setJd: (j) => { setJd(j); setMatch(null); }, resume, setResume, profile, setProfile, talent, setTalent, match, setMatch }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAppState() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAppState outside provider");
  return c;
}
