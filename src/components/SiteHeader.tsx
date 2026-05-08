import { Link, useRouterState } from "@tanstack/react-router";
import { Zap } from "lucide-react";

export function SiteHeader() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const links = [
    { to: "/", label: "Home" },
    { to: "/host", label: "Host" },
    { to: "/join", label: "Join" },
  ] as const;

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="mx-auto max-w-6xl px-4 pt-4">
        <div className="glass flex items-center justify-between rounded-2xl px-4 py-2.5">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] glow-primary transition-transform group-hover:scale-105">
              <Zap className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
            </span>
            <span className="text-base font-semibold tracking-tight">
              F<span className="gradient-text">share</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            {links.map((l) => {
              const active = path === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`rounded-xl px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
