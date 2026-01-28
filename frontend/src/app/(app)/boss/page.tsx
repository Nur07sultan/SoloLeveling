"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";

import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";

type BossDto = {
  id: number;
  name: string;
  rank: string;
  hp_max: number;
  hp_current: number;
  status: "active" | "defeated";
  started_at: string;
  defeated_at: string | null;
};

type BossAttackResultDto = {
  boss: BossDto;
  damage: number;
  events_used: number;
  total_damage: number;
  defeated: boolean;
  bonus_xp: number;
};

export default function BossPage() {
  const { token } = useAuth();

  const { data: boss, mutate } = useSWR(token ? ["boss", token] : null, () => apiGet<BossDto>("/boss/", token!));

  const [last, setLast] = useState<BossAttackResultDto | null>(null);
  const [loading, setLoading] = useState(false);

  const percent = useMemo(() => {
    if (!boss) return 0;
    if (boss.hp_max <= 0) return 0;
    return Math.round((boss.hp_current / boss.hp_max) * 100);
  }, [boss]);

  const attack = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiPost<BossAttackResultDto>("/boss/attack/", { max_events: 200 }, token);
      setLast(res);
      await mutate();
    } finally {
      setLoading(false);
    }
  };

  const nextBoss = async () => {
    if (!token) return;
    setLoading(true);
    try {
      await apiPost<BossDto>("/boss/next/", {}, token);
      setLast(null);
      await mutate();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-5">
      <div>
        <div className="text-2xl font-semibold">Боссы</div>
        <div className="text-sm text-zinc-400">Поглощай честный XP и превращай его в урон</div>
      </div>

      <Card>
        <CardHeader>
          <div className="text-lg font-semibold">Активный босс</div>
          <div className="text-sm text-zinc-400">Урон считается из XP-событий (tasks/workouts/focus/skills/logs)</div>
        </CardHeader>
        <CardBody>
          {!boss ? (
            <div className="text-sm text-zinc-400">Загрузка…</div>
          ) : (
            <div className="grid gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xl font-semibold">{boss.name}</div>
                  <div className="mt-1 text-xs text-zinc-400">Ранг: {boss.rank}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{boss.status === "active" ? "ACTIVE" : "DEFEATED"}</Badge>
                  <Badge>
                    {boss.hp_current}/{boss.hp_max} HP
                  </Badge>
                </div>
              </div>

              <Progress value={percent} />

              <div className="flex flex-wrap gap-2">
                <Button onClick={attack} disabled={loading || boss.status !== "active"}>
                  Поглотить XP → Атака
                </Button>
                <Button variant="ghost" onClick={nextBoss} disabled={loading}>
                  Следующий босс
                </Button>
              </div>

              {last ? (
                <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-200">
                  <div>Урон: <span className="font-semibold">{last.damage}</span> (событий: {last.events_used})</div>
                  <div>Всего урона по боссу: <span className="font-semibold">{last.total_damage}</span></div>
                  {last.defeated ? (
                    <div className="mt-1">Победа! Бонус: <span className="font-semibold">{last.bonus_xp} XP</span></div>
                  ) : null}
                </div>
              ) : (
                <div className="text-sm text-zinc-400">Нажми “Поглотить XP”, чтобы конвертировать накопленные события в урон.</div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
