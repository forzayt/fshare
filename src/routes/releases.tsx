import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  ArrowLeft, 
  Github, 
  Zap, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  GitCommit,
  ExternalLink,
  Clock
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";

export const Route = createFileRoute("/releases")({
  head: () => ({
    meta: [
      { title: "Release Notes — Fshare" },
      {
        name: "description",
        content:
          "See what's new in Fshare. Real-time updates from our GitHub repository.",
      },
    ],
  }),
  component: ReleaseNotes,
});

const PER_PAGE = 10;

async function fetchCommits(page: number) {
  const res = await fetch(
    `https://api.github.com/repos/forzayt/fshare/commits?per_page=${PER_PAGE}&page=${page}`
  );
  if (!res.ok) throw new Error("Failed to fetch commits");
  return res.json();
}

function ReleaseNotes() {
  const [page, setPage] = useState(1);
  
  const { data: commits, isLoading, isError, isPlaceholderData } = useQuery({
    queryKey: ["commits", page],
    queryFn: () => fetchCommits(page),
    placeholderData: (prev) => prev,
  });

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
          Live <span className="gradient-text">Updates</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Real-time activity from our GitHub repository. Tracking every release.
        </p>
      </div>

      <div className="space-y-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-pulse">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary/50" />
            <p className="text-sm font-medium">Fetching latest commits...</p>
          </div>
        ) : isError ? (
          <div className="glass rounded-3xl p-10 text-center border-destructive/20 bg-destructive/5">
            <p className="text-destructive font-medium">Failed to load release notes from GitHub.</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 text-sm font-bold text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-12">
              {commits.map((commit: any, i: number) => {
                const { sha, commit: details, html_url, author } = commit;
                const message = details.message.split("\n")[0];
                const commitDate = new Date(details.author.date);
                const dateStr = format(commitDate, "MMM d, yyyy");
                const timeStr = format(commitDate, "HH:mm");
                const relativeTime = formatDistanceToNow(commitDate, { addSuffix: true });

                return (
                  <section 
                    key={sha} 
                    className="relative pl-8 sm:pl-16 animate-fade-up"
                    style={{ animationDelay: `${(i % 10) * 0.05}s` }}
                  >
                    {/* Timeline Line */}
                    {i !== commits.length - 1 && (
                      <div className="absolute left-[15px] top-10 bottom-[-48px] w-px bg-gradient-to-b from-primary/30 to-transparent sm:left-[27px]" />
                    )}
                    
                    {/* Timeline Dot */}
                    <div className="absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-background ring-2 ring-primary/20 sm:h-12 sm:w-12 sm:left-1.5">
                      {author?.avatar_url ? (
                        <a href={author.html_url} target="_blank" rel="noopener noreferrer">
                          <img src={author.avatar_url} className="h-full w-full rounded-full grayscale hover:grayscale-0 transition-all border border-white/10" alt={author.login} />
                        </a>
                      ) : (
                        <GitCommit className="h-4 w-4 text-primary sm:h-6 sm:w-6" />
                      )}
                    </div>

                    <div className="glass gradient-border rounded-3xl p-6 transition-all hover:bg-white/[0.04]">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <code className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-mono font-bold text-primary ring-1 ring-primary/20">
                              {sha.substring(0, 7)}
                            </code>
                            <h3 className="text-lg font-bold tracking-tight text-foreground/90 sm:text-xl">
                              {message}
                            </h3>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5 font-medium text-primary/80">
                              <Clock className="h-3.5 w-3.5" /> {relativeTime}
                            </span>
                            <span className="h-1 w-1 rounded-full bg-white/10" />
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" /> {dateStr} • {timeStr}
                            </span>
                            <span className="h-1 w-1 rounded-full bg-white/10" />
                            <a 
                              href={author?.html_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 hover:text-primary transition-colors font-medium"
                            >
                              <Github className="h-3.5 w-3.5" /> @{author?.login || details.author.name}
                            </a>
                          </div>
                        </div>
                        <a 
                          href={html_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="glass inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors sm:h-10 sm:w-10"
                          title="View on GitHub"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                      
                      {/* Optional: Show extended message if it exists */}
                      {details.message.split("\n").length > 1 && (
                        <p className="mt-4 text-sm text-muted-foreground/80 line-clamp-2 border-l-2 border-white/5 pl-4 italic">
                          {details.message.split("\n").slice(1).join("\n").trim()}
                        </p>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="mt-16 flex items-center justify-center gap-3 animate-fade-up">
              <button
                onClick={() => {
                  setPage(p => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={page === 1 || isPlaceholderData}
                className="glass inline-flex h-11 items-center gap-2 rounded-2xl px-5 text-sm font-semibold transition-all hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              
              <div className="glass flex h-11 items-center rounded-2xl px-4 text-xs font-bold tracking-widest text-primary/80 uppercase">
                Page {page}
              </div>

              <button
                onClick={() => {
                  setPage(p => p + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={!commits || commits.length < PER_PAGE || isPlaceholderData}
                className="glass inline-flex h-11 items-center gap-2 rounded-2xl px-5 text-sm font-semibold transition-all hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>

      <footer className="mt-20 flex flex-col items-center gap-6 border-t border-white/5 pt-12 text-center animate-fade-up">
        <div className="glass flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-transform hover:scale-[1.02]">
          <Github className="h-4 w-4" />
          <span>Contribute to Fshare</span>
          <a 
            href="https://github.com/forzayt/fshare" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-bold text-primary hover:underline underline-offset-4"
          >
            GitHub
          </a>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Fshare · Built for the decentralised web.
        </p>
      </footer>
    </main>
  );
}
