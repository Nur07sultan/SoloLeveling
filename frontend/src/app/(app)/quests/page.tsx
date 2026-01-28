"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";

import { apiGet, apiPost } from "@/lib/api";
import type { Paginated, ProjectDto, TaskDto } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/EmptyState";

export default function QuestsPage() {
  const { token } = useAuth();

  const { data: projects, mutate: mutateProjects } = useSWR(token ? ["projects", token] : null, () =>
    apiGet<Paginated<ProjectDto>>("/projects/", token!)
  );
  const { data: tasks, mutate: mutateTasks } = useSWR(token ? ["tasks", token] : null, () =>
    apiGet<Paginated<TaskDto>>("/tasks/", token!)
  );

  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState(3);
  const [type, setType] = useState<TaskDto["type"]>("main");

  const projectId = projects?.results?.[0]?.id;

  const byStatus = useMemo(() => {
    const list = tasks?.results ?? [];
    return {
      todo: list.filter((t) => t.status !== "done"),
      done: list.filter((t) => t.status === "done"),
    };
  }, [tasks]);

  const ensureProject = async () => {
    if (!token) return;
    if (projectId) return projectId;
    const p = await apiPost<ProjectDto>("/projects/", { name: "Главный проект", is_commercial: false }, token);
    await mutateProjects();
    return p.id;
  };

  const createQuest = async () => {
    if (!token) return;
    if (!title.trim()) return;
    const pid = await ensureProject();
    await apiPost<TaskDto>("/tasks/", {
      project: pid,
      title,
      type,
      difficulty,
      status: "todo",
      deadline: null,
      notes: "",
    }, token);
    setTitle("");
    await mutateTasks();
  };

  const completeQuest = async (id: number) => {
    if (!token) return;
    await apiPost<TaskDto>(`/tasks/${id}/complete/`, {}, token);
    await mutateTasks();
  };

  return (
    <div className="grid gap-5">
      <div>
        <div className="text-2xl font-semibold">Квесты</div>
        <div className="text-sm text-zinc-400">Задачи, которые дают XP</div>
      </div>

      <Card>
        <CardHeader>
          <div className="text-lg font-semibold">Добавить квест</div>
          <div className="text-sm text-zinc-400">Создаёт проект автоматически при первом запуске</div>
        </CardHeader>
        <CardBody>
          <div className="grid md:grid-cols-4 gap-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название квеста" />
            <select
              className="rounded-xl bg-black/40 px-3 py-2 text-sm border border-white/10"
              value={type}
              onChange={(e) => setType(e.target.value as TaskDto["type"])}
            >
              <option value="daily">Daily</option>
              <option value="main">Main</option>
              <option value="internship">Internship</option>
            </select>
            <select
              className="rounded-xl bg-black/40 px-3 py-2 text-sm border border-white/10"
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map((d) => (
                <option key={d} value={d}>
                  Сложность {d}
                </option>
              ))}
            </select>
            <Button onClick={createQuest}>Создать</Button>
          </div>
        </CardBody>
      </Card>

      {(tasks?.results?.length ?? 0) === 0 ? (
        <EmptyState
          title="Список квестов пуст"
          description="System initialized. Start your first quest."
          action={{ label: "Создать первый квест", onClick: createQuest }}
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          <Card>
            <CardHeader>
              <div className="text-lg font-semibold">Активные</div>
              <div className="text-sm text-zinc-400">{byStatus.todo.length} шт.</div>
            </CardHeader>
            <CardBody>
              <div className="grid gap-2">
                {byStatus.todo.map((t) => (
                  <div key={t.id} className="rounded-xl border border-white/10 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">{t.title}</div>
                      <Badge>{t.xp_reward} XP</Badge>
                    </div>
                    <div className="mt-1 text-xs text-zinc-400">
                      Тип {t.type} • Сложность {t.difficulty} • Статус {t.status}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button onClick={() => completeQuest(t.id)}>Завершить</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="text-lg font-semibold">Завершённые</div>
              <div className="text-sm text-zinc-400">{byStatus.done.length} шт.</div>
            </CardHeader>
            <CardBody>
              <div className="grid gap-2">
                {byStatus.done.slice(0, 20).map((t) => (
                  <div key={t.id} className="rounded-xl border border-white/10 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">{t.title}</div>
                      <Badge>DONE</Badge>
                    </div>
                    <div className="mt-1 text-xs text-zinc-400">{t.completed_at ? `Завершено: ${new Date(t.completed_at).toLocaleString()}` : ""}</div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
