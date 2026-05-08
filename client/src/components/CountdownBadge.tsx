import { useEffect, useState } from "react";

export function CountdownBadge({ seconds = 600 }: { seconds?: number }) {
  const [s, setS] = useState(seconds);
  useEffect(() => {
    const t = setInterval(() => setS((x) => (x > 0 ? x - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary ring-1 ring-primary/30">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary glow-primary" />
      Expires in {m}:{ss}
    </span>
  );
}
