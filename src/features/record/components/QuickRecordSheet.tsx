"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Chip } from "@/components/ui/Chip";
import { useMarkMealEaten } from "../hooks/useRecord";
import { useFoodSearch } from "../hooks/useFoodSearch";
import { useMe } from "@/features/auth/hooks/useAuth";
import { useRecommendations } from "@/features/recommend/hooks/useRecommend";
import { SLOT_LABEL, SLOT_EMOJI, estimateSlot } from "../slot";
import {
  matchCatalog,
  normalizeName,
  type CatalogCandidate,
  type CatalogMode,
} from "../catalogMatch";
import type { FoodSearchItem, MealSlot } from "../types";

const MODES = [
  { value: "cook", label: "🍳 요리" },
  { value: "eatout", label: "🍽️ 외식" },
  { value: "convenience", label: "🏪 간편식" },
] as const;

type RecordMode = (typeof MODES)[number]["value"];

const SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];

const MODE_NAME: Record<CatalogMode, string> = { eatout: "외식", convenience: "간편식" };

/** 음식 사전 제안 최대 개수 — 카탈로그 제안(최대 3) 아래에 붙는다. */
const MAX_FOOD_SUGGESTIONS = 3;

interface QuickRecordSheetProps {
  open: boolean;
  onClose: () => void;
}

interface CatalogRow {
  id: string;
  name: string;
  emoji: string | null;
  subtitle: string | null;
  kcal: number | null;
}

const toCandidate =
  (mode: CatalogMode) =>
  (row: CatalogRow): CatalogCandidate => ({
    id: row.id,
    name: row.name,
    mode,
    emoji: row.emoji,
    subtitle: row.subtitle,
    kcal: row.kcal,
  });

/** 고른 제안 — 카탈로그 항목이면 refId로, 음식 사전 항목이면 foodId로 기록한다. */
type Picked = { kind: "catalog"; item: CatalogCandidate } | { kind: "food"; item: FoodSearchItem };

interface SuggestionButtonProps {
  emoji: string;
  name: string;
  meta: (string | null)[];
  onPick: () => void;
}

function SuggestionButton({ emoji, name, meta, onPick }: SuggestionButtonProps) {
  const detail = meta.filter(Boolean).join(" · ");
  return (
    <button
      type="button"
      onClick={onPick}
      className="flex items-center gap-2 rounded-mochi-sm bg-cream-100 px-3 py-2 text-left text-sm text-cocoa transition-transform ease-jelly active:scale-[0.98]"
    >
      <span className="text-base">{emoji}</span>
      <span className="min-w-0 flex-1 truncate">{name}</span>
      {detail && <span className="shrink-0 text-xs text-cocoa-faint">{detail}</span>}
    </button>
  );
}

/**
 * 직접 입력 기록 — 카탈로그에 없는 걸 그 자리에서 남긴다(예: "추러스", "외식 감자탕").
 * 이름만 있으면 되고, 나머지(끼니·모드)는 기본값이 잡혀 있어 한 줄 적고 바로 끝난다.
 *
 * 적은 이름으로 칼로리를 찾아 제안한다 — 고르면 kcal은 서버가 붙인다(숫자를 숨기는 cozy 사용자의
 * 기록도 정확해진다, 불변 #2). 두 곳에서 찾는다:
 * - 외식·편의점 **카탈로그**(catalogMatch.ts) → 고르면 refId로 기록
 * - 공공 영양성분 DB에서 정리한 **음식 사전**(서버 검색) → 고르면 foodId로 기록
 */
export function QuickRecordSheet({ open, onClose }: QuickRecordSheetProps) {
  const router = useRouter();
  const mark = useMarkMealEaten();
  const { data: me } = useMe();
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<RecordMode>("eatout");
  // 지금 시간대로 끼니를 미리 골라둔다 — 대부분 그대로 두고 넘어간다.
  const [slot, setSlot] = useState<MealSlot>(() => estimateSlot(new Date()));
  const [kcal, setKcal] = useState("");
  const [picked, setPicked] = useState<Picked | null>(null);

  // 이 시트는 홈에 항상 마운트돼 있다 — 열렸을 때만 받아야 홈 진입마다 요청이 나가지 않는다.
  const eatout = useRecommendations("eatout", { enabled: open });
  const convenience = useRecommendations("convenience", { enabled: open });
  const catalog = [
    ...(eatout.data ?? []).map(toCandidate("eatout")),
    ...(convenience.data ?? []).map(toCandidate("convenience")),
  ];
  const catalogMatches = picked ? [] : matchCatalog(title, catalog);

  // 카탈로그 72개로 못 찾는 대부분의 음식은 음식 사전에서 서버가 찾는다. 같은 이름은 카탈로그를 우선.
  const foodSearch = useFoodSearch(title, { enabled: open && !picked });
  const catalogNames = new Set(catalogMatches.map((c) => normalizeName(c.name)));
  const foodMatches = picked
    ? []
    : (foodSearch.data ?? [])
        .filter((f) => !catalogNames.has(normalizeName(f.name)))
        .slice(0, MAX_FOOD_SUGGESTIONS);
  const hasSuggestions = catalogMatches.length + foodMatches.length > 0;

  const trimmed = title.trim();
  const canSubmit = trimmed.length > 0 && !mark.isPending;
  // 칼로리 입력·표시는 숫자를 보기로 한 사람에게만 (불변 #2 — cozy는 숫자를 숨긴다).
  const showKcal = me?.displayMode === "detail";

  function reset() {
    setTitle("");
    setKcal("");
    setPicked(null);
  }

  function changeTitle(value: string) {
    setTitle(value);
    // 고른 뒤 이름을 고치면 더 이상 그 항목이 아니다 — 직접 입력으로 돌아간다.
    if (picked && value !== picked.item.name) setPicked(null);
  }

  function changeMode(value: RecordMode) {
    setMode(value);
    // 카탈로그 항목은 모드에 속해 있어 모드를 바꾸면 풀린다. 사전 음식은 어떻게 먹었든 같은 음식이라 유지.
    if (picked?.kind === "catalog" && picked.item.mode !== value) setPicked(null);
  }

  function pickCatalog(item: CatalogCandidate) {
    setPicked({ kind: "catalog", item });
    setTitle(item.name);
    setMode(item.mode);
  }

  function pickFood(item: FoodSearchItem) {
    setPicked({ kind: "food", item });
    setTitle(item.name);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const parsedKcal = showKcal && kcal.trim() ? Number(kcal) : undefined;
    mark.mutate(
      picked?.kind === "catalog"
        ? // 카탈로그 항목 — kcal은 서버가 조회해 붙인다. 음식 도감 희귀도는 이제 화면에 안 쓰여 common.
          { mode: picked.item.mode, slot, refId: picked.item.id, rarity: "common" }
        : picked?.kind === "food"
          ? // 음식 사전 — 이름·kcal은 서버가 사전에서 붙인다. title은 사전에서 못 찾을 때의 대비.
            { mode, slot, foodId: picked.item.id, title: trimmed, rarity: "common" }
          : {
              mode,
              slot,
              title: trimmed,
              ...(Number.isFinite(parsedKcal) ? { kcal: parsedKcal } : {}),
              rarity: "common",
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
    <Sheet open={open} onClose={onClose} title="오늘 먹은 것 적기">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="meal-title" className="text-sm text-cocoa-soft">
            무엇을 드셨나요?
          </label>
          <Input
            name="record-title"
            autoComplete="off"
            id="meal-title"
            value={title}
            maxLength={40}
            placeholder="예: 추러스, 감자탕"
            onChange={(e) => changeTitle(e.target.value)}
          />

          {hasSuggestions && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-cocoa-faint">
                {showKcal ? "혹시 이거예요? 고르면 칼로리가 자동으로 들어가요" : "혹시 이거예요?"}
              </span>
              {catalogMatches.map((c) => (
                <SuggestionButton
                  key={c.id}
                  emoji={c.emoji ?? (c.mode === "eatout" ? "🍽️" : "🏪")}
                  name={c.name}
                  meta={[
                    MODE_NAME[c.mode],
                    c.subtitle,
                    showKcal && c.kcal != null ? `${c.kcal}kcal` : null,
                  ]}
                  onPick={() => pickCatalog(c)}
                />
              ))}
              {foodMatches.map((f) => (
                <SuggestionButton
                  key={f.id}
                  emoji="🥣"
                  name={f.name}
                  meta={[f.category, showKcal && f.kcal != null ? `${f.kcal}kcal` : null]}
                  onPick={() => pickFood(f)}
                />
              ))}
            </div>
          )}

          {picked && (
            <p className="flex items-center gap-1.5 text-xs text-cocoa-soft">
              <span>
                ✓{" "}
                {picked.kind === "catalog"
                  ? `${MODE_NAME[picked.item.mode]} 목록의 항목으로 남겨요`
                  : showKcal
                    ? "음식 사전의 1인분 칼로리로 남겨요"
                    : "음식 사전에서 찾은 음식으로 남겨요"}
                {showKcal && picked.item.kcal != null ? ` · ${picked.item.kcal}kcal` : ""}
              </span>
              <button
                type="button"
                onClick={() => setPicked(null)}
                className="ml-auto text-cocoa-faint underline"
              >
                직접 적을래요
              </button>
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-cocoa-soft">어떻게 드셨어요?</span>
          <div className="flex gap-2">
            {MODES.map((m) => (
              <Chip key={m.value} active={mode === m.value} onClick={() => changeMode(m.value)}>
                {m.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-cocoa-soft">언제 드셨어요?</span>
          <div className="flex gap-2">
            {SLOTS.map((s) => (
              <Chip key={s} active={slot === s} onClick={() => setSlot(s)}>
                {SLOT_EMOJI[s]} {SLOT_LABEL[s]}
              </Chip>
            ))}
          </div>
        </div>

        {/* 제안에서 골랐으면 칼로리는 서버가 붙이므로 손으로 적는 칸은 감춘다. */}
        {showKcal && !picked && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="meal-kcal" className="text-sm text-cocoa-soft">
              칼로리 (알면 적어주세요)
            </label>
            <Input
              name="record-kcal"
              autoComplete="off"
              id="meal-kcal"
              type="number"
              inputMode="numeric"
              min={0}
              max={5000}
              value={kcal}
              placeholder="비워둬도 괜찮아요"
              onChange={(e) => setKcal(e.target.value)}
            />
          </div>
        )}

        <Button type="submit" className={canSubmit ? "w-full" : "w-full opacity-60"}>
          {mark.isPending ? "남기는 중…" : "기록하기 🌱"}
        </Button>
        {mark.isError && (
          <p className="text-center text-sm text-cocoa-soft">잠깐 안 됐어요. 다시 해볼까요?</p>
        )}

        {/* 카탈로그에서 고르고 싶은 사람을 위한 출구 — 추천은 매칭률·재료 정보가 붙는다. */}
        <button
          type="button"
          onClick={() => {
            onClose();
            router.push("/meals");
          }}
          className="text-center text-sm text-cocoa-faint underline"
        >
          추천 목록에서 고를래요
        </button>
      </form>
    </Sheet>
  );
}
