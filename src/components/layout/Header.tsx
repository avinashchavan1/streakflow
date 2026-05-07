"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useGamificationStore } from "@/lib/store/gamificationStore";
import { getXpProgress } from "@/lib/utils/xp";
import { Button } from "@/components/ui/button";
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
    <header className="flex items-center justify-between border-b border-border px-4 py-3 lg:px-6">
      <div className="lg:hidden text-lg font-bold">
        <span className="text-primary">Streak</span>Flow
      </div>

      <div className="flex items-center gap-4 ml-auto">
        {xpInfo && (
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <span className="font-mono text-primary font-bold">
              Lv.{xpInfo.currentLevel.level}
            </span>
            <span className="text-muted-foreground">
              {xpInfo.currentLevel.name}
            </span>
            <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${xpInfo.progressPercent}%` }}
              />
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {profile?.xp} XP
            </span>
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-accent">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary/20 text-primary text-sm">
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
