"use client";

import useSWR from "swr";

import { apiGet } from "@/lib/api";
import type { SystemDto } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
  const { token, logout } = useAuth();
  const { data: system } = useSWR(["system"], () => apiGet<SystemDto>("/system/", null));

  return (
    <div className="grid gap-5">
      <div>
        <div className="text-2xl font-semibold">Настройки</div>
        <div className="text-sm text-zinc-400">Профиль/множители/выход</div>
      </div>

      <Card>
        <CardHeader>
          <div className="text-lg font-semibold">Правила XP (только чтение)</div>
          <div className="text-sm text-zinc-400">Берётся с backend: /api/system/</div>
        </CardHeader>
        <CardBody>
          <pre className="text-xs text-zinc-300 whitespace-pre-wrap rounded-xl border border-white/10 bg-black/30 p-3">
            {JSON.stringify(system, null, 2)}
          </pre>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="text-lg font-semibold">Сессия</div>
        </CardHeader>
        <CardBody>
          <Button
            variant="danger"
            onClick={async () => {
              if (token) await logout();
              location.href = "/login";
            }}
          >
            Выйти из системы
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
