import { createFileRoute } from "@tanstack/react-router";
import {
  Copy,
  Pause,
  Play,
  Power,
  Lock,
  Eye,
  Users,
  Gauge,
  Trash2,
  FileText,
  FileImage,
  FileArchive,
  Plus,
  Share2,
} from "lucide-react";
import { useState } from "react";
import { QrCodeArt } from "@/components/QrCodeArt";
import { CountdownBadge } from "@/components/CountdownBadge";

export const Route = createFileRoute("/host")({
  head: () => ({
    meta: [
      { title: "Host Session — Fshare" },
      {
        name: "description",
        content:
          "Manage your live Fshare session: monitor transfers, share QR, control expiry and security.",
      },
    ],
  }),
  component: HostDashboard,
});

const initialFiles = [
  { id: 1, name: "Q4-brand-guidelines.pdf", size: "8.2 MB", pct: 100, Icon: FileText },
  { id: 2, name: "hero-render-final.png", size: "24.7 MB", pct: 84, Icon: FileImage },
  { id: 3, name: "client-handoff.zip", size: "412 MB", pct: 41, Icon: FileArchive },
  { id: 4, name: "voiceover-master.wav", size: "78 MB", pct: 12, Icon: FileText },
];

function HostDashboard() {
  const [paused, setPaused] = useState(false);
  const [pwd, setPwd] = useState(true);
  const [keepAwake, setKeepAwake] = useState(true);
  const sessionKey = "A4N9-K72X-Q3LM";

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Host dashboard
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Live <span className="gradient-text">session</span>
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CountdownBadge seconds={580} />
          <button className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs hover:bg-white/5">
            <Plus className="h-3.5 w-3.5" /> Add files
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        {/* Files */}
        <section className="space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Devices", value: "3", Icon: Users },
              { label: "Speed", value: "18.4 MB/s", Icon: Gauge },
              { label: "Sent", value: "287 MB", Icon: Share2 },
            ].map(({ label, value, Icon }) => (
              <div key={label} className="glass gradient-border rounded-2xl p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  {label}
                </div>
                <p className="mt-1 text-lg font-semibold sm:text-xl">{value}</p>
              </div>
            ))}
          </div>

          {/* Files list */}
          <div className="glass gradient-border rounded-3xl p-3 sm:p-5">
            <div className="mb-3 flex items-center justify-between px-2">
              <p className="text-sm font-semibold">Transferring</p>
              <p className="text-xs text-muted-foreground">
                {initialFiles.length} files · chunked
              </p>
            </div>
            <ul className="space-y-2">
              {initialFiles.map((f) => (
                <li
                  key={f.id}
                  className="group rounded-2xl bg-white/[0.03] p-3 ring-1 ring-white/5 transition hover:bg-white/[0.06] sm:p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                      <f.Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{f.name}</p>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {f.pct}%
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {f.size} · {f.pct === 100 ? "Complete" : "Streaming"}
                      </p>
                    </div>
                    <button className="rounded-lg p-2 text-muted-foreground opacity-0 transition hover:bg-white/5 hover:text-destructive group-hover:opacity-100">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="neon-progress h-full rounded-full transition-all"
                      style={{ width: `${f.pct}%` }}
                    />
                    {f.pct < 100 && (
                      <div className="shimmer absolute inset-0 rounded-full" />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Controls */}
          <div className="glass gradient-border rounded-3xl p-5">
            <p className="text-sm font-semibold">Session controls</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => setPaused((p) => !p)}
                className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3 ring-1 ring-white/5 hover:bg-white/[0.06]"
              >
                <span className="flex items-center gap-2 text-sm">
                  {paused ? <Play className="h-4 w-4 text-primary" /> : <Pause className="h-4 w-4 text-primary" />}
                  {paused ? "Resume transfers" : "Pause transfers"}
                </span>
                <span className="text-xs text-muted-foreground">{paused ? "Paused" : "Active"}</span>
              </button>
              <Toggle
                label="Password protection"
                Icon={Lock}
                on={pwd}
                onChange={setPwd}
                hint={pwd ? "Required to join" : "Open join"}
              />
              <Toggle
                label="Keep this device awake"
                Icon={Eye}
                on={keepAwake}
                onChange={setKeepAwake}
                hint="Prevents sleep"
              />
              <button className="flex items-center justify-between rounded-2xl bg-destructive/10 px-4 py-3 text-destructive ring-1 ring-destructive/30 hover:bg-destructive/15">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Power className="h-4 w-4" />
                  Revoke session now
                </span>
                <span className="text-xs">End</span>
              </button>
            </div>
          </div>
        </section>

        {/* Share panel */}
        <aside className="space-y-5">
          <div className="glass gradient-border rounded-3xl p-5 text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Scan to join
            </p>
            <div className="mt-4 flex justify-center">
              <div className="rounded-2xl glow-primary">
                <QrCodeArt size={220} value={sessionKey} />
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Session key</p>
            <div className="mt-1 flex items-center justify-center gap-2">
              <code className="rounded-lg bg-white/5 px-3 py-1.5 font-mono text-sm tracking-wider text-primary ring-1 ring-white/5">
                {sessionKey}
              </code>
              <button
                className="rounded-lg bg-primary/10 p-2 text-primary ring-1 ring-primary/30 hover:bg-primary/20"
                aria-label="Copy session key"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[image:var(--gradient-primary)] px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]">
              <Share2 className="h-4 w-4" /> Share invite link
            </button>
          </div>

          <div className="glass rounded-3xl p-5">
            <p className="text-sm font-semibold">Connected devices</p>
            <ul className="mt-3 space-y-2 text-sm">
              {[
                { d: "iPhone 15 Pro", loc: "Berlin · WiFi", on: true },
                { d: "MacBook Air", loc: "Berlin · WiFi", on: true },
                { d: "Pixel 9", loc: "Lagos · 5G", on: false },
              ].map((c) => (
                <li
                  key={c.d}
                  className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2 ring-1 ring-white/5"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${c.on ? "bg-success animate-pulse" : "bg-muted-foreground/50"}`}
                    />
                    <span className="font-medium">{c.d}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{c.loc}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Toggle({
  label,
  hint,
  on,
  onChange,
  Icon,
}: {
  label: string;
  hint?: string;
  on: boolean;
  onChange: (v: boolean) => void;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3 text-left ring-1 ring-white/5 hover:bg-white/[0.06]"
    >
      <span className="flex items-center gap-2 text-sm">
        <Icon className="h-4 w-4 text-primary" />
        <span>
          <span className="block font-medium">{label}</span>
          {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
        </span>
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          on ? "bg-[image:var(--gradient-primary)] glow-primary" : "bg-white/10"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-transform ${
            on ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}
