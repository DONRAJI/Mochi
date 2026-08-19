/**
 * Capacitor 셸 브릿지 접근 — **npm 패키지를 import하지 않는다.**
 *
 * 왜: 셸은 원격 URL 모드라 이 웹앱을 그대로 로드하고, Capacitor 런타임은 셸이
 * `window.Capacitor`로 **주입**한다. `@capacitor/push-notifications`를 웹에서 import하면
 * 브라우저 사용자에게도 내려가는 죽은 코드가 되고 새 의존성만 는다. 주입된 객체를 직접
 * 쓰면 웹 번들 의존성 0으로 같은 일을 한다. (셸 전용 패키지는 native/ 폴더에만 존재.)
 *
 * 타입은 우리가 실제로 부르는 표면만 최소로 선언한다 — 셸 SDK 타입을 끌어오지 않으려고.
 */

interface PermissionStatus {
  receive: "prompt" | "prompt-with-rationale" | "granted" | "denied";
}

interface PushNotificationsPlugin {
  checkPermissions(): Promise<PermissionStatus>;
  requestPermissions(): Promise<PermissionStatus>;
  register(): Promise<void>;
  unregister(): Promise<void>;
  addListener(
    event: "registration",
    fn: (token: { value: string }) => void,
  ): Promise<{ remove: () => Promise<void> }>;
  addListener(
    event: "registrationError",
    fn: (err: unknown) => void,
  ): Promise<{ remove: () => Promise<void> }>;
  /** 알림을 탭했을 때 — data.url로 이동시킨다(서버 fcm.ts가 실어 보낸 값). */
  addListener(
    event: "pushNotificationActionPerformed",
    fn: (e: { notification?: { data?: Record<string, string> } }) => void,
  ): Promise<{ remove: () => Promise<void> }>;
}

/** 셸이 주입하는 나머지 플러그인 — 우리가 부르는 표면만 최소 선언. */
interface AppPlugin {
  addListener(
    event: "backButton",
    fn: (e: { canGoBack: boolean }) => void,
  ): Promise<{ remove: () => Promise<void> }>;
  exitApp(): Promise<void>;
}

interface BrowserPlugin {
  open(options: { url: string }): Promise<void>;
}

interface SplashScreenPlugin {
  hide(): Promise<void>;
}

interface CapacitorBridge {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
  Plugins?: {
    PushNotifications?: PushNotificationsPlugin;
    App?: AppPlugin;
    Browser?: BrowserPlugin;
    SplashScreen?: SplashScreenPlugin;
  };
}

declare global {
  interface Window {
    Capacitor?: CapacitorBridge;
  }
}

/**
 * 기기에 남기는 FCM 토큰 — 플러그인이 '이미 등록됐나'를 질의할 방법을 주지 않아서,
 * 설정 화면이 켜짐/꺼짐을 판단하는 근거로 쓴다. 토큰은 비밀이 아니라 기기 식별자다.
 */
export const NATIVE_TOKEN_KEY = "mochi_push_token";

/** 네이티브 셸 안에서 도는 중인가 (브라우저면 false). */
export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  return window.Capacitor?.isNativePlatform?.() === true;
}

export function nativePlatform(): "android" | "ios" {
  return window.Capacitor?.getPlatform?.() === "ios" ? "ios" : "android";
}

function plugin(): PushNotificationsPlugin | null {
  return window.Capacitor?.Plugins?.PushNotifications ?? null;
}

/** 셸 플러그인 접근자 — 브라우저에선 전부 undefined라 호출부가 옵셔널 체이닝으로 넘긴다. */
export function nativePlugins() {
  const p = typeof window === "undefined" ? undefined : window.Capacitor?.Plugins;
  return {
    push: p?.PushNotifications,
    app: p?.App,
    browser: p?.Browser,
    splash: p?.SplashScreen,
  };
}

/**
 * 네이티브 푸시 등록 → FCM 토큰을 받아 돌려준다.
 *
 * 토큰은 `register()`의 반환값이 아니라 **'registration' 이벤트로 비동기 도착**하므로,
 * 리스너를 먼저 걸고 기다린다. 응답이 없을 때 UI가 영영 "켜는 중…"에 머물지 않게 타임아웃.
 */
export async function registerNativePush(timeoutMs = 15_000): Promise<string> {
  const push = plugin();
  if (!push) throw new Error("잠깐 준비가 안 됐어요. 다음에 다시 볼까요?");

  let status = await push.checkPermissions();
  if (status.receive !== "granted") status = await push.requestPermissions();
  if (status.receive !== "granted") {
    throw new Error("알림을 허용해 주시면 켤 수 있어요.");
  }

  return new Promise<string>((resolve, reject) => {
    let settled = false;
    const handles: { remove: () => Promise<void> }[] = [];
    const cleanup = () => handles.forEach((h) => void h.remove().catch(() => {}));

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("잠깐 안 됐어요. 다시 해볼까요?"));
    }, timeoutMs);

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      cleanup();
      fn();
    };

    push
      .addListener("registration", (t) => finish(() => resolve(t.value)))
      .then((h) => handles.push(h))
      .catch(() => {});
    push
      .addListener("registrationError", () =>
        finish(() => reject(new Error("잠깐 안 됐어요. 다시 해볼까요?"))),
      )
      .then((h) => handles.push(h))
      .catch(() => {});

    push.register().catch(() => finish(() => reject(new Error("잠깐 안 됐어요. 다시 해볼까요?"))));
  });
}

/** 네이티브 푸시 해지 (기기 쪽). 서버 토큰 삭제는 호출부가 따로 한다. */
export async function unregisterNativePush(): Promise<void> {
  await plugin()?.unregister().catch(() => {});
}

/**
 * 로그아웃 시 이 기기의 푸시 토큰을 서버에서 떼어낸다.
 * 브라우저에선 아무것도 하지 않고, 실패해도 로그아웃을 막지 않는다.
 */
export async function releaseNativePushToken(): Promise<void> {
  if (!isNativeApp()) return;
  const token = localStorage.getItem(NATIVE_TOKEN_KEY);
  if (!token) return;
  try {
    const { unregisterDevice } = await import("./api/notify.api");
    await unregisterDevice(token);
  } catch {
    // 서버에 못 알려도 기기 쪽 정리는 계속 — 다음 로그인 때 토큰이 새 주인으로 갱신된다.
  }
  await unregisterNativePush();
  localStorage.removeItem(NATIVE_TOKEN_KEY);
}
