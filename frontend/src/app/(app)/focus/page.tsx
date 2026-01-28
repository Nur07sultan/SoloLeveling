"use client";

import useSWR from "swr";
import { useEffect, useMemo, useState } from "react";

import { apiGet, apiPost } from "@/lib/api";
import type { FocusSessionDto, Paginated, SkillNodeDto } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/EmptyState";

const KIND_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "coding", label: "Кодинг" },
  { value: "learning", label: "Обучение" },
  { value: "debugging", label: "Отладка" },
  { value: "reading", label: "Чтение документации" },
  { value: "review", label: "Код-ревью" },
  { value: "interview", label: "Подготовка к собеседованию" },
];

export default function FocusPage() {
  const { token } = useAuth();

  const { data: active, mutate: mutateActive } = useSWR(
    token ? ["focus-active", token] : null,
    () => apiGet<FocusSessionDto | null>("/focus/active/", token!)
  );

  const { data: sessions, mutate: mutateSessions } = useSWR(
    token ? ["focus", token] : null,
    () => apiGet<Paginated<FocusSessionDto>>("/focus/", token!)
  );

  const { data: nodes } = useSWR(token ? ["skill-nodes", token] : null, () =>
    apiGet<Paginated<SkillNodeDto> | SkillNodeDto[]>("/skill-nodes/", token!)
  );

  const skillNodes = useMemo<SkillNodeDto[]>(() => {
    if (!nodes) return [];
    return Array.isArray(nodes) ? nodes : nodes.results ?? [];
  }, [nodes]);

  const [kind, setKind] = useState<string>("coding");
  const [note, setNote] = useState<string>("");
  const [skillNodeId, setSkillNodeId] = useState<number | "">("");
  const [sourceUrl, setSourceUrl] = useState<string>("");
  const [now, setNow] = useState<number>(() => Date.now());
  const [lastXp, setLastXp] = useState<number | null>(null);

  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);

  const elapsed = useMemo(() => {
    if (!active) return 0;
    const started = Date.parse(active.started_at);
    if (Number.isNaN(started)) return 0;
    return Math.max(0, Math.floor((now - started) / 1000));
  }, [active, now]);

  const elapsedText = useMemo(() => {
    const s = elapsed;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    const pad = (x: number) => String(x).padStart(2, "0");
    if (h > 0) return `${h}:${pad(m)}:${pad(ss)}`;
    return `${m}:${pad(ss)}`;
  }, [elapsed]);

  const refreshAll = async () => {
    await Promise.all([mutateActive(), mutateSessions()]);
  };

  const start = async () => {
    if (!token) return;
    setLastXp(null);

    await apiPost<FocusSessionDto>(
      "/focus/start/",
      {
        kind,
        note,
        skill_node: skillNodeId === "" ? null : skillNodeId,
      },
      token
    );

    await refreshAll();
  };

  const stop = async () => {
    if (!token) return;

    const res = await apiPost<{ session: FocusSessionDto; xp_awarded: number }>(
      "/focus/stop/",
      { source_url: sourceUrl },
      token
    );

    setLastXp(res.xp_awarded);
    setSourceUrl("");
    await refreshAll();
  };

  const cancel = async () => {
    if (!token) return;

    await apiPost<FocusSessionDto>("/focus/cancel/", {}, token);
    setSourceUrl("");
    setLastXp(null);
    await refreshAll();
  };

  return (
    <div className="grid gap-5">
      <div>
        <div className="text-2xl font-semibold">Фокус</div>
        <div className="text-sm text-zinc-400">Честные фокус-сессии как доказательство прогресса</div>
      </div>

      <Card>
        <CardHeader>
          <div className="text-lg font-semibold">Текущая сессия</div>
          <div className="text-sm text-zinc-400">XP выдаётся при остановке (есть минималка и дневной лимит)</div>
        </CardHeader>
        <CardBody>
          {!active ? (
            <div className="grid gap-3">
              <div className="grid md:grid-cols-3 gap-2">
                <label className="grid gap-1">
                  <div className="text-xs text-zinc-400">Тип</div>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value)}
                    className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-zinc-100"
                  >
                    {KIND_OPTIONS.map((k) => (
                      <option key={k.value} value={k.value}>
                        {k.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1">
                  <div className="text-xs text-zinc-400">Узел навыка (опционально)</div>
                  <select
                    value={skillNodeId}
                    onChange={(e) => setSkillNodeId(e.target.value ? Number(e.target.value) : "")}
                    className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-zinc-100"
                  >
                    <option value="">— не выбран —</option>
                    {skillNodes
                      .slice()
                      .sort((a, b) => (a.track.order - b.track.order) || (a.order - b.order) || a.title.localeCompare(b.title))
                      .map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.track.title} • {n.title}
                        </option>
                      ))}
                  </select>
                </label>

                <label className="grid gap-1">
                  <div className="text-xs text-zinc-400">Заметка</div>
                  <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Что конкретно делал(а)?" />
                </label>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={start}>Старт</Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-zinc-400">Прошло</div>
                  <div className="text-3xl font-semibold">{elapsedText}</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {active.track_title ? `${active.track_title} • ` : ""}
                    {active.skill_node_title ?? ""}
                    {active.note ? (active.skill_node_title ? ` • ${active.note}` : active.note) : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{active.kind}</Badge>
                  <Badge>id #{active.id}</Badge>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-2">
                <label className="grid gap-1">
                  <div className="text-xs text-zinc-400">Ссылка-подтверждение (опционально)</div>
                  <Input
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://github.com/... (PR/commit/issue)"
                  />
                </label>
                <div className="flex items-end gap-2">
                  <Button onClick={stop}>Стоп</Button>
                  <Button variant="ghost" onClick={cancel}>
                    Отмена
                  </Button>
                </div>
              </div>

              {lastXp !== null ? (
                <div className="text-sm text-zinc-300">
                  Начислено: <span className="font-semibold">{lastXp} XP</span>
                </div>
              ) : null}
            </div>
          )}
        </CardBody>
      </Card>

      {(sessions?.results?.length ?? 0) === 0 ? (
        <EmptyState title="Фокус-сессий пока нет" description="Запусти первую сессию и зафиксируй прогресс честно." />
      ) : (
        <Card>
          <CardHeader>
            <div className="text-lg font-semibold">История</div>
            <div className="text-sm text-zinc-400">Последние сессии</div>
          </CardHeader>
          <CardBody>
            <div className="grid gap-2">
              {sessions!.results.map((s) => {
                const minutes = Math.floor((s.duration_seconds ?? 0) / 60);
                return (
                  <div key={s.id} className="rounded-xl border border-white/10 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">
                          {s.canceled ? "Отменено" : "Завершено"} • {s.kind}
                        </div>
                        <div className="mt-1 text-xs text-zinc-400">
                          {s.track_title ? `${s.track_title} • ` : ""}
                          {s.skill_node_title ?? ""}
                          {s.note ? (s.skill_node_title ? ` • ${s.note}` : s.note) : ""}
                        </div>
                        <div className="mt-1 text-xs text-zinc-500">
                          {minutes} мин • {s.xp_awarded} XP
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {s.canceled ? <Badge>Отмена</Badge> : <Badge>OK</Badge>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
