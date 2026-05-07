"use client";

interface HeatmapProps {
  weeks?: number;
  data?: number[]; // values 0..4
  color?: string;
  cellSize?: number;
  cellGap?: number;
}

function deterministic(weeks: number) {
  const cells: number[] = [];
  for (let i = 0; i < weeks * 7; i++) {
    const seed = Math.sin(i * 12.9898) * 43758.5453;
    const v = seed - Math.floor(seed);
    cells.push(v > 0.85 ? 4 : v > 0.65 ? 3 : v > 0.45 ? 2 : v > 0.25 ? 1 : 0);
  }
  return cells;
}

export function Heatmap({
  weeks = 26,
  data,
  color = "var(--sf-ring-move)",
  cellSize = 11,
  cellGap = 3,
}: HeatmapProps) {
  const cells = data ?? deterministic(weeks);
  const grid: number[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: number[] = [];
    for (let d = 0; d < 7; d++) col.push(cells[w * 7 + d] ?? 0);
    grid.push(col);
  }

  function cellBg(v: number) {
    if (v === 0) return "var(--sf-surface-2)";
    if (v === 1) return `color-mix(in oklab, ${color} 22%, transparent)`;
    if (v === 2) return `color-mix(in oklab, ${color} 42%, transparent)`;
    if (v === 3) return `color-mix(in oklab, ${color} 70%, transparent)`;
    return color;
  }

  return (
    <div className="flex" style={{ gap: cellGap }}>
      {grid.map((col, i) => (
        <div key={i} className="flex flex-col" style={{ gap: cellGap }}>
          {col.map((v, j) => (
            <div
              key={j}
              style={{
                width: cellSize,
                height: cellSize,
                borderRadius: 2,
                background: cellBg(v),
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
