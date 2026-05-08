type Props = { value?: string; size?: number; className?: string };

// Decorative QR-style block (not a real encoded QR — purely visual placeholder)
export function QrCodeArt({ value = "FSHARE-DEMO", size = 220, className = "" }: Props) {
  const cells = 21;
  // Deterministic pseudo-random pattern from value
  let seed = 0;
  for (let i = 0; i < value.length; i++) seed = (seed * 31 + value.charCodeAt(i)) >>> 0;
  const rand = (i: number, j: number) => {
    const x = Math.sin(seed + i * 91 + j * 17) * 10000;
    return x - Math.floor(x);
  };

  const isFinder = (i: number, j: number) => {
    const inBox = (a: number, b: number) =>
      i >= a && i < a + 7 && j >= b && j < b + 7;
    return inBox(0, 0) || inBox(0, cells - 7) || inBox(cells - 7, 0);
  };

  const finderCell = (i: number, j: number, a: number, b: number) => {
    const di = i - a, dj = j - b;
    const onOuter = di === 0 || di === 6 || dj === 0 || dj === 6;
    const onInner = di >= 2 && di <= 4 && dj >= 2 && dj <= 4;
    return onOuter || onInner;
  };

  return (
    <div
      className={`relative grid rounded-2xl bg-foreground p-3 ${className}`}
      style={{
        width: size,
        height: size,
        gridTemplateColumns: `repeat(${cells}, 1fr)`,
        gridTemplateRows: `repeat(${cells}, 1fr)`,
        gap: 2,
      }}
    >
      {Array.from({ length: cells * cells }).map((_, idx) => {
        const i = Math.floor(idx / cells);
        const j = idx % cells;
        let on = false;
        if (isFinder(i, j)) {
          if (i < 7 && j < 7) on = finderCell(i, j, 0, 0);
          else if (i < 7) on = finderCell(i, j, 0, cells - 7);
          else on = finderCell(i, j, cells - 7, 0);
        } else {
          on = rand(i, j) > 0.55;
        }
        return (
          <div
            key={idx}
            className="rounded-[1px]"
            style={{ background: on ? "var(--background)" : "transparent" }}
          />
        );
      })}
    </div>
  );
}
