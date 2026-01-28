"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR, { mutate } from "swr";

import { apiDelete, apiGet, apiPatch, apiPost, apiPostForm } from "@/lib/api";
import type { HeroStatsDto, ProfileDto, SystemDto } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ProfilePage() {
  const { token } = useAuth();

  const { data: profile } = useSWR(token ? ["profile", token] : null, () => apiGet<ProfileDto>("/profile/", token!));
  const { data: system } = useSWR(["system"], () => apiGet<SystemDto>("/system/", null));
  const { data: hero } = useSWR(token ? ["hero", token] : null, () => apiGet<HeroStatsDto>("/hero/", token!));

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [allocating, setAllocating] = useState(false);
  const [form, setForm] = useState({ title: "", bio: "" });
  const [alloc, setAlloc] = useState({ strength: 0, agility: 0, intelligence: 0, vitality: 0 });
  const fileRef = useRef<HTMLInputElement | null>(null);

  const initial = useMemo(() => ({ title: profile?.title ?? "", bio: profile?.bio ?? "" }), [profile?.title, profile?.bio]);
  const serverTitle = profile?.title ?? "";
  const serverBio = profile?.bio ?? "";

  useEffect(() => {
    setForm({ title: serverTitle, bio: serverBio });
  }, [serverTitle, serverBio]);

  const ranks = system?.ranks ?? [];
  const currentRank = profile?.rank ?? "E";

  return (
    <div className="grid gap-5">
      <div>
        <div className="text-2xl font-semibold">Профиль</div>
        <div className="text-sm text-zinc-400">Твои характеристики и прогресс ранга</div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative h-14 w-14 overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-indigo-500 to-fuchsia-500">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="Аватар" className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div>
              <div className="text-lg font-semibold">{profile?.nickname ?? "Игрок"}</div>
              <div className="text-sm text-zinc-400">
                {profile?.title ? `${profile.title} • ` : ""}Уровень {profile?.level ?? 0} • XP {profile?.xp ?? 0}
              </div>
            </div>
            <div className="ml-auto flex gap-2">
              <Badge>Ранг {profile?.rank ?? "E"}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="mb-6 rounded-xl border border-white/10 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-sm font-semibold">Характеристики героя</div>
              <div className="ml-auto text-xs text-zinc-400">Свободные очки: {hero?.stat_points ?? 0}</div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {(
                [
                  { key: "strength", label: "Сила", value: hero?.strength ?? 0 },
                  { key: "agility", label: "Ловкость", value: hero?.agility ?? 0 },
                  { key: "intelligence", label: "Интеллект", value: hero?.intelligence ?? 0 },
                  { key: "vitality", label: "Выносливость", value: hero?.vitality ?? 0 },
                ] as const
              ).map((s) => (
                <div key={s.key} className="flex items-center justify-between rounded-xl border border-white/10 p-3">
                  <div>
                    <div className="text-sm font-semibold">{s.label}</div>
                    <div className="text-xs text-zinc-400">Текущее значение: {s.value}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      inputMode="numeric"
                      className="w-20"
                      value={String(alloc[s.key])}
                      onChange={(e) => {
                        const n = Math.max(0, Number(e.target.value || 0));
                        setAlloc((p) => ({ ...p, [s.key]: Number.isFinite(n) ? n : 0 }));
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                disabled={
                  !token ||
                  allocating ||
                  (alloc.strength + alloc.agility + alloc.intelligence + alloc.vitality) <= 0
                }
                onClick={async () => {
                  if (!token) return;
                  setAllocating(true);
                  try {
                    await apiPost<HeroStatsDto>("/hero/allocate/", alloc, token);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    await mutate(["hero", token] as any);
                    setAlloc({ strength: 0, agility: 0, intelligence: 0, vitality: 0 });
                  } finally {
                    setAllocating(false);
                  }
                }}
              >
                {allocating ? "Распределение…" : "Распределить очки"}
              </Button>
              <Button variant="ghost" disabled={allocating} onClick={() => setAlloc({ strength: 0, agility: 0, intelligence: 0, vitality: 0 })}>
                Сбросить
              </Button>
            </div>
            <div className="mt-2 text-xs text-zinc-400">
              Очки выдаются при повышении уровня. Это часть «честной» прокачки.
            </div>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 p-4">
              <div className="text-sm font-semibold">Аватар героя</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !token) return;
                    setUploading(true);
                    try {
                      const fd = new FormData();
                      fd.append("avatar", file);
                      await apiPostForm<unknown>("/profile/avatar/", fd, token);
                      // обновляем кеш
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      await mutate(["profile", token] as any);
                    } finally {
                      setUploading(false);
                      e.target.value = "";
                    }
                  }}
                />
                <Button
                  disabled={!token || uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploading ? "Загрузка…" : "Загрузить"}
                </Button>
                <Button
                  variant="ghost"
                  disabled={!token || uploading || !profile?.avatar_url}
                  onClick={async () => {
                    if (!token) return;
                    setUploading(true);
                    try {
                      await apiDelete<unknown>("/profile/avatar/", token);
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      await mutate(["profile", token] as any);
                    } finally {
                      setUploading(false);
                    }
                  }}
                >
                  Удалить
                </Button>
              </div>
              <div className="mt-2 text-xs text-zinc-400">Поддерживаются изображения до 5 МБ.</div>
            </div>

            <div className="rounded-xl border border-white/10 p-4">
              <div className="text-sm font-semibold">Титул и описание</div>
              <div className="mt-3 grid gap-3">
                <div>
                  <div className="mb-1 text-xs text-zinc-400">Титул</div>
                  <Input
                    placeholder="Например: Повелитель DRF"
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  />
                </div>
                <div>
                  <div className="mb-1 text-xs text-zinc-400">О себе</div>
                  <textarea
                    className="min-h-[88px] w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-white/20"
                    placeholder="Напиши пару строк: стек, цели, текущий рейд…"
                    value={form.bio}
                    onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    disabled={!token || saving || (form.title === initial.title && form.bio === initial.bio)}
                    onClick={async () => {
                      if (!token) return;
                      setSaving(true);
                      try {
                        await apiPatch<ProfileDto>("/profile/", { title: form.title, bio: form.bio }, token);
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        await mutate(["profile", token] as any);
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    {saving ? "Сохранение…" : "Сохранить"}
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={saving}
                    onClick={() => setForm(initial)}
                  >
                    Сбросить
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <div className="text-sm font-semibold">Ключевые навыки</div>
              <div className="mt-2 grid gap-2">
                {(profile?.key_skills ?? []).length ? (
                  profile!.key_skills.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-xl border border-white/10 p-3">
                      <div>
                        <div className="text-sm font-semibold">{s.name}</div>
                        <div className="text-xs text-zinc-400">{s.category || "Без категории"} • {s.status}</div>
                      </div>
                      <Badge>Lvl {s.level}</Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-zinc-400">Пока нет навыков.</div>
                )}
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold">Активные проекты</div>
              <div className="mt-2 grid gap-2">
                {(profile?.active_projects ?? []).length ? (
                  profile!.active_projects.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-xl border border-white/10 p-3">
                      <div>
                        <div className="text-sm font-semibold">{p.name}</div>
                        <div className="text-xs text-zinc-400">{p.is_commercial ? "Коммерческий" : "Учебный"}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-zinc-400">Пока нет проектов.</div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-semibold">Прогресс ранга</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {ranks.map((r) => (
                <Badge key={r.code} className={r.code === currentRank ? "bg-white/20" : ""}>
                  {r.code} — {r.title}
                </Badge>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
