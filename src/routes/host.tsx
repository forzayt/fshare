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
import { getSocket } from "@/lib/socket";
import { WebRTCHost } from "@/lib/webrtcHost";
import { useRef } from "react";
import { db } from "@/lib/db";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CHUNK_SIZE = 64 * 1024; // 64 KB

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
  const [copied, setCopied] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);

  // Load files from DB on mount
  useEffect(() => {
    const loadFiles = async () => {
      const dbFiles = await db.getFilesByRole('host');
      setFiles(dbFiles.map(f => ({
        id: f.id,
        name: f.name,
        size: (f.size / (1024 * 1024)).toFixed(2) + " MB",
        pct: 100,
        Icon: FileText,
        // No fileObj after refresh, WebRTCHost will use DB
      })));
    };
    loadFiles();
  }, []);

  const handleAddFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFilesList = Array.from(e.target.files);
    e.target.value = ""; // Reset input so same file can be added again if deleted

    // Generate IDs and add all to state immediately for responsiveness
    const filesWithContext = newFilesList.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9)
    }));

    setFiles((prev) => [
      ...prev,
      ...filesWithContext.map(({ file, id }) => ({
        id,
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
        pct: 0,
        Icon: FileText,
        fileObj: file,
        isIndexing: true,
      }))
    ]);

    // Process indexing for each file (can run concurrently)
    filesWithContext.forEach(async ({ file, id }) => {
      try {
        // Save metadata to DB
        await db.saveFileMetadata({
          id,
          name: file.name,
          size: file.size,
          type: file.type,
          role: 'host',
          addedAt: Date.now()
        });

        // Save chunks to DB (streaming)
        let offset = 0;
        let chunkIndex = 0;
        let lastReportedPct = 0;

        while (offset < file.size) {
          const slice = file.slice(offset, offset + CHUNK_SIZE);
          const buffer = await slice.arrayBuffer();
          await db.saveChunk({
            fileId: id,
            index: chunkIndex,
            data: buffer
          });
          offset += buffer.byteLength;
          chunkIndex++;

          // Throttle state updates
          const currentPct = Math.floor((offset / file.size) * 100);
          if (currentPct > lastReportedPct) {
            lastReportedPct = currentPct;
            setFiles(prev => prev.map(f => f.id === id ? { ...f, pct: currentPct } : f));
          }
        }

        // Finalize indexing status
        setFiles(prev => prev.map(f => f.id === id ? { ...f, pct: 100, isIndexing: false } : f));
      } catch (err) {
        console.error("Error indexing file:", err);
        // Remove file from list if indexing failed
        setFiles(prev => prev.filter(f => f.id !== id));
      }
    });
  };

  const handleDeleteFile = async (id: string) => {
    await db.deleteFile(id);
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  useEffect(() => {
    if (sessionKey && sessionKey !== "Connecting..." && sessionKey !== "Error creating session") {
      const socket = getSocket();
      socket.emit("host:update_metadata", {
        sessionId: sessionKey,
        metadata: files.filter(f => !f.isIndexing).map(f => ({
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
    let currentSessionId: string | null = localStorage.getItem("fshare_host_session_id");
    
    socket.emit("host:start", { sessionId: currentSessionId }, (res: any) => {
      if (res.success) {
        currentSessionId = res.sessionId;
        setSessionKey(res.sessionId);
        localStorage.setItem("fshare_host_session_id", res.sessionId);
        
        if (res.isResume && res.joiners) {
          setDevices(res.joiners.map((id: string) => ({ id })));
        }
      } else {
        setSessionKey("Error creating session");
      }
    });

    const onJoinerConnected = (data: { joinerId: string }) => {
      setDevices(prev => {
        if (prev.find(d => d.id === data.joinerId)) return prev;
        return [...prev, { id: data.joinerId }];
      });
    };

    const onJoinerDisconnected = (data: { joinerId: string }) => {
      setDevices(prev => prev.filter(d => d.id !== data.joinerId));
    };

    socket.on("host:joiner_connected", onJoinerConnected);
    socket.on("host:joiner_disconnected", onJoinerDisconnected);

    return () => {
      socket.off("host:joiner_connected", onJoinerConnected);
      socket.off("host:joiner_disconnected", onJoinerDisconnected);
      // We no longer shutdown on unmount to allow refresh/cloud-drive behavior
    };
  }, []);

  // WebRTC Setup
  const filesRef = useRef(files);
  filesRef.current = files;

  const transfersRef = useRef<Record<string, Record<string, number>>>({});

  useEffect(() => {
    if (!sessionKey || sessionKey === "Connecting..." || sessionKey === "Error creating session") return;
    
    const socket = getSocket();
    
    // Reset transfers when session starts/resumes
    transfersRef.current = {};

    const rtcHost = new WebRTCHost(socket, sessionKey, (fileId, joinerId, sentBytes, totalBytes) => {
      // Track progress per joiner for this file
      if (!transfersRef.current[fileId]) transfersRef.current[fileId] = {};
      transfersRef.current[fileId][joinerId] = Math.round((sentBytes / totalBytes) * 100);

      // Find max progress across all joiners for this file
      const maxPct = Math.max(...Object.values(transfersRef.current[fileId]));

      setFiles(prev => prev.map(f => {
        if (f.id === fileId) {
          // Only update if it's a meaningful change to avoid unnecessary re-renders
          if (f.pct === maxPct) return f;
          return { ...f, pct: maxPct };
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
      if (file) {
        rtcHost.sendFile(joinerId, fileId, file.fileObj);
      }
    };

    socket.on("host:file_requested", onFileRequested);

    return () => {
      socket.off("host:file_requested", onFileRequested);
      rtcHost.destroy();
    };
  }, [sessionKey]);

  const handleShutdown = () => {
    const socket = getSocket();
    socket.emit("host:shutdown", { sessionId: sessionKey }, (res: any) => {
      if (res.success) {
        localStorage.removeItem("fshare_host_session_id");
        window.location.href = "/"; // Redirect to home
      }
    });
  };

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
          <div className="glass flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium border-r border-white/10 pr-2 mr-1">Key</span>
            <code className="font-mono text-xs tracking-wider text-primary">
              {sessionKey}
            </code>
            <button
              className="ml-1 text-muted-foreground hover:text-primary transition-colors"
              aria-label="Copy session key"
              onClick={() => {
                navigator.clipboard.writeText(sessionKey).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
              }}
            >
              {copied ? (
                <span className="text-[10px] font-bold text-success px-0.5">✓</span>
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>
          <button 
            onClick={() => setShowRevokeConfirm(true)}
            className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Power className="h-3.5 w-3.5" /> Revoke session
          </button>
          <label className="glass inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs hover:bg-white/5">
            <Plus className="h-3.5 w-3.5" /> Add files
            <input type="file" multiple className="hidden" onChange={handleAddFiles} />
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {/* Deletion Confirmation */}
        <AlertDialog open={!!fileToDelete} onOpenChange={(open) => !open && setFileToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the file from your local index and stop it from being shared. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  if (fileToDelete) {
                    handleDeleteFile(fileToDelete);
                    setFileToDelete(null);
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Revoke Session Confirmation */}
        <AlertDialog open={showRevokeConfirm} onOpenChange={setShowRevokeConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke this session?</AlertDialogTitle>
              <AlertDialogDescription>
                This will immediately disconnect all devices and stop sharing all files. You will need to start a new session to share again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep session</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  handleShutdown();
                  setShowRevokeConfirm(false);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Revoke session
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
                        {f.size} · {f.isIndexing ? "Indexing..." : (f.pct === 100 ? "Ready" : "Transferring")}
                      </p>
                    </div>
                    <button 
                      onClick={() => setFileToDelete(f.id)}
                      className="rounded-lg p-2 text-muted-foreground transition hover:bg-white/5 hover:text-destructive opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    >
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
        </section>

        {/* Share panel */}
        <aside className="space-y-5">
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
