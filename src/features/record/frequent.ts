/**
 * 자주 먹은 것 순위 (순수) — 홈의 '또 먹었어요' 한 번 탭 기록용.
 *
 * 왜: 기록하려면 버튼 → 입력창 → 이름 입력 → 저장이라 매일 비슷하게 먹는 사람에겐 그 자체가 일이었다
 * (테스터 피드백: "기록 과정 자체에 피로를 느끼기 쉽다"). 자주 먹는 것 몇 개를 홈에 두고 한 번 탭으로
 * 끝내면, 앱을 여는 이유가 '기록해야 해서'가 아니라 '한 번 누르면 끝나서'가 된다.
 *
 * 묶는 기준: 카탈로그 항목은 (모드, refId), 직접 입력·음식 사전은 이름(공백·대소문자 무시).
 * 정렬: 많이 먹은 순 → 최근에 먹은 순. 사진만 있는 기록(이름 없음)은 다시 기록할 수 없으니 뺀다.
 */
import { searchKeyOf } from "./foodDict";
import type { MealMode } from "@/features/recommend/types";

export interface FrequentSource {
  mode: string;
  refId: string | null;
  /** 카탈로그 항목이면 서버가 해석해 넣은 이름, 직접 입력이면 저장된 이름 */
  title: string | null;
  eatenAt: string; // ISO
}

export interface FrequentMeal {
  /** 화면 key + 중복 방지용 식별자 */
  key: string;
  mode: MealMode;
  refId: string | null;
  title: string;
  count: number;
}

const MODES = new Set(["cook", "eatout", "convenience"]);

export function rankFrequentMeals(rows: FrequentSource[], limit = 3): FrequentMeal[] {
  const groups = new Map<string, FrequentMeal & { lastAt: number }>();

  for (const row of rows) {
    const title = row.title?.trim();
    if (!title || !MODES.has(row.mode)) continue;
    const mode = row.mode as MealMode;
    const key = row.refId ? `${mode}:${row.refId}` : `name:${searchKeyOf(title)}`;
    const at = new Date(row.eatenAt).getTime();
    const found = groups.get(key);
    if (found) {
      found.count += 1;
      // 이름이 같은 기록끼리는 가장 최근 표기를 쓴다(띄어쓰기가 다를 수 있다).
      if (at > found.lastAt) {
        found.lastAt = at;
        found.title = title;
      }
    } else {
      groups.set(key, { key, mode, refId: row.refId, title, count: 1, lastAt: at });
    }
  }

  return [...groups.values()]
    .sort((a, b) => b.count - a.count || b.lastAt - a.lastAt)
    .slice(0, limit)
    .map(({ key, mode, refId, title, count }) => ({ key, mode, refId, title, count }));
}
