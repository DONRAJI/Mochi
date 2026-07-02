/**
 * 도감 공유 텍스트 (PRD 7.3#7) — 컬렉션 자랑으로 소셜 바이럴. 순수 함수(테스트 용이).
 */
export function buildShareText(tabLabel: string, acquired: number, url: string): string {
  const head =
    acquired > 0
      ? `모찌에서 ${tabLabel} 도감을 ${acquired}개 모았어요! 🍮`
      : `모찌에서 ${tabLabel} 도감을 모으기 시작했어요 🌱`;
  return `${head}\n오늘 잘 먹었다는 기록, 같이 해요.\n${url}`;
}
