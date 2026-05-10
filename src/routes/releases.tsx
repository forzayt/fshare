import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Rocket, Shield, Zap, Sparkles, Github, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/releases")({
  head: () => ({
    meta: [
      { title: "Release Notes — Fshare" },
      {
        name: "description",
        content:
          "See what's new in Fshare. Track our progress towards a faster, more secure peer-to-peer sharing experience.",
      },
    ],
  }),
  component: ReleaseNotes,
});

function ReleaseNotes() {
  const releases = [
    {
      version: "v1.2.0",
      date: "May 10, 2026",
      title: "Real-time Indexing & Mobile Polish",
      description: "Significant improvements to the hosting experience and mobile accessibility.",
      changes: [
        "Added real-time indexing progress bars when adding files.",
        "Optimized parallel file processing for multiple selections.",
        "Fixed delete button visibility on mobile touch screens.",
        "Improved metadata synchronization consistency.",
      ],
      Icon: Sparkles,
      tag: "Latest",
    },
    {
      version: "v1.1.0",
      date: "May 08, 2026",
      title: "The Backend Evolution",
      description: "Migration to a robust Fastify & Socket.io architecture for better signaling.",
      changes: [
        "Implemented session resumption (keep sharing after refresh).",
        "Added device monitoring to track connected joiners.",
        "New glassmorphism UI design system.",
        "Improved WebRTC connection reliability.",
      ],
      Icon: Zap,
    },
    {
      version: "v1.0.0",
      date: "May 05, 2026",
      title: "Public Launch",
      description: "The first stable release of Fshare. Peer-to-peer sharing for everyone.",
      changes: [
        "End-to-end peer sharing using WebRTC.",
        "No-server architecture (files never touch our disks).",
        "Simple session-based sharing.",
        "Dark mode by default.",
      ],
      Icon: Rocket,
    },
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:py-20">
      <div className="mb-12 animate-fade-up">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
          Release <span className="gradient-text">Notes</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Stay up to date with the latest features and improvements to Fshare.
        </p>
      </div>

      <div className="space-y-12">
        {releases.map((release, i) => (
          <section 
            key={release.version} 
            className="relative pl-8 sm:pl-12 animate-fade-up"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            {/* Timeline Line */}
            {i !== releases.length - 1 && (
              <div className="absolute left-[15px] top-10 bottom-[-48px] w-px bg-gradient-to-b from-primary/50 to-transparent sm:left-[19px]" />
            )}
            
            {/* Timeline Dot */}
            <div className="absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-background ring-2 ring-primary/20 sm:h-10 sm:w-10">
              <release.Icon className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
            </div>

            <div className="glass gradient-border rounded-3xl p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold sm:text-2xl">{release.version}</h2>
                    {release.tag && (
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary ring-1 ring-primary/20">
                        {release.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{release.date}</p>
                </div>
                <div className="h-px flex-1 bg-white/5 hidden sm:block" />
                <h3 className="text-lg font-semibold text-primary/90">{release.title}</h3>
              </div>

              <p className="mt-4 text-muted-foreground">
                {release.description}
              </p>

              <ul className="mt-6 space-y-3">
                {release.changes.map((change, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm">
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />
                    <span className="text-muted-foreground/90">{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>

      <footer className="mt-20 flex flex-col items-center gap-6 border-t border-white/5 pt-12 text-center animate-fade-up">
        <div className="glass flex items-center gap-2 rounded-full px-4 py-2 text-sm">
          <Github className="h-4 w-4" />
          <span>Open source on GitHub</span>
          <a 
            href="https://github.com/forzayt/fshare" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-bold text-primary hover:underline"
          >
            Contribute
          </a>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Fshare · Built with Passion.
        </p>
      </footer>
    </main>
  );
}
