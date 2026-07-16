import { signupSchema } from "@/features/auth/types";
import { signup } from "@/server/services/auth.service";
import { created, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";
import { checkRateLimit, clientIp } from "@/server/auth/rate-limit";

/** POST /api/auth/signup — Route Handler는 얇게: Zod 검증 → 서비스 → ApiResponse. */
export async function POST(request: Request) {
  try {
    if (!(await checkRateLimit(`signup:${clientIp(request)}`, 5, 60_000))) {
      return fail("RATE_LIMITED", messages.error.RATE_LIMITED, 429);
    }

    const body = await request.json().catch(() => null);
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.error.VALIDATION, 400);
    }

    const user = await signup(parsed.data);
    return created(user);
  } catch (error) {
    return toErrorResponse(error);
  }
}
