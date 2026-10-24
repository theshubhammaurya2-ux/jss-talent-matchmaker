import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CategoryBadge, EmptyState, Gauge, NextStep, PageHeader, Panel } from "@/components/radix/shared";
import { useAppState } from "@/lib/app-state";
import { pageHead } from "@/lib/head";
import { runTalentCheck } from "@/lib/talent";
import { supabase } from "@/integrations/supabase/client";
import type { CategoryCode } from "@/types";

export const Route = createFileRoute("/talent")({
  head: () => pageHead("Talent Check", "Compare a candidate's skill levels to a company's required skillset and get a readiness score."),
  component: TalentPage,
});

function TalentPage() {
  const { profile, talent, setTalent } = useAppState();
  const [companies, setCompanies] = useState<string[]>([]);
  const [company, setCompany] = useState(talent?.company ?? "");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    supabase.from("company_skillsets").select("company").then(({ data, error }) => {
      if (error) toast.error("Couldn't load companies");
      else setCompanies([...new Set(data.map((d) => d.company))].sort());
    });
  }, []);

  if (!profile?.id) return (
    <>
      <PageHeader step={4} title="Talent Check" subtitle="See how ready a candidate is for a company." />
      <EmptyState title="No saved profile yet" body="Save a candidate profile first — Talent Check uses its skills to compute levels." to="/profile" cta="Go to Profile Builder" />
    </>
  );

  const run = async () => {
    if (!company) return toast.error("Choose a company first");
    setRunning(true);
    try {
      const { data, error } = await supabase.from("company_skillsets").select("category_code, required_level").eq("company", company);
      if (error) throw error;
      const req = Object.fromEntries(data.map((d) => [d.category_code, d.required_level])) as Partial<Record<CategoryCode, number>>;
      const r = runTalentCheck(profile.skills, company, req);
      setTalent(r);
      const { data: tr, error: e2 } = await supabase.from("talent_results").insert({ candidate_id: profile.id, company, readiness_score: r.readiness_score }).select("id").single();
      if (e2) throw e2;
      const { error: e3 } = await supabase.from("talent_result_gaps").insert(r.skillset_gap.map((g) => ({ ...g, talent_result_id: tr.id })));
      if (e3) throw e3;
      toast.success("Talent check saved");
    } catch {
      toast.error("Talent check failed");
    } finally {
      setRunning(false);
    }
  };

  const radar = talent?.skillset_gap.map((g) => ({ cat: g.category_code, Candidate: g.candidate_level, Company: g.required_level })) ?? [];

  return (
    <>
      <PageHeader step={4} title="Talent Check" subtitle={`How ready is ${profile.name} for a company's hiring bar?`} />
      <Panel className="mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <Select value={company} onValueChange={setCompany}>
            <SelectTrigger className="md:w-72"><SelectValue placeholder="Choose a company" /></SelectTrigger>
            <SelectContent>{companies.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <Button size="lg" className="h-14 flex-1 text-base" onClick={run} disabled={running}>{running ? "Running…" : "Run Talent Check"}</Button>
        </div>
      </Panel>

      {talent && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
            <Panel title={`Readiness for ${talent.company}`} className="flex flex-col items-center">
              <Gauge value={talent.readiness_score} label="Readiness score" size={220} />
              <p className="mt-3 text-sm text-muted-foreground">{talent.skillset_gap.filter((g) => g.gap).length} of {talent.skillset_gap.length} categories below the bar</p>
            </Panel>
            <Panel title="Candidate vs company bar">
              <div className="h-80">
                <ResponsiveContainer>
                  <RadarChart data={radar}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="cat" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                    <Radar name="Company" dataKey="Company" stroke="var(--destructive)" fill="var(--destructive)" fillOpacity={0.12} />
                    <Radar name="Candidate" dataKey="Candidate" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.35} />
                    <Legend /><Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
          <Panel title="Category breakdown">
            <Table>
              <TableHeader><TableRow><TableHead>Category</TableHead><TableHead>Required</TableHead><TableHead>Candidate</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {talent.skillset_gap.map((g) => (
                  <TableRow key={g.category_code}>
                    <TableCell><CategoryBadge code={g.category_code} /></TableCell>
                    <TableCell>{g.required_level}</TableCell>
                    <TableCell>{g.candidate_level}</TableCell>
                    <TableCell>
                      <span className={g.gap ? "rounded-full bg-destructive px-2.5 py-0.5 text-xs font-semibold text-destructive-foreground" : "rounded-full bg-success px-2.5 py-0.5 text-xs font-semibold text-success-foreground"}>
                        {g.gap ? "Gap" : "OK"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
        </div>
      )}
      <NextStep to="/match" label="Next: Skill Matching" />
    </>
  );
}
