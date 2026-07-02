/**
 * 도감 진척 넛지 (PRD 7.3 #2) — "거의 다 왔다는 느낌"이 가장 강한 수집 동기.
 * 순수 함수. ⚠️ 레시피 도감은 1150개라 "앞으로 1147개"는 오히려 의욕을 꺾는다 →
 * 남은 게 적을 때만 "앞으로 N개", 많으면 '발견' 프레이밍으로 긍정적으로.
 */

/** 임박 넛지("앞으로 N개")를 켜는 남은 개수 상한. */
const CLOSE_THRESHOLD = 10;

export function progressMessage(have: number, total: number): string {
  if (total === 0) return "";
  const left = total - have;
  if (left === 0) return "다 모았어요! 🎉";
  if (have === 0) return "첫 칸을 채워볼까요? 🌱";
  if (left <= CLOSE_THRESHOLD) return `앞으로 ${left}개만 더! 🌸`;
  return `${have}개 발견! 계속 모아봐요 🌱`;
}
