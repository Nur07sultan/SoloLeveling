"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  BarChart3,
  Bot,
  ClipboardList,
  Dumbbell,
  LayoutDashboard,
  Settings,
  Swords,
  Timer,
  Skull,
  User,
  Wallet,
} from "lucide-react";

const items = [
  { href: "/dashboard", label: "Панель", icon: LayoutDashboard },
  { href: "/profile", label: "Профиль", icon: User },
  { href: "/skills", label: "Навыки", icon: Swords },
  { href: "/ai", label: "ИИ", icon: Bot },
  { href: "/focus", label: "Фокус", icon: Timer },
  { href: "/boss", label: "Боссы", icon: Skull },
  { href: "/quests", label: "Квесты", icon: ClipboardList },
  { href: "/training", label: "Тренировки", icon: Dumbbell },
  { href: "/finance", label: "Финансы", icon: Wallet },
  { href: "/projects", label: "Проекты", icon: LayoutDashboard },
  { href: "/analytics", label: "Аналитика", icon: BarChart3 },
  { href: "/settings", label: "Настройки", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-64 md:min-h-screen border-b md:border-b-0 md:border-r border-white/10 bg-black/20">
      <div className="p-5">
        <div className="text-sm text-zinc-400">SoloLevel</div>
        <div className="text-lg font-semibold text-zinc-100">Dev Ascension</div>
      </div>

      <nav className="px-3 pb-4 grid gap-1">
        {items.map((it) => {
          const active = pathname === it.href;
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={clsx(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
                active ? "bg-white/10 text-white" : "text-zinc-300 hover:bg-white/5"
              )}
            >
              <Icon size={18} />
              {it.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
