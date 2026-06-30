import "server-only";

/**
 * 인메모리 고정 윈도우 레이트 리밋 (security.md §5 — 민감 엔드포인트 보호).
 * ⚠️ 단일 인스턴스 가드다. 프로덕션 멀티 인스턴스(Vercel 등)에선 공유 스토어(Upstash Redis 등)로 교체.
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 5000) pruneExpired(now); // 메모리 방어
    return true;
  }
  if (bucket.count >= max) return false;
  bucket.count += 1;
  return true;
}

function pruneExpired(now: number): void {
  for (const [k, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(k);
  }
}

/** 요청 IP 추출 (프록시 헤더). 없으면 'local'. */
export function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "local";
}
