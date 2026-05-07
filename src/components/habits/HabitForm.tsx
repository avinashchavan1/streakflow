"use client";

import { useState, useEffect } from "react";
import { useHabitStore } from "@/lib/store/habitStore";
import { useUiStore } from "@/lib/store/uiStore";
import {
  HABIT_COLORS,
  HABIT_TEMPLATES,
  MAX_ACTIVE_HABITS,
} from "@/lib/constants/theme";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import type { HabitType, Frequency } from "@/types";

const ICONS = [
  "💧",
  "💪",
  "📚",
  "🧘",
  "💻",
  "📓",
  "🏃",
  "🥗",
  "😴",
  "🎨",
  "🎸",
  "📝",
  "☀️",
  "🌱",
  "🧠",
  "🦷",
];

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

export function HabitForm() {
  const { habits, addHabit, updateHabit } = useHabitStore();
  const { habitFormOpen, editingHabitId, closeHabitForm } = useUiStore();

  const editingHabit = editingHabitId
    ? habits.find((h) => h.id === editingHabitId)
    : null;

  const [name, setName] = useState("");
  const [icon, setIcon] = useState(ICONS[0]);
  const [color, setColor] = useState<string>(HABIT_COLORS[0]);
  const [habitType, setHabitType] = useState<HabitType>("binary");
  const [targetValue, setTargetValue] = useState("");
  const [targetUnit, setTargetUnit] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("daily");
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingHabit) {
      setName(editingHabit.name);
      setIcon(editingHabit.icon);
      setColor(editingHabit.color);
      setHabitType(editingHabit.habit_type);
      setTargetValue(editingHabit.target_value?.toString() ?? "");
      setTargetUnit(editingHabit.target_unit ?? "");
      setFrequency(editingHabit.frequency);
      setCustomDays(editingHabit.custom_days ?? []);
    } else {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingHabit?.id]);

  function resetForm() {
    setName("");
    setIcon(ICONS[0]);
    setColor(HABIT_COLORS[0]);
    setHabitType("binary");
    setTargetValue("");
    setTargetUnit("");
    setFrequency("daily");
    setCustomDays([]);
  }

  function applyTemplate(idx: number) {
    const t = HABIT_TEMPLATES[idx];
    setName(t.name);
    setIcon(t.icon);
    setColor(t.color);
    setHabitType(t.habit_type);
    setTargetValue(t.target_value?.toString() ?? "");
    setTargetUnit(t.target_unit ?? "");
  }

  async function handleSubmit() {
    if (!name.trim()) return;
    setSaving(true);
    const data = {
      name: name.trim(),
      icon,
      color,
      habit_type: habitType,
      target_value:
        habitType !== "binary" ? parseFloat(targetValue) || null : null,
      target_unit: habitType !== "binary" ? targetUnit || null : null,
      frequency,
      custom_days: frequency === "custom" ? customDays : null,
    };
    if (editingHabitId) await updateHabit(editingHabitId, data);
    else await addHabit(data);
    setSaving(false);
    closeHabitForm();
    resetForm();
  }

  const atLimit =
    !editingHabitId &&
    habits.filter((h) => h.is_active).length >= MAX_ACTIVE_HABITS;

  return (
    <Dialog
      open={habitFormOpen}
      onOpenChange={(open) => !open && closeHabitForm()}
    >
      <DialogContent
        showCloseButton={false}
        className="overflow-hidden p-0 sm:max-w-[520px] gap-0"
        style={{
          background: "var(--sf-surface)",
          border: "1px solid var(--sf-border-strong)",
          borderRadius: 20,
          boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
        }}
      >
        <DialogTitle className="sr-only">
          {editingHabitId ? "Edit habit" : "New habit"}
        </DialogTitle>

        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: "1px solid var(--sf-divider)" }}
        >
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {editingHabitId ? "Edit habit" : "New habit"}
            </h2>
            <div
              className="mt-0.5 text-xs"
              style={{ color: "var(--sf-text-3)" }}
            >
              {editingHabitId
                ? "Tweak the details and save."
                : "Pick a template or build your own"}
            </div>
          </div>
          <button
            onClick={closeHabitForm}
            className="flex h-7 w-7 items-center justify-center rounded-lg border p-0"
            style={{
              background: "var(--sf-surface-2)",
              borderColor: "var(--sf-border)",
              color: "var(--sf-text-3)",
            }}
            aria-label="Close"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M3 3l6 6M9 3l-6 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto px-6 py-6">
          {/* Templates */}
          {!editingHabitId && (
            <div>
              <div className="sf-eyebrow mb-2.5">Templates</div>
              <div className="grid grid-cols-3 gap-2">
                {HABIT_TEMPLATES.map((t, i) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => applyTemplate(i)}
                    className="flex items-center gap-2.5 rounded-[10px] border px-3 py-2.5 text-left text-[13px] font-medium"
                    style={{
                      background: "var(--sf-surface-2)",
                      borderColor: "var(--sf-border)",
                      color: "var(--sf-text)",
                    }}
                  >
                    <span className="text-base">{t.icon}</span>
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Name */}
          <label className="flex flex-col gap-1.5">
            <span className="sf-eyebrow">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 50))}
              placeholder="e.g. Cold shower"
              maxLength={50}
              className="rounded-lg border px-3.5 py-2.5 text-sm outline-none"
              style={{
                background: "rgba(20,17,14,0.6)",
                borderColor: "var(--sf-border)",
                color: "var(--sf-text)",
              }}
            />
          </label>

          {/* Icon */}
          <div>
            <div className="sf-eyebrow mb-2.5">Icon</div>
            <div className="grid grid-cols-8 gap-1.5">
              {ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className="rounded-[9px] border text-base"
                  style={{
                    aspectRatio: "1 / 1",
                    background:
                      icon === ic
                        ? `${color}33`
                        : "var(--sf-surface-2)",
                    borderColor:
                      icon === ic ? `${color}80` : "var(--sf-border)",
                    color: "var(--sf-text)",
                  }}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <div className="sf-eyebrow mb-2.5">Color</div>
            <div className="flex flex-wrap gap-2">
              {HABIT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-7 w-7 rounded-full p-0"
                  style={{
                    background: c,
                    boxShadow:
                      color === c
                        ? `0 0 0 2px var(--sf-bg), 0 0 0 4px ${c}`
                        : "none",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Type */}
          <div>
            <div className="sf-eyebrow mb-2.5">Type</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  v: "binary" as const,
                  l: "Yes / No",
                  s: "Did you do it?",
                },
                {
                  v: "quantity" as const,
                  l: "Quantity",
                  s: "8 glasses, 5 reps…",
                },
                {
                  v: "duration" as const,
                  l: "Duration",
                  s: "30 min, 1 hour…",
                },
              ].map((t) => {
                const active = habitType === t.v;
                return (
                  <button
                    key={t.v}
                    type="button"
                    onClick={() => setHabitType(t.v)}
                    className="rounded-[10px] border p-3 text-left"
                    style={{
                      background: active
                        ? "var(--sf-surface-3)"
                        : "var(--sf-surface-2)",
                      borderColor: active
                        ? "var(--sf-border-strong)"
                        : "var(--sf-border)",
                    }}
                  >
                    <div
                      className="mb-0.5 text-[13px] font-semibold"
                      style={{ color: "var(--sf-text)" }}
                    >
                      {t.l}
                    </div>
                    <div
                      className="text-[11px]"
                      style={{ color: "var(--sf-text-3)" }}
                    >
                      {t.s}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target/Unit */}
          {habitType !== "binary" && (
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="sf-eyebrow">Target</span>
                <input
                  type="number"
                  min={1}
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder="8"
                  className="rounded-lg border px-3.5 py-2.5 text-sm outline-none"
                  style={{
                    background: "rgba(20,17,14,0.6)",
                    borderColor: "var(--sf-border)",
                    color: "var(--sf-text)",
                  }}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="sf-eyebrow">Unit</span>
                <input
                  value={targetUnit}
                  onChange={(e) => setTargetUnit(e.target.value)}
                  placeholder="glasses"
                  className="rounded-lg border px-3.5 py-2.5 text-sm outline-none"
                  style={{
                    background: "rgba(20,17,14,0.6)",
                    borderColor: "var(--sf-border)",
                    color: "var(--sf-text)",
                  }}
                />
              </label>
            </div>
          )}

          {/* Frequency */}
          <div>
            <div className="sf-eyebrow mb-2.5">Frequency</div>
            <div className="mb-2.5 flex gap-1">
              {(["daily", "weekdays", "weekends", "custom"] as Frequency[]).map(
                (f) => {
                  const active = frequency === f;
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFrequency(f)}
                      className="flex-1 rounded-lg border py-1.5 text-xs font-medium capitalize"
                      style={{
                        background: active
                          ? "var(--sf-surface-3)"
                          : "var(--sf-surface-2)",
                        borderColor: active
                          ? "var(--sf-border-strong)"
                          : "var(--sf-border)",
                        color: active
                          ? "var(--sf-text)"
                          : "var(--sf-text-3)",
                      }}
                    >
                      {f}
                    </button>
                  );
                }
              )}
            </div>
            {frequency === "custom" && (
              <div className="flex gap-1">
                {DAY_LETTERS.map((d, i) => {
                  const active = customDays.includes(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        setCustomDays((prev) =>
                          prev.includes(i)
                            ? prev.filter((x) => x !== i)
                            : [...prev, i]
                        )
                      }
                      className="flex-1 rounded-lg border text-xs font-semibold"
                      style={{
                        aspectRatio: "1 / 1",
                        maxHeight: 36,
                        background: active
                          ? "var(--sf-surface-3)"
                          : "var(--sf-surface-2)",
                        borderColor: active
                          ? "var(--sf-border-strong)"
                          : "var(--sf-border)",
                        color: active
                          ? "var(--sf-text)"
                          : "var(--sf-text-3)",
                      }}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {atLimit && (
            <p className="text-xs" style={{ color: "var(--sf-danger)" }}>
              Maximum {MAX_ACTIVE_HABITS} active habits reached.
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex justify-end gap-2 px-6 py-4"
          style={{ borderTop: "1px solid var(--sf-divider)" }}
        >
          <button
            type="button"
            onClick={closeHabitForm}
            className="rounded-lg border px-4 py-2 text-sm font-semibold"
            style={{
              background: "var(--sf-surface-2)",
              borderColor: "var(--sf-border)",
              color: "var(--sf-text)",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || atLimit || !name.trim()}
            className="rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
            style={{ background: "var(--sf-text)", color: "var(--sf-bg)" }}
          >
            {saving
              ? "Saving…"
              : editingHabitId
                ? "Save changes"
                : "Add habit"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
