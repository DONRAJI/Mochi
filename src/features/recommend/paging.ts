/**
 * 추천 목록 페이지 나누기 (순수).
 *
 * 주간 식단을 별도 뷰로 뺀 뒤(1c9da4c) 추천이 최대 50장 한 줄로 쭉 이어져 스크롤이 길어졌다.
 * 번호 페이지로 끊어 한 화면에 몇 장씩만 보여준다. 서버는 이미 상위 50개만 주므로 클라에서 자른다.
 */

/** 한 페이지 카드 수 — 분리 전 '처음에 보여주던 개수(6)'와 같게 두어 화면 높이 감각을 유지한다. */
export const RECIPE_PAGE_SIZE = 6;

/** 전체 페이지 수. 비어 있어도 1(“1 / 1”) — 0페이지 상태를 만들지 않는다. */
export function pageCount(total: number, size = RECIPE_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / size));
}

/**
 * 요청한 페이지를 유효 범위로 맞춘다. 즐겨찾기·데이터 갱신으로 목록이 줄어들면
 * 보고 있던 페이지가 사라질 수 있는데, 그때 빈 화면 대신 마지막 페이지를 보여준다.
 */
export function clampPage(page: number, total: number, size = RECIPE_PAGE_SIZE): number {
  return Math.min(Math.max(0, page), pageCount(total, size) - 1);
}

/** 해당 페이지의 항목들. 페이지는 0부터. */
export function pageSlice<T>(items: readonly T[], page: number, size = RECIPE_PAGE_SIZE): T[] {
  const p = clampPage(page, items.length, size);
  return items.slice(p * size, p * size + size);
}
