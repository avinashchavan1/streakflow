"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useGamificationStore } from "@/lib/store/gamificationStore";
import { getXpProgress } from "@/lib/utils/xp";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";

export function Header() {
  const router = useRouter();
  const { profile, fetchProfile } = useGamificationStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const xpInfo = profile ? getXpProgress(profile.xp) : null;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header
      className="flex items-center justify-between border-b px-4 py-3 lg:px-8 lg:py-4"
      style={{ borderColor: "var(--sf-border)" }}
    >
      {/* Mobile logo */}
      <div className="flex items-center gap-2 lg:hidden">
        <div
          className="relative h-6 w-6 rounded-md"
          style={{
            background:
              "conic-gradient(from 90deg, var(--sf-ring-move), var(--sf-ring-fuel), var(--sf-ring-mind), var(--sf-ring-move))",
          }}
        >
          <div
            className="absolute inset-1 rounded-sm"
            style={{ background: "var(--sf-bg)" }}
          />
        </div>
        <div className="text-sm font-semibold tracking-tight">StreakFlow</div>
      </div>

      <div className="ml-auto flex items-center gap-3 sm:gap-4">
        {/* Mobile-only XP pill (sidebar hidden) */}
        {xpInfo && (
          <div
            className="flex items-center gap-2 rounded-full border px-2.5 py-1 lg:hidden"
            style={{
              background: "var(--sf-surface-2)",
              borderColor: "var(--sf-border)",
            }}
          >
            <span className="sf-num text-[11px] font-semibold">
              Lv {xpInfo.currentLevel.level}
            </span>
            <div
              className="h-1 w-12 overflow-hidden rounded-full"
              style={{ background: "var(--sf-surface-3)" }}
            >
              <div
                className="h-full rounded-full transition-[width] duration-700"
                style={{
                  width: `${xpInfo.progressPercent}%`,
                  background:
                    "linear-gradient(90deg, var(--sf-ring-move), var(--sf-ring-fuel))",
                }}
              />
            </div>
            <span
              className="sf-num text-[11px]"
              style={{ color: "var(--sf-text-3)" }}
            >
              {profile?.xp ?? 0}
            </span>
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--sf-surface-2)]">
            <Avatar className="h-9 w-9">
              <AvatarFallback
                className="text-sm font-semibold text-white"
                style={{
                  background: "linear-gradient(135deg, #ff5e3a, #ffb340)",
                }}
              >
                {profile?.display_name?.charAt(0)?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem disabled>
              <User className="mr-2 h-4 w-4" />
              {profile?.display_name ?? "User"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
