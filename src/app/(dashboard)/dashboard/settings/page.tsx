"use client";

import { PushToggle } from "@/components/push/PushToggle";
import { WidgetSetup } from "@/components/widget/WidgetSetup";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-7">
        <div className="sf-eyebrow">Account</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-[32px]">
          Settings
        </h1>
      </div>

      <div className="flex flex-col gap-4">
        <PushToggle />
        <WidgetSetup />
      </div>
    </div>
  );
}
