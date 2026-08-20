import { describe, it, expect } from "vitest";
import {
  estimateGrams,
  readQuantity,
  cleanIngredientName,
  plausibleKcal,
  MAX_PLAUSIBLE_KCAL,
} from "./kcalEstimate";

describe("재료 그램 추정", () => {
  it("g/ml이 적혀 있으면 그 값을 그대로 쓴다", () => {
    // 덤프는 "양배추 1/4통(200g)"처럼 병기가 흔하다 — 단위 추정보다 항상 우선.
    expect(estimateGrams("양배추 1/4통(200g)", "양배추", false)).toBe(200);
    expect(estimateGrams("느타리버섯 1줌(100g)", "느타리버섯", false)).toBe(100);
    expect(estimateGrams("두부 1/2모(150g)", "두부", false)).toBe(150);
  });

  it("⚠️ 국물용 멸치는 1마리 1g — 2,061kcal 버그의 진원지", () => {
    // 예전엔 모든 '마리'를 800g으로 잡아 멸치 10마리가 8kg이 됐다.
    expect(estimateGrams("국물용 멸치 10마리", "국물용멸치", false)).toBe(10);
    expect(estimateGrams("다시멸치 20마리", "다시멸치", false)).toBe(20);
  });

  it("'마리'는 재료마다 무게가 다르다", () => {
    expect(estimateGrams("새우 5마리", "새우", false)).toBe(75);
    expect(estimateGrams("오징어 1마리", "오징어", false)).toBe(250);
    expect(estimateGrams("닭 1마리", "닭", false)).toBe(800);
    // 모르는 재료는 보수적으로(800은 대형 가금·생선 전용)
    expect(estimateGrams("무언가 1마리", "무언가", false)).toBe(200);
  });

  it("⚠️ 양배추를 배추로 오인하지 않는다", () => {
    // `/배추/` 부분일치 때문에 양배추가 800g으로 잡히던 버그.
    expect(estimateGrams("양배추 1개", "양배추", false)).toBe(1000);
    expect(estimateGrams("배추 1개", "배추", false)).toBe(800);
  });

  it("단위는 수량 뒤에 올 때만 인정한다", () => {
    // 예전엔 이름에 '모'가 있기만 해도 두부 1모(300g)로 잡혔다.
    expect(estimateGrams("두부 1/2모", "두부", false)).toBe(150);
    expect(estimateGrams("모둠채소", "모둠채소", false)).toBe(50); // 단위 아님 → 기본량
  });

  it("스푼류는 큰술 무게로, 수북하면 더 무겁게", () => {
    expect(estimateGrams("된장 2큰술", "된장", true)).toBe(17);
    expect(estimateGrams("설탕 1큰술 수북히", "설탕", true)).toBe(13.5);
    expect(estimateGrams("간장 적당량", "간장", true)).toBe(8.5);
    expect(estimateGrams("식용유 적당량", "식용유", true)).toBe(20);
  });

  it("⚠️ 작은술·숟갈도 스푼으로 센다 — 빠지면 기본량 50g으로 빠진다", () => {
    // "다진마늘 1작은술"이 50g(75kcal)으로 잡히던 버그. 작은술은 큰술의 1/3.
    expect(estimateGrams("다진마늘 1작은술", "다진마늘", true)).toBe(3);
    expect(estimateGrams("설탕 2작은술", "설탕", true)).toBe(6);
    expect(estimateGrams("간장 1숟갈", "간장", true)).toBe(8.5);
    // 분수 수량도 살린다 — 정규식으로 "1/2"를 잡으면 parseFloat가 1로 읽는다.
    expect(estimateGrams("설탕 1/2숟갈", "설탕", true)).toBe(4.25);
  });

  it("낱개가 작은 재료는 기본 100g을 쓰지 않는다", () => {
    // "떡볶이떡 45개 = 4.5kg" 같은 값이 나오던 문제.
    expect(estimateGrams("떡볶이떡 45개", "떡볶이떡", false)).toBe(450);
    expect(estimateGrams("김 15장", "김", false)).toBe(30);
    expect(estimateGrams("비엔나소시지 6개", "비엔나소시지", false)).toBe(60);
    expect(estimateGrams("오뎅 6장", "오뎅", false)).toBe(180);
  });

  it("개수 단위는 재료별 크기를 쓴다", () => {
    expect(estimateGrams("양파 1개", "양파", false)).toBe(170);
    expect(estimateGrams("계란 2개", "계란", false)).toBe(100);
    expect(estimateGrams("마늘 3개", "마늘", false)).toBe(15);
    expect(estimateGrams("표고버섯 2개", "표고버섯", false)).toBe(40);
    // 청고추가 목록에 없어 100g으로 잡히던 것 — '고추'로 끝나면 전부 5g.
    expect(estimateGrams("청고추 1개", "청고추", false)).toBe(5);
    expect(estimateGrams("홍고추 1개", "홍고추", false)).toBe(5);
  });
});

describe("수량 읽기", () => {
  it("분수와 분수 기호를 해석한다", () => {
    expect(readQuantity("두부 1/2모")).toBe(0.5);
    expect(readQuantity("양배추 ½통")).toBe(0.5);
    expect(readQuantity("당근 2개")).toBe(2);
    expect(readQuantity("소금 약간")).toBe(1); // 수량 없으면 1
  });
});

describe("재료명 정리", () => {
  it("수량·괄호·꾸밈말을 걷어낸다", () => {
    expect(cleanIngredientName("양배추 1/4통(200g)")).toBe("양배추");
    expect(cleanIngredientName("다진 마늘 1T")).toBe("다진 마늘");
    expect(cleanIngredientName("소금 약간")).toBe("소금");
  });
});

describe("추정치 상한", () => {
  it("현실적인 값은 반올림해 그대로 통과", () => {
    expect(plausibleKcal(70.4)).toBe(70);
    expect(plausibleKcal(MAX_PLAUSIBLE_KCAL)).toBe(MAX_PLAUSIBLE_KCAL);
  });

  it("비현실적이면 값을 싣지 않는다 — 틀린 숫자는 없는 것보다 나쁘다", () => {
    // 이 값은 화면뿐 아니라 '먹었어요' 기록·칼로리 예산에도 들어간다.
    expect(plausibleKcal(4927)).toBeNull();
    expect(plausibleKcal(0)).toBeNull();
  });
});
