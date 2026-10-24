import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, Gauge, PageHeader, Panel } from "@/components/radix/shared";
import { matchSkills } from "@/lib/api";
import { useAppState } from "@/lib/app-state";
import { pageHead } from "@/lib/head";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/match")({
  head: () => pageHead("Skill Matching", "Match a candidate's skills against a job description and see exactly which skills are missing."),
  component: MatchPage,
});

function MatchPage() {
  const { profile, jd, match, setMatch } = useAppState();
  const [running, setRunning] = useState(false);

  if (!jd) return (<><PageHeader step={5} title="Skill Matching" subtitle="Match a candidate to a job description." />
    <EmptyState title="No JD selected" body="Pick or upload a job description in JD Analytics first." to="/" cta="Go to JD Analytics" /></>);
  if (!profile?.id) return (<><PageHeader step={5} title="Skill Matching" subtitle="Match a candidate to a job description." />
    <EmptyState title="No saved profile" body="Save a candidate profile so we can compare their skills to the JD." to="/profile" cta="Go to Profile Builder" /></>);

  const run = async () => {
    setRunning(true);
    try {
      const r = await matchSkills(profile.skills, jd);
      setMatch(r);
      const { error } = await supabase.from("match_results").insert({ candidate_id: profile.id, jd_id: jd.id ?? null, ...r });
      if (error) throw error;
      toast.success("Skill match saved");
    } catch {
      toast.error("Skill match failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <PageHeader step={5} title="Skill Matching" subtitle={`${profile.name} vs ${jd.company} · ${jd.role}`} />
      <Button size="lg" className="mb-6 h-14 w-full text-base" onClick={run} disabled={running}>{running ? "Matching…" : "Run Skill Match"}</Button>

      {match && (
        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <div className="space-y-6">
            <Panel title="Match score" className="flex flex-col items-center"><Gauge value={match.match_score} label={match.jd_source_file} /></Panel>
            <Panel title={`Matched (${match.matched_skills.length})`}>
              {match.matched_skills.length === 0 && <p className="text-sm text-muted-foreground">No direct matches yet.</p>}
              <ul className="space-y-2">
                {match.matched_skills.map((s) => <li key={s} className="flex items-center gap-2 text-sm font-medium text-success"><CheckCircle2 className="h-4 w-4" />{s}</li>)}
              </ul>
            </Panel>
          </div>
          <section className="rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-6 shadow-card">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <h2 className="text-xl font-bold text-destructive">Missing skills ({match.missing_skills.length})</h2>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">These are what stand between the candidate and this role. Focus preparation here.</p>
            {match.missing_skills.length === 0
              ? <p className="font-semibold text-success">No gaps — the candidate covers every skill in this JD.</p>
              : <div className="grid gap-3 sm:grid-cols-2">
                  {match.missing_skills.map((s) => (
                    <div key={s} className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-card px-4 py-3 font-semibold text-destructive">
                      <XCircle className="h-5 w-5 shrink-0" />{s}
                    </div>
                  ))}
                </div>}
          </section>
        </div>
      )}
    </>
  );
}
