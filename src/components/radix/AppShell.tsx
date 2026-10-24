import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Check, FileText, GraduationCap, Menu, User, X } from "lucide-react";
import { useAppState } from "@/lib/app-state";
import { cn } from "@/lib/utils";

const STEPS = [
  { to: "/", label: "JD Analytics" },
  { to: "/resume", label: "Resume Parsing" },
  { to: "/profile", label: "Profile Builder" },
  { to: "/talent", label: "Talent Check" },
  { to: "/match", label: "Skill Matching" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { jd, resume, profile, talent, match } = useAppState();
  const done = [!!jd, !!resume, !!profile?.id, !!talent, !!match];
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const nav = (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-6 pt-7 pb-6">
        <div className="text-2xl font-extrabold tracking-[0.25em]">RADIX</div>
        <div className="text-xs font-medium uppercase tracking-widest text-sidebar-primary">Talent Match</div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {STEPS.map((s, i) => {
          const active = path === s.to;
          return (
            <Link key={s.to} to={s.to} onClick={() => setOpen(false)}
              className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground")}>
              <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                done[i] ? "bg-success text-success-foreground" : active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "border border-sidebar-border")}>
                {done[i] ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              {s.label}
            </Link>
          );
        })}
      </nav>
      <div className="m-3 rounded-xl border border-sidebar-border p-4">
        <GraduationCap className="mb-2 h-5 w-5 text-sidebar-primary" />
        <p className="text-xs font-semibold leading-snug">JSS Academy of Technical Education</p>
        <p className="mt-1 text-[11px] text-sidebar-foreground/60">Training & Placement Cell</p>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <div className="sticky top-0 hidden h-screen lg:block">{nav}</div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
          <div className="relative h-full w-64">{nav}</div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur md:px-8">
          <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X /> : <Menu />}</button>
          <div className="hidden text-sm font-semibold text-foreground sm:block">JSS Academy of Technical Education</div>
          <div className="ml-auto flex flex-wrap items-center gap-2 text-sm">
            <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
              <User className="h-4 w-4 text-primary" />
              <span className="max-w-40 truncate">{profile?.name || resume?.name || "No candidate"}</span>
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
              <FileText className="h-4 w-4 text-primary" />
              <span className="max-w-48 truncate">{jd ? `${jd.company} · ${jd.role}` : "No JD selected"}</span>
            </span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-8">{children}</main>
        <footer className="border-t px-8 py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} JSS Academy of Technical Education · RADIX Talent Match
        </footer>
      </div>
    </div>
  );
}
