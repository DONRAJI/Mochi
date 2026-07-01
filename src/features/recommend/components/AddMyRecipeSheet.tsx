"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useCreateRecipe } from "../hooks/useRecommend";

/**
 * 내 요리 추가 (PRD 11.3) — 냉장고 재료로 만드는 자기만의 요리.
 * 등록하면 요리 모드 추천에 내 요리도 뜨고, '먹었어요'로 도감에 쌓인다.
 */
export function AddMyRecipeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateRecipe();
  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [steps, setSteps] = useState("");

  function addIngredient() {
    const t = draft.trim();
    if (!t || ingredients.includes(t) || ingredients.length >= 20) {
      setDraft("");
      return;
    }
    setIngredients((prev) => [...prev, t]);
    setDraft("");
  }

  function onDraftKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addIngredient();
    }
  }

  function reset() {
    setName("");
    setIngredients([]);
    setDraft("");
    setSteps("");
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || ingredients.length === 0) return;
    create.mutate(
      {
        name: name.trim(),
        ingredients,
        steps: steps
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      },
    );
  }

  return (
    <Sheet open={open} onClose={onClose} title="내 요리 추가">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-sm text-cocoa-faint">요리 이름</label>
          <Input placeholder="예: 두부 계란 볶음" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <label className="mb-1 block text-sm text-cocoa-faint">재료 (냉장고에 있는 걸로)</label>
          {ingredients.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {ingredients.map((ing) => (
                <button
                  key={ing}
                  type="button"
                  onClick={() => setIngredients((prev) => prev.filter((x) => x !== ing))}
                  className="rounded-mochi-sm bg-mint-soft px-2.5 py-1 text-sm text-cocoa transition-transform ease-jelly active:scale-90"
                >
                  {ing} ✕
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="재료를 적고 Enter (예: 두부)"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onDraftKey}
            />
            <Button type="button" variant="soft" onClick={addIngredient}>
              추가
            </Button>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-cocoa-faint">조리 단계 (선택 · 한 줄에 하나)</label>
          <textarea
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            rows={3}
            placeholder={"두부를 깍둑 썰어요\n계란을 풀어 함께 볶아요"}
            className="w-full resize-none rounded-mochi-sm bg-cream-50 px-4 py-3 text-cocoa shadow-mochi-press outline-none placeholder:text-cocoa-faint focus:bg-cream-200"
          />
        </div>

        <Button
          type="submit"
          className={`w-full ${!name.trim() || ingredients.length === 0 ? "opacity-60" : ""}`}
        >
          {create.isPending ? "담는 중…" : "내 요리로 담기"}
        </Button>
        {create.isError && (
          <p className="text-center text-sm text-cocoa-soft">잠깐 안 됐어요. 다시 해볼까요?</p>
        )}
      </form>
    </Sheet>
  );
}
