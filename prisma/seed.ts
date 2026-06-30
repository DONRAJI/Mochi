import { PrismaClient } from "@prisma/client";

/**
 * 시드 콘텐츠 (PRD 리스크 #4: 추천 품질은 시드 양에 달림).
 * 실행: `npx -y tsx prisma/seed.ts`  또는  `npx prisma db seed`
 * 3모드 대칭(불변 #5): 요리=Recipe · 외식=Menu · 간편식=ConvenienceItem.
 * upsert로 멱등하게(여러 번 돌려도 안전, 필드 갱신까지).
 */
const db = new PrismaClient();

const recipes = [
  {
    id: "seed-recipe-egg",
    name: "계란 스크램블",
    emoji: "🍳",
    minutes: 10,
    servings: 1,
    rarity: "common" as const,
    badge: "💪 단백질",
    ingredients: ["계란", "우유", "버터"],
    steps: ["계란을 풀어요", "약불에서 부드럽게 저어요", "소금 살짝 마무리"],
  },
  {
    id: "seed-recipe-tofu",
    name: "김치두부조림",
    emoji: "🍲",
    minutes: 15,
    servings: 1,
    rarity: "common" as const,
    badge: "🫧 포만감",
    ingredients: ["두부", "김치", "대파"],
    steps: ["두부를 도톰하게 썰어요", "김치와 자작하게 끓여요", "참기름 한 방울"],
  },
  {
    id: "seed-recipe-bowl",
    name: "단백질 볼",
    emoji: "🥗",
    minutes: 20,
    servings: 1,
    rarity: "rare" as const,
    badge: "💪 단백질",
    ingredients: ["닭가슴살", "방울토마토", "현미밥", "올리브유"],
    steps: ["닭가슴살을 구워요", "채소를 담아요", "올리브유를 둘러요"],
  },
  {
    id: "seed-recipe-salad",
    name: "두부 샐러드",
    emoji: "🥬",
    minutes: 10,
    servings: 1,
    rarity: "common" as const,
    badge: "🍃 가벼움",
    ingredients: ["두부", "상추", "방울토마토"],
    steps: ["채소를 한 입 크기로", "두부를 올려요", "드레싱 살짝"],
  },
];

const menus = [
  { id: "seed-menu-sundubu", name: "순두부찌개 한 상", emoji: "🍲", category: "한식", rarity: "common" as const, badge: "🫧 포만감" },
  { id: "seed-menu-salad", name: "닭가슴살 샐러드", emoji: "🥗", category: "샐러드", rarity: "common" as const, badge: "🍃 가벼움" },
  { id: "seed-menu-pho", name: "쌀국수", emoji: "🍜", category: "아시안", rarity: "rare" as const, badge: "🍃 가벼움" },
  { id: "seed-menu-bibim", name: "비빔밥", emoji: "🍚", category: "한식", rarity: "common" as const, badge: "💪 단백질" },
];

const convenience = [
  { id: "seed-conv-gimbap", name: "참치마요 삼각김밥", emoji: "🍙", brand: "GS25", rarity: "common" as const, badge: "🫧 포만감" },
  { id: "seed-conv-yogurt", name: "그릭요거트", emoji: "🥛", brand: "fage", rarity: "common" as const, badge: "💪 단백질" },
  { id: "seed-conv-bar", name: "프로틴바", emoji: "🍫", brand: "마이프로틴", rarity: "rare" as const, badge: "💪 단백질" },
  { id: "seed-conv-salad", name: "닭가슴살 샐러드 도시락", emoji: "🥗", brand: "CU", rarity: "common" as const, badge: "🍃 가벼움" },
];

async function main() {
  for (const r of recipes) await db.recipe.upsert({ where: { id: r.id }, create: r, update: r });
  for (const m of menus) await db.menu.upsert({ where: { id: m.id }, create: m, update: m });
  for (const c of convenience)
    await db.convenienceItem.upsert({ where: { id: c.id }, create: c, update: c });

  console.log(`🧊 seed 완료 — recipe ${recipes.length} · menu ${menus.length} · convenience ${convenience.length}`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
