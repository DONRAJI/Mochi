"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSignup } from "../hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export function SignupForm() {
  const router = useRouter();
  const signup = useSignup();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [cooksOften, setCooksOften] = useState(true); // 온보딩 A/B 페르소나 분기 (PRD 4.1)

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    signup.mutate({ email, password, nickname, cooksOften }, { onSuccess: () => router.push("/") });
  }

  return (
    <Card className="w-full">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <Input
          placeholder="닉네임"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          required
        />
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
          placeholder="비밀번호 (8자 이상)"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-cocoa-soft">요리하는 편이세요?</span>
          <div className="flex gap-2">
            <ChoiceChip active={cooksOften} onClick={() => setCooksOften(true)}>
              네, 자주 해요
            </ChoiceChip>
            <ChoiceChip active={!cooksOften} onClick={() => setCooksOften(false)}>
              거의 안 해요
            </ChoiceChip>
          </div>
        </div>

        {signup.isError && (
          <p className="text-sm text-cocoa-soft">{(signup.error as Error).message}</p>
        )}
        <Button type="submit" className="w-full">
          {signup.isPending ? "준비하는 중…" : "시작하기"}
        </Button>
      </form>
      <p className="mt-3 text-center text-sm text-cocoa-faint">
        이미 계정이 있나요?{" "}
        <Link href="/login" className="text-cocoa underline">
          로그인
        </Link>
      </p>
    </Card>
  );
}

function ChoiceChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-mochi-sm px-3 py-2 text-sm shadow-mochi-press",
        "transition-transform ease-jelly active:scale-[0.96]",
        active ? "bg-mint text-cocoa" : "bg-cream-200 text-cocoa-faint",
      )}
    >
      {children}
    </button>
  );
}
