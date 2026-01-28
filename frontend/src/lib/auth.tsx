"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { apiGet, apiPost, setToken as persistToken, getToken } from "@/lib/api";
import type { AuthResponse, ProfileDto } from "@/lib/types";

type AuthState = {
  token: string | null;
  profile: ProfileDto | null;
  loading: boolean;
  login: (params: { login: string; password: string }) => Promise<void>;
  register: (params: { username: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const existing = getToken();
    setToken(existing);
    setLoading(false);
  }, []);

  const refreshProfile = async () => {
    if (!token) {
      setProfile(null);
      return;
    }
    const p = await apiGet<ProfileDto>("/profile/", token);
    setProfile(p);
  };

  useEffect(() => {
    if (!token) {
      setProfile(null);
      return;
    }
    refreshProfile().catch(() => {
      // если токен невалидный — чистим
      persistToken(null);
      setToken(null);
      setProfile(null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = async (params: { login: string; password: string }) => {
    const res = await apiPost<AuthResponse>("/auth/login/", params, null);
    persistToken(res.token);
    setToken(res.token);
  };

  const register = async (params: { username: string; email: string; password: string }) => {
    const res = await apiPost<AuthResponse>("/auth/register/", params, null);
    persistToken(res.token);
    setToken(res.token);
  };

  const logout = async () => {
    if (token) {
      try {
        await apiPost<void>("/auth/logout/", {}, token);
      } catch {
        // ignore
      }
    }
    persistToken(null);
    setToken(null);
    setProfile(null);
  };

  const value = useMemo<AuthState>(
    () => ({ token, profile, loading, login, register, logout, refreshProfile }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth должен использоваться внутри AuthProvider");
  return ctx;
}
