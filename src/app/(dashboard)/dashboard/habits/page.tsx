"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useHabitStore } from "@/lib/store/habitStore";
import { useUiStore } from "@/lib/store/uiStore";
import { createClient } from "@/lib/supabase/client";
import { HabitForm } from "@/components/habits/HabitForm";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { FlameIcon } from "@/components/dashboard/StackedRing";
import { useConfirm } from "@/components/ui/confirm";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { format, subDays } from "date-fns";
import type { HabitLog } from "@/types";

const CAPITALIZE = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const SPARK_DAYS = 30;

export default function HabitsPage() {
  const { habits, loading, fetchHabits, deleteHabit } = useHabitStore();
  const { openHabitForm } = useUiStore();
  const [tab, setTab] = useState<"active" | "archived">("active");
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const { confirm, dialog: confirmDialog } = useConfirm();

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  useEffect(() => {
    async function loadLogs() {
      const supabase = createClient();
      const since = format(subDays(new Date(), SPARK_DAYS - 1), "yyyy-MM-dd");
      const { data } = await supabase
        .from("habit_logs")
        .select("*")
        .gte("log_date", since);
      setLogs(data ?? []);
    }
    loadLogs();
  }, []);

  const sparkByHabit = useMemo(() => {
    const map = new Map<string, number[]>();
    const today = new Date();
    for (const habit of habits) {
      const habitLogs = logs.filter((l) => l.habit_id === habit.id);
      const byDate = new Map<string, HabitLog>();
      for (const l of habitLogs) byDate.set(l.log_date, l);
      const series: number[] = [];
      for (let i = SPARK_DAYS - 1; i >= 0; i--) {
        const d = format(subDays(today, i), "yyyy-MM-dd");
        const log = byDate.get(d);
        if (!log) {
          series.push(0);
        } else if (habit.habit_type === "binary") {
          series.push(log.completed ? 1 : 0);
        } else if (habit.target_value && habit.target_value > 0) {
          series.push(Math.min(1, (log.value ?? 0) / habit.target_value));
        } else {
          series.push(log.completed ? 1 : 0);
        }
      }
      map.set(habit.id, series);
    }
    return map;
  }, [habits, logs]);

  const visible = habits.filter((h) =>
    tab === "active" ? h.is_active : !h.is_active
  );

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-end justify-between gap-4 lg:mb-7">
        <div>
          <div className="sf-eyebrow">Manage</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-[32px]">
            Habits
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="hidden sm:flex rounded-lg border p-[3px]"
            style={{
              background: "var(--sf-surface)",
              borderColor: "var(--sf-border)",
            }}
          >
            <button
              onClick={() => setTab("active")}
              className="rounded-md px-3.5 py-1.5 text-[13px]"
              style={{
                background:
                  tab === "active" ? "var(--sf-surface-3)" : "transparent",
                color: tab === "active" ? "var(--sf-text)" : "var(--sf-text-3)",
              }}
            >
              Active{" "}
              <span style={{ color: "var(--sf-text-3)" }}>
                {habits.filter((h) => h.is_active).length}
              </span>
            </button>
            <button
              onClick={() => setTab("archived")}
              className="rounded-md px-3.5 py-1.5 text-[13px]"
              style={{
                background:
                  tab === "archived" ? "var(--sf-surface-3)" : "transparent",
                color:
                  tab === "archived" ? "var(--sf-text)" : "var(--sf-text-3)",
              }}
            >
              Archived{" "}
              <span>{habits.filter((h) => !h.is_active).length}</span>
            </button>
          </div>
          <button
            onClick={() => openHabitForm()}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold"
            style={{ background: "var(--sf-text)", color: "var(--sf-bg)" }}
          >
            <Plus className="h-4 w-4" />
            Add Habit
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3.5 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-2xl border animate-pulse"
              style={{
                background: "var(--sf-surface)",
                borderColor: "var(--sf-border)",
              }}
            />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="py-20 text-center">
          <div
            className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: "var(--sf-surface-2)" }}
          >
            <span className="text-3xl">📝</span>
          </div>
          <h3 className="mb-2 text-lg font-semibold">
            {tab === "active" ? "No active habits" : "No archived habits"}
          </h3>
          <p
            className="mx-auto mb-6 max-w-sm text-sm"
            style={{ color: "var(--sf-text-3)" }}
          >
            {tab === "active"
              ? "Create your first habit to start building."
              : "Archive habits you're no longer tracking."}
          </p>
          {tab === "active" && (
            <button
              onClick={() => openHabitForm()}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold"
              style={{ background: "var(--sf-text)", color: "var(--sf-bg)" }}
            >
              <Plus className="h-4 w-4" />
              Add Habit
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2">
          {visible.map((h) => {
            const current = h.streak?.current_streak ?? 0;
            const longest = h.streak?.longest_streak ?? 0;
            const typeLabel =
              h.habit_type === "binary"
                ? "Binary"
                : `${CAPITALIZE(h.habit_type)} · ${h.target_value} ${h.target_unit ?? ""}`;
            const freqLabel = CAPITALIZE(h.frequency);
            const spark = sparkByHabit.get(h.id) ?? Array(SPARK_DAYS).fill(0);
            return (
              <div
                key={h.id}
                className="relative flex flex-col gap-3.5 rounded-2xl border p-5"
                style={{
                  background: "var(--sf-surface)",
                  borderColor: "var(--sf-border)",
                }}
              >
                <div className="flex items-start gap-3">
                  <Link
                    href={`/dashboard/habits/${h.id}`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
                    style={{ background: `${h.color}1f` }}
                  >
                    {h.icon}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/dashboard/habits/${h.id}`}
                      className="block truncate text-[15px] font-semibold hover:underline"
                    >
                      {h.name}
                    </Link>
                    <div
                      className="mt-0.5 truncate text-xs"
                      style={{ color: "var(--sf-text-3)" }}
                    >
                      {typeLabel} · {freqLabel}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <button
                      onClick={() => openHabitForm(h.id)}
                      className="rounded-md p-1.5 transition-colors hover:bg-[var(--sf-surface-2)]"
                      aria-label="Edit"
                    >
                      <Pencil
                        className="h-3.5 w-3.5"
                        style={{ color: "var(--sf-text-3)" }}
                      />
                    </button>
                    <button
                      onClick={async () => {
                        const ok = await confirm({
                          title: `Delete "${h.name}"?`,
                          description:
                            "Habit goes to archive. Logs and streak data are kept.",
                          confirmLabel: "Delete",
                          destructive: true,
                        });
                        if (ok) deleteHabit(h.id);
                      }}
                      className="rounded-md p-1.5 transition-colors hover:bg-[var(--sf-surface-2)]"
                      aria-label="Delete"
                    >
                      <Trash2
                        className="h-3.5 w-3.5"
                        style={{ color: "var(--sf-text-3)" }}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex items-end gap-5">
                  <div>
                    <div className="sf-eyebrow">Current</div>
                    <div className="mt-0.5 flex items-baseline gap-1">
                      <FlameIcon size={14} />
                      <span
                        className="sf-num text-[22px] font-semibold"
                        style={{
                          color:
                            current > 0
                              ? "var(--sf-accent)"
                              : "var(--sf-text-3)",
                        }}
                      >
                        {current}
                      </span>
                      <span
                        className="text-[11px]"
                        style={{ color: "var(--sf-text-3)" }}
                      >
                        d
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="sf-eyebrow">Longest</div>
                    <div
                      className="sf-num mt-0.5 text-[22px] font-semibold"
                      style={{ color: "var(--sf-text-2)" }}
                    >
                      {longest}
                      <span
                        className="ml-0.5 text-[11px] font-medium"
                        style={{ color: "var(--sf-text-3)" }}
                      >
                        d
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col items-end">
                    <div className="sf-eyebrow mb-1">30d</div>
                    <Sparkline
                      data={spark}
                      color={h.color}
                      width={130}
                      height={28}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <HabitForm />
      {confirmDialog}
    </div>
  );
}
