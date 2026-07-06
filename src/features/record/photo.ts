/**
 * 업로드 전 클라 이미지 리사이즈 (conventions.md — 이미지 업로드 규칙).
 * 장변 ~1600px·품질 0.8 jpeg로 줄여 전송(대용량 차단·비용↓). 외부 라이브러리 없이 브라우저 API만.
 * ⚠️ 클라 최적화는 보안 검증이 아니다 — 타입·크기 최종 검증은 서버가 한다(security.md §6).
 * 디코드 불가(일부 HEIC 등)면 원본을 그대로 반환하고 서버 검증에 맡긴다.
 */
const MAX_EDGE = 1600;
const QUALITY = 0.8;

export async function resizeImage(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITY),
    );
    return blob ?? file;
  } catch {
    return file;
  }
}
