import { describe, it, expect } from "vitest";
import {
  DISCOVERY_ITEMS,
  FEATURE_GUIDE,
  FEATURE_GUIDE_HREF,
  featureTourStorageKey,
  shouldShowFeatureTour,
} from "./featureGuide";

/** 실제로 있는 화면(src/app/(main)) — 안내가 없는 곳으로 보내지 않게 */
const APP_ROUTES = [
  "/",
  "/fridge",
  "/meals",
  "/collection",
  "/me",
  "/me/weight",
  "/me/history",
  "/me/settings",
];
/** 식단 탭이 받는 딥링크(MealsScreen) */
const MEALS_PARAMS = ["segment=outside", "view=week"];
/** messages.test.ts와 같은 금지어 — 안내 문구도 죄책감 제로(불변 #1) */
const BANNED = ["실패", "오류", "에러", "경고", "잘못", "❌", "금지", "초과"];

const items = FEATURE_GUIDE.flatMap((s) => s.items);

describe("기능 안내", () => {
  it("모든 바로가기가 실제 화면·딥링크로 간다", () => {
    for (const { href } of [...items, ...DISCOVERY_ITEMS]) {
      if (href == null) continue;
      const [path, query] = href.split("?");
      expect(APP_ROUTES).toContain(path);
      if (query) expect(MEALS_PARAMS).toContain(query);
    }
    expect(FEATURE_GUIDE_HREF).toBe("/me/guide");
  });

  it("항목 키가 겹치지 않고, 홈 소개 카드 항목은 모두 사용법 페이지에도 있다", () => {
    const keys = items.map((i) => i.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const d of DISCOVERY_ITEMS) expect(keys).toContain(d.key);
  });

  it("안내 문구에 금지어가 없다", () => {
    const copy = [
      ...FEATURE_GUIDE.flatMap((s) => [
        s.title,
        ...s.items.flatMap((i) => [i.title, i.where, i.body]),
      ]),
      ...DISCOVERY_ITEMS.flatMap((d) => [d.label, d.hint]),
    ];
    for (const word of BANNED) expect(copy.filter((c) => c.includes(word))).toEqual([]);
  });

  it("홈 소개 카드엔 숫자가 없다 (불변 #2)", () => {
    for (const d of DISCOVERY_ITEMS) expect(`${d.label}${d.hint}`).not.toMatch(/\d/);
  });
});

describe("첫 모찌 뒤 소개 카드", () => {
  it("첫 모찌를 뽑기 전엔 첫 안내가 있으니 띄우지 않는다", () => {
    expect(shouldShowFeatureTour({ collectedCount: 0, dismissed: false })).toBe(false);
  });

  it("첫 모찌 뒤 한 번 — 닫으면 다시 안 뜬다", () => {
    expect(shouldShowFeatureTour({ collectedCount: 1, dismissed: false })).toBe(true);
    expect(shouldShowFeatureTour({ collectedCount: 12, dismissed: true })).toBe(false);
  });

  it("닫은 기록은 계정별이다", () => {
    expect(featureTourStorageKey("a")).not.toBe(featureTourStorageKey("b"));
  });
});
