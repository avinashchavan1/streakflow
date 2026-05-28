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

function formatHour(h: number): string {
  if (h === 0) return "12:00 AM";
  if (h === 12) return "12:00 PM";
  if (h < 12) return `${h}:00 AM`;
  return `${h - 12}:00 PM`;
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: formatHour(i),
}));

export function PushToggle() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hour, setHour] = useState(20);
  const [savedHour, setSavedHour] = useState(20);
  const [tz, setTz] = useState("UTC");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(ok);
    if (!ok) return;
    setPermission(Notification.permission);
    setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
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
    await navigator.serviceWorker.ready;
    return reg;
  }

  async function postSubscription(
    endpoint: string,
    keys: { p256dh: string; auth: string },
    reminderHour: number
  ) {
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint,
        keys,
        reminder_hour: reminderHour,
        reminder_tz: tz,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "subscribe failed");
    }
  }

  async function enable() {
    if (!VAPID_PUBLIC) {
      toast.error("Push not configured. Contact admin.");
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
      await postSubscription(
        sub.endpoint,
        sub.toJSON().keys as { p256dh: string; auth: string },
        hour
      );
      setSubscribed(true);
      setSavedHour(hour);
      toast.success(`Reminders on. We'll ping you at ${formatHour(hour)}.`);
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

  async function saveHour() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      if (!sub) throw new Error("Not subscribed");
      await postSubscription(
        sub.endpoint,
        sub.toJSON().keys as { p256dh: string; auth: string },
        hour
      );
      setSavedHour(hour);
      toast.success(`Reminder time updated to ${formatHour(hour)}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  if (!supported) {
    return (
      <div
        className="rounded-2xl border p-4"
        style={{
          background: "var(--sf-surface)",
          borderColor: "var(--sf-border)",
        }}
      >
        <div className="text-sm font-semibold">Habit reminders</div>
        <div
          className="mt-1 text-xs"
          style={{ color: "var(--sf-text-3)" }}
        >
          Not supported in this browser. iOS users: install as PWA via
          Safari (Share → Add to Home Screen) to enable push.
        </div>
      </div>
    );
  }

  const hourChanged = subscribed && hour !== savedHour;
  const isOn = subscribed;

  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        background: "var(--sf-surface)",
        borderColor: "var(--sf-border)",
      }}
    >
      {/* Title row + toggle switch */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">Habit reminders</div>
          <div
            className="mt-0.5 text-xs"
            style={{ color: "var(--sf-text-3)" }}
          >
            {isOn
              ? `Active. We'll ping you at ${formatHour(savedHour)} ${tz} if anything's still open.`
              : "Get a single push when you've still got habits to log."}
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isOn}
          onClick={isOn ? disable : enable}
          disabled={busy || permission === "denied"}
          className="relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50"
          style={{
            background: isOn
              ? "var(--sf-success)"
              : "var(--sf-surface-3)",
            border: `1px solid ${isOn ? "var(--sf-success)" : "var(--sf-border)"}`,
          }}
        >
          <span
            className="absolute top-[2px] block h-[22px] w-[22px] rounded-full transition-transform"
            style={{
              background: "#ffffff",
              transform: isOn ? "translateX(22px)" : "translateX(2px)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            }}
          />
          {busy && (
            <span
              className="absolute inset-0 flex items-center justify-center text-[10px]"
              style={{ color: isOn ? "white" : "var(--sf-text-3)" }}
            >
              …
            </span>
          )}
        </button>
      </div>

      {/* Time picker */}
      <div
        className="mt-4 border-t pt-4"
        style={{ borderColor: "var(--sf-divider)" }}
      >
        <label
          htmlFor="reminder-hour"
          className="sf-eyebrow mb-2 block"
        >
          Reminder time
        </label>
        <div className="flex items-center gap-2">
          <select
            id="reminder-hour"
            value={hour}
            onChange={(e) => setHour(parseInt(e.target.value, 10))}
            disabled={busy}
            className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none disabled:opacity-60"
            style={{
              background: "rgba(20,17,14,0.6)",
              borderColor: "var(--sf-border)",
              color: "var(--sf-text)",
            }}
          >
            {HOUR_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {hourChanged && (
            <button
              type="button"
              onClick={saveHour}
              disabled={busy}
              className="shrink-0 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
              style={{
                background: "var(--sf-text)",
                color: "var(--sf-bg)",
              }}
            >
              {busy ? "Saving…" : "Save"}
            </button>
          )}
        </div>
        <div
          className="mt-1.5 text-[11px]"
          style={{ color: "var(--sf-text-3)" }}
        >
          {tz} · 24h: {hour.toString().padStart(2, "0")}:00
        </div>
      </div>

      {/* Permission denied — guidance */}
      {permission === "denied" && (
        <div
          className="mt-4 rounded-lg border p-3"
          style={{
            background: "rgba(255,69,58,0.08)",
            borderColor: "rgba(255,69,58,0.2)",
          }}
        >
          <div
            className="text-xs font-semibold"
            style={{ color: "var(--sf-danger)" }}
          >
            Notifications blocked
          </div>
          <div
            className="mt-1 text-[11px]"
            style={{ color: "var(--sf-text-2)" }}
          >
            You denied permission at the browser level. Click the padlock /
            site-info icon in your address bar → Notifications → Allow, then
            refresh.
          </div>
        </div>
      )}
    </div>
  );
}
