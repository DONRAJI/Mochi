/**
 * 웹푸시 클라 헬퍼 (순수) — VAPID 공개키(base64url 문자열)를
 * `PushManager.subscribe({ applicationServerKey })`가 요구하는 바이트 배열로.
 */
export function urlBase64ToUint8Array(base64url: string): Uint8Array {
  const pad = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}
