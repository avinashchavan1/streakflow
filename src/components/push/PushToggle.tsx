"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buffer;
}

export function PushToggle() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hour, setHour] = useState(20);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(ok);
    if (!ok) return;
    setPermission(Notification.permission);
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => {});
  }, []);

  async function ensureSwRegistered() {
    if (!("serviceWorker" in navigator))
      throw new Error("Service workers not supported");
    let reg = await navigator.serviceWorker.getRegistration("/");
    if (!reg) {
      reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    }
    // Wait until the SW reaches "activated" — required for pushManager.subscribe
    if (!reg.active) {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("Service worker activation timed out")),
          15000
        );
        const sw = reg!.installing ?? reg!.waiting;
        if (!sw) {
          clearTimeout(timeout);
          resolve();
          return;
        }
        sw.addEventListener("statechange", () => {
          if (sw.state === "activated") {
            clearTimeout(timeout);
            resolve();
          }
        });
      });
    }
    // Belt-and-suspenders — wait for global ready promise too
    await navigator.serviceWorker.ready;
    return reg;
  }

  async function enable() {
    if (!VAPID_PUBLIC) {
      toast.error("VAPID key not configured");
      return;
    }
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        toast.error("Notification permission denied");
        return;
      }
      const reg = await ensureSwRegistered();
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: sub.toJSON().keys,
          reminder_hour: hour,
          reminder_tz: tz,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "subscribe failed");
      setSubscribed(true);
      toast.success("Reminders on. Won't break your streak.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to enable");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch(
          `/api/push/subscribe?endpoint=${encodeURIComponent(sub.endpoint)}`,
          { method: "DELETE" }
        );
        await sub.unsubscribe();
      }
      setSubscribed(false);
      toast.success("Reminders off.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to disable");
    } finally {
      setBusy(false);
    }
  }

  if (!supported) return null;

  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        background: "var(--sf-surface)",
        borderColor: "var(--sf-border)",
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Habit reminders</div>
          <div className="mt-0.5 text-xs" style={{ color: "var(--sf-text-3)" }}>
            Get a push at {hour}:00 local time if any habits are still open.
          </div>
        </div>
        <button
          onClick={subscribed ? disable : enable}
          disabled={busy}
          className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
          style={{
            background: subscribed ? "var(--sf-surface-2)" : "var(--sf-text)",
            color: subscribed ? "var(--sf-text)" : "var(--sf-bg)",
            border: subscribed ? "1px solid var(--sf-border)" : "none",
          }}
        >
          {busy ? "…" : subscribed ? "Off" : "On"}
        </button>
      </div>
      {!subscribed && (
        <div className="mt-2 flex items-center gap-2">
          <label className="text-xs" style={{ color: "var(--sf-text-3)" }}>
            Reminder hour
          </label>
          <input
            type="number"
            min={0}
            max={23}
            value={hour}
            onChange={(e) => setHour(Math.max(0, Math.min(23, +e.target.value || 0)))}
            className="w-16 rounded-md border px-2 py-1 text-xs"
            style={{
              background: "rgba(20,17,14,0.6)",
              borderColor: "var(--sf-border)",
              color: "var(--sf-text)",
            }}
          />
        </div>
      )}
      {permission === "denied" && (
        <div
          className="mt-2 text-[11px]"
          style={{ color: "var(--sf-danger)" }}
        >
          Notifications blocked at browser level. Re-enable in site settings.
        </div>
      )}
    </div>
  );
}
