"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLogin } from "../hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export function LoginForm() {
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    login.mutate({ email, password }, { onSuccess: () => router.push("/") });
  }

  return (
    <Card className="w-full">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <Input
          type="email"
          placeholder="이메일"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="비밀번호"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {login.isError && <p className="text-sm text-cocoa-soft">{(login.error as Error).message}</p>}
        <Button type="submit" className="w-full">
          {login.isPending ? "들어가는 중…" : "로그인"}
        </Button>
      </form>
      <p className="mt-3 text-center text-sm text-cocoa-faint">
        처음이세요?{" "}
        <Link href="/signup" className="text-cocoa underline">
          가입하기
        </Link>
      </p>
    </Card>
  );
}
