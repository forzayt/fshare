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
  Trash2,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { getSocket } from "@/lib/socket";
import { WebRTCJoiner } from "@/lib/webrtcJoiner";
import { db } from "@/lib/db";

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
  const [selected, setSelected] = useState<string[]>([]);
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

  const webrtcRef = useRef<WebRTCJoiner | null>(null);

  useEffect(() => {
    if (joined && key) {
      const socket = getSocket();
      const rtcJoiner = new WebRTCJoiner(socket, key, 
        (fileId, receivedBytes, totalBytes) => {
          setFiles(prev => prev.map(f => {
            if (f.id === fileId) {
              return { ...f, pct: Math.round((receivedBytes / totalBytes) * 100), ready: false };
            }
            return f;
          }));
        }, 
        async (fileId, blob, meta) => {
          // Trigger download
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.style.display = "none";
          a.href = url;
          a.download = meta.name;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          
          setFiles(prev => prev.map(f => f.id === fileId ? { ...f, pct: 100, ready: true } : f));
        }
      );
      
      webrtcRef.current = rtcJoiner;
      
      return () => {
        rtcJoiner.destroy();
        webrtcRef.current = null;
      };
    }
  }, [joined, key]);

  const handleJoin = () => {
    if (!key.trim()) return;
    setError("");
    // Normalise: strip dashes and reformat as XXXX-XXXX-XXXX
    const raw = key.replace(/-/g, "").toUpperCase();
    const sessionId = raw.length === 12
      ? `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`
      : raw;
    const socket = getSocket();
    socket.emit("joiner:join", { sessionId }, (res: any) => {
      if (res.success) {
        setJoined(true);
        if (res.metadata) {
          setFiles(res.metadata.map((f: any) => ({ ...f, pct: 0 })));
        }
      } else {
        setError(res.error || "Failed to join session");
      }
    });
  };

  const handleDownloadSelected = () => {
    if (webrtcRef.current) {
      selected.forEach(fileId => {
        webrtcRef.current?.requestFile(fileId.toString());
      });
    }
  };

  const handleDownloadSingle = (fileId: string) => {
    if (webrtcRef.current) {
      webrtcRef.current.requestFile(fileId.toString());
    }
  };

  const toggle = (id: string) =>
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
        <>
          <div className="mt-8 flex justify-center">
            {/* Session key */}
            <div className="glass gradient-border w-full max-w-sm rounded-3xl p-5">
              <p className="text-sm font-semibold">Session key</p>
              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-3 ring-1 ring-white/5 focus-within:ring-primary/50">
                <KeyRound className="h-4 w-4 text-primary" />
                <input
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  placeholder="A4N9-K72X-Q3LM"
                  autoComplete="off"
                  spellCheck={false}
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
        </>
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
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{f.name}</p>
                        {f.pct !== undefined && <span className="shrink-0 text-xs text-muted-foreground">{f.pct}%</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {f.size} · {f.pct === 100 ? "Ready" : f.pct > 0 ? "Downloading" : "Waiting"}
                      </p>
                      {f.pct > 0 && f.pct < 100 && (
                        <div className="relative mt-1.5 h-1 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="neon-progress h-full rounded-full transition-all"
                            style={{ width: `${f.pct}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => handleDownloadSingle(f.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 text-xs font-medium ring-1 ring-white/5 hover:bg-white/10"
                    >
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

          <button 
            onClick={handleDownloadSelected}
            disabled={selected.length === 0}
            className={`sticky bottom-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow-lg)] transition-all ${
              selected.length > 0 ? "bg-[image:var(--gradient-primary)] hover:scale-[1.01]" : "bg-white/10 text-muted-foreground cursor-not-allowed"
            }`}
          >
            <Download className="h-4 w-4" />
            Download {selected.length} file{selected.length === 1 ? "" : "s"}
          </button>
        </div>
      )}
    </main>
  );
}
