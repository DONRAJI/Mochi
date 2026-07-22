"use client";

import { useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  useShopping,
  useAddShopping,
  useToggleShopping,
  useRemoveShopping,
  useMoveCheckedToFridge,
} from "../hooks/useShopping";

/** 🛒 장보기 리스트 (PRD 5.3) — 추가구매 재료를 모아 체크, 사면 냉장고로. */
export function ShoppingList() {
  const { data: items } = useShopping();
  const add = useAddShopping();
  const toggle = useToggleShopping();
  const remove = useRemoveShopping();
  const move = useMoveCheckedToFridge();
  const [name, setName] = useState("");

  const list = items ?? [];
  const checkedCount = list.filter((i) => i.checked).length;

  function submit(e: FormEvent) {
    e.preventDefault();
    const t = name.trim();
    if (!t) return;
    add.mutate([t]);
    setName(""); // 낙관적 추가라 서버 응답을 기다리지 않고 즉시 입력칸을 비운다
  }

  return (
    <Card className="flex flex-col gap-3">
      <p className="font-display text-cocoa">🛒 장보기 리스트</p>

      {list.length === 0 ? (
        <p className="text-sm text-cocoa-faint">
          추가구매 재료를 담아보세요. 레시피에서 한 번에 담을 수 있어요.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {list.map((i) => (
            <li key={i.id} className="flex items-center gap-2 text-sm">
              <button
                type="button"
                onClick={() => toggle.mutate(i.id)}
                className="flex flex-1 items-center gap-2 text-left"
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-mochi-sm text-xs",
                    i.checked ? "bg-mint text-cocoa" : "bg-cream-200",
                  )}
                >
                  {i.checked ? "✓" : ""}
                </span>
                <span className={cn(i.checked ? "text-cocoa-faint line-through" : "text-cocoa")}>
                  {i.name}
                </span>
              </button>
              <button
                type="button"
                onClick={() => remove.mutate(i.id)}
                aria-label="삭제"
                className="px-1 text-cocoa-faint transition-transform ease-jelly active:scale-90"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="flex gap-2">
        <Input placeholder="직접 담기 (예: 두부)" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" variant="soft">
          담기
        </Button>
      </form>

      {checkedCount > 0 && (
        <Button className="w-full" onClick={() => move.mutate()}>
          {move.isPending ? "옮기는 중…" : `샀어요! ${checkedCount}개 냉장고로 🧊`}
        </Button>
      )}
    </Card>
  );
}
