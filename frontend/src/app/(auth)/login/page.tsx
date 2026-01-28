"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

const schema = z.object({
  login: z.string().min(1, "Введите email или username"),
  password: z.string().min(1, "Введите пароль"),
});

type Form = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    setError(null);
    try {
      await login(data);
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ошибка входа");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <div className="text-xl font-semibold text-zinc-100">Вход в систему</div>
            <div className="mt-1 text-sm text-zinc-400">Enter the System</div>
          </CardHeader>
          <CardBody>
            <form className="grid gap-3" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <div className="text-xs text-zinc-400 mb-1">Email или Username</div>
                <Input placeholder="demo@example.com" {...register("login")} />
                {errors.login ? <div className="mt-1 text-xs text-red-400">{errors.login.message}</div> : null}
              </div>

              <div>
                <div className="text-xs text-zinc-400 mb-1">Пароль</div>
                <Input type="password" placeholder="••••••••" {...register("password")} />
                {errors.password ? (
                  <div className="mt-1 text-xs text-red-400">{errors.password.message}</div>
                ) : null}
              </div>

              {error ? <div className="text-sm text-red-300">{error}</div> : null}

              <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? "Входим..." : "Войти"}
              </Button>

              <div className="text-sm text-zinc-400">
                Нет аккаунта?{" "}
                <Link className="text-zinc-100 underline" href="/register">
                  Регистрация
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
