import "server-only";
import { db } from "@/server/db";
import { AppError } from "@/lib/api-response";
import { messages } from "@/lib/messages";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { deleteUserPhotos } from "@/server/storage/photo-storage";
import {
  createSession,
  destroySession,
  getSessionUserId,
  pruneExpiredSessions,
} from "@/server/auth/session";
import type {
  SignupRequest,
  LoginRequest,
  AuthUserResponse,
  DisplayMode,
  PreferencesRequest,
  PreferencesResponse,
} from "@/features/auth/types";

/**
 * auth 서비스 — 비즈니스 로직·Prisma는 여기서만 (structure.md 레이어 규칙).
 * Prisma User를 그대로 반환하지 않고 AuthUserResponse로 변환(passwordHash 노출 금지 — security.md).
 */
function toAuthUser(user: {
  id: string;
  email: string;
  nickname: string;
  cooksOften: boolean;
  displayMode: string;
}): AuthUserResponse {
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    cooksOften: user.cooksOften,
    displayMode: user.displayMode as AuthUserResponse["displayMode"],
  };
}

export async function signup(input: SignupRequest): Promise<AuthUserResponse> {
  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError("EMAIL_TAKEN", messages.auth.emailTaken, 400);

  const passwordHash = await hashPassword(input.password);

  // 멀티 스텝 쓰기는 트랜잭션으로 (가입 = 유저 + 모찌 + 스트릭 + 온보딩 태그 한 번에)
  const user = await db.$transaction((tx) =>
    tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        nickname: input.nickname,
        cooksOften: input.cooksOften,
        mochi: { create: {} }, // 기본 idle 상태
        streak: { create: {} }, // 보호권 1개 기본
        preferences: input.tags?.length
          ? { create: input.tags.map((t) => ({ kind: t.kind, label: t.label })) }
          : undefined,
      },
    }),
  );

  await createSession(user.id);
  return toAuthUser(user);
}

export async function login(input: LoginRequest): Promise<AuthUserResponse> {
  const user = await db.user.findUnique({ where: { email: input.email } });
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new AppError("INVALID_CREDENTIALS", messages.auth.invalidCredentials, 401);
  }
  // 옛 세션 정리: 이 브라우저의 기존 세션 폐기 + 이 유저의 만료 세션 청소(row 누적 방지).
  await destroySession();
  await pruneExpiredSessions(user.id);
  await createSession(user.id, input.remember); // '로그인 유지'면 지속 쿠키, 아니면 세션 쿠키
  return toAuthUser(user);
}

export async function logout(): Promise<void> {
  await destroySession();
}

/**
 * 계정 탈퇴 (Google Play 정책 필수 — 계정 생성 앱은 삭제 수단 제공). 되돌릴 수 없음.
 * 순서: ① Supabase 사진 정리(베스트에포트) ② 내 요리(Recipe.ownerId=평문, cascade 안 됨) 삭제
 *       ③ User 삭제 → 나머지 관계 전부 cascade(세션·기록·냉장고·도감·체중·계획…) ④ 세션 쿠키 폐기.
 */
export async function deleteAccount(userId: string): Promise<void> {
  await deleteUserPhotos(userId).catch(() => {}); // 스토리지 미구성/실패해도 삭제는 진행
  await db.recipe.deleteMany({ where: { ownerId: userId } }); // 내가 등록한 요리(FK 없음 → 수동)
  await db.user.delete({ where: { id: userId } }); // cascade로 나머지 전부 정리
  await destroySession(); // 쿠키 폐기(세션 row는 이미 cascade됨)
}

export async function getMe(): Promise<AuthUserResponse> {
  const userId = await getSessionUserId();
  if (!userId) throw new AppError("UNAUTHORIZED", messages.auth.loginRequired, 401);

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("UNAUTHORIZED", messages.auth.loginRequired, 401);
  return toAuthUser(user);
}

/** 숫자 표시 모드 변경 (#4). detail=관리 모드로 kcal 노출. */
export async function setDisplayMode(userId: string, mode: DisplayMode): Promise<AuthUserResponse> {
  const user = await db.user.update({ where: { id: userId }, data: { displayMode: mode } });
  return toAuthUser(user);
}

/** 내 취향 태그(선호·비선호·알러지) 조회. 추천 반영에 쓰임. */
export async function getPreferences(userId: string): Promise<PreferencesResponse> {
  const tags = await db.preferenceTag.findMany({
    where: { userId },
    select: { kind: true, label: true },
  });
  const res: PreferencesResponse = { likes: [], dislikes: [], allergies: [] };
  for (const t of tags) {
    if (t.kind === "like") res.likes.push(t.label);
    else if (t.kind === "dislike") res.dislikes.push(t.label);
    else if (t.kind === "allergy") res.allergies.push(t.label);
  }
  return res;
}

/** 취향 통째 교체(기존 삭제 후 재생성 — 트랜잭션). */
export async function savePreferences(
  userId: string,
  input: PreferencesRequest,
): Promise<PreferencesResponse> {
  const rows = [
    ...input.likes.map((label) => ({ userId, kind: "like" as const, label })),
    ...input.dislikes.map((label) => ({ userId, kind: "dislike" as const, label })),
    ...input.allergies.map((label) => ({ userId, kind: "allergy" as const, label })),
  ];
  await db.$transaction([
    db.preferenceTag.deleteMany({ where: { userId } }),
    db.preferenceTag.createMany({ data: rows }),
  ]);
  return getPreferences(userId);
}
