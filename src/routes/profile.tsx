import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NextStep, PageHeader, Panel } from "@/components/radix/shared";
import { useAppState } from "@/lib/app-state";
import { pageHead } from "@/lib/head";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_CODES, type CategoryCode, type Confidence, type Profile, type Skill } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  head: () => pageHead("Profile Builder", "Build and save a candidate profile with skills, hackathons, internships and certifications."),
  component: ProfilePage,
});

const ROLES = ["Software Engineer", "Data Analyst", "ML Engineer", "Cloud Engineer", "Systems Engineer", "Full-Stack Developer", "DevOps Engineer"];
const empty: Profile = { name: "", email: "", education: "", skills: [], hackathons: [], internships: [], certifications: [], preferred_roles: [], cv_file: "" };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ProfilePage() {
  const { profile, resume, setProfile } = useAppState();
  const [form, setForm] = useState<Profile>(() =>
    profile ?? (resume ? { ...empty, name: resume.name, email: resume.email, education: resume.education, skills: resume.skills.map((s) => ({ ...s })), cv_file: resume.source_file,
      internships: resume.experience.map((e) => ({ company: e.company, role: e.role, duration: e.duration })) } : empty));
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [saving, setSaving] = useState(false);
  const [candidates, setCandidates] = useState<{ id: string; name: string; email: string }[]>([]);

  const loadList = async () => {
    const { data, error } = await supabase.from("candidates").select("id, name, email").order("created_at", { ascending: false });
    if (error) toast.error("Couldn't load candidates"); else setCandidates(data);
  };
  useEffect(() => { loadList(); }, []);

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setSkill = (i: number, patch: Partial<Skill>) => set("skills", form.skills.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  const load = async (id: string) => {
    const [{ data: c, error }, { data: sk, error: e2 }] = await Promise.all([
      supabase.from("candidates").select("*").eq("id", id).single(),
      supabase.from("candidate_skills").select("*").eq("candidate_id", id),
    ]);
    if (error || e2 || !c) { toast.error("Couldn't load candidate"); return; }
    const p: Profile = {
      id: c.id, name: c.name, email: c.email, education: c.education ?? "", cv_file: c.cv_file ?? "",
      hackathons: (c.hackathons as unknown as Profile["hackathons"]) ?? [], internships: (c.internships as unknown as Profile["internships"]) ?? [],
      certifications: (c.certifications as unknown as Profile["certifications"]) ?? [], preferred_roles: (c.preferred_roles as unknown as string[]) ?? [],
      skills: (sk ?? []).map((s) => ({ skill_name: s.skill_name, category_code: s.category_code as CategoryCode, evidence: s.evidence ?? "", confidence: s.confidence as Confidence })),
    };
    setForm(p);
    setProfile(p);
    toast.success(`Loaded ${p.name}`);
  };

  const save = async () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!EMAIL_RE.test(form.email)) e.email = "Enter a valid email";
    setErrors(e);
    if (Object.keys(e).length) { toast.error("Please fix the highlighted fields"); return; }
    setSaving(true);
    try {
      const row = { name: form.name.trim(), email: form.email.trim(), education: form.education, cv_file: form.cv_file, hackathons: form.hackathons, internships: form.internships, certifications: form.certifications, preferred_roles: form.preferred_roles };
      let id = form.id;
      if (id) {
        const { error } = await supabase.from("candidates").update(row).eq("id", id);
        if (error) throw error;
        await supabase.from("candidate_skills").delete().eq("candidate_id", id);
      } else {
        const { data, error } = await supabase.from("candidates").insert(row).select("id").single();
        if (error) throw error;
        id = data.id;
      }
      const skills = form.skills.filter((s) => s.skill_name.trim());
      if (skills.length) {
        const { error } = await supabase.from("candidate_skills").insert(skills.map((s) => ({ ...s, candidate_id: id! })));
        if (error) throw error;
      }
      const p = { ...form, id, skills };
      setForm(p);
      setProfile(p);
      loadList();
      toast.success("Profile saved");
    } catch {
      toast.error("Couldn't save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader step={3} title="Profile Builder" subtitle="Review and complete the candidate's profile, then save it for Talent Check and Skill Matching." />
      <Panel className="mb-6" title="Load existing candidate">
        <Select onValueChange={load} value={form.id ?? ""}>
          <SelectTrigger className="max-w-md"><SelectValue placeholder={candidates.length ? "Choose a candidate" : "No saved candidates yet"} /></SelectTrigger>
          <SelectContent>{candidates.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} — {c.email}</SelectItem>)}</SelectContent>
        </Select>
      </Panel>

      <div className="space-y-6">
        <Panel title="Basic details">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name *" error={errors.name}><Input value={form.name} onChange={(e) => set("name", e.target.value)} className={cn(errors.name && "border-destructive")} /></Field>
            <Field label="Email *" error={errors.email}><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={cn(errors.email && "border-destructive")} /></Field>
            <div className="md:col-span-2"><Field label="Education"><Input value={form.education} onChange={(e) => set("education", e.target.value)} placeholder="B.E. Computer Science, JSS Academy of Technical Education" /></Field></div>
          </div>
        </Panel>

        <Panel title="Skills" action={<Button variant="outline" size="sm" onClick={() => set("skills", [...form.skills, { skill_name: "", category_code: "COD", evidence: "", confidence: "medium" }])}><Plus /> Add skill</Button>}>
          {form.skills.length === 0 && <p className="text-sm text-muted-foreground">No skills yet — parse a resume or add them manually.</p>}
          <div className="space-y-2">
            {form.skills.map((s, i) => (
              <div key={i} className="grid gap-2 rounded-xl border p-2 md:grid-cols-[1.3fr_0.8fr_1.5fr_0.8fr_auto]">
                <Input placeholder="Skill" value={s.skill_name} onChange={(e) => setSkill(i, { skill_name: e.target.value })} />
                <Select value={s.category_code} onValueChange={(v) => setSkill(i, { category_code: v as CategoryCode })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORY_CODES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="Evidence" value={s.evidence} onChange={(e) => setSkill(i, { evidence: e.target.value })} />
                <Select value={s.confidence} onValueChange={(v) => setSkill(i, { confidence: v as Confidence })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(["high", "medium", "low"] as const).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <Button variant="ghost" size="icon" aria-label="Remove skill" onClick={() => set("skills", form.skills.filter((_, j) => j !== i))}><Trash2 className="text-destructive" /></Button>
              </div>
            ))}
          </div>
        </Panel>

        <div className="grid gap-6 lg:grid-cols-3">
          <Repeat title="Hackathons" items={form.hackathons} fields={["name", "result"]} onChange={(v) => set("hackathons", v)} />
          <Repeat title="Internships" items={form.internships} fields={["company", "role", "duration"]} onChange={(v) => set("internships", v)} />
          <Repeat title="Certifications" items={form.certifications} fields={["name", "issuer"]} onChange={(v) => set("certifications", v)} />
        </div>

        <Panel title="Preferred roles">
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => {
              const on = form.preferred_roles.includes(r);
              return (
                <button key={r} type="button" onClick={() => set("preferred_roles", on ? form.preferred_roles.filter((x) => x !== r) : [...form.preferred_roles, r])}
                  className={cn("rounded-full border px-3 py-1.5 text-sm font-medium transition-colors", on ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary")}>
                  {r}
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel title="CV">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted">
            <Upload className="h-4 w-4" /> {form.cv_file || "Upload CV"}
            <input type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => e.target.files?.[0] && set("cv_file", e.target.files[0].name)} />
          </label>
        </Panel>

        <div className="flex justify-end">
          <Button size="lg" onClick={save} disabled={saving}>{saving ? "Saving…" : form.id ? "Update profile" : "Save profile"}</Button>
        </div>
      </div>
      <NextStep to="/talent" label="Next: Talent Check" disabled={!profile?.id} />
    </>
  );
}

function Field({ label, error, children }: { label: string; error?: string | undefined; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

function Repeat<T extends Record<string, string>>({ title, items, fields, onChange }: { title: string; items: T[]; fields: (keyof T & string)[]; onChange: (v: T[]) => void }) {
  return (
    <Panel title={title} action={<Button variant="outline" size="sm" onClick={() => onChange([...items, Object.fromEntries(fields.map((f) => [f, ""])) as T])}><Plus /> Add</Button>}>
      {items.length === 0 && <p className="text-sm text-muted-foreground">None added.</p>}
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="space-y-2 rounded-xl border p-3">
            {fields.map((f) => (
              <Input key={f} placeholder={f.charAt(0).toUpperCase() + f.slice(1)} value={it[f]} onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, [f]: e.target.value } : x)))} />
            ))}
            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onChange(items.filter((_, j) => j !== i))}><Trash2 /> Remove</Button>
          </div>
        ))}
      </div>
    </Panel>
  );
}
