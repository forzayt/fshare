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
import { useState } from "react";
import { CountdownBadge } from "@/components/CountdownBadge";

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

const previewFiles = [
  { id: 1, name: "Q4-brand-guidelines.pdf", size: "8.2 MB", Icon: FileText, ready: true },
  { id: 2, name: "hero-render-final.png", size: "24.7 MB", Icon: FileImage, ready: true },
  { id: 3, name: "client-handoff.zip", size: "412 MB", Icon: FileArchive, ready: false },
];

function JoinSession() {
  const [key, setKey] = useState("");
  const [joined, setJoined] = useState(false);
  const [selected, setSelected] = useState<number[]>([1, 2]);

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
          {/* QR scanner - Hidden for now */}
          {/* <div className="glass gradient-border relative overflow-hidden rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">QR scanner</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary ring-1 ring-primary/30">
                <Camera className="h-3 w-3" /> Camera
              </span>
            </div>
            <div className="relative mt-4 aspect-square overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
              <div className="absolute inset-0 [background:radial-gradient(60%_60%_at_50%_50%,oklch(0.78_0.18_210/0.18),transparent_70%)]" />
              <div className="absolute inset-6 rounded-2xl border-2 border-primary/60" />
              <div className="absolute inset-x-6 top-6 h-px overflow-hidden">
                <div className="h-[200%] w-full animate-[scan_2.4s_ease-in-out_infinite] bg-gradient-to-b from-transparent via-primary to-transparent" />
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <ScanLine className="h-8 w-8 text-primary" />
                <p className="text-xs text-muted-foreground">Align QR inside the frame</p>
              </div>
            </div>
            <button className="mt-4 w-full rounded-2xl bg-white/5 px-4 py-2.5 text-sm font-medium ring-1 ring-white/5 hover:bg-white/10">
              Use rear camera
            </button>
          </div> */}

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
            <button
              onClick={() => setJoined(true)}
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
                  Encrypted channel · {previewFiles.length} files available
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
              {previewFiles.map((f) => {
                const on = selected.includes(f.id);
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
                      <f.Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{f.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {f.size} · {f.ready ? "Ready" : "Resumable"}
                      </p>
                    </div>
                    <button className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 text-xs font-medium ring-1 ring-white/5 hover:bg-white/10">
                      <Download className="h-3.5 w-3.5 text-primary" />
                      Get
                    </button>
                  </li>
                );
              })}
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
