"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";

import { apiGet, apiPost, apiDelete } from "@/lib/api";
import type { FinanceDto, Paginated } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/EmptyState";

export default function FinancePage() {
  const { token } = useAuth();
  const { data, mutate } = useSWR(token ? ["finance", token] : null, () => apiGet<Paginated<FinanceDto>>("/finance/", token!));

  const [type, setType] = useState<FinanceDto["type"]>("expense");
  const [category, setCategory] = useState("Еда");
  const [amount, setAmount] = useState("100");
  const [description, setDescription] = useState("");

  const create = async () => {
    if (!token) return;
    await apiPost<FinanceDto>("/finance/", { type, category, amount, description }, token);
    setDescription("");
    await mutate();
  };

  const remove = async (id: number) => {
    if (!token) return;
    await apiDelete<void>(`/finance/${id}/`, token);
    await mutate();
  };

  const balance = useMemo(() => {
    const list = data?.results ?? [];
    let b = 0;
    for (const r of list) {
      const v = Number(r.amount);
      b += r.type === "income" ? v : -v;
    }
    return b;
  }, [data]);

  return (
    <div className="grid gap-5">
      <div>
        <div className="text-2xl font-semibold">Финансы</div>
        <div className="text-sm text-zinc-400">Транзакции + баланс</div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">Баланс</div>
              <div className="text-sm text-zinc-400">Сумма доходов − расходы</div>
            </div>
            <Badge>{balance.toFixed(2)}</Badge>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid md:grid-cols-5 gap-2">
            <select
              className="rounded-xl bg-black/40 px-3 py-2 text-sm border border-white/10"
              value={type}
              onChange={(e) => setType(e.target.value as FinanceDto["type"])}
            >
              <option value="income">Доход</option>
              <option value="expense">Расход</option>
            </select>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Категория" />
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Сумма" inputMode="decimal" />
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Комментарий" />
            <Button onClick={create}>Добавить</Button>
          </div>
        </CardBody>
      </Card>

      {(data?.results?.length ?? 0) === 0 ? (
        <EmptyState title="Транзакций пока нет" description="Добавь первую запись дохода/расхода." />
      ) : (
        <Card>
          <CardHeader>
            <div className="text-lg font-semibold">История</div>
            <div className="text-sm text-zinc-400">Последние записи</div>
          </CardHeader>
          <CardBody>
            <div className="grid gap-2">
              {data!.results.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl border border-white/10 p-3">
                  <div>
                    <div className="text-sm font-semibold">
                      {r.type === "income" ? "+" : "-"}
                      {r.amount} • {r.category}
                    </div>
                    <div className="text-xs text-zinc-400">{r.description}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{r.date}</Badge>
                    <Button variant="ghost" onClick={() => remove(r.id)}>
                      Удалить
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
