import { describe, it, expect } from "vitest";
import { detectImageType } from "./imageType";

/** 앞바이트만 있으면 감지되므로 시그니처 + 패딩으로 최소 버퍼를 만든다. */
function buf(bytes: number[]): ArrayBuffer {
  const arr = new Uint8Array(16);
  arr.set(bytes);
  return arr.buffer;
}
function withAscii(offset: number, text: string, extra: [number, string][] = []): ArrayBuffer {
  const arr = new Uint8Array(16);
  const put = (o: number, t: string) => {
    for (let i = 0; i < t.length; i++) arr[o + i] = t.charCodeAt(i);
  };
  put(offset, text);
  for (const [o, t] of extra) put(o, t);
  return arr.buffer;
}

describe("detectImageType — 매직바이트 감지", () => {
  it("JPEG (FF D8 FF)", () => {
    expect(detectImageType(buf([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
  });
  it("PNG 시그니처", () => {
    expect(detectImageType(buf([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
  });
  it("WebP (RIFF....WEBP)", () => {
    expect(detectImageType(withAscii(0, "RIFF", [[8, "WEBP"]]))).toBe("image/webp");
  });
  it("HEIC (ftyp + heic 브랜드)", () => {
    expect(detectImageType(withAscii(4, "ftyp", [[8, "heic"]]))).toBe("image/heic");
    expect(detectImageType(withAscii(4, "ftyp", [[8, "mif1"]]))).toBe("image/heic");
  });

  it("이미지가 아니면 null (위조 헤더 방어)", () => {
    expect(detectImageType(buf([0x25, 0x50, 0x44, 0x46]))).toBeNull(); // %PDF
    expect(detectImageType(buf([0x4d, 0x5a]))).toBeNull(); // MZ(실행파일)
    expect(detectImageType(withAscii(4, "ftyp", [[8, "mp42"]]))).toBeNull(); // mp4 브랜드는 거절
  });
  it("너무 짧은 버퍼는 null", () => {
    expect(detectImageType(new Uint8Array(4).buffer)).toBeNull();
  });
});
