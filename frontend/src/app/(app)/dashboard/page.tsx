"use client";

import useSWR from "swr";
import { useRouter } from "next/navigation";

import { apiGet } from "@/lib/api";
import type { DashboardDto, TaskDto } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/lib/auth";

const fetcher = (token: string) => apiGet<DashboardDto>("/dashboard/", token);
const tasksFetcher = (token: string) => apiGet<{ count: number; next: string | null; previous: string | null; results: TaskDto[] }>("/tasks/?page_size=5", token);

export default function DashboardPage() {
  const router = useRouter();
  const { token, profile } = useAuth();

  const { data } = useSWR(token ? ["dashboard", token] : null, () => fetcher(token!));
  const { data: tasks } = useSWR(token ? ["tasks", token] : null, () => tasksFetcher(token!));

  const level = data?.level ?? 0;
  const xp = data?.xp ?? 0;
  const xpToNext = Math.max(100, level * 100 || 100);
  const progress = Math.round((xp / xpToNext) * 100);

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-semibold">Панель</div>
          <div className="text-sm text-zinc-400">Система активна. Начни прокачку.</div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push("/quests")}>Добавить квест</Button>
          <Button variant="ghost" onClick={() => router.push("/training")}>
            Добавить тренировку
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500" />
              <div>
                <div className="text-lg font-semibold">{profile?.nickname ?? "Игрок"}</div>
                <div className="text-sm text-zinc-400">Уровень {level}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge>Ранг {data?.rank ?? "E"}</Badge>
              <Badge>DevScore {data?.dev_score ?? 0}</Badge>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>XP {xp} / {xpToNext}</span>
              <span>{progress}%</span>
            </div>
            <Progress className="mt-2" value={progress} />
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Баланс" value={String(data?.balance ?? 0)} />
            <Stat label="Тренировок на неделе" value={String(data?.workouts_this_week ?? 0)} />
            <Stat label="Квестов выполнено" value={String(data?.tasks_done ?? 0)} />
            <Stat label="Навыков в процессе" value={String(data?.skills_in_progress ?? 0)} />
          </div>
        </CardBody>
      </Card>

      <div className="grid md:grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <div className="text-lg font-semibold">Активные квесты</div>
            <div className="text-sm text-zinc-400">Твои ближайшие цели</div>
          </CardHeader>
          <CardBody>
            {tasks?.results?.length ? (
              <div className="grid gap-2">
                {tasks.results.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-xl border border-white/10 p-3">
                    <div>
                      <div className="text-sm font-semibold">{t.title}</div>
                      <div className="text-xs text-zinc-400">
                        Сложность {t.difficulty} • Награда {t.xp_reward} XP • Статус {t.status}
                      </div>
                    </div>
                    <Button variant="ghost" onClick={() => router.push(`/quests?focus=${t.id}`)}>
                      Открыть
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Система инициализирована. Начни первый квест."
                description="Пока здесь пусто — создай задачу и получай XP."
                action={{ label: "Создать первый квест", onClick: () => router.push("/quests") }}
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="text-lg font-semibold">Быстрые действия</div>
            <div className="text-sm text-zinc-400">Добавляй прогресс за секунды</div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => router.push("/quests")}>Добавить квест</Button>
              <Button onClick={() => router.push("/training")} variant="ghost">
                Добавить тренировку
              </Button>
              <Button onClick={() => router.push("/finance")} variant="ghost">
                Добавить расход
              </Button>
              <Button onClick={() => router.push("/skills")} variant="ghost">
                Добавить навык
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
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
