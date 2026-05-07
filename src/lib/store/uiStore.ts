"use client";

import { create } from "zustand";

interface UiState {
  habitFormOpen: boolean;
  editingHabitId: string | null;
  showConfetti: boolean;
  openHabitForm: (editId?: string) => void;
  closeHabitForm: () => void;
  triggerConfetti: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  habitFormOpen: false,
  editingHabitId: null,
  showConfetti: false,

  openHabitForm: (editId?: string) =>
    set({ habitFormOpen: true, editingHabitId: editId ?? null }),

  closeHabitForm: () =>
    set({ habitFormOpen: false, editingHabitId: null }),

  triggerConfetti: () => {
    set({ showConfetti: true });
    setTimeout(() => set({ showConfetti: false }), 3000);
  },
}));
