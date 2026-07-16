/**
 * 이미지 매직바이트 감지 (순수 함수) — 업로드 파일의 실제 형식을 앞바이트로 확인.
 * 클라가 보낸 content-type 헤더는 위조 가능하므로(security.md §6), 서버는 바이트로 재검증한다.
 * 지원: JPEG · PNG · WebP · HEIC/HEIF. 알 수 없으면 null(=이미지 아님으로 거절).
 */
export type DetectedImage = "image/jpeg" | "image/png" | "image/webp" | "image/heic";

function ascii(b: Uint8Array, offset: number, text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    if (b[offset + i] !== text.charCodeAt(i)) return false;
  }
  return true;
}

/** ISO-BMFF(HEIC/HEIF) ftyp 브랜드 화이트리스트. */
const HEIF_BRANDS = new Set([
  "heic",
  "heix",
  "hevc",
  "hevx",
  "heim",
  "heis",
  "hevm",
  "hevs",
  "mif1",
  "msf1",
  "heif",
]);

export function detectImageType(buffer: ArrayBuffer): DetectedImage | null {
  const b = new Uint8Array(buffer);
  if (b.length < 12) return null;

  // JPEG: FF D8 FF
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47 &&
    b[4] === 0x0d &&
    b[5] === 0x0a &&
    b[6] === 0x1a &&
    b[7] === 0x0a
  ) {
    return "image/png";
  }

  // WebP: "RIFF"....(size)...."WEBP"
  if (ascii(b, 0, "RIFF") && ascii(b, 8, "WEBP")) return "image/webp";

  // HEIC/HEIF: box "ftyp" at offset 4 + 지원 브랜드
  if (ascii(b, 4, "ftyp")) {
    const brand = String.fromCharCode(b[8], b[9], b[10], b[11]);
    if (HEIF_BRANDS.has(brand)) return "image/heic";
  }

  return null;
}
