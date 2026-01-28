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

const schema = z
  .object({
    username: z.string().min(3, "Минимум 3 символа"),
    email: z.string().email("Введите корректный email"),
    password: z.string().min(8, "Минимум 8 символов"),
    confirm: z.string().min(8, "Повторите пароль"),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Пароли не совпадают" });

type Form = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: doRegister } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    setError(null);
    try {
      await doRegister({ username: data.username, email: data.email, password: data.password });
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ошибка регистрации");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <div className="text-xl font-semibold text-zinc-100">Регистрация</div>
            <div className="mt-1 text-sm text-zinc-400">System initialization</div>
          </CardHeader>
          <CardBody>
            <form className="grid gap-3" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <div className="text-xs text-zinc-400 mb-1">Username</div>
                <Input placeholder="solo_dev" {...register("username")} />
                {errors.username ? <div className="mt-1 text-xs text-red-400">{errors.username.message}</div> : null}
              </div>

              <div>
                <div className="text-xs text-zinc-400 mb-1">Email</div>
                <Input placeholder="solo@example.com" {...register("email")} />
                {errors.email ? <div className="mt-1 text-xs text-red-400">{errors.email.message}</div> : null}
              </div>

              <div>
                <div className="text-xs text-zinc-400 mb-1">Пароль</div>
                <Input type="password" placeholder="••••••••" {...register("password")} />
                {errors.password ? (
                  <div className="mt-1 text-xs text-red-400">{errors.password.message}</div>
                ) : null}
              </div>

              <div>
                <div className="text-xs text-zinc-400 mb-1">Повтор пароля</div>
                <Input type="password" placeholder="••••••••" {...register("confirm")} />
                {errors.confirm ? (
                  <div className="mt-1 text-xs text-red-400">{errors.confirm.message}</div>
                ) : null}
              </div>

              {error ? <div className="text-sm text-red-300">{error}</div> : null}

              <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? "Создаём аккаунт..." : "Создать аккаунт"}
              </Button>

              <div className="text-sm text-zinc-400">
                Уже есть аккаунт?{" "}
                <Link className="text-zinc-100 underline" href="/login">
                  Войти
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
