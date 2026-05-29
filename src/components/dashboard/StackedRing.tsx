"use client";

import { ReactNode } from "react";

export interface RingDatum {
  key: string | number;
  color: string;
  value: number; // 0..1
}

interface StackedRingProps {
  size?: number;
  stroke?: number;
  gap?: number;
  rings: RingDatum[];
  children?: ReactNode;
  animate?: boolean;
}

export function StackedRing({
  size = 240,
  stroke = 16,
  gap = 3,
  rings,
  children,
  animate = true,
}: StackedRingProps) {
  const cx = size / 2;
  const cy = size / 2;
  const outermost = (size - stroke) / 2;
  return (
    <div
      className="relative aspect-square w-full"
      style={{ maxWidth: size }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${size} ${size}`}
        preserveAspectRatio="xMidYMid meet"
        className="block"
      >
        {rings.map((r, i) => {
          const radius = outermost - i * (stroke + gap);
          if (radius <= 0) return null;
          const c = 2 * Math.PI * radius;
          const v = Math.max(0, Math.min(1, r.value));
          return (
            <g key={r.key} transform={`rotate(-90 ${cx} ${cy})`}>
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                stroke={r.color}
                strokeOpacity="0.15"
                strokeWidth={stroke}
                fill="none"
              />
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                stroke={r.color}
                strokeWidth={stroke}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={c * (1 - v)}
                style={{
                  filter: `drop-shadow(0 0 6px ${r.color}80)`,
                  transition: animate
                    ? "stroke-dashoffset 1.2s cubic-bezier(.2,.7,.3,1)"
                    : "none",
                }}
              />
            </g>
          );
        })}
      </svg>
      {children && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {children}
        </div>
      )}
    </div>
  );
}

export function FlameIcon({
  size = 14,
  color = "var(--sf-accent)",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path
        d="M8 1.5c.5 2 2 2.5 2 4.5 0 .8-.4 1.4-1 1.7.4-.7.2-1.6-.5-2 .3 1.2-.6 1.8-.6 2.8 0 .5.3.9.7 1.1-.4.1-.8 0-1.1-.2-1.4-.7-2.5-2-2.5-3.7C5 3.5 6.5 2.6 8 1.5z"
        fill={color}
      />
      <path
        d="M8 6c.5 1 1.6 1.5 1.6 3 0 1.4-1.1 2.5-2.6 2.5S4.4 10.4 4.4 9c0-.7.3-1.2.7-1.6.1.6.5 1 .9 1.1-.2-.5-.1-1 .2-1.4.5-.6 1.4-.7 1.8-1.1z"
        fill={color}
        fillOpacity="0.7"
      />
    </svg>
  );
}
