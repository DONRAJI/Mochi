import { z } from "zod";
import type { MealSlot } from "@/features/record/types";
import type { MealMode } from "./types";

/**
 * 주간 식단 프리셋 — 매주 비슷하게 먹는 사람이 한 주치를 저장해 반복 적용한다.
 *
 * 날짜가 아니라 **요일**로 저장하는 게 핵심: 날짜로 저장하면 다음 주에 못 쓴다.
 * 요일 기준은 week.ts와 동일(월=0 … 일=6).
 */

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "날짜를 한 번만 더 봐줄래요?");

/** 이번 주 계획을 프리셋으로 저장. dates는 클라가 계산한 이번 주 월~일. */
export const savePresetSchema = z.object({
  name: z.string().trim().min(1, "이름을 붙여줄래요?").max(20),
  dates: z.array(dateStr).min(1).max(7),
});
export type SavePresetRequest = z.infer<typeof savePresetSchema>;

/** 프리셋을 특정 주에 적용. */
export const applyPresetSchema = z.object({ dates: z.array(dateStr).min(1).max(7) });
export type ApplyPresetRequest = z.infer<typeof applyPresetSchema>;

export interface PresetItemResponse {
  weekday: number; // 0=월 … 6=일
  slot: MealSlot | null;
  mode: MealMode;
  refId: string | null;
  title: string;
  emoji: string | null;
}

export interface PresetResponse {
  id: string;
  name: string;
  itemCount: number;
  items: PresetItemResponse[];
}

/** 적용 결과 — 얼마나 채웠고 왜 건너뛰었는지 그대로 알려준다(조용히 실패하지 않게). */
export interface ApplyPresetResult {
  added: number;
  skipped: number; // 이미 계획·기록이 있어 건드리지 않은 칸
}

/**
 * `YYYY-MM-DD` → 요일 인덱스(월=0 … 일=6).
 * ⚠️ `new Date("2026-08-20")`는 **UTC 자정**으로 파싱돼 KST에선 전날이 된다.
 * 문자열을 직접 쪼개 로컬 기준으로 만들어야 요일이 밀리지 않는다.
 */
export function weekdayOf(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return (new Date(y, m - 1, d).getDay() + 6) % 7;
}

/** 같은 칸인지 — (요일, 끼니)로 본다. 끼니 없는 항목끼리도 같은 칸으로 취급. */
export function slotKey(weekday: number, slot: MealSlot | null): string {
  return `${weekday}:${slot ?? "-"}`;
}

/**
 * 프리셋 적용 계획을 세운다 — **빈 자리만 채우고** 이미 있는 칸은 건너뛴다.
 * (덮어쓰면 사용자가 공들여 짠 주간 계획이 조용히 사라진다.)
 *
 * @param dates 적용할 주의 날짜들(월~일)
 * @param items 프리셋 항목
 * @param occupied 이미 계획·기록이 있는 칸의 slotKey 집합
 */
export function planPresetApply(
  dates: string[],
  items: PresetItemResponse[],
  occupied: Set<string>,
): { toCreate: (PresetItemResponse & { date: string })[]; skipped: number } {
  const byWeekday = new Map<number, string>();
  for (const d of dates) byWeekday.set(weekdayOf(d), d);

  const toCreate: (PresetItemResponse & { date: string })[] = [];
  let skipped = 0;
  // 같은 주에 같은 칸이 두 번 만들어지지 않게, 이번 적용에서 채운 칸도 함께 센다.
  const taken = new Set(occupied);

  for (const item of items) {
    const date = byWeekday.get(item.weekday);
    if (!date) continue; // 적용 범위에 그 요일이 없음(부분 주)
    const key = slotKey(item.weekday, item.slot);
    if (taken.has(key)) {
      skipped += 1;
      continue;
    }
    taken.add(key);
    toCreate.push({ ...item, date });
  }
  return { toCreate, skipped };
}
