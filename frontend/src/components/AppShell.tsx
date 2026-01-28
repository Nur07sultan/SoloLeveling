"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { useAuth } from "@/lib/auth";

const PUBLIC_ROUTES = new Set<string>(["/login", "/register"]);

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, loading } = useAuth();

  const isPublic = PUBLIC_ROUTES.has(pathname);

  useEffect(() => {
    if (loading) return;
    if (!isPublic && !token) router.replace("/login");
    if (isPublic && token) router.replace("/dashboard");
  }, [loading, token, isPublic, router]);

  if (isPublic) {
    return <div className="min-h-screen bg-[#07070b] text-zinc-100">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#07070b] text-zinc-100">
      <div className="md:flex">
        <Sidebar />
        <div className="flex-1">
          <Topbar />
          <main className="p-5">{children}</main>
        </div>
      </div>
    </div>
  );
}
