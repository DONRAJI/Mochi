/**
 * '첫 발견' 씨앗(+1)을 무엇으로 판단할지 (순수) — PRD 12.2.
 *
 * 왜: 예전엔 레시피·편의점 **카탈로그**를 고를 때만 첫 발견이었다(도감 CollectionEntry가 생길 때).
 * 직접 입력·밖에서 먹기(음식 사전)·외식 메뉴로 기록하는 사람은 영영 못 받아서, 요리하는 사람은 첫날
 * 세 끼로 약 7씨앗(첫 뽑기 가능), 밖에서 먹는 사람은 4씨앗(첫날 뽑기 불가) — 비요리 동등(불변 #5) 위반.
 * 이제 **처음 기록하는 음식 이름·메뉴**도 첫 발견이다.
 *
 * 마이그레이션 없이 '이 사람이 전에 이걸 기록한 적 있나'를 기록 표에서 찾는다(도감 종류 enum을 늘리면
 * 코드가 먼저 배포됐을 때 '먹었어요' 자체가 깨진다). 새 이름을 계속 지어내는 반복은 요리 카탈로그
 * 1천여 개를 돌려 고르는 것과 같은 수준이라, 씨앗 일일 상한(DAILY_SEED_CAP)이 공통 방어선이다.
 * 사진만 올린 기록은 무엇을 먹었는지 모르니 첫 발견이 없다.
 */

export type DiscoveryCheck =
  /** 레시피·편의점 카탈로그 — 기존대로 도감(CollectionEntry)이 새로 생겼는지로 판단 */
  | { kind: "catalog" }
  /** 외식 카탈로그 메뉴 — 같은 메뉴를 기록한 적 있는지 */
  | { kind: "menu"; refId: string }
  /** 음식 사전·직접 입력 — 같은 이름으로 기록한 적 있는지 */
  | { kind: "name"; name: string }
  | null;

export function discoveryCheckFor(input: {
  mode: "cook" | "eatout" | "convenience";
  refId?: string | null;
  /** 음식 사전 이름 또는 직접 입력한 이름 (refId가 없을 때 기록에 남는 title) */
  name?: string | null;
}): DiscoveryCheck {
  if (input.refId) {
    return input.mode === "eatout" ? { kind: "menu", refId: input.refId } : { kind: "catalog" };
  }
  const name = input.name?.trim();
  return name ? { kind: "name", name } : null;
}
