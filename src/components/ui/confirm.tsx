"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

export interface ConfirmDialogState {
  open: boolean;
  options: ConfirmOptions;
  resolve: ((value: boolean) => void) | null;
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmDialogState>({
    open: false,
    options: { title: "" },
    resolve: null,
  });

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ open: true, options, resolve });
    });
  }, []);

  const handle = (value: boolean) => {
    state.resolve?.(value);
    setState((s) => ({ ...s, open: false, resolve: null }));
  };

  const dialog = (
    <Dialog
      open={state.open}
      onOpenChange={(open) => {
        if (!open) handle(false);
      }}
    >
      <DialogContent
        className="sm:max-w-[400px]"
        showCloseButton={false}
        style={{
          background: "var(--sf-surface)",
          border: "1px solid var(--sf-border-strong)",
        }}
      >
        <DialogHeader>
          <DialogTitle>{state.options.title}</DialogTitle>
          {state.options.description && (
            <DialogDescription style={{ color: "var(--sf-text-3)" }}>
              {state.options.description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => handle(false)}
            className="rounded-lg border px-4 py-2 text-sm font-semibold"
            style={{
              background: "var(--sf-surface-2)",
              borderColor: "var(--sf-border)",
              color: "var(--sf-text)",
            }}
          >
            {state.options.cancelLabel ?? "Cancel"}
          </button>
          <button
            type="button"
            onClick={() => handle(true)}
            className="rounded-lg px-4 py-2 text-sm font-semibold"
            style={{
              background: state.options.destructive
                ? "var(--sf-danger)"
                : "var(--sf-text)",
              color: state.options.destructive
                ? "#fff"
                : "var(--sf-bg)",
            }}
          >
            {state.options.confirmLabel ?? "Confirm"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return { confirm, dialog };
}
