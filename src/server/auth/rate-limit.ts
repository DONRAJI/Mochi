import "server-only";

/**
 * 레이트 리밋 (security.md §5 — 민감 엔드포인트 보호).
 * - 공유 스토어(Upstash Redis REST)가 설정돼 있으면 그걸 쓴다 → Vercel 멀티 인스턴스/서버리스에서도 유효.
 * - 없으면 인메모리 폴백(단일 인스턴스/개발용). Upstash 장애 시에도 인메모리로 폴백(가용성 우선).
 * - REST 호출이라 새 의존성 0 (사진 스토리지·Resend와 동일 패턴). env: UPSTASH_REDIS_REST_URL·_TOKEN.
 */
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL?.trim().replace(/\/$/, "");
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

/** 공유 스토어(Upstash) 사용 가능 여부 — 없으면 인메모리 폴백. */
export function rateLimitShared(): boolean {
  return !!(UPSTASH_URL && UPSTASH_TOKEN);
}

/**
 * 레이트 리밋 검사 (허용=true). 공유 스토어가 있으면 원자적 INCR로 고정 윈도우 카운트.
 * 민감 엔드포인트에서 `await`로 호출. 스토어 없거나 실패하면 인메모리로 폴백.
 */
export async function checkRateLimit(key: string, max: number, windowMs: number): Promise<boolean> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return rateLimit(key, max, windowMs);
  try {
    const rlKey = `rl:${key}`;
    // SET NX PX로 윈도우 첫 요청에만 TTL 부여(고정 윈도우) → INCR로 카운트. TTL은 INCR에 영향 없음.
    const res = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["SET", rlKey, "0", "PX", windowMs, "NX"],
        ["INCR", rlKey],
      ]),
    });
    if (!res.ok) throw new Error(`upstash ${res.status}`);
    const results = (await res.json()) as { result?: unknown }[];
    const count = Number(results[1]?.result ?? 0);
    return count <= max;
  } catch {
    return rateLimit(key, max, windowMs); // 스토어 장애 → 서비스 지속(인메모리 폴백)
  }
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** 인메모리 고정 윈도우(단일 인스턴스). 공유 스토어의 폴백. */
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
