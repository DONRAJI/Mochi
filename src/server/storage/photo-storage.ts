import "server-only";
import { AppError } from "@/lib/api-response";

/**
 * Supabase Storage — 식사 사진 업로드/서명 (REST API, 새 의존성 없음).
 * 비공개 버킷이라 읽을 땐 짧은 만료의 **서명 URL**을 발급한다(개인 음식 사진 프라이버시).
 * 서버 전용: 시크릿 키는 절대 클라로 새지 않는다(security.md §1·§6).
 */

const URL_BASE = process.env.SUPABASE_URL?.trim().replace(/\/$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(); // .env에 뒤 공백이 있어도 안전하게 trim
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET?.trim();

/** 허용 이미지 MIME (security.md §6 화이트리스트). */
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
/** 서버 최종 방어 상한 — 클라 리사이즈 후엔 훨씬 작다. */
const MAX_BYTES = 10 * 1024 * 1024;

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

function config() {
  if (!URL_BASE || !KEY || !BUCKET) {
    // env 미설정 = 기능 미구성. 서버 로그로만, 사용자에겐 부드럽게.
    throw new AppError("INTERNAL", "사진 기능이 아직 준비 중이에요.", 500);
  }
  return { base: `${URL_BASE}/storage/v1`, key: KEY, bucket: BUCKET };
}

/** 경로 세그먼트를 각각 인코딩(버킷명의 공백 등도 안전하게). */
function encodePath(bucket: string, path: string): string {
  const b = encodeURIComponent(bucket);
  const p = path.split("/").map(encodeURIComponent).join("/");
  return `${b}/${p}`;
}

/**
 * 업로드 — 타입·크기를 서버에서 검증하고 **파일명을 서버가 재생성**(경로 조작 방지, security.md §6).
 * 반환 = 버킷 상대 경로(경로만 DB에 저장, 공개 URL 저장 안 함).
 */
export async function uploadMealPhoto(
  userId: string,
  bytes: ArrayBuffer,
  contentType: string,
): Promise<string> {
  if (!ALLOWED.has(contentType)) {
    throw new AppError("VALIDATION", "이미지 파일만 올릴 수 있어요.", 400);
  }
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) {
    throw new AppError("VALIDATION", "사진이 조금 커요. 다시 골라볼까요?", 400);
  }
  const { base, key, bucket } = config();
  const name = `${crypto.randomUUID()}.${EXT[contentType] ?? "jpg"}`;
  const path = `${userId}/${name}`; // 사용자별 폴더
  const res = await fetch(`${base}/object/${encodePath(bucket, path)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
      "Content-Type": contentType,
      "x-upsert": "false",
    },
    body: bytes,
  });
  if (!res.ok) {
    console.error("[storage] upload failed", res.status, await res.text().catch(() => ""));
    throw new AppError("INTERNAL", "사진을 저장하지 못했어요. 잠시 후 다시 해볼까요?", 502);
  }
  return path;
}

/** 서명 URL 발급(기본 1시간) — 비공개 버킷 읽기용. 실패해도 기록은 유지되게 null 반환. */
export async function signMealPhoto(path: string, expiresIn = 3600): Promise<string | null> {
  const { base, key, bucket } = config();
  const res = await fetch(`${base}/object/sign/${encodePath(bucket, path)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn }),
  });
  if (!res.ok) return null;
  const data = (await res.json().catch(() => null)) as { signedURL?: string } | null;
  if (!data?.signedURL) return null;
  // signedURL은 "/object/sign/…?token=…" 상대경로 → 전체 URL로.
  return `${base}${data.signedURL.startsWith("/") ? "" : "/"}${data.signedURL}`;
}
