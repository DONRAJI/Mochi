"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { useMealHistory } from "../hooks/useRecord";
import { SLOT_LABEL, SLOT_EMOJI } from "../slot";
import type { MealHistoryDayResponse, MealSlot } from "../types";

const MODE_LABEL: Record<"cook" | "eatout" | "convenience", string> = {
  cook: "요리",
  eatout: "외식",
  convenience: "간편식",
};

const PAGE_SIZE = 10; // 한 페이지에 보여줄 날짜 수

/** "YYYY-MM" → 칩 라벨. 여러 해가 섞이면 연도까지("26.7"), 아니면 "7월". */
function monthChipLabel(ym: string, multiYear: boolean): string {
  const [y, m] = ym.split("-");
  return multiYear ? `${y.slice(2)}.${Number(m)}` : `${Number(m)}월`;
}

/**
 * ⏳ 기록 되돌아보기 (마이 전용, /me/history) — 월을 골라 그 달을 페이지로 넘겨 본다.
 * 날짜별로 먹은 것 + 그날 체중을 나란히 (판단은 사용자, 앱은 벌하지 않음 — 불변 #1).
 * 숫자(체중·kcal)는 마이 트리에서만(불변 #2).
 */
export function MealHistoryScreen() {
  const router = useRouter();
  const [month, setMonth] = useState<string | null>(null); // null이면 서버가 최근 달 선택
  const [page, setPage] = useState(0);
  const { data, isError } = useMealHistory(month, page, PAGE_SIZE);

  const months = data?.months ?? [];
  const activeMonth = data?.month ?? null;
  const days = data?.days ?? [];
  const totalPages = data?.totalPages ?? 1;
  const multiYear = new Set(months.map((m) => m.slice(0, 4))).size > 1;

  function pickMonth(ym: string) {
    setMonth(ym);
    setPage(0); // 달을 바꾸면 첫 페이지부터
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.push("/me")}
          aria-label="마이로 돌아가기"
          className="rounded-mochi-sm px-2 py-1 text-cocoa-faint transition-transform ease-jelly active:scale-90"
        >
          ‹
        </button>
        <h1 className="text-title text-cocoa">기록 되돌아보기</h1>
      </div>

      {/* 월 선택 칩 — 기록이 있는 달만, 최근 먼저 */}
      {months.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {months.map((ym) => (
            <button
              key={ym}
              type="button"
              onClick={() => pickMonth(ym)}
              className={`shrink-0 rounded-mochi-sm px-3 py-1 text-sm transition-transform ease-jelly active:scale-95 ${
                ym === activeMonth ? "bg-lavender text-cocoa" : "bg-cream-200 text-cocoa-faint"
              }`}
            >
              {monthChipLabel(ym, multiYear)}
            </button>
          ))}
        </div>
      )}

      {isError && <p className="px-1 text-sm text-cocoa-soft">잠깐 못 불러왔어요. 다시 볼까요?</p>}

      {!isError && days.length === 0 && (
        <Card>
          <p className="text-center text-sm text-cocoa-soft">
            아직 돌아볼 기록이 없어요. 한 끼 담아볼까요? 🍽️
          </p>
        </Card>
      )}

      {days.map((day) => (
        <DayCard key={day.date} day={day} />
      ))}

      {/* 페이지 넘기기 — 그 달 안에서 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page <= 0}
            className="rounded-mochi-sm bg-cream-200 px-4 py-2 text-sm text-cocoa transition-transform ease-jelly active:scale-95 disabled:opacity-40"
          >
            ‹ 최근
          </button>
          <span className="text-sm text-cocoa-faint">
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="rounded-mochi-sm bg-cream-200 px-4 py-2 text-sm text-cocoa transition-transform ease-jelly active:scale-95 disabled:opacity-40"
          >
            지난 기록 ›
          </button>
        </div>
      )}
    </div>
  );
}

/** 하루 카드 — 날짜·그날 체중(직전 대비 흐름)·먹은 끼니들. */
function DayCard({ day }: { day: MealHistoryDayResponse }) {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <p className="font-display text-cocoa">{day.label}</p>
        {day.weight != null && (
          <span className="text-sm text-cocoa-soft">
            <span className="font-display text-cocoa">{day.weight}kg</span>
            {day.weightDelta != null && day.weightDelta !== 0 && (
              <span className="ml-1 text-cocoa-faint">
                {day.weightDelta < 0 ? "↘" : "↗"} {Math.abs(day.weightDelta)}
              </span>
            )}
          </span>
        )}
      </div>

      {day.meals.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {day.meals.map((m) => (
            <li key={m.id} className="flex items-center gap-2 text-sm">
              {m.photoUrl && (
                <Image
                  src={m.photoUrl}
                  alt="식사 사진"
                  width={36}
                  height={36}
                  className="h-9 w-9 shrink-0 rounded-mochi-sm object-cover"
                />
              )}
              <span className="text-base">{SLOT_EMOJI[m.slot as MealSlot]}</span>
              <span className="text-cocoa-faint">{SLOT_LABEL[m.slot as MealSlot]}</span>
              <span className="text-cocoa">{m.title ?? MODE_LABEL[m.mode]}</span>
              {m.kcal != null && <span className="ml-auto text-cocoa-faint">{m.kcal} kcal</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-cocoa-faint">이 날은 체중만 기록했어요 🌙</p>
      )}

      {day.totalKcal != null && day.meals.length > 0 && (
        <p className="border-t border-cream-200 pt-1.5 text-right text-xs text-cocoa-faint">
          그날 합계 {day.totalKcal.toLocaleString()} kcal
        </p>
      )}
    </Card>
  );
}
