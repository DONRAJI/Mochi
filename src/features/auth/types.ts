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

/** 클라에 노출하는 안전한 유저 형태 (passwordHash 등 제외). */
export interface AuthUserResponse {
  id: string;
  email: string;
  nickname: string;
  cooksOften: boolean;
}
