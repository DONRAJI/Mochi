import { loginSchema } from "@/features/auth/types";
import { login } from "@/server/services/auth.service";
import { ok, fail, toErrorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

/** POST /api/auth/login */
export async function POST(request: Request) {
  try {
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
