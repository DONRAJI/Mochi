"use client";

import { useState, type FormEvent } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { COMMON_INGREDIENTS, type IngredientPreset } from "../ingredients";
import { useAddIngredient, useIngredients } from "../hooks/useFridge";
import type { Storage } from "../shelfLife";

/**
 * 재료 담기 — 자주 쓰는 재료 톡 누르기(스티커) + 직접 입력.
 * 분류·보관 기한은 서버가 채운다(재료 마스터·shelfLife) — 예전엔 직접 입력하면 분류를 손으로 골라야 했다.
 * 이미 냉장고에 있는 재료는 ✓ — 다시 누르면 '다시 샀어요'로 담은 날만 새로 한다(중복 안 생김).
 * 위의 냉장/냉동 선택이 스티커·직접 입력 모두에 적용된다(냉동새우를 '새우' 스티커로 담을 수 있게).
 * 창을 닫으면 냉장으로 돌아간다 — 다음에 열었을 때 모르고 냉동으로 담기지 않게.
 */
export function AddIngredientSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const add = useAddIngredient();
  const { data: fridge } = useIngredients();
  const owned = new Set((fridge ?? []).map((i) => i.name));
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [storage, setStorage] = useState<Storage>("fridge");

  function close() {
    setStorage("fridge");
    onClose();
  }

  function quickAdd(preset: IngredientPreset) {
    add.mutate({ name: preset.name, category: preset.category, storage });
  }

  function customAdd(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    add.mutate(
      { name: trimmed, storage, ...(expiry ? { expiresAt: expiry } : {}) },
      {
        onSuccess: () => {
          setName("");
          setExpiry("");
        },
      },
    );
  }

  return (
    <Sheet open={open} onClose={close} title="냉장고에 담기">
      <div className="mb-3 flex gap-2">
        {(
          [
            ["fridge", "🧊 냉장"],
            ["freezer", "❄️ 냉동"],
          ] as const
        ).map(([value, text]) => (
          <button
            key={value}
            type="button"
            onClick={() => setStorage(value)}
            aria-pressed={storage === value}
            className={cn(
              "flex-1 rounded-mochi-sm px-3 py-2 text-sm transition-transform ease-jelly active:scale-95",
              storage === value ? "bg-mint text-cocoa" : "bg-cream-200 text-cocoa-faint",
            )}
          >
            {text}
          </button>
        ))}
      </div>
      <p className="mb-2 text-sm text-cocoa-faint">
        자주 쓰는 재료 — 톡 누르면 {storage === "freezer" ? "냉동으로" : ""} 담겨요
      </p>
      <div className="mb-4 grid grid-cols-4 gap-2">
        {COMMON_INGREDIENTS.map((p) => {
          const has = owned.has(p.name);
          return (
            <button
              key={p.name}
              type="button"
              onClick={() => quickAdd(p)}
              aria-label={has ? `${p.name} (냉장고에 있어요)` : p.name}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-mochi-sm p-2 text-xs text-cocoa transition-transform ease-jelly active:scale-90",
                has ? "bg-mint-soft" : "bg-cream-200",
              )}
            >
              {has && <span className="absolute right-1 top-1 text-[10px] text-cocoa-soft">✓</span>}
              <span className="text-2xl">{p.emoji}</span>
              {p.name}
            </button>
          );
        })}
      </div>

      <form onSubmit={customAdd} className="flex flex-col gap-2">
        <Input
          name="ingredient-name"
          autoComplete="off"
          placeholder="직접 입력 (예: 애호박)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-cocoa-faint">
          <span className="whitespace-nowrap">유통기한 (선택)</span>
          <Input
            name="ingredient-expiry"
            autoComplete="off"
            type="date"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
          />
        </label>
        <p className="text-xs text-cocoa-faint">
          분류와 대략적인 보관 기간은 모찌가 알아서 챙겨요. 날짜를 알면 적어줘도 좋아요.
        </p>
        <Button type="submit" className="w-full">
          {add.isPending ? "담는 중…" : "담기"}
        </Button>
      </form>
    </Sheet>
  );
}
