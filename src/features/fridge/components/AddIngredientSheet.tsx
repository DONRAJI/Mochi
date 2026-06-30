"use client";

import { useState, type FormEvent } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { COMMON_INGREDIENTS, type IngredientPreset } from "../ingredients";
import { FRIDGE_CATEGORIES } from "../data";
import { useAddIngredient } from "../hooks/useFridge";

/** 재료 담기 — 자주 쓰는 재료 톡 누르기(스티커) + 직접 입력. 사진/바코드는 P2. */
export function AddIngredientSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const add = useAddIngredient();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("채소");

  function quickAdd(preset: IngredientPreset) {
    add.mutate({ name: preset.name, category: preset.category });
  }

  function customAdd(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    add.mutate({ name: trimmed, category }, { onSuccess: () => setName("") });
  }

  return (
    <Sheet open={open} onClose={onClose} title="냉장고에 담기">
      <p className="mb-2 text-sm text-cocoa-faint">자주 쓰는 재료 — 톡 누르면 담겨요</p>
      <div className="mb-4 grid grid-cols-4 gap-2">
        {COMMON_INGREDIENTS.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => quickAdd(p)}
            className="flex flex-col items-center gap-1 rounded-mochi-sm bg-cream-200 p-2 text-xs text-cocoa transition-transform ease-jelly active:scale-90"
          >
            <span className="text-2xl">{p.emoji}</span>
            {p.name}
          </button>
        ))}
      </div>

      <form onSubmit={customAdd} className="flex flex-col gap-2">
        <Input placeholder="직접 입력 (예: 감자)" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FRIDGE_CATEGORIES.filter((c) => c !== "전체").map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                "whitespace-nowrap rounded-mochi-sm px-3 py-1.5 text-sm transition-transform ease-jelly active:scale-95",
                category === c ? "bg-mint text-cocoa" : "bg-cream-200 text-cocoa-faint",
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <Button type="submit" className="w-full">
          {add.isPending ? "담는 중…" : "담기"}
        </Button>
      </form>

      <div className="mt-4 flex gap-2 text-center text-xs text-cocoa-faint">
        <div className="flex-1 rounded-mochi-sm bg-cream-200 py-2">📷 사진 — 곧</div>
        <div className="flex-1 rounded-mochi-sm bg-cream-200 py-2">🧾 바코드 — 곧</div>
      </div>
    </Sheet>
  );
}
