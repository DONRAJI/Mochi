/**
 * 레시피 카드·상세의 메타 한 줄 (조리시간 · 분량 · 칼로리).
 *
 * ⚠️ **kcal은 1인분 기준**이다. 예전엔 "4인분 · 70kcal"처럼 나란히 찍혀 그 숫자가
 * 한 그릇인지 냄비 전체인지 알 수 없었다. 분량과 기준을 갈라 적어 오해를 없앤다.
 * (저장값·'먹었어요' 기록·칼로리 예산이 모두 1인분 기준이라 표시도 여기 맞춘다.)
 */
export function servingsLabel(minutes: number | null, servings: number | null): string | null {
  if (minutes == null) return null;
  // 1인분짜리는 "1인분 분량"이라 쓰면 어색하다 — 분량 표기를 생략한다.
  const portion = servings != null && servings > 1 ? ` · ${servings}인분 분량` : "";
  return `⏱ ${minutes}분${portion}`;
}

/** 칼로리 표기 — 몇 인분이든 **1인분 기준**임을 문구로 못박는다. detail 모드에서만 값이 온다(#4). */
export function kcalLabel(kcal: number | null): string | null {
  return kcal == null ? null : `1인분 ${kcal}kcal`;
}
