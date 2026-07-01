"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { usePreferences, useSavePreferences } from "../hooks/useAuth";

type Tone = "mint" | "peach" | "default";

const CHIP_TONE: Record<Tone, string> = {
  mint: "bg-mint-soft text-cocoa",
  peach: "bg-peach-soft text-cocoa",
  default: "bg-cream-200 text-cocoa-soft",
};

/** 한 줄 태그 편집 — 재료명 입력→칩 추가, 칩 눌러 삭제. */
function TagRow({
  label,
  hint,
  tone,
  items,
  onChange,
}: {
  label: string;
  hint?: string;
  tone: Tone;
  items: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const t = draft.trim();
    if (!t || items.includes(t) || items.length >= 20) {
      setDraft("");
      return;
    }
    onChange([...items, t]);
    setDraft("");
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    }
  }

  return (
    <div>
      <p className="mb-1 text-sm text-cocoa">
        {label}
        {hint && <span className="ml-1 text-cocoa-faint">· {hint}</span>}
      </p>
      {items.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {items.map((it) => (
            <button
              key={it}
              type="button"
              onClick={() => onChange(items.filter((x) => x !== it))}
              className={`rounded-mochi-sm px-2.5 py-1 text-sm transition-transform ease-jelly active:scale-90 ${CHIP_TONE[tone]}`}
            >
              {it} ✕
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          placeholder="재료를 적고 Enter"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
        />
        <Button type="button" variant="soft" onClick={add}>
          추가
        </Button>
      </div>
    </div>
  );
}

/**
 * 취향 편집 (선호·비선호·알러지) — 모찌가 제안할 때 참고한다.
 * 알러지 재료는 추천에서 아예 빼고(안전), 비선호는 뒤로, 선호는 앞으로. 강조는 복숭아톤(빨강 금지, 불변 #1·#4).
 */
export function PreferencesSection() {
  const { data } = usePreferences();
  const save = useSavePreferences();

  const [likes, setLikes] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);

  useEffect(() => {
    if (!data) return;
    setLikes(data.likes);
    setDislikes(data.dislikes);
    setAllergies(data.allergies);
  }, [data]);

  return (
    <Card className="flex flex-col gap-3">
      <div>
        <p className="font-display text-cocoa">취향</p>
        <p className="text-sm text-cocoa-faint">
          모찌가 골라줄 때 참고해요. 알러지 재료는 꼭 빼드릴게요 🌿
        </p>
      </div>

      <TagRow label="좋아하는 재료" tone="mint" items={likes} onChange={setLikes} />
      <TagRow label="안 좋아하는 재료" tone="default" items={dislikes} onChange={setDislikes} />
      <TagRow label="알러지" hint="추천에서 빼드려요" tone="peach" items={allergies} onChange={setAllergies} />

      <Button className="w-full" onClick={() => save.mutate({ likes, dislikes, allergies })}>
        {save.isPending ? "저장하는 중…" : "저장"}
      </Button>
      {save.isSuccess && !save.isPending && (
        <p className="text-center text-sm text-cocoa-soft">취향을 담았어요 😊</p>
      )}
      {save.isError && (
        <p className="text-center text-sm text-cocoa-soft">잠깐 안 됐어요. 다시 해볼까요?</p>
      )}
    </Card>
  );
}
