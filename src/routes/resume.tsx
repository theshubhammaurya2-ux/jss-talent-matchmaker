import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Briefcase, FolderGit2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dropzone, NextStep, PageHeader, Panel, SkillTable } from "@/components/radix/shared";
import { parseResume } from "@/lib/api";
import { useAppState } from "@/lib/app-state";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/resume")({
  head: () => pageHead("Resume Parsing", "Upload a student resume to extract skills, education, projects and experience."),
  component: ResumePage,
});

function ResumePage() {
  const { resume, setResume } = useAppState();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFile = async (f: File) => {
    setLoading(true);
    try {
      setResume(await parseResume(f));
      toast.success("Resume parsed");
    } catch {
      toast.error("Failed to parse resume");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader step={2} title="Resume Parsing" subtitle="Upload a resume to pull out the candidate's skills, education, projects and experience." />
      <Dropzone onFile={onFile} loading={loading} label="Upload resume" />
      <p className="mt-2 text-xs text-muted-foreground">Tip: different file names produce different demo candidates.</p>

      {loading && <div className="mt-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>}

      {resume && !loading && (
        <div className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Panel title="Education">
              <GraduationCap className="mb-2 h-5 w-5 text-primary" />
              <p className="font-semibold">{resume.name}</p>
              <p className="text-sm text-muted-foreground">{resume.email}</p>
              <p className="mt-2 text-sm">{resume.education}</p>
            </Panel>
            <Panel title="Projects">
              <ul className="space-y-3">
                {resume.projects.map((p) => (
                  <li key={p.title} className="flex gap-2"><FolderGit2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div><p className="text-sm font-semibold">{p.title}</p><p className="text-sm text-muted-foreground">{p.description}</p></div></li>
                ))}
              </ul>
            </Panel>
            <Panel title="Experience">
              <ul className="space-y-3">
                {resume.experience.map((e) => (
                  <li key={e.company} className="flex gap-2"><Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div><p className="text-sm font-semibold">{e.role}</p><p className="text-sm text-muted-foreground">{e.company} · {e.duration}</p></div></li>
                ))}
              </ul>
            </Panel>
          </div>
          <Panel title="Extracted skills" action={<Button onClick={() => navigate({ to: "/profile" })}>Send to Profile Builder</Button>}>
            <SkillTable skills={resume.skills} />
          </Panel>
        </div>
      )}
      <NextStep to="/profile" label="Next: Profile Builder" />
    </>
  );
}
