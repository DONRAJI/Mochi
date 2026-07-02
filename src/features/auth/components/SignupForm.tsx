"use client";

import { useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
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
  const [allergies, setAllergies] = useState<string[]>([]); // 온보딩 알러지(선택) → 첫날부터 추천 반영
  const [allergyDraft, setAllergyDraft] = useState("");

  function addAllergy() {
    const t = allergyDraft.trim();
    if (!t || allergies.includes(t) || allergies.length >= 10) {
      setAllergyDraft("");
      return;
    }
    setAllergies((prev) => [...prev, t]);
    setAllergyDraft("");
  }

  function onAllergyKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addAllergy();
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const tags = allergies.map((label) => ({ kind: "allergy" as const, label }));
    signup.mutate(
      { email, password, nickname, cooksOften, tags },
      { onSuccess: () => router.push("/") },
    );
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

        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-cocoa-soft">알러지 있나요? (선택)</span>
          {allergies.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {allergies.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAllergies((prev) => prev.filter((x) => x !== a))}
                  className="rounded-mochi-sm bg-peach-soft px-2.5 py-1 text-sm text-cocoa transition-transform ease-jelly active:scale-90"
                >
                  {a} ✕
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="예: 새우 (Enter로 추가)"
              value={allergyDraft}
              onChange={(e) => setAllergyDraft(e.target.value)}
              onKeyDown={onAllergyKey}
            />
            <Button type="button" variant="soft" onClick={addAllergy}>
              추가
            </Button>
          </div>
          <span className="text-xs text-cocoa-faint">알러지 재료는 추천에서 빼드려요 🌿</span>
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
