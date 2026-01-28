"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";

import { apiGet, apiPost, apiPatch } from "@/lib/api";
import type { Paginated, SkillDto, SkillNodeDto, SkillTrackDto } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/EmptyState";

export default function SkillsPage() {
  const { token } = useAuth();
  const { data, mutate } = useSWR(token ? ["skills", token] : null, () => apiGet<Paginated<SkillDto>>("/skills/", token!));
  const { data: tracks } = useSWR(token ? ["skill-tracks", token] : null, () => apiGet<Paginated<SkillTrackDto> | SkillTrackDto[]>("/skill-tracks/", token!));
  const { data: nodes } = useSWR(token ? ["skill-nodes", token] : null, () => apiGet<Paginated<SkillNodeDto> | SkillNodeDto[]>("/skill-nodes/", token!));

  const [category, setCategory] = useState("Backend");
  const [name, setName] = useState("");

  const groups = useMemo(() => {
    const list = data?.results ?? [];
    const map = new Map<string, SkillDto[]>();
    for (const s of list) {
      const key = s.category || "Без категории";
      map.set(key, [...(map.get(key) ?? []), s]);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [data]);

  const createSkill = async () => {
    if (!token) return;
    if (!name.trim()) return;
    await apiPost<SkillDto>("/skills/", { category, name, level: 0 }, token);
    setName("");
    await mutate();
  };

  const upgrade = async (s: SkillDto) => {
    if (!token) return;
    const nextLevel = Math.min(100, s.level + 5);
    await apiPatch<SkillDto>(`/skills/${s.id}/`, { level: nextLevel }, token);
    await mutate();
  };

  const listTracks = useMemo<SkillTrackDto[]>(() => {
    if (!tracks) return [];
    return Array.isArray(tracks) ? tracks : tracks.results ?? [];
  }, [tracks]);

  const listNodes = useMemo<SkillNodeDto[]>(() => {
    if (!nodes) return [];
    return Array.isArray(nodes) ? nodes : nodes.results ?? [];
  }, [nodes]);

  const skillsByNode = useMemo(() => {
    const map = new Map<number, SkillDto>();
    for (const s of data?.results ?? []) {
      if (s.node) map.set(s.node, s);
    }
    return map;
  }, [data]);

  const nodesById = useMemo(() => {
    const map = new Map<number, SkillNodeDto>();
    for (const n of listNodes) map.set(n.id, n);
    return map;
  }, [listNodes]);

  const nodesByTrack = useMemo(() => {
    const map = new Map<number, SkillNodeDto[]>();
    for (const n of listNodes) {
      map.set(n.track.id, [...(map.get(n.track.id) ?? []), n]);
    }
    for (const [k, v] of map) {
      map.set(k, v.sort((a, b) => (a.order - b.order) || a.title.localeCompare(b.title)));
    }
    return map;
  }, [listNodes]);

  const isUnlocked = (node: SkillNodeDto) => {
    if (!node.prerequisites?.length) return true;
    return node.prerequisites.every((pid) => {
      const s = skillsByNode.get(pid);
      return !!s && s.level >= 20; // простое правило: prerequisite считается пройденным на lvl>=20
    });
  };

  const activateNode = async (node: SkillNodeDto) => {
    if (!token) return;
    if (skillsByNode.has(node.id)) return;
    if (!isUnlocked(node)) return;
    await apiPost<SkillDto>("/skills/", { node: node.id, category: node.track.title, name: node.title, level: 0 }, token);
    await mutate();
  };

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-semibold">Навыки</div>
          <div className="text-sm text-zinc-400">Дерево навыков и прокачка</div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="text-lg font-semibold">Добавить навык</div>
          <div className="text-sm text-zinc-400">Можно вручную, либо активировать из дерева ниже</div>
        </CardHeader>
        <CardBody>
          <div className="grid md:grid-cols-3 gap-2">
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Категория (например Backend)" />
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Навык (например Django REST)" />
            <Button onClick={createSkill}>Добавить</Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="text-lg font-semibold">Дерево навыков backend-разработчика</div>
          <div className="text-sm text-zinc-400">Канонический набор (Django, DRF, PostgreSQL, Redis, Celery, Docker…)</div>
        </CardHeader>
        <CardBody>
          {listTracks.length === 0 || listNodes.length === 0 ? (
            <div className="text-sm text-zinc-400">Загружаю дерево…</div>
          ) : (
            <div className="grid gap-4">
              {listTracks
                .slice()
                .sort((a, b) => (a.order - b.order) || a.title.localeCompare(b.title))
                .map((t) => (
                  <div key={t.id} className="rounded-xl border border-white/10 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold">{t.title}</div>
                        <div className="text-xs text-zinc-400">Трек</div>
                      </div>
                      <Badge>{(nodesByTrack.get(t.id) ?? []).length} узлов</Badge>
                    </div>

                    <div className="mt-3 grid md:grid-cols-2 gap-2">
                      {(nodesByTrack.get(t.id) ?? []).map((n) => {
                        const owned = skillsByNode.get(n.id);
                        const unlocked = isUnlocked(n);
                        const prereqTitles = (n.prerequisites ?? [])
                          .map((pid) => nodesById.get(pid)?.title)
                          .filter(Boolean)
                          .join(", ");

                        return (
                          <div key={n.id} className="rounded-xl border border-white/10 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold">{n.title}</div>
                                <div className="mt-1 text-xs text-zinc-400">{n.description}</div>
                                {prereqTitles ? (
                                  <div className="mt-1 text-xs text-zinc-500">Требования: {prereqTitles}</div>
                                ) : null}
                              </div>
                              <Badge>{owned ? `Lvl ${owned.level}` : unlocked ? "Доступно" : "Закрыто"}</Badge>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {!owned ? (
                                <Button variant="ghost" disabled={!unlocked} onClick={() => activateNode(n)}>
                                  Активировать
                                </Button>
                              ) : (
                                <Button variant="ghost" onClick={() => upgrade(owned)}>
                                  Прокачать +5
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardBody>
      </Card>

      {(data?.results?.length ?? 0) === 0 ? (
        <EmptyState
          title="Навыков пока нет"
          description="System initialized. Start your first skill."
        />
      ) : (
        <div className="grid gap-5">
          {groups.map(([cat, skills]) => (
            <Card key={cat}>
              <CardHeader>
                <div className="text-lg font-semibold">{cat}</div>
                <div className="text-sm text-zinc-400">{skills.length} шт.</div>
              </CardHeader>
              <CardBody>
                <div className="grid md:grid-cols-2 gap-2">
                  {skills.map((s) => (
                    <div key={s.id} className="rounded-xl border border-white/10 p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">{s.name}</div>
                        <Badge>Lvl {s.level}</Badge>
                      </div>
                      <div className="mt-1 text-xs text-zinc-400">Статус: {s.status}</div>
                      <div className="mt-3">
                        <Button variant="ghost" onClick={() => upgrade(s)}>
                          Улучшить +5
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
