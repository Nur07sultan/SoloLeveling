"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";

import { apiGet, apiPost } from "@/lib/api";
import type { Paginated, WorkoutDto } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/EmptyState";

export default function TrainingPage() {
  const { token } = useAuth();
  const { data, mutate } = useSWR(token ? ["workouts", token] : null, () => apiGet<Paginated<WorkoutDto>>("/workouts/", token!));

  const [type, setType] = useState("boxing");
  const [duration, setDuration] = useState(30);
  const [intensity, setIntensity] = useState(5);
  const [comment, setComment] = useState("");

  const createWorkout = async () => {
    if (!token) return;
    await apiPost<WorkoutDto>("/workouts/", { type, duration, intensity, comment }, token);
    setComment("");
    await mutate();
  };

  const stats = useMemo(() => {
    const list = data?.results ?? [];
    const count = list.length;
    const totalDuration = list.reduce((a, x) => a + x.duration, 0);
    const totalXp = list.reduce((a, x) => a + x.xp_reward, 0);
    return { count, totalDuration, totalXp };
  }, [data]);

  return (
    <div className="grid gap-5">
      <div>
        <div className="text-2xl font-semibold">Тренировки</div>
        <div className="text-sm text-zinc-400">XP = длительность × интенсивность</div>
      </div>

      <Card>
        <CardHeader>
          <div className="text-lg font-semibold">Добавить тренировку</div>
          <div className="text-sm text-zinc-400">boxing / cardio / strength — любые типы</div>
        </CardHeader>
        <CardBody>
          <div className="grid md:grid-cols-4 gap-2">
            <Input value={type} onChange={(e) => setType(e.target.value)} placeholder="type" />
            <Input
              value={String(duration)}
              onChange={(e) => setDuration(Number(e.target.value || 0))}
              placeholder="duration"
              inputMode="numeric"
            />
            <Input
              value={String(intensity)}
              onChange={(e) => setIntensity(Number(e.target.value || 1))}
              placeholder="intensity"
              inputMode="numeric"
            />
            <Button onClick={createWorkout}>Добавить</Button>
          </div>
          <div className="mt-2">
            <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Комментарий" />
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Всего тренировок" value={String(stats.count)} />
        <Stat label="Минут суммарно" value={String(stats.totalDuration)} />
        <Stat label="XP суммарно" value={String(stats.totalXp)} />
      </div>

      {(data?.results?.length ?? 0) === 0 ? (
        <EmptyState title="Тренировок пока нет" description="Добавь первую тренировку и получи XP." />
      ) : (
        <Card>
          <CardHeader>
            <div className="text-lg font-semibold">История</div>
            <div className="text-sm text-zinc-400">Последние записи</div>
          </CardHeader>
          <CardBody>
            <div className="grid gap-2">
              {data!.results.map((w) => (
                <div key={w.id} className="flex items-center justify-between rounded-xl border border-white/10 p-3">
                  <div>
                    <div className="text-sm font-semibold">{w.type}</div>
                    <div className="text-xs text-zinc-400">
                      {w.duration} мин × {w.intensity} = {w.xp_reward} XP
                      {w.comment ? ` • ${w.comment}` : ""}
                    </div>
                  </div>
                  <Badge>{w.date}</Badge>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="mt-1 text-lg font-semibold text-zinc-100">{value}</div>
    </div>
  );
}
