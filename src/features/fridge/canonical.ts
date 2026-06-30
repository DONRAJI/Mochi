/**
 * 재료명 정규화 — 별칭(토마토)을 표준명(방울토마토)으로 매핑해 매칭 정확도를 높인다.
 * 재료 마스터(IngredientMaster)에서 맵을 만들어 recommend 매칭·collection 도감에서 공용으로 쓴다.
 */
export function buildCanonicalMap(masters: { name: string; aliases: string[] }[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const m of masters) {
    map.set(m.name, m.name);
    for (const alias of m.aliases) map.set(alias, m.name);
  }
  return map;
}

export function canonicalize(name: string, map: Map<string, string>): string {
  return map.get(name) ?? name;
}
