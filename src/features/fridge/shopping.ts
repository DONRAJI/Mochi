import { z } from "zod";

/** 장보기 리스트에 재료 담기 (레시피 추가구매에서 한 번에). */
export const addShoppingSchema = z.object({
  names: z.array(z.string().min(1).max(20)).min(1).max(30),
});

export type AddShoppingRequest = z.infer<typeof addShoppingSchema>;

export interface ShoppingItemResponse {
  id: string;
  name: string;
  checked: boolean;
}
