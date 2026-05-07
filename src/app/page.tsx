import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Flame, Trophy, BarChart3, Sparkles, Zap, Target } from "lucide-react";

const FEATURES = [
  { icon: Flame, title: "Streak Tracking", desc: "Build momentum with consecutive day tracking and streak freezes" },
  { icon: Zap, title: "XP & Levels", desc: "Earn XP for completions with streak multipliers. Level up from Starter to Transcendent" },
  { icon: Trophy, title: "Badges", desc: "Unlock 15+ achievements for milestones, streaks, and special feats" },
  { icon: BarChart3, title: "Analytics", desc: "Heatmap calendar, completion charts, and habit correlation insights" },
  { icon: Sparkles, title: "AI Insights", desc: "Weekly AI-powered analysis of your patterns, predictions, and suggestions" },
  { icon: Target, title: "Flexible Habits", desc: "Binary, quantity, or duration habits with daily, weekday, or custom schedules" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-xl font-bold">
          <span className="text-primary">Streak</span>Flow
        </h1>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="flex flex-col items-center justify-center text-center px-6 py-24 lg:py-32">
          <div className="animate-fade-in">
            <h2 className="text-4xl lg:text-6xl font-bold max-w-3xl leading-tight">
              Build habits that{" "}
              <span className="text-primary">stick</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              Gamified habit tracking with streaks, XP, badges, analytics, and
              AI-powered insights. Turn your daily routine into a game.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link href="/signup">
                <Button size="lg" className="text-base px-8">
                  Start Free
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-base px-8">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-12 flex items-center gap-6 text-sm text-muted-foreground">
            <span>🔥 Streaks</span>
            <span>⚡ XP System</span>
            <span>🏆 Badges</span>
            <span>📊 Analytics</span>
            <span>🤖 AI Insights</span>
          </div>
        </section>

        <section className="px-6 py-16 max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-12">
            Everything you need to build better habits
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="glass-card rounded-xl p-6 transition-all hover:ring-1 hover:ring-primary/20"
              >
                <f.icon className="h-8 w-8 text-primary mb-3" />
                <h4 className="font-semibold mb-1">{f.title}</h4>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 py-16 text-center">
          <h3 className="text-2xl font-bold mb-4">Level up your life</h3>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Join and start tracking your habits today. From Starter to Transcendent.
          </p>
          <Link href="/signup">
            <Button size="lg" className="text-base px-10">
              Create Account
            </Button>
          </Link>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-6 text-center text-sm text-muted-foreground">
        StreakFlow — Built with Next.js, Supabase, and Claude AI
      </footer>
    </div>
  );
}
