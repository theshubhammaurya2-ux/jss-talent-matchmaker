import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dropzone, NextStep, PageHeader, Panel, SkillTable } from "@/components/radix/shared";
import { parseJD } from "@/lib/api";
import { useAppState } from "@/lib/app-state";
import { pageHead } from "@/lib/head";
import { supabase } from "@/integrations/supabase/client";
import type { CategoryCode, Confidence, SkillList } from "@/types";

export const Route = createFileRoute("/")({
  head: () => pageHead("JD Analytics", "Upload a job description and extract the required skills by category."),
  component: JdPage,
});

function JdPage() {
  const { jd, setJd } = useAppState();
  const [draft, setDraft] = useState<SkillList | null>(jd);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ id: string; source_file: string; company: string | null; role: string | null }[]>([]);

  const loadSaved = async () => {
    const { data, error } = await supabase.from("job_descriptions").select("id, source_file, company, role").order("created_at", { ascending: false });
    if (error) toast.error("Couldn't load saved JDs");
    else setSaved(data);
  };
  useEffect(() => { loadSaved(); }, []);

  const onFile = async (f: File) => {
    setLoading(true);
    try {
      setDraft(await parseJD(f));
      toast.success("JD parsed");
    } catch {
      toast.error("Failed to parse JD");
    } finally {
      setLoading(false);
    }
  };

  const pick = async (id: string) => {
    const meta = saved.find((s) => s.id === id);
    const { data, error } = await supabase.from("jd_skills").select("*").eq("jd_id", id);
    if (error || !meta) return toast.error("Couldn't load JD");
    const list: SkillList = {
      id, source_type: "jd", source_file: meta.source_file, company: meta.company ?? "", role: meta.role ?? "",
      skills: data.map((s) => ({ skill_name: s.skill_name, category_code: s.category_code as CategoryCode, evidence: s.evidence ?? "", confidence: s.confidence as Confidence })),
    };
    setDraft(list);
    setJd(list);
    toast.success(`Loaded ${meta.company} · ${meta.role}`);
  };

  const useThis = async () => {
    if (!draft) return;
    if (draft.id) { setJd(draft); return toast.success("JD selected"); }
    setSaving(true);
    try {
      const { data, error } = await supabase.from("job_descriptions").insert({ source_file: draft.source_file, company: draft.company, role: draft.role }).select("id").single();
      if (error) throw error;
      const { error: e2 } = await supabase.from("jd_skills").insert(draft.skills.map((s) => ({ ...s, jd_id: data.id })));
      if (e2) throw e2;
      const withId = { ...draft, id: data.id };
      setDraft(withId);
      setJd(withId);
      loadSaved();
      toast.success("JD saved and selected");
    } catch {
      toast.error("Couldn't save JD");
    } finally {
      setSaving(false);
    }
  };

  const chart = useMemo(() => {
    const m = new Map<string, number>();
    draft?.skills.forEach((s) => m.set(s.category_code, (m.get(s.category_code) ?? 0) + 1));
    return [...m].map(([code, count]) => ({ code, count }));
  }, [draft]);

  return (
    <>
      <PageHeader step={1} title="JD Analytics" subtitle="Upload a job description to extract the skills a company is hiring for, grouped by category." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><Dropzone onFile={onFile} loading={loading} label="Upload job description" /></div>
        <Panel title="Saved JDs">
          <Select onValueChange={pick} value={draft?.id}>
            <SelectTrigger><SelectValue placeholder={saved.length ? "Pick a saved JD" : "No saved JDs yet"} /></SelectTrigger>
            <SelectContent>
              {saved.map((s) => <SelectItem key={s.id} value={s.id}>{s.company} · {s.role} ({s.source_file})</SelectItem>)}
            </SelectContent>
          </Select>
          <p className="mt-3 text-xs text-muted-foreground">Tip: different file names produce different demo JDs (Google, TCS, Amazon).</p>
        </Panel>
      </div>

      {loading && <div className="mt-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>}

      {draft && !loading && (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Panel className="lg:col-span-2" title={`${draft.company} · ${draft.role}`}
            action={jd?.id && jd.id === draft.id
              ? <span className="flex items-center gap-1 text-sm font-medium text-success"><CheckCircle2 className="h-4 w-4" /> Selected</span>
              : <Button onClick={useThis} disabled={saving}>{saving ? "Saving…" : "Use this JD"}</Button>}>
            <SkillTable skills={draft.skills} />
          </Panel>
          <Panel title="Skills per category">
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={chart}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="code" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {chart.map((c) => <Cell key={c.code} fill={`var(--cat-${c.code})`} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      )}
      <NextStep to="/resume" label="Next: Resume Parsing" disabled={!jd} />
    </>
  );
}
