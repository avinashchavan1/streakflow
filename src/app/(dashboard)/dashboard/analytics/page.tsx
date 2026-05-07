"use client";

import { useEffect, useMemo, useState } from "react";
import { useHabitStore } from "@/lib/store/habitStore";
import { useGamificationStore } from "@/lib/store/gamificationStore";
import { createClient } from "@/lib/supabase/client";
import { Heatmap } from "@/components/dashboard/Heatmap";
import { format, subDays } from "date-fns";
import type { HabitLog } from "@/types";

type Range = "7d" | "30d" | "90d" | "All";
const RANGES: Range[] = ["7d", "30d", "90d", "All"];
const RANGE_DAYS: Record<Range, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  All: 365,
};

export default function AnalyticsPage() {
  const { habits, fetchHabits } = useHabitStore();
  const { profile, fetchProfile } = useGamificationStore();
  const [range, setRange] = useState<Range>("30d");
  const [logs, setLogs] = useState<HabitLog[]>([]);

  useEffect(() => {
    fetchHabits();
    fetchProfile();
  }, [fetchHabits, fetchProfile]);

  useEffect(() => {
    async function loadLogs() {
      const supabase = createClient();
      const since = format(subDays(new Date(), RANGE_DAYS[range]), "yyyy-MM-dd");
      const { data } = await supabase
        .from("habit_logs")
        .select("*")
        .gte("log_date", since);
      setLogs(data ?? []);
    }
    loadLogs();
  }, [range]);

  const stats = useMemo(() => {
    const days = RANGE_DAYS[range];
    const completed = logs.filter((l) => l.completed).length;
    const totalPossible = habits.length * days;
    const completionPct =
      totalPossible > 0 ? Math.round((completed / totalPossible) * 100) : 0;

    // Perfect days
    const byDate = new Map<string, Set<string>>();
    for (const l of logs) {
      if (!l.completed) continue;
      if (!byDate.has(l.log_date)) byDate.set(l.log_date, new Set());
      byDate.get(l.log_date)!.add(l.habit_id);
    }
    let perfectDays = 0;
    for (const set of byDate.values()) {
      if (habits.length > 0 && set.size >= habits.length) perfectDays++;
    }

    return { completionPct, perfectDays, daysSpan: days };
  }, [logs, habits, range]);

  const habitCompletion = useMemo(() => {
    const days = RANGE_DAYS[range];
    return habits
      .map((h) => {
        const habitLogs = logs.filter(
          (l) => l.habit_id === h.id && l.completed
        );
        const pct = days > 0 ? Math.round((habitLogs.length / days) * 100) : 0;
        return { name: h.name, pct: Math.min(100, pct), color: h.color };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [habits, logs, range]);

  // Build heatmap from completion ratio per day
  const heatmapData = useMemo(() => {
    const today = new Date();
    const weeks = 20;
    const cells: number[] = [];
    for (let i = weeks * 7 - 1; i >= 0; i--) {
      const d = format(subDays(today, i), "yyyy-MM-dd");
      const completedToday = logs.filter(
        (l) => l.log_date === d && l.completed
      ).length;
      const ratio = habits.length === 0 ? 0 : completedToday / habits.length;
      if (ratio === 0) cells.push(0);
      else if (ratio < 0.34) cells.push(1);
      else if (ratio < 0.67) cells.push(2);
      else if (ratio < 1) cells.push(3);
      else cells.push(4);
    }
    return cells;
  }, [habits, logs]);

  // Time of day (placeholder using logged_at hours from logs)
  const timeOfDay = useMemo(() => {
    const buckets = Array.from({ length: 24 }, () => 0);
    for (const l of logs) {
      if (!l.completed) continue;
      const h = new Date(l.logged_at).getHours();
      buckets[h]++;
    }
    return buckets;
  }, [logs]);

  // By weekday
  const byWeekday = useMemo(() => {
    const totals = Array.from({ length: 7 }, () => ({ done: 0, total: 0 }));
    const seenDates = new Map<string, number>();
    for (const l of logs) {
      const dow = new Date(l.log_date).getDay();
      seenDates.set(l.log_date, dow);
    }
    // For each date in range, increment total per habit count
    const days = RANGE_DAYS[range];
    for (let i = 0; i < days; i++) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      const dow = new Date(d).getDay();
      totals[dow].total += habits.length;
      const completed = logs.filter(
        (l) => l.log_date === d && l.completed
      ).length;
      totals[dow].done += completed;
    }
    const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    // Reorder Mon..Sun
    const order = [1, 2, 3, 4, 5, 6, 0];
    return order.map((idx) => ({
      d: labels[idx],
      v: totals[idx].total === 0 ? 0 : totals[idx].done / totals[idx].total,
    }));
  }, [logs, habits, range]);

  const peakHour = timeOfDay.indexOf(Math.max(...timeOfDay));
  const peakLabel =
    peakHour < 12
      ? `${peakHour || 12}–${peakHour + 2 || 12} AM`
      : `${peakHour - 12 || 12}–${peakHour - 10 || 12} PM`;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <div className="sf-eyebrow">Patterns</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-[32px]">
            Analytics
          </h1>
        </div>
        <div
          className="flex rounded-lg border p-[3px]"
          style={{
            background: "var(--sf-surface)",
            borderColor: "var(--sf-border)",
          }}
        >
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className="rounded-md px-3.5 py-1.5 text-[13px] font-medium"
              style={{
                background:
                  range === r ? "var(--sf-surface-3)" : "transparent",
                color: range === r ? "var(--sf-text)" : "var(--sf-text-3)",
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Top stats */}
      <div className="mb-6 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <AnalyticsTile
          label="Completion"
          value={
            <>
              {stats.completionPct}
              <span
                className="text-lg"
                style={{ color: "var(--sf-text-3)" }}
              >
                %
              </span>
            </>
          }
          sub={`vs previous ${range === "All" ? "period" : range}`}
        />
        <AnalyticsTile
          label="Perfect days"
          value={stats.perfectDays}
          sub={`of ${RANGE_DAYS[range]} days`}
        />
        <AnalyticsTile
          label="XP earned"
          value={(profile?.xp ?? 0).toLocaleString()}
          sub="Lifetime"
          color="var(--sf-ring-fuel)"
        />
        <AnalyticsTile
          label="Best window"
          value={
            timeOfDay.every((v) => v === 0) ? "—" : peakLabel
          }
          sub={
            timeOfDay.every((v) => v === 0)
              ? "Log more to see"
              : `${timeOfDay[peakHour]} logs`
          }
          smallValue
        />
      </div>

      {/* Per-habit + Heatmap */}
      <div className="mb-6 grid gap-3.5 lg:grid-cols-[1fr_1.4fr]">
        <div
          className="rounded-2xl border p-6"
          style={{
            background: "var(--sf-surface)",
            borderColor: "var(--sf-border)",
          }}
        >
          <h3 className="mb-4 text-sm font-semibold">By habit</h3>
          {habitCompletion.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--sf-text-3)" }}>
              No habits yet.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {habitCompletion.map((h) => (
                <div key={h.name}>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span style={{ color: "var(--sf-text-2)" }}>{h.name}</span>
                    <span
                      className="sf-num font-semibold"
                      style={{ color: "var(--sf-text)" }}
                    >
                      {h.pct}%
                    </span>
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-full"
                    style={{ background: "var(--sf-surface-3)" }}
                  >
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{
                        width: `${h.pct}%`,
                        background: h.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          className="rounded-2xl border p-6"
          style={{
            background: "var(--sf-surface)",
            borderColor: "var(--sf-border)",
          }}
        >
          <h3 className="text-sm font-semibold">Streak heatmap</h3>
          <div
            className="mb-4 mt-0.5 text-xs"
            style={{ color: "var(--sf-text-3)" }}
          >
            Color intensity = % of habits done that day
          </div>
          <div className="overflow-x-auto">
            <Heatmap weeks={20} data={heatmapData} color="#ff5e3a" />
          </div>
        </div>
      </div>

      {/* Time of day + by weekday */}
      <div className="grid gap-3.5 lg:grid-cols-[1.4fr_1fr]">
        <div
          className="rounded-2xl border p-6"
          style={{
            background: "var(--sf-surface)",
            borderColor: "var(--sf-border)",
          }}
        >
          <h3 className="text-sm font-semibold">Time of day</h3>
          <div
            className="mb-5 mt-0.5 text-xs"
            style={{ color: "var(--sf-text-3)" }}
          >
            When you log most
          </div>
          <div className="flex h-24 items-end gap-1">
            {timeOfDay.map((v, i) => {
              const max = Math.max(...timeOfDay, 1);
              const h = Math.max(2, (v / max) * 100);
              const isPeak = v === max && v > 0;
              return (
                <div
                  key={i}
                  className="flex flex-1 flex-col items-center gap-1"
                >
                  <div
                    className="w-full rounded-[3px] transition-colors"
                    style={{
                      height: `${h}%`,
                      background: isPeak
                        ? "var(--sf-ring-fuel)"
                        : "var(--sf-surface-3)",
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div
            className="mt-2 flex justify-between text-[10px]"
            style={{ color: "var(--sf-text-3)" }}
          >
            <span>12a</span>
            <span>6a</span>
            <span>12p</span>
            <span>6p</span>
            <span>11p</span>
          </div>
        </div>

        <div
          className="rounded-2xl border p-6"
          style={{
            background: "var(--sf-surface)",
            borderColor: "var(--sf-border)",
          }}
        >
          <h3 className="text-sm font-semibold">By weekday</h3>
          <div
            className="mb-5 mt-0.5 text-xs"
            style={{ color: "var(--sf-text-3)" }}
          >
            Avg completion %
          </div>
          <div className="flex flex-col gap-2">
            {byWeekday.map((d) => (
              <div key={d.d} className="flex items-center gap-2.5">
                <span
                  className="w-7 text-xs"
                  style={{ color: "var(--sf-text-3)" }}
                >
                  {d.d}
                </span>
                <div
                  className="h-1.5 flex-1 overflow-hidden rounded-full"
                  style={{ background: "var(--sf-surface-3)" }}
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-700"
                    style={{
                      width: `${d.v * 100}%`,
                      background: "var(--sf-ring-mind)",
                    }}
                  />
                </div>
                <span
                  className="sf-num w-8 text-right text-xs"
                  style={{ color: "var(--sf-text-2)" }}
                >
                  {Math.round(d.v * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsTile({
  label,
  value,
  sub,
  color = "var(--sf-text)",
  smallValue,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  color?: string;
  smallValue?: boolean;
}) {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{
        background: "var(--sf-surface)",
        borderColor: "var(--sf-border)",
      }}
    >
      <div className="sf-eyebrow">{label}</div>
      <div
        className={`sf-num mt-2 font-semibold leading-none ${smallValue ? "text-2xl" : "text-[36px]"}`}
        style={{ color }}
      >
        {value}
      </div>
      {sub && (
        <div
          className="mt-1 text-[11px]"
          style={{ color: "var(--sf-text-3)" }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}
