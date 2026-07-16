"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { MochiAvatar } from "@/components/ui/MochiAvatar";
import { useMarkMealEaten, useMarkMealWithPhoto } from "@/features/record/hooks/useRecord";
import { resizeImage } from "@/features/record/photo";
import { estimateSlot, SLOT_LABEL } from "@/features/record/slot";
import { useAddPlan } from "../hooks/usePlan";
import { useAddShopping } from "@/features/fridge/hooks/useShopping";
import { weekDates, WEEKDAY_LABEL } from "../week";
import { mgrSourceUrl } from "../mgrParse";
import type { MarkMealRequest, MealSlot } from "@/features/record/types";
import type { MealMode, RecipeIngredient, RecommendationResponse } from "../types";

const SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];

/** 레시피/메뉴 상세 + '먹었어요'(기록→수집). 성공 시 모찌 cheer 축하 연출 (PRD 4.2 데일리 루프). */
export function RecipeDetailModal({
  item,
  mode,
  onClose,
}: {
  item: RecommendationResponse | null;
  mode: MealMode;
  onClose: () => void;
}) {
  const router = useRouter();
  const mark = useMarkMealEaten();
  const markPhoto = useMarkMealWithPhoto(); // 사진 첨부 기록(B안)
  const addPlan = useAddPlan();
  const addShopping = useAddShopping();
  const result = mark.data ?? markPhoto.data;
  const marking = mark.isPending || markPhoto.isPending;
  const markError = mark.isError || markPhoto.isError;
  const [plannedDay, setPlannedDay] = useState<string | null>(null);
  const [shopped, setShopped] = useState(false);
  const [slot, setSlot] = useState<MealSlot>(estimateSlot(new Date())); // 먹었어요: 시간대 자동추정
  const [planSlot, setPlanSlot] = useState<MealSlot>("dinner"); // 담기: '저녁 뭐 먹지'가 기본
  const week = weekDates(new Date());
  // 사진 첨부(선택) — 내가 만든 모습을 이 레시피에 남긴다(나만 봄)
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // 같은 파일 다시 고를 수 있게
    if (!file) return;
    const blob = await resizeImage(file); // 업로드 전 클라 리사이즈(대용량 차단)
    setPhotoBlob(blob);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(blob);
    });
  }

  function removePhoto() {
    setPhotoBlob(null);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  function eat() {
    if (!item) return;
    const rarity = item.rarity as MarkMealRequest["rarity"];
    if (photoBlob) {
      // 사진과 함께 기록 → 내 사진이 이 레시피 카드에 표시됨
      markPhoto.mutate({ blob: photoBlob, mode, slot, refId: item.id, rarity });
    } else {
      mark.mutate({ mode, slot, refId: item.id, rarity }); // 시간대 자동추정 또는 고른 끼니(PRD 11.2)
    }
  }

  function planTo(date: string, label: string) {
    if (!item) return;
    addPlan.mutate(
      { date, slot: planSlot, mode, refId: item.id, title: item.name, emoji: item.emoji ?? undefined },
      { onSuccess: () => setPlannedDay(`${label}요일 ${SLOT_LABEL[planSlot]}`) },
    );
  }

  function close() {
    mark.reset();
    markPhoto.reset();
    setPlannedDay(null);
    setShopped(false);
    removePhoto();
    onClose();
  }

  return (
    <Modal open={item !== null} onClose={close}>
      {item &&
        (result ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <MochiAvatar state="cheer" className="h-24 w-24" />
            <p className="font-display text-lg text-cocoa">잘 먹었어요!</p>
            <p className="text-sm text-cocoa-soft">
              {SLOT_LABEL[result.slot as MealSlot]}으로{" "}
              {result.cardAcquired ? "기록했어요 · 첫 발견! 🎉" : "기록했어요 😊"}
            </p>
            {/* 뽑기 씨앗 적립 — 건강 행동의 보상(PRD 12.2) */}
            <p className="text-sm font-display text-cocoa">🌱 씨앗 +{result.seedsEarned}</p>
            <p className="text-sm text-cocoa-faint">스트릭 {result.streakCount}일째 🍮</p>
            {result.shieldUsed && (
              <p className="text-sm text-cocoa-soft">🛡️ 보호권이 스트릭을 지켜줬어요!</p>
            )}
            {/* 기록→뽑기 브릿지 — 씨앗이 다 모였으면 도감으로 바로 (루프의 마지막 연결) */}
            {result.canDraw ? (
              <div className="flex w-full gap-2">
                <Button variant="soft" className="flex-1" onClick={close}>
                  닫기
                </Button>
                <Button className="flex-1" onClick={() => router.push("/collection")}>
                  🎁 뽑으러 가기
                </Button>
              </div>
            ) : (
              <Button className="w-full" onClick={close}>
                닫기
              </Button>
            )}
          </div>
        ) : (
          <>
            {(item.myPhotoUrl ?? item.imageUrl) && (
              <div className="relative mb-3 h-40 w-full overflow-hidden rounded-mochi">
                <Image
                  src={(item.myPhotoUrl ?? item.imageUrl)!}
                  alt={item.name}
                  fill
                  sizes="100vw"
                  className="object-cover"
                />
                {item.myPhotoUrl && (
                  <span className="absolute bottom-2 left-2 rounded-mochi-sm bg-cream-50/90 px-2 py-0.5 text-xs text-cocoa">
                    📷 내가 만든 사진
                  </span>
                )}
              </div>
            )}
            <div className="flex items-center gap-3">
              <span className="text-4xl">{item.emoji ?? "🍽️"}</span>
              <div>
                <h3 className="text-lg font-bold text-cocoa">{item.name}</h3>
                <p className="text-sm text-cocoa-faint">
                  {item.minutes != null ? `⏱ ${item.minutes}분 · ${item.servings}인분` : item.subtitle}
                  {item.kcal != null && ` · ${item.kcal} kcal`}
                </p>
              </div>
            </div>

            {mode === "cook" && item.ingredients.length > 0 && (
              <IngredientHints ingredients={item.ingredients} />
            )}

            {item.steps.length > 0 ? (
              <ol className="mt-4 flex flex-col gap-2">
                {item.steps.map((s, i) => (
                  <li key={i} className="flex gap-2 text-cocoa-soft">
                    <span className="font-display text-cocoa">{i + 1}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            ) : mode === "eatout" ? (
              <p className="mt-4 text-center text-sm text-cocoa-soft">맛있게 즐기고 아래로 기록해요 😊</p>
            ) : mode === "convenience" ? (
              <p className="mt-4 text-center text-sm text-cocoa-soft">가까운 편의점에서 만나요 🏪</p>
            ) : mgrSourceUrl(item.id) ? (
              // 만개의레시피 인기 레시피 — 덤프에 조리 단계가 없어 원문으로 연결 (결정은 모찌, 조리법은 원문)
              <a
                href={mgrSourceUrl(item.id)!}
                target="_blank"
                rel="noreferrer"
                className="mt-4 block rounded-mochi bg-cream-50 px-4 py-2.5 text-center text-sm text-cocoa-soft shadow-mochi-press transition-transform ease-jelly active:scale-[0.98]"
              >
                📖 자세한 조리법 보기 — 만개의레시피
              </a>
            ) : (
              <p className="mt-4 text-center text-sm text-cocoa-soft">재료만 있으면 금방이에요 😊</p>
            )}

            <div className="mt-4 flex items-center gap-1.5">
              <span className="text-xs text-cocoa-faint">끼니</span>
              {SLOTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSlot(s)}
                  className={`rounded-mochi-sm px-2 py-0.5 text-xs transition-transform ease-jelly active:scale-90 ${
                    slot === s ? "bg-mint text-cocoa" : "bg-cream-200 text-cocoa-faint"
                  }`}
                >
                  {SLOT_LABEL[s]}
                </button>
              ))}
            </div>

            {/* 사진 첨부(선택) — 내가 만든 모습을 이 레시피에 남긴다(나만 봄, B안) */}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onPickPhoto}
              className="hidden"
            />
            {photoPreview ? (
              <div className="mt-3 flex items-center gap-2 rounded-mochi bg-cream-50 p-2">
                {/* 로컬 미리보기(object URL)라 next/image 대신 img */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoPreview}
                  alt="첨부한 사진"
                  className="h-12 w-12 rounded-mochi-sm object-cover"
                />
                <span className="text-sm text-cocoa-soft">사진과 함께 기록해요</span>
                <button
                  type="button"
                  onClick={removePhoto}
                  aria-label="사진 제거"
                  className="ml-auto px-1 text-cocoa-faint transition-transform ease-jelly active:scale-90"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="mt-3 w-full rounded-mochi border border-dashed border-lavender bg-cream-50 px-4 py-2.5 text-sm text-cocoa-soft transition-transform ease-jelly active:scale-[0.98]"
              >
                📷 사진 첨부 (선택)
              </button>
            )}

            <Button className="mt-2 w-full" onClick={eat}>
              {marking
                ? "기록하는 중…"
                : photoBlob
                  ? "잘 먹었어요! 📷 사진과 함께"
                  : "잘 먹었어요! 🌱 씨앗 받기"}
            </Button>
            {markError && (
              <p className="mt-2 text-center text-sm text-cocoa-soft">잠깐 안 됐어요. 다시 해볼까요?</p>
            )}

            {mode === "cook" &&
              item.missingIngredients.length > 0 &&
              (shopped ? (
                <p className="mt-2 text-center text-sm text-cocoa-soft">장보기 리스트에 담았어요 🛒</p>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    addShopping.mutate(item.missingIngredients, { onSuccess: () => setShopped(true) })
                  }
                  className="mt-2 w-full rounded-mochi border border-dashed border-mint-deep bg-cream-50 px-4 py-2.5 text-sm text-cocoa-soft transition-transform ease-jelly active:scale-[0.98]"
                >
                  🛒 추가구매 {item.missingIngredients.length}개 장보기에 담기
                </button>
              ))}

            <div className="mt-4 border-t border-cream-200 pt-3">
              <p className="mb-2 text-sm text-cocoa-faint">이번 주 식단에 담기</p>
              {plannedDay ? (
                <p className="text-sm text-cocoa-soft">{plannedDay}에 담았어요 🗓️</p>
              ) : (
                <>
                  {/* 담을 끼니 — 기본 저녁, 아침/점심도 담아 하루 여러 끼니 계획 가능 */}
                  <div className="mb-2 flex items-center gap-1.5">
                    <span className="text-xs text-cocoa-faint">끼니</span>
                    {SLOTS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setPlanSlot(s)}
                        className={`rounded-mochi-sm px-2 py-0.5 text-xs transition-transform ease-jelly active:scale-90 ${
                          planSlot === s ? "bg-lavender text-cocoa" : "bg-cream-200 text-cocoa-faint"
                        }`}
                      >
                        {SLOT_LABEL[s]}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    {week.map((date, i) => (
                      <button
                        key={date}
                        type="button"
                        onClick={() => planTo(date, WEEKDAY_LABEL[i])}
                        className="flex-1 rounded-mochi-sm bg-cream-200 py-2 text-sm text-cocoa transition-transform ease-jelly active:scale-90"
                      >
                        {WEEKDAY_LABEL[i]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        ))}
    </Modal>
  );
}

/**
 * 재료 + 다이어트 힌트 — "냉장고 재료로 가볍게" 컨셉.
 * 가진 재료는 민트로 체크, 고열량은 가벼운 대체를 부드럽게 제안(강요 아님).
 * '없어도 괜찮아요'(optional)는 잘 안 쓰는 희귀 재료만 — 흔한 양념(후추·깨)엔 침묵(사용자 피드백).
 */
function IngredientHints({ ingredients }: { ingredients: RecipeIngredient[] }) {
  const swaps = ingredients.filter((i) => i.swap);
  const optionals = ingredients.filter((i) => i.optional && !i.swap);

  return (
    <div className="mt-4">
      <p className="mb-2 text-sm font-display text-cocoa">재료</p>
      <div className="flex flex-wrap gap-1.5">
        {ingredients.map((ing) => (
          <span
            key={ing.name}
            className={
              ing.owned
                ? "rounded-mochi-sm bg-mint-soft px-2.5 py-1 text-sm text-cocoa"
                : "rounded-mochi-sm bg-cream-200 px-2.5 py-1 text-sm text-cocoa-faint"
            }
          >
            {ing.owned ? "✓ " : ""}
            {ing.name}
          </span>
        ))}
      </div>

      {(swaps.length > 0 || optionals.length > 0) && (
        <div className="mt-3 rounded-mochi bg-peach-soft/60 p-3">
          <p className="mb-1.5 text-sm font-display text-cocoa">🍃 가볍게 바꿔볼까요?</p>
          <ul className="flex flex-col gap-1 text-sm text-cocoa-soft">
            {swaps.map((i) => (
              <li key={i.name}>
                <span className="text-cocoa">
                  {i.name} → {i.swap!.to}
                </span>{" "}
                · {i.swap!.note}
              </li>
            ))}
            {optionals.map((i) => (
              <li key={i.name}>{i.name}는 잘 안 쓰는 재료예요 — 없어도 괜찮아요</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
