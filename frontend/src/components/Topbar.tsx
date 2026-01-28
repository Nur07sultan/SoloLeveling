"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth";

export function Topbar() {
  const { profile, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="flex items-center justify-between gap-4 p-5 border-b border-white/10 bg-black/20">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500" />
        <div>
          <div className="text-sm text-zinc-200 font-semibold">
            {profile?.nickname || "Безымянный игрок"}
          </div>
          <div className="text-xs text-zinc-400">Система прокачки активна</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {profile?.rank ? <Badge>Ранг {profile.rank}</Badge> : null}
        <Button
          variant="ghost"
          onClick={async () => {
            await logout();
            router.push("/login");
          }}
        >
          Выход
        </Button>
      </div>
    </header>
  );
}
