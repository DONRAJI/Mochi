/**
 * 배달 연결 (PRD 8-1·10) — 제휴/딥링크 전이라 검색으로 연결한다.
 * "결정과 기록은 모찌에서, 주문은 외부에서." 순수 함수라 테스트 용이.
 */
export function deliverySearchUrl(name: string): string {
  return `https://search.naver.com/search.naver?query=${encodeURIComponent(`${name} 배달`)}`;
}
