/**
 * 모찌 보이스 카피 중앙화 (제품 불변 규칙 #1: 죄책감 제로).
 * 에러·검증·빈 상태 문구는 전부 여기서. "실패/오류/❌" 같은 단어·빨강 강조 금지, 부드러운 톤.
 * (이 규칙은 messages.test.ts가 자동 검사한다 — 금지어가 들어가면 테스트가 깨진다.)
 */
export const messages = {
  error: {
    UNAUTHORIZED: "로그인이 필요해요.",
    FORBIDDEN: "여긴 살짝 잠겨 있어요.",
    NOT_FOUND: "찾는 걸 못 찾았어요.",
    VALIDATION: "입력을 한 번만 더 봐줄래요?",
    INTERNAL: "잠깐 문제가 생겼어요. 다시 시도해 주세요.",
    RATE_LIMITED: "조금 천천히, 잠시 후 다시 와줄래요?",
  },
  auth: {
    emailTaken: "이미 함께하고 있는 이메일이에요.",
    invalidCredentials: "이메일이나 비밀번호를 한 번만 더 봐줄래요?",
    loginRequired: "로그인이 필요해요.",
  },
  empty: {
    fridge: "냉장고가 비어도 괜찮아요 — 외식 모드 볼까요?",
    meals: "오늘은 모찌가 메뉴를 고르는 중이에요.",
  },
  mochi: {
    greet: "왔어요? 오늘도 같이 잘 먹어봐요.",
    rest: "쉬어가도 괜찮아요.",
    expirySoon: (name: string) => `${name} 곧 써볼까요?`,
  },
} as const;
