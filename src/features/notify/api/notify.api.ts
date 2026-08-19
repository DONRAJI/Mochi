import { fetcher } from "@/lib/fetcher";
import type { PushKeyResponse, PushSubscribeRequest } from "../types";

export function fetchPushKey(): Promise<PushKeyResponse> {
  return fetcher<PushKeyResponse>("/api/push/public-key");
}

export function subscribePush(input: PushSubscribeRequest): Promise<{ done: true }> {
  return fetcher<{ done: true }>("/api/push/subscribe", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function unsubscribePush(endpoint: string): Promise<{ done: true }> {
  return fetcher<{ done: true }>("/api/push/subscribe", {
    method: "DELETE",
    body: JSON.stringify({ endpoint }),
  });
}

/** 네이티브(FCM) 토큰 등록 — Capacitor 셸에서만 호출된다. */
export function registerDevice(token: string, platform: "android" | "ios"): Promise<{ done: true }> {
  return fetcher<{ done: true }>("/api/push/device", {
    method: "POST",
    body: JSON.stringify({ token, platform }),
  });
}

export function unregisterDevice(token: string): Promise<{ done: true }> {
  return fetcher<{ done: true }>("/api/push/device", {
    method: "DELETE",
    body: JSON.stringify({ token }),
  });
}
