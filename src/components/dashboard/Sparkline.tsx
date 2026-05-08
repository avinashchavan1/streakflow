"use client";

import { useId } from "react";

interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export function Sparkline({
  data,
  color = "var(--sf-ring-move)",
  width = 130,
  height = 32,
}: SparklineProps) {
  const reactId = useId();
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const min = 0;
  const stepX = width / Math.max(1, data.length - 1);
  const pts = data
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / (max - min)) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  const area = `0,${height} ${pts} ${width},${height}`;
  const id = `sg-${reactId.replace(/:/g, "_")}`;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="block"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id})`} />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
