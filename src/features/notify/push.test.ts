import { describe, it, expect } from "vitest";
import { urlBase64ToUint8Array } from "./push";
import { pushUnsubscribeSchema } from "./types";

describe("웹푸시 공개키 변환", () => {
  it("base64url을 원래 바이트로 되돌린다 (패딩 없는 입력 포함)", () => {
    const bytes = Uint8Array.from([4, 255, 0, 128, 62, 63, 250, 251]);
    const b64url = Buffer.from(bytes).toString("base64url");
    expect(b64url).not.toContain("="); // base64url은 패딩이 없다 — 그 입력을 처리해야 함
    expect(Array.from(urlBase64ToUint8Array(b64url))).toEqual(Array.from(bytes));
  });

  it("VAPID 공개키 형태(65바이트, 0x04 시작)를 보존한다", () => {
    const key = Uint8Array.from([4, ...Array.from({ length: 64 }, (_, i) => i)]);
    const out = urlBase64ToUint8Array(Buffer.from(key).toString("base64url"));
    expect(out.length).toBe(65);
    expect(out[0]).toBe(4);
  });
});

describe("웹푸시 해지 요청", () => {
  it("endpoint를 주면 그 구독 하나만 지목한다", () => {
    const parsed = pushUnsubscribeSchema.safeParse({
      endpoint: "https://fcm.googleapis.com/fcm/send/abc",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.endpoint).toBe("https://fcm.googleapis.com/fcm/send/abc");
  });

  it("endpoint가 없으면 '내 구독 전부 해지'로 통과한다 — 앱이 채널을 가져갈 때 쓰는 길", () => {
    const parsed = pushUnsubscribeSchema.safeParse({});
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.endpoint).toBeUndefined();
  });

  it("endpoint가 URL이 아니면 거부한다 (있을 땐 여전히 검증)", () => {
    expect(pushUnsubscribeSchema.safeParse({ endpoint: "not-a-url" }).success).toBe(false);
  });
});
