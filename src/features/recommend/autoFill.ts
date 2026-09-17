/**
 * 주간 자동 채우기 — 어떤 요리를 어느 날에 넣을지 (순수).
 *
 * 왜: 예전엔 추천 상위 20개를 1위부터 날짜 순서대로 넣어서, 누를 때마다(다음 주에도) 거의 같은 식단이
 * 나왔다. 🎲 버튼인데 굴리는 맛이 없었다. 그렇다고 전체 레시피에서 무작위로 뽑으면 냉장고 매칭·취향·
 * 자취 현실성 같은 추천의 일이 사라진다. 그래서 **추천 상위 후보 안에서, 순위가 높을수록 조금 더 잘
 * 뽑히게** 섞는다.
 *
 * - 후보 AUTO_FILL_POOL(50)개: 알러지는 이미 빠져 있고, 정렬 기준(냉장고 매칭·취향·자취 점수)이 있어
 *   상위 20개로만 좁힐 이유가 없다. 가중치 1/(1 + 순위/10) — 상위 10개가 약 40%, 11~20위 약 20%,
 *   21~50위 약 40%로 뽑힌다(위가 자주, 아래도 가끔).
 * - 유통기한 임박 재료를 쓰는 요리는 섞지 않고 **가장 가까운 날부터** — 일요일로 밀리면 재료가 상한다.
 * - 한 주 안에서 같은 요리는 두 번 넣지 않고, 이번 주에 이미 담아둔 요리도 뺀다.
 *   (후보가 모자라면 그때만 겹치게 둔다 — 레시피가 아주 적은 경우)
 */

export const AUTO_FILL_POOL = 50;

export interface AutoFillCandidate {
  id: string;
  usesExpiring: boolean;
}

function weightOf(rank: number): number {
  return 1 / (1 + rank / 10);
}

/**
 * @param ranked 추천 순서대로 정렬된 후보
 * @param count 채울 날 수(날짜 순서대로 결과를 배정한다)
 * @param exclude 이번 주에 이미 담긴 요리 id
 * @param random 0 이상 1 미만 난수 — 테스트에서 고정하려고 주입
 */
export function pickAutoFillRecipes<T extends AutoFillCandidate>(
  ranked: readonly T[],
  count: number,
  exclude: ReadonlySet<string> = new Set(),
  random: () => number = Math.random,
): T[] {
  if (count <= 0 || ranked.length === 0) return [];

  const pool = ranked
    .slice(0, AUTO_FILL_POOL)
    .map((item, rank) => ({ item, rank }))
    .filter((c) => !exclude.has(c.item.id));
  const source =
    pool.length > 0 ? pool : ranked.slice(0, AUTO_FILL_POOL).map((item, rank) => ({ item, rank }));

  const picked: T[] = [];
  let remaining = [...source];

  // 임박 재료 요리는 순위대로 가장 가까운 날부터
  for (const c of remaining.filter((c) => c.item.usesExpiring)) {
    if (picked.length >= count) break;
    picked.push(c.item);
  }
  remaining = remaining.filter((c) => !picked.includes(c.item));

  while (picked.length < count) {
    if (remaining.length === 0) remaining = [...source]; // 후보가 모자랄 때만 겹침 허용
    const total = remaining.reduce((sum, c) => sum + weightOf(c.rank), 0);
    let r = random() * total;
    let index = remaining.length - 1;
    for (let i = 0; i < remaining.length; i++) {
      r -= weightOf(remaining[i].rank);
      if (r < 0) {
        index = i;
        break;
      }
    }
    picked.push(remaining[index].item);
    remaining.splice(index, 1);
  }
  return picked;
}
