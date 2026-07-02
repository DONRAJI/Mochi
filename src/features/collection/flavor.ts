/**
 * 카드 플레이버 텍스트 (PRD 7.3 #5) — 수집물에 정서적 애착. 순수 함수.
 * 미획득은 티저(호기심), 획득은 희귀도별 모찌 코멘트.
 */
export function flavorText(rarity: string, acquired: boolean): string {
  if (!acquired) return "아직 못 만난 카드예요. 곧 만나요 👀";
  switch (rarity) {
    case "epic":
      return "에픽! 모찌가 폴짝 뛰었어요 ✨";
    case "rare":
      return "레어 카드예요, 반짝반짝 🌟";
    case "seasonal":
      return "한정 카드! 지금만 만날 수 있어요 🌸";
    default:
      return "모찌랑 같이 모은 한 칸이에요 🍮";
  }
}
