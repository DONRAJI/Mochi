import { z } from "zod";

/** 온보딩 취향 태그 (선호/비선호/알러지) — Prisma PreferenceKind와 값 일치. */
export const preferenceTagSchema = z.object({
  kind: z.enum(["like", "dislike", "allergy"]),
  label: z.string().min(1).max(20),
});

/** 회원가입 입력 (Zod 검증은 Route Handler 경계에서 — security.md §3). 메시지는 부드럽게(불변 #1). */
export const signupSchema = z.object({
  email: z.string().email("이메일 형태만 한 번 확인해 주세요."),
  password: z.string().min(8, "비밀번호는 8자 이상이면 좋아요.").max(72),
  nickname: z.string().min(1, "닉네임을 알려줄래요?").max(20),
  cooksOften: z.boolean(),
  tags: z.array(preferenceTagSchema).max(10).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  // 로그인 유지: true면 7일 지속 쿠키, false면 세션 쿠키(앱/브라우저 종료 시 만료).
  remember: z.boolean().default(true),
});

export type SignupRequest = z.infer<typeof signupSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type PreferenceTagInput = z.infer<typeof preferenceTagSchema>;

/** 취향 편집 (선호·비선호·알러지) — kind별 라벨 배열로 통째 교체. */
export const preferencesSchema = z.object({
  likes: z.array(z.string().min(1).max(20)).max(20).default([]),
  dislikes: z.array(z.string().min(1).max(20)).max(20).default([]),
  allergies: z.array(z.string().min(1).max(20)).max(20).default([]),
});

export type PreferencesRequest = z.infer<typeof preferencesSchema>;

export interface PreferencesResponse {
  likes: string[];
  dislikes: string[];
  allergies: string[];
}

/** 숫자 표시 모드 (#4). cozy=숨김(기본), detail=관리 모드(kcal 노출). */
export type DisplayMode = "cozy" | "detail";

export const displayModeSchema = z.object({
  displayMode: z.enum(["cozy", "detail"]),
});

/** 닉네임 변경 (설정) — 가입 때와 같은 규칙. 공백만 넣는 것도 막는다. */
export const nicknameSchema = z.object({
  nickname: z.string().trim().min(1, "닉네임을 알려줄래요?").max(20),
});

export type NicknameRequest = z.infer<typeof nicknameSchema>;

/** 비밀번호 찾기 요청 — 계정 유무와 무관하게 라우트는 항상 같은 응답을 준다(사용자 열거 방지). */
export const forgotPasswordSchema = z.object({
  email: z.string().email("이메일 형태만 한 번 확인해 주세요."),
});

/** 메일 링크로 새 비밀번호 정하기. 규칙은 가입 때와 같게. */
export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "비밀번호는 8자 이상이면 좋아요.").max(72),
});

/** 로그인 상태에서 비밀번호 변경 — 현재 비밀번호 확인 필요. */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "지금 쓰는 비밀번호를 알려줄래요?"),
  newPassword: z.string().min(8, "비밀번호는 8자 이상이면 좋아요.").max(72),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;

/** 클라에 노출하는 안전한 유저 형태 (passwordHash 등 제외). */
export interface AuthUserResponse {
  id: string;
  email: string;
  nickname: string;
  cooksOften: boolean;
  displayMode: DisplayMode;
  /** 이메일 인증 여부. 미인증도 앱은 쓸 수 있고, 설정에서 재발송만 권한다(저마찰 온보딩). */
  emailVerified: boolean;
}
