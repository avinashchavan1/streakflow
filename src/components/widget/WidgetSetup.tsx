"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function WidgetSetup() {
  const [key, setKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("widget_keys")
        .select("key")
        .maybeSingle();
      if (data?.key) setKey(data.key);
      setLoading(false);
    }
    load();
  }, []);

  async function generate() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const newKey = crypto.randomUUID();
    const { error } = await supabase
      .from("widget_keys")
      .upsert({ user_id: user.id, key: newKey }, { onConflict: "user_id" });
    if (error) {
      toast.error(error.message);
      return;
    }
    setKey(newKey);
    toast.success("Widget key generated.");
  }

  async function revoke() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("widget_keys").delete().eq("user_id", user.id);
    setKey(null);
    toast.success("Widget key revoked.");
  }

  const origin =
    typeof window === "undefined" ? "" : window.location.origin;
  const feedUrl = key ? `${origin}/api/widget/${key}` : "";
  const script = key
    ? `// StreakFlow widget — paste into Scriptable
const url = "${feedUrl}";
const data = await new Request(url).loadJSON();
const w = new ListWidget();
w.backgroundColor = new Color("#100e0c");
const title = w.addText("Today");
title.font = Font.semiboldSystemFont(11);
title.textColor = new Color("#7a7268");
w.addSpacer(4);
const pct = w.addText(\`\${data.completionPct}%\`);
pct.font = Font.boldSystemFont(36);
pct.textColor = new Color("#f5efe7");
w.addSpacer(2);
const done = w.addText(\`\${data.doneCount}/\${data.totalCount} done\`);
done.font = Font.systemFont(12);
done.textColor = new Color("#b8aea2");
if (data.topStreak > 0) {
  w.addSpacer(6);
  const streak = w.addText(\`🔥 \${data.topStreak}d streak\`);
  streak.font = Font.systemFont(11);
  streak.textColor = new Color("#ff5e3a");
}
Script.setWidget(w);
Script.complete();`
    : "";

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
          <div className="text-sm font-semibold">iOS widget (Scriptable)</div>
          <div
            className="mt-0.5 text-xs"
            style={{ color: "var(--sf-text-3)" }}
          >
            Free Scriptable app + paste script. Shows today's ring on your home screen.
          </div>
        </div>
        <button
          onClick={key ? revoke : generate}
          disabled={loading}
          className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
          style={{
            background: key ? "var(--sf-surface-2)" : "var(--sf-text)",
            color: key ? "var(--sf-text)" : "var(--sf-bg)",
            border: key ? "1px solid var(--sf-border)" : "none",
          }}
        >
          {loading ? "…" : key ? "Revoke" : "Generate"}
        </button>
      </div>
      {key && (
        <>
          <div
            className="mb-2 mt-3 text-[11px]"
            style={{ color: "var(--sf-text-3)" }}
          >
            1. Install Scriptable from App Store. 2. New script. 3. Paste:
          </div>
          <textarea
            readOnly
            value={script}
            className="h-32 w-full rounded-md border p-2 font-mono text-[11px]"
            style={{
              background: "rgba(20,17,14,0.6)",
              borderColor: "var(--sf-border)",
              color: "var(--sf-text)",
            }}
            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(script);
              toast.success("Copied.");
            }}
            className="mt-2 rounded-md px-3 py-1 text-[11px] font-semibold"
            style={{
              background: "var(--sf-surface-2)",
              border: "1px solid var(--sf-border)",
              color: "var(--sf-text)",
            }}
          >
            Copy script
          </button>
        </>
      )}
    </div>
  );
}
