"use client";

import { useEffect, useState } from "react";

const COLORS = ["#ff2d55", "#ffb340", "#00d9b2", "#af52de", "#5ac8fa", "#ff5e3a"];

interface Particle {
  id: number;
  x: number;
  color: string;
  delay: number;
  size: number;
  duration: number;
  rounded: boolean;
}

export function Confetti() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Honor reduced motion
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const p: Particle[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 0.5,
      size: Math.random() * 6 + 4,
      duration: 1.5 + Math.random(),
      rounded: Math.random() > 0.5,
    }));
    setParticles(p);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute top-0"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.rounded ? "50%" : "2px",
            animation: `confetti-fall ${p.duration}s ease-in forwards`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
