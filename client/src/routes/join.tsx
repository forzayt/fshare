import { createFileRoute } from "@tanstack/react-router";
import {
  ScanLine,
  KeyRound,
  Download,
  ShieldCheck,
  FileText,
  FileImage,
  FileArchive,
  Camera,
  CheckCircle2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { CountdownBadge } from "@/components/CountdownBadge";
import { getSocket } from "@/lib/socket";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Join Session — Fshare" },
      {
        name: "description",
        content: "Enter a session key to join an Fshare transfer.",
      },
    ],
  }),
  component: JoinSession,
});

function JoinSession() {
  const [key, setKey] = useState("");
  const [joined, setJoined] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [files, setFiles] = useState<any[]>([]);

  useEffect(() => {
    const socket = getSocket();
    
    const onMetadata = (metadata: any[]) => {
      setFiles(metadata);
    };
    
    const onClosed = () => {
      setJoined(false);
      setError("Session closed by host");
      setFiles([]);
    };

    socket.on("session:metadata_updated", onMetadata);
    socket.on("session:closed", onClosed);

    return () => {
      socket.off("session:metadata_updated", onMetadata);
      socket.off("session:closed", onClosed);
    };
  }, []);

  const handleJoin = () => {
    if (!key) return;
    setError("");
    const socket = getSocket();
    socket.emit("joiner:join", { sessionId: key }, (res: any) => {
      if (res.success) {
        setJoined(true);
        if (res.metadata) {
          setFiles(res.metadata);
        }
      } else {
        setError(res.error || "Failed to join session");
      }
    });
  };

  const toggle = (id: number) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-12">
      <div className="text-center">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Join session
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
          Connect to a <span className="gradient-text"> Server</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the host's session key to connect.
        </p>
      </div>

      {!joined ? (
        <div className="mt-8 flex justify-center">
          {/* Session key */}
          <div className="glass gradient-border w-full max-w-sm rounded-3xl p-5">
            <p className="text-sm font-semibold">Session key</p>
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-3 ring-1 ring-white/5 focus-within:ring-primary/50">
              <KeyRound className="h-4 w-4 text-primary" />
              <input
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                placeholder="A4N9-K72X-Q3LM"
                className="flex-1 bg-transparent font-mono text-sm tracking-wider outline-none placeholder:text-muted-foreground/60"
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              12 characters · case insensitive · dashes optional
            </p>
            
            {error && (
              <p className="mt-2 text-xs text-destructive">{error}</p>
            )}

            <button
              onClick={handleJoin}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[image:var(--gradient-primary)] px-4 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.01]"
            >
              Join secure session
            </button>
            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              Verified end-to-end · No account required
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          <div className="glass gradient-border flex flex-wrap items-center justify-between gap-3 rounded-3xl p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 ring-1 ring-success/30">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm font-semibold">Connected to host</p>
                <p className="text-xs text-muted-foreground">
                  Encrypted channel · {files.length} files available
                </p>
              </div>
            </div>
            <CountdownBadge seconds={540} />
          </div>

          <div className="glass gradient-border rounded-3xl p-3 sm:p-5">
            <div className="mb-3 flex items-center justify-between px-2">
              <p className="text-sm font-semibold">Available files</p>
              <p className="text-xs text-muted-foreground">
                {selected.length} selected
              </p>
            </div>
            <ul className="space-y-2">
              {files.map((f) => {
                const on = selected.includes(f.id);
                const Icon = f.Icon || FileText;
                return (
                  <li
                    key={f.id}
                    className={`flex items-center gap-3 rounded-2xl p-3 ring-1 transition sm:p-4 ${
                      on
                        ? "bg-primary/5 ring-primary/30"
                        : "bg-white/[0.03] ring-white/5"
                    }`}
                  >
                    <button
                      onClick={() => toggle(f.id)}
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ring-1 transition ${
                        on
                          ? "bg-[image:var(--gradient-primary)] ring-transparent"
                          : "ring-white/20"
                      }`}
                    >
                      {on && <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />}
                    </button>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{f.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {f.size} · {f.ready !== false ? "Ready" : "Resumable"}
                      </p>
                    </div>
                    <button className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 text-xs font-medium ring-1 ring-white/5 hover:bg-white/10">
                      <Download className="h-3.5 w-3.5 text-primary" />
                      Get
                    </button>
                  </li>
                );
              })}
              {files.length === 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No files available yet. Wait for the host to add files.
                </div>
              )}
            </ul>
          </div>

          <button className="sticky bottom-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[image:var(--gradient-primary)] px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow-lg)]">
            <Download className="h-4 w-4" />
            Download {selected.length} file{selected.length === 1 ? "" : "s"}
          </button>
        </div>
      )}
    </main>
  );
}
