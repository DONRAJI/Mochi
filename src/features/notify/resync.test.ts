import { describe, it, expect, beforeEach, vi } from "vitest";
import { NATIVE_TOKEN_KEY, resyncNativePush } from "./native";

/** 셸이 주입하는 PushNotifications 브릿지 흉내 — register()가 registration 이벤트로 토큰을 준다. */
function installBridge(opts: { permission: "granted" | "denied"; token?: string }) {
  const listeners: Record<string, (arg: unknown) => void> = {};
  window.Capacitor = {
    isNativePlatform: () => true,
    getPlatform: () => "android",
    Plugins: {
      PushNotifications: {
        checkPermissions: () => ({ receive: opts.permission }),
        requestPermissions: () => ({ receive: opts.permission }),
        register: () => {
          listeners.registration?.({ value: opts.token ?? "fresh-token" });
        },
        unregister: () => {},
        addListener: (event: string, fn: (arg: never) => void) => {
          listeners[event] = fn as (arg: unknown) => void;
          return { remove: () => {} };
        },
      },
    },
  } as unknown as Window["Capacitor"];
}

describe("앱 알림 토큰 재동기화", () => {
  beforeEach(() => {
    localStorage.clear();
    delete window.Capacitor;
  });

  it("리마인더를 켠 적 없는 기기는 아무것도 안 한다", async () => {
    installBridge({ permission: "granted" });
    const send = vi.fn().mockResolvedValue(undefined);
    await resyncNativePush(send);
    expect(send).not.toHaveBeenCalled();
  });

  it("켜 둔 기기는 현재 토큰을 서버에 다시 등록한다 — 서버 토큰만 사라진 상태 복구", async () => {
    localStorage.setItem(NATIVE_TOKEN_KEY, "old-token");
    installBridge({ permission: "granted", token: "new-token" });
    const send = vi.fn().mockResolvedValue(undefined);
    await resyncNativePush(send);
    expect(send).toHaveBeenCalledWith("new-token");
    expect(localStorage.getItem(NATIVE_TOKEN_KEY)).toBe("new-token");
  });

  it("휴대폰 설정에서 알림 권한을 끄면 '꺼짐'으로 맞춘다", async () => {
    localStorage.setItem(NATIVE_TOKEN_KEY, "old-token");
    installBridge({ permission: "denied" });
    const send = vi.fn();
    await resyncNativePush(send);
    expect(send).not.toHaveBeenCalled();
    expect(localStorage.getItem(NATIVE_TOKEN_KEY)).toBeNull();
  });

  it("로그인 전(서버 거절)이면 조용히 넘기고 토큰은 남겨 다음에 다시", async () => {
    localStorage.setItem(NATIVE_TOKEN_KEY, "old-token");
    installBridge({ permission: "granted", token: "new-token" });
    const send = vi.fn().mockRejectedValue(new Error("401"));
    await expect(resyncNativePush(send)).resolves.toBeUndefined();
    expect(localStorage.getItem(NATIVE_TOKEN_KEY)).toBe("old-token");
  });
});
