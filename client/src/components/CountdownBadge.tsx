import { useEffect, useState } from "react";

export function CountdownBadge({ expiryTime }: { expiryTime?: number }) {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!expiryTime) return;

    const calculateRemaining = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expiryTime - now) / 1000));
      setRemaining(diff);
    };

    calculateRemaining();
    const t = setInterval(calculateRemaining, 1000);
    return () => clearInterval(t);
  }, [expiryTime]);

  if (!expiryTime) return null;

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60).toString().padStart(2, "0");
  const s = (remaining % 60).toString().padStart(2, "0");

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary ring-1 ring-primary/30">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary glow-primary" />
      Expires in {h > 0 ? `${h}:` : ""}{m}:{s}
    </span>
  );
}
