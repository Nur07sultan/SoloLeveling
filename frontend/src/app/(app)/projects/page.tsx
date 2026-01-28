"use client";

import useSWR from "swr";
import { useState } from "react";

import { apiGet, apiPost } from "@/lib/api";
import type { Paginated, ProjectDto } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/EmptyState";

export default function ProjectsPage() {
  const { token } = useAuth();
  const { data, mutate } = useSWR(token ? ["projects", token] : null, () => apiGet<Paginated<ProjectDto>>("/projects/", token!));

  const [name, setName] = useState("Новый проект");

  const create = async () => {
    if (!token) return;
    await apiPost<ProjectDto>("/projects/", { name, is_commercial: false, description: "", stack: "", role: "", status: "active" }, token);
    await mutate();
  };

  return (
    <div className="grid gap-5">
      <div>
        <div className="text-2xl font-semibold">Проекты</div>
        <div className="text-sm text-zinc-400">Карточки проектов (MVP)</div>
      </div>

      <Card>
        <CardHeader>
          <div className="text-lg font-semibold">Добавить проект</div>
        </CardHeader>
        <CardBody>
          <div className="grid md:grid-cols-3 gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Название" />
            <Button onClick={create}>Создать</Button>
          </div>
        </CardBody>
      </Card>

      {(data?.results?.length ?? 0) === 0 ? (
        <EmptyState title="Проектов пока нет" description="Создай первый проект для задач/квестов." />
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {data!.results.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold">{p.name}</div>
                  <Badge>{p.is_commercial ? "Коммерческий" : "Учебный"}</Badge>
                </div>
                <div className="text-sm text-zinc-400">Статус: {p.status}</div>
              </CardHeader>
              <CardBody>
                <div className="text-sm text-zinc-300">{p.description || "Описание пока не задано."}</div>
                <div className="mt-3 text-xs text-zinc-400">Stack: {p.stack || "—"}</div>
                <div className="text-xs text-zinc-400">Role: {p.role || "—"}</div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
