"use client";

import { useMemo, useState } from "react";

import { apiGet, apiPost, apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { AIActResponseDto, AIChatResponseDto, AIProfileDto, AIProposedAction } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type ChatMsg = { role: "user" | "assistant"; content: string };

function prettyJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function AIPage() {
  const { token } = useAuth();

  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content:
        "Я могу помочь с твоим прогрессом и предложить безопасные действия (фокус/квесты/босс/статы). Спроси, что сделать дальше.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [proposedAction, setProposedAction] = useState<AIProposedAction>(null);
  const [actionToken, setActionToken] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);

  const [profile, setProfile] = useState<AIProfileDto>({
    preferred_name: "",
    how_to_address: "",
    about_me: "",
    assistant_persona: "",
  });
  const [profileLoaded, setProfileLoaded] = useState(false);

  const historyForApi = useMemo(() => {
    // Убираем приветствие, но оставляем последние сообщения.
    const raw = messages
      .filter((m) => m.content.trim().length > 0)
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));
    return raw;
  }, [messages]);

  const send = async () => {
    if (!token) return;
    const text = input.trim();
    if (!text) return;

    setInput("");
    setLoading(true);
    setProposedAction(null);
    setActionToken(null);

    setMessages((prev) => [...prev, { role: "user", content: text }]);

    try {
      const res = await apiPost<AIChatResponseDto>(
        "/ai/chat/",
        {
          message: text,
          history: historyForApi,
        },
        token
      );

      setModel(res.model);
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
      if (res.proposed_action && res.action_token) {
        setProposedAction(res.proposed_action);
        setActionToken(res.action_token);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    if (!token) return;
    const p = await apiGet<AIProfileDto>("/ai/profile/", token);
    setProfile(p);
    setProfileLoaded(true);
  };

  const saveProfile = async () => {
    if (!token) return;
    const p = await apiRequest<AIProfileDto>("/ai/profile/", {
      method: "PUT",
      body: JSON.stringify(profile),
      token,
    });
    setProfile(p);
    setProfileLoaded(true);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "Ок, запомнил. Теперь я буду учитывать это в ответах.",
      },
    ]);
  };

  const confirmAction = async () => {
    if (!token || !actionToken) return;
    setLoading(true);
    try {
      const res = await apiPost<AIActResponseDto>("/ai/act/", { action_token: actionToken }, token);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Команда выполнена: ${res.action.name}\n\nРезультат:\n${prettyJson(res.result)}`,
        },
      ]);
      setProposedAction(null);
      setActionToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-5">
      <div>
        <div className="text-2xl font-semibold">ИИ ассистент</div>
        <div className="text-sm text-zinc-400">
          Локальная модель через Ollama. Команды выполняются только после подтверждения.
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold">Чат</div>
              <div className="text-sm text-zinc-400">Попроси план прокачки или следующую задачу</div>
            </div>
            {model ? <Badge>{model}</Badge> : null}
          </div>
        </CardHeader>
        <CardBody>
          {!token ? (
            <div className="text-sm text-zinc-400">Войди в аккаунт, чтобы использовать ИИ.</div>
          ) : (
            <div className="grid gap-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-zinc-100">Память и характер</div>
                    <div className="text-xs text-zinc-400">Сохраняется локально в твоей базе и подмешивается в системный промпт</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => loadProfile()}
                      disabled={loading || profileLoaded}
                    >
                      {profileLoaded ? "Загружено" : "Загрузить"}
                    </Button>
                    <Button onClick={() => saveProfile()} disabled={loading}>
                      Сохранить
                    </Button>
                  </div>
                </div>

                <div className="mt-3 grid gap-2">
                  <label className="grid gap-1">
                    <div className="text-xs text-zinc-400">Твоё имя (как тебе комфортно)</div>
                    <input
                      value={profile.preferred_name}
                      onChange={(e) => setProfile((p) => ({ ...p, preferred_name: e.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/20"
                      placeholder="Напр.: Нурсултан"
                    />
                  </label>
                  <label className="grid gap-1">
                    <div className="text-xs text-zinc-400">Как ко мне обращаться</div>
                    <input
                      value={profile.how_to_address}
                      onChange={(e) => setProfile((p) => ({ ...p, how_to_address: e.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/20"
                      placeholder="Напр.: Нурс / Нурсултан / брат / на 'Вы'"
                    />
                  </label>
                  <label className="grid gap-1">
                    <div className="text-xs text-zinc-400">Факты о тебе (что ИИ должен помнить)</div>
                    <textarea
                      value={profile.about_me}
                      onChange={(e) => setProfile((p) => ({ ...p, about_me: e.target.value }))}
                      className="min-h-[80px] w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/20"
                      placeholder="Напр.: Я backend-разработчик, люблю краткие ответы, работаю по будням вечером, цель — выйти на middle."
                    />
                  </label>
                  <label className="grid gap-1">
                    <div className="text-xs text-zinc-400">Характер ассистента</div>
                    <textarea
                      value={profile.assistant_persona}
                      onChange={(e) => setProfile((p) => ({ ...p, assistant_persona: e.target.value }))}
                      className="min-h-[80px] w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/20"
                      placeholder="Напр.: Будь строгим наставником. Отвечай коротко, по пунктам. Всегда предлагай 1-2 следующих шага."
                    />
                  </label>
                  <div className="text-xs text-zinc-500">
                    Совет: не записывай лишние чувствительные данные. Если потом выложишь проект в сеть — эти данные окажутся на сервере.
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-3 max-h-[50vh] overflow-auto">
                <div className="grid gap-3">
                  {messages.map((m, idx) => (
                    <div key={idx} className={m.role === "user" ? "text-right" : "text-left"}>
                      <div
                        className={
                          "inline-block max-w-[90%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap " +
                          (m.role === "user" ? "bg-white/10 text-zinc-100" : "bg-black/30 text-zinc-200")
                        }
                      >
                        {m.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {proposedAction && actionToken ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-zinc-100">
                  <div className="font-semibold">Предложена команда</div>
                  <div className="mt-1 text-xs text-zinc-300 whitespace-pre-wrap">
                    {prettyJson(proposedAction)}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button onClick={confirmAction} disabled={loading}>
                      Выполнить
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setProposedAction(null);
                        setActionToken(null);
                      }}
                      disabled={loading}
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Например: 'Составь план на сегодня и предложи фокус-сессию'"
                  className="flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/20"
                />
                <Button onClick={send} disabled={loading || !input.trim()}>
                  {loading ? "…" : "Отправить"}
                </Button>
              </div>

              <div className="text-xs text-zinc-500">
                Подсказка: попроси “покажи статы” или “атака на босса” — ассистент предложит команду.
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
