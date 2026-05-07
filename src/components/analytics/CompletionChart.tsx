"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, subDays, getDay } from "date-fns";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface DayAvg {
  day: string;
  rate: number;
}

export function CompletionChart() {
  const [data, setData] = useState<DayAvg[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const startDate = format(subDays(new Date(), 90), "yyyy-MM-dd");

      const { data: logs } = await supabase
        .from("habit_logs")
        .select("log_date, completed")
        .gte("log_date", startDate);

      const dayCounts: Record<number, { total: number; completed: number }> = {};
      for (let i = 0; i < 7; i++) dayCounts[i] = { total: 0, completed: 0 };

      for (const log of logs ?? []) {
        const dayIdx = getDay(new Date(log.log_date));
        dayCounts[dayIdx].total++;
        if (log.completed) dayCounts[dayIdx].completed++;
      }

      const chartData = DAY_NAMES.map((name, i) => ({
        day: name,
        rate: dayCounts[i].total > 0
          ? Math.round((dayCounts[i].completed / dayCounts[i].total) * 100)
          : 0,
      }));

      setData(chartData);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <Card className="glass-card p-4 h-64 animate-pulse" />;
  }

  return (
    <Card className="glass-card p-4">
      <h3 className="font-semibold mb-3">Completion by Day</h3>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2D2D3F" />
            <XAxis dataKey="day" stroke="#A0A0B8" fontSize={12} />
            <YAxis stroke="#A0A0B8" fontSize={12} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1A1A24",
                border: "1px solid #2D2D3F",
                borderRadius: 8,
              }}
              formatter={(value) => [`${value}%`, "Completion"]}
            />
            <Bar dataKey="rate" fill="#6C5CE7" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
