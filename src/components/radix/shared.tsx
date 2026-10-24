import { useCallback, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { CategoryCode, Confidence, Skill } from "@/types";

export function PageHeader({ step, title, subtitle }: { step: number; title: string; subtitle: string }) {
  return (
    <div className="mb-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Step {step}</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">{title}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">{subtitle}</p>
    </div>
  );
}

export function Panel({ title, children, className, action }: { title?: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={cn("rounded-2xl border bg-card p-6 shadow-card", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-4">
          {title && <h2 className="text-lg font-semibold text-card-foreground">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function CategoryBadge({ code }: { code: CategoryCode }) {
  return (
    <span className="inline-flex rounded-md px-2 py-0.5 text-xs font-semibold" style={{ background: `color-mix(in oklab, var(--cat-${code}) 15%, transparent)`, color: `var(--cat-${code})` }}>
      {code}
    </span>
  );
}

const confStyle: Record<Confidence, string> = {
  high: "bg-success/15 text-success",
  medium: "bg-warning/15 text-warning-foreground",
  low: "bg-muted text-muted-foreground",
};
export function ConfidenceChip({ c }: { c: Confidence }) {
  return <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", confStyle[c])}>{c}</span>;
}

export function SkillTable({ skills }: { skills: Skill[] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Skill</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Evidence</TableHead>
            <TableHead>Confidence</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {skills.map((s, i) => (
            <TableRow key={i}>
              <TableCell className="font-medium">{s.skill_name}</TableCell>
              <TableCell><CategoryBadge code={s.category_code} /></TableCell>
              <TableCell className="max-w-sm text-muted-foreground">{s.evidence}</TableCell>
              <TableCell><ConfidenceChip c={s.confidence} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function Dropzone({ onFile, loading, label }: { onFile: (f: File) => void; loading: boolean; label: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const accept = useCallback((f?: File) => {
    if (!f) return;
    if (!/\.(pdf|docx)$/i.test(f.name)) {
      import("sonner").then(({ toast }) => toast.error("Please upload a PDF or DOCX file"));
      return;
    }
    onFile(f);
  }, [onFile]);
  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => ref.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); accept(e.dataTransfer.files[0]); }}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition-colors",
        over ? "border-primary bg-primary/5" : "border-border hover:border-primary/60 hover:bg-muted/50",
      )}
    >
      <input ref={ref} type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => { accept(e.target.files?.[0]); e.target.value = ""; }} />
      {loading ? <Loader2 className="h-10 w-10 animate-spin text-primary" /> : <FileUp className="h-10 w-10 text-primary" />}
      <div>
        <p className="font-semibold text-foreground">{loading ? "Parsing document…" : label}</p>
        <p className="text-sm text-muted-foreground">Drag & drop or click — PDF or DOCX</p>
      </div>
    </button>
  );
}

export function EmptyState({ title, body, to, cta }: { title: string; body: string; to: "/" | "/resume" | "/profile"; cta: string }) {
  return (
    <div className="rounded-2xl border border-dashed bg-muted/40 p-10 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-muted-foreground">{body}</p>
      <Button asChild className="mt-5"><Link to={to}>{cta}</Link></Button>
    </div>
  );
}

export function NextStep({ to, label, disabled }: { to: "/resume" | "/profile" | "/talent" | "/match"; label: string; disabled?: boolean }) {
  return (
    <div className="mt-10 flex justify-end border-t pt-6">
      {disabled ? (
        <Button size="lg" disabled>{label} <ArrowRight /></Button>
      ) : (
        <Button size="lg" asChild><Link to={to}>{label} <ArrowRight /></Link></Button>
      )}
    </div>
  );
}

export function Gauge({ value, label, size = 200 }: { value: number; label: string; size?: number }) {
  const r = 80, c = 2 * Math.PI * r;
  const tone = value >= 75 ? "var(--success)" : value >= 50 ? "var(--warning)" : "var(--destructive)";
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox="0 0 200 200">
        <circle cx="100" cy="100" r={r} fill="none" stroke="var(--muted)" strokeWidth="16" />
        <circle cx="100" cy="100" r={r} fill="none" stroke={tone} strokeWidth="16" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} transform="rotate(-90 100 100)"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
        <text x="100" y="108" textAnchor="middle" className="fill-foreground" style={{ fontSize: 44, fontWeight: 800 }}>{value}</text>
        <text x="100" y="132" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 12 }}>/ 100</text>
      </svg>
      <p className="mt-1 text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
