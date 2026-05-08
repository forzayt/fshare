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
import { useState, useEffect } from "react";
import { QrCodeArt } from "@/components/QrCodeArt";
import { CountdownBadge } from "@/components/CountdownBadge";
import { getSocket } from "@/lib/socket";
import { WebRTCHost } from "@/lib/webrtcHost";
import { useRef } from "react";

export const Route = createFileRoute("/host")({
  head: () => ({
    meta: [
      { title: "Host Session — Fshare" },
      {
        name: "description",
        content:
          "Manage your live Fshare session: monitor transfers, share the link, control expiry and security.",
      },
    ],
  }),
  component: HostDashboard,
});

function HostDashboard() {
  const [paused, setPaused] = useState(false);
  const [pwd, setPwd] = useState(true);
  const [keepAwake, setKeepAwake] = useState(true);
  const [sessionKey, setSessionKey] = useState<string>("Connecting...");
  const [files, setFiles] = useState<any[]>([]);
  const [devices, setDevices] = useState<{ id: string }[]>([]);
  const [speed, setSpeed] = useState("0 MB/s");
  const [sent, setSent] = useState("0 MB");

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
        pct: 0,
        Icon: FileText,
        fileObj: file, // Keep actual file for future upload/webrtc
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  useEffect(() => {
    if (sessionKey && sessionKey !== "Connecting..." && sessionKey !== "Error creating session") {
      const socket = getSocket();
      socket.emit("host:update_metadata", {
        sessionId: sessionKey,
        metadata: files.map(f => ({
          id: f.id.toString(),
          name: f.name,
          size: f.size,
          type: f.fileObj?.type || 'application/octet-stream',
          path: f.name,
        })),
      });
    }
  }, [files, sessionKey]);

  useEffect(() => {
    const socket = getSocket();
    let currentSessionId: string | null = null;
    
    socket.emit("host:start", (res: any) => {
      if (res.success) {
        currentSessionId = res.sessionId;
        setSessionKey(res.sessionId);
      } else {
        setSessionKey("Error creating session");
      }
    });

    const onJoinerConnected = (data: { joinerId: string }) => {
      setDevices(prev => [...prev, { id: data.joinerId }]);
    };

    socket.on("host:joiner_connected", onJoinerConnected);

    return () => {
      socket.off("host:joiner_connected", onJoinerConnected);
      if (currentSessionId) {
        socket.emit("host:shutdown", { sessionId: currentSessionId });
      }
    };
  }, []);

  // WebRTC Setup
  const filesRef = useRef(files);
  filesRef.current = files;

  useEffect(() => {
    if (!sessionKey || sessionKey === "Connecting..." || sessionKey === "Error creating session") return;
    
    const socket = getSocket();
    
    const rtcHost = new WebRTCHost(socket, sessionKey, (fileId, joinerId, sentBytes, totalBytes) => {
      setFiles(prev => prev.map(f => {
        if (f.id === fileId) {
          return { ...f, pct: Math.round((sentBytes / totalBytes) * 100) };
        }
        return f;
      }));
      setSent((prevSent) => {
        const currentMB = parseFloat(prevSent.replace(" MB", "")) || 0;
        return (currentMB + (64 / 1024)).toFixed(2) + " MB";
      });
      setSpeed("14.2 MB/s"); // Mock dynamic speed
    });

    const onFileRequested = ({ joinerId, fileId }: { joinerId: string, fileId: string }) => {
      const file = filesRef.current.find(f => f.id === fileId);
      if (file && file.fileObj) {
        rtcHost.sendFile(joinerId, fileId, file.fileObj);
      }
    };

    socket.on("host:file_requested", onFileRequested);

    return () => {
      socket.off("host:file_requested", onFileRequested);
      rtcHost.destroy();
    };
  }, [sessionKey]);

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
          <label className="glass inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs hover:bg-white/5">
            <Plus className="h-3.5 w-3.5" /> Add files
            <input type="file" multiple className="hidden" onChange={handleAddFiles} />
          </label>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        {/* Files */}
        <section className="space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Devices", value: devices.length.toString(), Icon: Users },
              { label: "Speed", value: speed, Icon: Gauge },
              { label: "Sent", value: sent, Icon: Share2 },
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
                {files.length} files · chunked
              </p>
            </div>
            <ul className="space-y-2">
              {files.map((f) => (
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
                        {f.size} · {f.pct === 100 ? "Complete" : "Waiting"}
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
                    {f.pct > 0 && f.pct < 100 && (
                      <div className="shimmer absolute inset-0 rounded-full" />
                    )}
                  </div>
                </li>
              ))}
              {files.length === 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No files added yet. Click "Add files" to start.
                </div>
              )}
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
            {/* QR Scanner hidden */}
            {/* <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Scan to join
            </p>
            <div className="mt-4 flex justify-center">
              <div className="rounded-2xl glow-primary">
                <QrCodeArt size={220} value={sessionKey} />
              </div>
            </div> */}
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
              {devices.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2 ring-1 ring-white/5"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full bg-success animate-pulse`}
                    />
                    <span className="font-medium">Device {c.id.substring(0, 4)}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">Connected</span>
                </li>
              ))}
              {devices.length === 0 && (
                <li className="text-center text-xs text-muted-foreground py-2">
                  Waiting for devices to connect...
                </li>
              )}
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
