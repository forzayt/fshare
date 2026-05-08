import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Upload,
  QrCode,
  ShieldCheck,
  Globe,
  Timer,
  Lock,
  Smartphone,
  Laptop,
  Tablet,
  Monitor,
  Zap,
  ArrowRight,
  CloudOff,
  Wifi,
} from "lucide-react";
import { useState } from "react";
import { QrCodeArt } from "@/components/QrCodeArt";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fshare — Share Files Anywhere. Instantly." },
      {
        name: "description",
        content:
          "Fshare is a browser-based peer-to-peer file sharing platform. No cloud, end-to-end direct transfer, auto-delete on expiry.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [drag, setDrag] = useState(false);

  return (
    <main className="relative">
      {/* Hero */}
      <section className="bg-hero">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:pt-20">
          <div className="flex flex-col items-center text-center animate-[fade-up_0.6s_ease-out_both]">
            <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs text-muted-foreground">
              <Wifi className="h-3.5 w-3.5 text-primary" />
              Peer-to-peer · No cloud · Auto-expire
            </span>
            <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Share Files <span className="gradient-text">Anywhere.</span>
              <br /> Instantly.
            </h1>
            <p className="mt-4 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
              Direct device-to-device transfer in your browser. Drop a file, share a
              QR — done. Nothing ever lands on a server.
            </p>

            <div className="mt-7 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/host"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[image:var(--gradient-primary)] px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.02] sm:w-auto"
              >
                <Zap className="h-4 w-4" />
                Create Secure Session
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/join"
                className="glass inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold text-foreground hover:bg-white/5 sm:w-auto"
              >
                <QrCode className="h-4 w-4 text-primary" />
                Join with Key
              </Link>
            </div>
          </div>

          {/* Drag and drop + QR */}
          <div className="mt-12 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
              }}
              className={`gradient-border relative flex min-h-[260px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl p-8 text-center transition-all sm:min-h-[340px] ${
                drag ? "glass-strong glow-lg" : "glass"
              }`}
            >
              <input type="file" multiple className="sr-only" />
              <div className="pointer-events-none absolute inset-0 opacity-30 [background:radial-gradient(60%_50%_at_50%_0%,oklch(0.78_0.18_210/0.35),transparent_70%)]" />
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/30 ${
                  drag ? "animate-pulse-glow" : ""
                }`}
              >
                <Upload className="h-7 w-7 text-primary" />
              </div>
              <p className="mt-5 text-lg font-semibold">
                Drop files to start a session
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                or tap below — files never leave your device until a peer connects
              </p>
              <span className="mt-5 inline-flex items-center gap-2 rounded-xl bg-foreground/95 px-5 py-2.5 text-sm font-semibold text-background">
                <Upload className="h-4 w-4" />
                Select Files
              </span>
              <p className="mt-4 text-[11px] uppercase tracking-wider text-muted-foreground">
                Up to 10 GB per session · End-to-end encrypted
              </p>
            </label>

            <div className="glass gradient-border flex flex-col items-center justify-center rounded-3xl p-6 text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Instant connect
              </p>
              <p className="mt-1 font-semibold">Scan the session QR</p>
              <div className="mt-5 rounded-2xl p-2 glow-primary">
                <QrCodeArt size={200} value="FSHARE-LANDING" />
              </div>
              <p className="mt-4 font-mono text-sm text-primary">
                fshare.io/<span className="text-foreground">A4N9-K72X</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Session key valid for 10 minutes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security highlights */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Privacy is the architecture
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Built browser-first so your files stay yours.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { Icon: CloudOff, title: "No cloud storage", text: "Files transfer peer-to-peer between browsers — never stored on any server." },
            { Icon: ShieldCheck, title: "End-to-end transfer", text: "Encrypted WebRTC channel with rotating keys for every session." },
            { Icon: Timer, title: "Temporary by design", text: "Sessions auto-expire and all traces are wiped from memory." },
            { Icon: Lock, title: "Optional password", text: "Lock any session with a passphrase that recipients must enter." },
          ].map(({ Icon, title, text }) => (
            <div key={title} className="glass gradient-border rounded-2xl p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/30">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <p className="mt-4 font-semibold">{title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Devices */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="glass gradient-border rounded-3xl p-6 sm:p-10">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs text-accent ring-1 ring-accent/30">
                <Globe className="h-3.5 w-3.5" />
                Universal
              </span>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                Works on every screen with a browser
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                iPhone, Android, iPad, Mac, Windows, Linux, Chromebook — if it
                browses, it shares. No installs, no accounts.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { Icon: Smartphone, l: "Mobile" },
                  { Icon: Tablet, l: "Tablet" },
                  { Icon: Laptop, l: "Laptop" },
                  { Icon: Monitor, l: "Desktop" },
                ].map(({ Icon, l }) => (
                  <div
                    key={l}
                    className="flex flex-col items-center gap-2 rounded-2xl bg-white/5 p-4 ring-1 ring-white/5"
                  >
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="text-xs text-muted-foreground">{l}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                {["Chrome", "Safari", "Firefox", "Edge", "Brave", "Arc"].map(
                  (b) => (
                    <span
                      key={b}
                      className="rounded-full bg-white/5 px-2.5 py-1 ring-1 ring-white/5"
                    >
                      {b}
                    </span>
                  ),
                )}
              </div>
            </div>

            <div className="relative">
              <div className="glass-strong gradient-border mx-auto max-w-sm rounded-3xl p-5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
                    Live session
                  </span>
                  <span>2 devices</span>
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    { name: "design-system.fig", size: "12.4 MB", pct: 100 },
                    { name: "build-final.zip", size: "184 MB", pct: 62 },
                    { name: "screenshots/", size: "47 files", pct: 18 },
                  ].map((f) => (
                    <div
                      key={f.name}
                      className="rounded-xl bg-white/5 p-3 ring-1 ring-white/5"
                    >
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{f.name}</span>
                        <span className="text-muted-foreground">{f.size}</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="neon-progress h-full rounded-full"
                          style={{ width: `${f.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pointer-events-none absolute -inset-6 -z-10 opacity-50 [background:radial-gradient(50%_50%_at_50%_50%,oklch(0.65_0.22_295/0.35),transparent_70%)]" />
            </div>
          </div>
        </div>
      </section>

      {/* Sticky mobile CTA */}
      <div className="sticky bottom-3 z-40 mx-auto w-full max-w-md px-4 sm:hidden">
        <Link
          to="/host"
          className="glass-strong flex items-center justify-center gap-2 rounded-2xl bg-[image:var(--gradient-primary)] px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow-lg)]"
        >
          <Zap className="h-4 w-4" />
          Start Secure Session
        </Link>
      </div>

      <footer className="mx-auto max-w-6xl px-4 pb-8 pt-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Fshare · Built for a private internet.
      </footer>
    </main>
  );
}
