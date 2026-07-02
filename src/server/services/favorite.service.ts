import "server-only";
import { db } from "@/server/db";
import type { MealMode } from "@/features/recommend/types";
import type {
  ToggleFavoriteRequest,
  FavoriteResponse,
  ToggleFavoriteResult,
} from "@/features/recommend/favorite";

/** 즐겨찾기 목록 (#7) — 최근 담은 순. */
export async function listFavorites(userId: string): Promise<FavoriteResponse[]> {
  const rows = await db.favorite.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return rows.map((f) => ({
    id: f.id,
    mode: f.mode as MealMode,
    refId: f.refId,
    title: f.title,
    emoji: f.emoji,
  }));
}

/** 하트 토글 — 있으면 제거, 없으면 추가. 반환은 토글 후 상태. */
export async function toggleFavorite(
  userId: string,
  input: ToggleFavoriteRequest,
): Promise<ToggleFavoriteResult> {
  const existing = await db.favorite.findUnique({
    where: { userId_mode_refId: { userId, mode: input.mode, refId: input.refId } },
  });
  if (existing) {
    await db.favorite.delete({ where: { id: existing.id } });
    return { favorited: false };
  }
  await db.favorite.create({
    data: {
      userId,
      mode: input.mode,
      refId: input.refId,
      title: input.title,
      emoji: input.emoji,
    },
  });
  return { favorited: true };
}

/** 추천 카드에 favorited 플래그를 달기 위한 refId 집합. */
export async function getFavoriteRefIds(userId: string): Promise<Set<string>> {
  const rows = await db.favorite.findMany({ where: { userId }, select: { refId: true } });
  return new Set(rows.map((r) => r.refId));
}
