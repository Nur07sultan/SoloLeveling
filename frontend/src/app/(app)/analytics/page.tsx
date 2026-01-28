"use client";

import useSWR from "swr";
import { useMemo } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { apiGet } from "@/lib/api";
import type { DashboardDto, Paginated, SkillDto, TaskDto } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

type AnalyticsSummaryDto = {
  xp_by_day: Array<{ date: string; xp: number }>;
  xp_by_kind: Array<{ kind: string; xp: number }>;
  streak_current: number;
  streak_best_30d: number;
};

export default function AnalyticsPage() {
  const { token } = useAuth();

  const { data: dashboard } = useSWR(token ? ["dashboard", token] : null, () => apiGet<DashboardDto>("/dashboard/", token!));
  const { data: tasks } = useSWR(token ? ["tasks", token] : null, () => apiGet<Paginated<TaskDto>>("/tasks/", token!));
  const { data: skills } = useSWR(token ? ["skills", token] : null, () => apiGet<Paginated<SkillDto>>("/skills/", token!));
  const { data: summary } = useSWR(token ? ["analytics-summary", token] : null, () => apiGet<AnalyticsSummaryDto>("/analytics/summary/", token!));

  const chartData = useMemo(() => {
    const list = summary?.xp_by_day ?? [];
    return list.slice(-14).map((x) => ({ date: x.date, xp: x.xp }));
  }, [summary]);

  return (
    <div className="grid gap-5">
      <div>
        <div className="text-2xl font-semibold">Аналитика</div>
        <div className="text-sm text-zinc-400">Графики прогресса (MVP)</div>
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        <Kpi label="Уровень" value={String(dashboard?.level ?? 0)} />
        <Kpi label="XP" value={String(dashboard?.xp ?? 0)} />
        <Kpi label="Квестов" value={String(tasks?.results?.length ?? 0)} />
        <Kpi label="Навыков" value={String(skills?.results?.length ?? 0)} />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <Kpi label="Streak сейчас" value={String(summary?.streak_current ?? 0)} />
        <Kpi label="Лучший за 30 дней" value={String(summary?.streak_best_30d ?? 0)} />
      </div>

      <Card>
        <CardHeader>
          <div className="text-lg font-semibold">XP по дням (по событиям)</div>
          <div className="text-sm text-zinc-400">Последние 14 дней</div>
        </CardHeader>
        <CardBody>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} />
                <YAxis stroke="#a1a1aa" fontSize={12} />
                <Tooltip contentStyle={{ background: "#0b0b12", border: "1px solid rgba(255,255,255,0.1)" }} />
                <Line type="monotone" dataKey="xp" stroke="#a78bfa" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="mt-1 text-lg font-semibold text-zinc-100">{value}</div>
    </div>
  );
}
