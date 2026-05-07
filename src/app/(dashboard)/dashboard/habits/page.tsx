"use client";

import { useEffect } from "react";
import { useHabitStore } from "@/lib/store/habitStore";
import { useUiStore } from "@/lib/store/uiStore";
import { HabitForm } from "@/components/habits/HabitForm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HabitsPage() {
  const { habits, loading, fetchHabits, deleteHabit, reorderHabits } = useHabitStore();
  const { openHabitForm } = useUiStore();

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const reordered = [...habits];
    [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];
    reorderHabits(reordered);
  }

  function handleMoveDown(index: number) {
    if (index === habits.length - 1) return;
    const reordered = [...habits];
    [reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]];
    reorderHabits(reordered);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Habits</h1>
          <p className="text-muted-foreground">
            {habits.length} active habit{habits.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => openHabitForm()} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : habits.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-bold mb-2">No habits yet</h3>
          <p className="text-muted-foreground mb-6">Create your first habit to get started.</p>
          <Button onClick={() => openHabitForm()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Habit
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {habits.map((habit, index) => (
            <Card key={habit.id} className="glass-card p-3 flex items-center gap-3">
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => handleMoveUp(index)}
                  className="text-muted-foreground hover:text-foreground p-0.5"
                  disabled={index === 0}
                >
                  <GripVertical className="h-4 w-4" />
                </button>
              </div>

              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg"
                style={{ backgroundColor: `${habit.color}20` }}
              >
                {habit.icon}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">{habit.name}</h3>
                <p className="text-xs text-muted-foreground capitalize">
                  {habit.habit_type} • {habit.frequency}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => openHabitForm(habit.id)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-danger hover:text-danger"
                  onClick={() => deleteHabit(habit.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <HabitForm />
    </div>
  );
}
