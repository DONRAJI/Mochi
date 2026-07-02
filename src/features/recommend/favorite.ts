import { z } from "zod";
import type { MealMode } from "./types";

/** 즐겨찾기 토글 입력 (#7). title/emoji는 즐겨찾기 목록 표시용 스냅샷. */
export const toggleFavoriteSchema = z.object({
  mode: z.enum(["cook", "eatout", "convenience"]),
  refId: z.string().min(1).max(60),
  title: z.string().min(1).max(60),
  emoji: z.string().max(8).optional(),
});

export type ToggleFavoriteRequest = z.infer<typeof toggleFavoriteSchema>;

export interface FavoriteResponse {
  id: string;
  mode: MealMode;
  refId: string;
  title: string;
  emoji: string | null;
}

export interface ToggleFavoriteResult {
  favorited: boolean;
}
