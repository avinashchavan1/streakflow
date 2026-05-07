"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUiStore } from "@/lib/store/uiStore";
import { createClient } from "@/lib/supabase/client";
import { Heatmap } from "@/components/dashboard/Heatmap";
import { FlameIcon } from "@/components/dashboard/StackedRing";
import { format, subDays } from "date-fns";
import type { Habit, HabitLog, Streak } from "@/types";

interface HabitDetailProps {
  habitId: string;
}

export function HabitDetail({ habitId }: HabitDetailProps) {
  const { openHabitForm } = useUiStore();
  const [habit, setHabit] = useState<Habit | null>(null);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [allLogs, setAllLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
      const [{ data: h }, { data: l }, { data: s }, { data: allL }] =
        await Promise.all([
          supabase.from("habits").select("*").eq("id", habitId).single(),
          supabase
            .from("habit_logs")
            .select("*")
            .eq("habit_id", habitId)
            .gte("log_date", thirtyDaysAgo)
            .order("log_date", { ascending: false }),
          supabase.from("streaks").select("*").eq("habit_id", habitId).single(),
          supabase
            .from("habit_logs")
            .select("*")
            .eq("habit_id", habitId),
        ]);
      setHabit(h);
      setLogs(l ?? []);
      setStreak(s);
      setAllLogs(allL ?? []);
      setLoading(false);
    }
    load();
  }, [habitId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl">
        <div
          className="h-64 animate-pulse rounded-2xl border"
          style={{
            background: "var(--sf-surface)",
            borderColor: "var(--sf-border)",
          }}
        />
      </div>
    );
  }

  if (!habit) {
    return (
      <p style={{ color: "var(--sf-text-3)" }}>Habit not found.</p>
    );
  }

  // Build 26 weeks of heatmap from allLogs
  const today = new Date();
  const weeks = 26;
  const cells: number[] = [];
  const logByDate = new Map<string, HabitLog>();
  for (const log of allLogs) logByDate.set(log.log_date, log);

  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const d = format(subDays(today, i), "yyyy-MM-dd");
    const log = logByDate.get(d);
    if (!log) cells.push(0);
    else if (!log.completed) cells.push(1);
    else if (habit.habit_type !== "binary" && habit.target_value) {
      const ratio = (log.value ?? 0) / habit.target_value;
      if (ratio >= 1.25) cells.push(4);
      else if (ratio >= 1) cells.push(3);
      else if (ratio >= 0.75) cells.push(2);
      else cells.push(1);
    } else cells.push(3);
  }

  const totalLogs = allLogs.filter((l) => l.completed).length;
  const freezesUsed = streak?.freeze_used_dates?.length ?? 0;

  const typeLabel =
    habit.habit_type === "binary"
      ? "Binary · Daily"
      : `${habit.habit_type === "quantity" ? "Quantity" : "Duration"} · ${habit.target_value} ${habit.target_unit ?? ""} · ${habit.frequency}`;

  return (
    <div className="mx-auto max-w-6xl">
      {/* Breadcrumb */}
      <div
        className="mb-3 flex items-center gap-1.5 text-xs"
        style={{ color: "var(--sf-text-3)" }}
      >
        <Link
          href="/dashboard/habits"
          style={{ color: "var(--sf-text-3)" }}
          className="hover:underline"
        >
          Habits
        </Link>
        <span>/</span>
        <span style={{ color: "var(--sf-text-2)" }}>{habit.name}</span>
      </div>

      {/* Header */}
      <div className="mb-7 flex items-center gap-4">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl"
          style={{ background: `${habit.color}26` }}
        >
          {habit.icon}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            {habit.name}
          </h1>
          <div
            className="mt-0.5 text-sm"
            style={{ color: "var(--sf-text-3)" }}
          >
            {typeLabel}
          </div>
        </div>
        <button
          onClick={() => openHabitForm(habitId)}
          className="rounded-lg border px-4 py-2 text-sm font-semibold"
          style={{
            background: "var(--sf-surface-2)",
            borderColor: "var(--sf-border)",
            color: "var(--sf-text)",
          }}
        >
          Edit
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <DetailTile
          label="Current streak"
          value={
            <span className="inline-flex items-center gap-1.5">
              <FlameIcon size={20} />
              {streak?.current_streak ?? 0}d
            </span>
          }
          sub={
            (streak?.current_streak ?? 0) ===
            (streak?.longest_streak ?? 0)
              ? "Personal best, tied"
              : `Best: ${streak?.longest_streak ?? 0}d`
          }
          color="var(--sf-accent)"
        />
        <DetailTile
          label="Longest"
          value={`${streak?.longest_streak ?? 0}d`}
          sub={
            (streak?.current_streak ?? 0) ===
            (streak?.longest_streak ?? 0)
              ? "Same as current"
              : "All-time best"
          }
          color="var(--sf-text)"
        />
        <DetailTile
          label="Total logs"
          value={totalLogs}
          sub={
            allLogs.length > 0
              ? `Since ${format(
                  new Date(
                    allLogs[allLogs.length - 1]?.log_date ??
                      habit.created_at
                  ),
                  "MMM d"
                )}`
              : "No logs yet"
          }
          color="var(--sf-text)"
        />
        <DetailTile
          label="Freezes used"
          value={freezesUsed}
          sub="Per habit"
          color="var(--sf-ring-rest)"
        />
      </div>

      {/* Heatmap card */}
      <div
        className="mb-6 rounded-2xl border p-6"
        style={{
          background: "var(--sf-surface)",
          borderColor: "var(--sf-border)",
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Activity</h3>
            <div
              className="mt-0.5 text-xs"
              style={{ color: "var(--sf-text-3)" }}
            >
              Last 26 weeks
            </div>
          </div>
          <div
            className="flex items-center gap-1.5 text-[11px]"
            style={{ color: "var(--sf-text-3)" }}
          >
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((v) => (
              <div
                key={v}
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: 2,
                  background:
                    v === 0
                      ? "var(--sf-surface-2)"
                      : `color-mix(in oklab, ${habit.color} ${22 + v * 18}%, transparent)`,
                }}
              />
            ))}
            <span>More</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Heatmap weeks={26} data={cells} color={habit.color} />
        </div>
      </div>

      {/* Recent logs */}
      <div
        className="rounded-2xl border p-6"
        style={{
          background: "var(--sf-surface)",
          borderColor: "var(--sf-border)",
        }}
      >
        <h3 className="mb-3.5 text-sm font-semibold">Recent logs</h3>
        {logs.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--sf-text-3)" }}>
            No logs in last 30 days.
          </p>
        ) : (
          <div>
            {logs.slice(0, 14).map((log, i) => {
              const ratio =
                habit.habit_type !== "binary" && habit.target_value
                  ? Math.min(
                      1,
                      (log.value ?? 0) / habit.target_value
                    )
                  : log.completed
                    ? 1
                    : 0;
              return (
                <div
                  key={log.id}
                  className="flex items-center gap-3.5 py-2.5"
                  style={{
                    borderTop:
                      i === 0 ? "none" : "1px solid var(--sf-divider)",
                  }}
                >
                  <div
                    className="w-20 text-[13px]"
                    style={{ color: "var(--sf-text-2)" }}
                  >
                    {format(new Date(log.log_date), "EEE MMM d")}
                  </div>
                  <div className="flex-1">
                    <div
                      className="h-1 max-w-[200px] overflow-hidden rounded-full"
                      style={{ background: "var(--sf-surface-3)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${ratio * 100}%`,
                          background: habit.color,
                        }}
                      />
                    </div>
                  </div>
                  <div
                    className="sf-num w-20 text-right text-[13px]"
                    style={{ color: "var(--sf-text-2)" }}
                  >
                    {habit.habit_type !== "binary"
                      ? `${log.value ?? 0}/${habit.target_value}`
                      : log.completed
                        ? "Done"
                        : "Skipped"}
                  </div>
                  <div className="w-20 text-right">
                    {log.completed ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                        style={{
                          background: "rgba(48,209,88,0.1)",
                          color: "var(--sf-success)",
                          borderColor: "rgba(48,209,88,0.2)",
                        }}
                      >
                        +XP
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                        style={{
                          background: "rgba(255,69,58,0.1)",
                          color: "var(--sf-danger)",
                          borderColor: "rgba(255,69,58,0.2)",
                        }}
                      >
                        Missed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailTile({
  label,
  value,
  sub,
  color = "var(--sf-text)",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  color?: string;
}) {
  return (
    <div
      className="flex flex-col gap-1.5 rounded-2xl border p-4 sm:p-5"
      style={{
        background: "var(--sf-surface)",
        borderColor: "var(--sf-border)",
      }}
    >
      <div className="sf-eyebrow">{label}</div>
      <div
        className="sf-num text-[26px] font-semibold leading-none sm:text-3xl"
        style={{ color }}
      >
        {value}
      </div>
      {sub && (
        <div className="text-xs" style={{ color: "var(--sf-text-3)" }}>
          {sub}
        </div>
      )}
    </div>
  );
}
