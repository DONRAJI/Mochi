/** 스켈레톤용 mock (도감 서비스 연동 시 교체). */
export type Rarity = "common" | "rare" | "epic" | "seasonal";
export type CollectionTab = "recipe" | "ingredient" | "convenience";

export const COLLECTION_TABS = [
  { value: "recipe", label: "요리" },
  { value: "ingredient", label: "재료" },
  { value: "convenience", label: "간편식" },
] as const;

export interface MockCollectible {
  id: number;
  emoji: string;
  name: string;
  rarity: Rarity;
  acquired: boolean;
  comment: string;
  count?: number;
  acquiredAt?: string;
}

export const MOCK_COLLECTION: Record<CollectionTab, MockCollectible[]> = {
  recipe: [
    { id: 1, emoji: "🍳", name: "계란 스크램블", rarity: "common", acquired: true, comment: "모찌의 첫 요리예요.", count: 5, acquiredAt: "2026.05.02" },
    { id: 2, emoji: "🥗", name: "단백질 볼", rarity: "rare", acquired: true, comment: "탱탱하게 잘 만들었어요.", count: 2, acquiredAt: "2026.06.10" },
    { id: 3, emoji: "🍝", name: "마스터 파스타", rarity: "epic", acquired: false, comment: "" },
    { id: 4, emoji: "🍲", name: "히든 김치찌개", rarity: "rare", acquired: false, comment: "" },
    { id: 5, emoji: "🌸", name: "봄나물 비빔밥", rarity: "seasonal", acquired: false, comment: "" },
    { id: 6, emoji: "🍜", name: "잔치국수", rarity: "common", acquired: true, comment: "후루룩 한 그릇.", count: 1, acquiredAt: "2026.06.18" },
  ],
  ingredient: [
    { id: 7, emoji: "🥚", name: "계란", rarity: "common", acquired: true, comment: "어디에나 어울려요.", count: 12, acquiredAt: "2026.05.01" },
    { id: 8, emoji: "🥦", name: "브로콜리", rarity: "common", acquired: true, comment: "모찌가 좋아하는 나무 🌳", count: 4, acquiredAt: "2026.05.20" },
    { id: 9, emoji: "🦐", name: "새우", rarity: "epic", acquired: false, comment: "" },
    { id: 10, emoji: "🌿", name: "아스파라거스", rarity: "rare", acquired: false, comment: "" },
    { id: 11, emoji: "🍄", name: "트러플", rarity: "epic", acquired: false, comment: "" },
    { id: 12, emoji: "🥕", name: "당근", rarity: "common", acquired: true, comment: "톡톡 씹는 맛.", count: 6, acquiredAt: "2026.06.05" },
  ],
  convenience: [
    { id: 13, emoji: "🍙", name: "참치마요 삼각김밥", rarity: "common", acquired: true, comment: "급할 땐 역시.", count: 3, acquiredAt: "2026.06.21" },
    { id: 14, emoji: "🥛", name: "그릭요거트", rarity: "common", acquired: true, comment: "든든한 단백질.", count: 8, acquiredAt: "2026.06.02" },
    { id: 15, emoji: "🍱", name: "신상 도시락", rarity: "seasonal", acquired: false, comment: "" },
    { id: 16, emoji: "🍫", name: "프로틴바", rarity: "rare", acquired: false, comment: "" },
  ],
};
