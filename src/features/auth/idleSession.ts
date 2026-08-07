/**
 * 유휴 세션 자동 로그아웃 (클라 전용) — '로그인 유지'를 안 한 경우, 앱을 오래 떠나 있으면 재로그인.
 *
 * 웹/TWA엔 '앱 스와이프 종료' 이벤트가 없어(죽는 순간 코드 실행 불가) '종료 시점'을 못 잡는다.
 * 대신 '마지막 활동 시각'을 localStorage에 남겨, 다시 열었을 때 떠나 있던 시간이 임계 초과면 로그아웃.
 * (토큰이 아니라 타임스탬프만 저장 — security.md의 '토큰 localStorage 금지'와 무관.)
 */
const MODE_KEY = "mochi:idleMode"; // "1"이면 유휴 로그아웃 대상(비유지 로그인)
const ACTIVE_KEY = "mochi:lastActive";

/** 앱을 이만큼 이상 떠나 있으면(마지막 활동 이후) 자동 로그아웃. 필요하면 이 값만 조정. */
export const IDLE_LOGOUT_MS = 30 * 60 * 1000; // 30분

function store(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

/** 로그인 시: remember면 유휴 로그아웃 비활성(플래그 제거), 아니면 활성(지금을 마지막 활동으로). */
export function setIdleSession(remember: boolean): void {
  const s = store();
  if (!s) return;
  if (remember) {
    s.removeItem(MODE_KEY);
    s.removeItem(ACTIVE_KEY);
  } else {
    s.setItem(MODE_KEY, "1");
    s.setItem(ACTIVE_KEY, String(Date.now()));
  }
}

/** 활동/백그라운드 진입 시 마지막 활동 시각 갱신 (유휴 모드일 때만). */
export function touchActive(): void {
  const s = store();
  if (!s || s.getItem(MODE_KEY) !== "1") return;
  s.setItem(ACTIVE_KEY, String(Date.now()));
}

/** 유휴 모드인데 마지막 활동 이후 임계를 넘겼는지. */
export function isIdleExpired(): boolean {
  const s = store();
  if (!s || s.getItem(MODE_KEY) !== "1") return false;
  const last = Number(s.getItem(ACTIVE_KEY) ?? 0);
  return Date.now() - last > IDLE_LOGOUT_MS;
}

/** 로그아웃/탈퇴 시 플래그 정리. */
export function clearIdleSession(): void {
  const s = store();
  if (!s) return;
  s.removeItem(MODE_KEY);
  s.removeItem(ACTIVE_KEY);
}
