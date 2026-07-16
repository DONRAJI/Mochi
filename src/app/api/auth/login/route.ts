import { loginSchema } from "@/features/auth/types";
import { login } from "@/server/services/auth.service";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";
import { checkRateLimit, clientIp } from "@/server/auth/rate-limit";

/** POST /api/auth/login */
export async function POST(request: Request) {
  try {
    if (!(await checkRateLimit(`login:${clientIp(request)}`, 10, 60_000))) {
      return fail("RATE_LIMITED", messages.error.RATE_LIMITED, 429);
    }

    const body = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.error.VALIDATION, 400);
    }

    const user = await login(parsed.data);
    return ok(user);
  } catch (error) {
    return toErrorResponse(error);
  }
}
