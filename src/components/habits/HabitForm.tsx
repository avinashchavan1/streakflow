"use client";

import { useState, useEffect } from "react";
import { useHabitStore } from "@/lib/store/habitStore";
import { useUiStore } from "@/lib/store/uiStore";
import { HABIT_COLORS, HABIT_TEMPLATES, MAX_ACTIVE_HABITS } from "@/lib/constants/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { HabitType, Frequency } from "@/types";

const EMOJIS = ["✅", "💧", "🏋️", "📚", "🧘", "💻", "✍️", "🏃", "😴", "🎵", "🥗", "💊", "🧹", "📱", "🎨"];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function HabitForm() {
  const { habits, addHabit, updateHabit } = useHabitStore();
  const { habitFormOpen, editingHabitId, closeHabitForm } = useUiStore();

  const editingHabit = editingHabitId
    ? habits.find((h) => h.id === editingHabitId)
    : null;

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("✅");
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
  }, [editingHabit]);

  function resetForm() {
    setName("");
    setIcon("✅");
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    const data = {
      name: name.trim(),
      icon,
      color,
      habit_type: habitType,
      target_value: habitType !== "binary" ? parseFloat(targetValue) || null : null,
      target_unit: habitType !== "binary" ? targetUnit || null : null,
      frequency,
      custom_days: frequency === "custom" ? customDays : null,
    };

    if (editingHabitId) {
      await updateHabit(editingHabitId, data);
    } else {
      await addHabit(data);
    }

    setSaving(false);
    closeHabitForm();
    resetForm();
  }

  const canAdd = !editingHabitId && habits.filter((h) => h.is_active !== false).length >= MAX_ACTIVE_HABITS;

  return (
    <Dialog open={habitFormOpen} onOpenChange={(open) => !open && closeHabitForm()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingHabitId ? "Edit Habit" : "New Habit"}
          </DialogTitle>
        </DialogHeader>

        {!editingHabitId && (
          <div className="mb-4">
            <Label className="text-sm text-muted-foreground mb-2 block">
              Quick templates
            </Label>
            <div className="flex flex-wrap gap-2">
              {HABIT_TEMPLATES.map((t, i) => (
                <Button
                  key={t.name}
                  size="sm"
                  variant="outline"
                  onClick={() => applyTemplate(i)}
                  className="text-xs"
                >
                  {t.icon} {t.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 50))}
              placeholder="e.g. Morning run"
              required
              maxLength={50}
            />
            <span className="text-xs text-muted-foreground">{name.length}/50</span>
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setIcon(e)}
                  className={cn(
                    "h-10 w-10 rounded-lg text-xl flex items-center justify-center transition-all",
                    icon === e ? "bg-primary/20 ring-2 ring-primary" : "bg-muted hover:bg-muted/80"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {HABIT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-8 w-8 rounded-full transition-all",
                    color === c && "ring-2 ring-offset-2 ring-offset-background ring-white"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={habitType} onValueChange={(v) => setHabitType(v as HabitType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="binary">Yes/No (Binary)</SelectItem>
                <SelectItem value="quantity">Quantity (e.g., 8 glasses)</SelectItem>
                <SelectItem value="duration">Duration (e.g., 30 minutes)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {habitType !== "binary" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Target</Label>
                <Input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder="e.g. 8"
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input
                  value={targetUnit}
                  onChange={(e) => setTargetUnit(e.target.value)}
                  placeholder="e.g. glasses"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Every day</SelectItem>
                <SelectItem value="weekdays">Weekdays only</SelectItem>
                <SelectItem value="weekends">Weekends only</SelectItem>
                <SelectItem value="custom">Custom days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {frequency === "custom" && (
            <div className="flex gap-2">
              {DAYS.map((day, i) => (
                <button
                  key={day}
                  type="button"
                  onClick={() =>
                    setCustomDays((prev) =>
                      prev.includes(i)
                        ? prev.filter((d) => d !== i)
                        : [...prev, i]
                    )
                  }
                  className={cn(
                    "h-10 w-10 rounded-lg text-xs font-medium transition-all",
                    customDays.includes(i)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
          )}

          {canAdd && (
            <p className="text-sm text-danger">
              Maximum {MAX_ACTIVE_HABITS} active habits reached.
            </p>
          )}

          <Button type="submit" className="w-full" disabled={saving || canAdd}>
            {saving ? "Saving..." : editingHabitId ? "Update Habit" : "Add Habit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
