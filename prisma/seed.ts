import { PrismaClient } from "@prisma/client";

/**
 * 시드 콘텐츠 (PRD 리스크 #4). 실행: `npx -y tsx prisma/seed.ts` 또는 `npx prisma db seed`
 * 3모드 대칭(불변 #5) + 영양(서버 신호, 화면 X) + 재료 마스터(정규화·도감). upsert로 멱등.
 * 뱃지는 더 이상 저장하지 않고 영양에서 자동 산출(deriveBadge).
 */
const db = new PrismaClient();

const ingredientMasters = [
  { name: "계란", category: "단백질", emoji: "🥚", kcal: 155, protein: 13, aliases: ["달걀"] },
  { name: "두부", category: "단백질", emoji: "🧈", kcal: 80, protein: 8, aliases: [] },
  { name: "닭가슴살", category: "단백질", emoji: "🍗", kcal: 165, protein: 31, aliases: ["닭"] },
  { name: "새우", category: "단백질", emoji: "🦐", kcal: 99, protein: 24, aliases: [] },
  { name: "양파", category: "채소", emoji: "🧅", kcal: 40, protein: 1, aliases: [] },
  { name: "당근", category: "채소", emoji: "🥕", kcal: 41, protein: 1, aliases: [] },
  { name: "상추", category: "채소", emoji: "🥬", kcal: 15, protein: 1, aliases: [] },
  { name: "브로콜리", category: "채소", emoji: "🥦", kcal: 34, protein: 3, aliases: [] },
  { name: "방울토마토", category: "채소", emoji: "🍅", kcal: 18, protein: 1, aliases: ["토마토", "대추토마토"] },
  { name: "김치", category: "채소", emoji: "🌶️", kcal: 15, protein: 1, aliases: [] },
  { name: "대파", category: "채소", emoji: "🌿", kcal: 30, protein: 2, aliases: ["파"] },
  { name: "치즈", category: "유제품", emoji: "🧀", kcal: 402, protein: 25, aliases: [] },
  { name: "우유", category: "유제품", emoji: "🥛", kcal: 60, protein: 3, aliases: [] },
  { name: "쌀", category: "곡물", emoji: "🍚", kcal: 130, protein: 2, aliases: ["밥"] },
];

const recipes = [
  { id: "seed-recipe-egg", name: "계란 스크램블", emoji: "🍳", minutes: 10, servings: 1, rarity: "common" as const, kcal: 200, protein: 16, ingredients: ["계란", "우유", "버터"], steps: ["계란을 풀어요", "약불에서 부드럽게 저어요", "소금 살짝 마무리"] },
  { id: "seed-recipe-tofu", name: "김치두부조림", emoji: "🍲", minutes: 15, servings: 1, rarity: "common" as const, kcal: 360, protein: 18, ingredients: ["두부", "김치", "대파"], steps: ["두부를 도톰하게 썰어요", "김치와 자작하게 끓여요", "참기름 한 방울"] },
  { id: "seed-recipe-bowl", name: "단백질 볼", emoji: "🥗", minutes: 20, servings: 1, rarity: "rare" as const, kcal: 420, protein: 35, ingredients: ["닭가슴살", "방울토마토", "현미밥", "올리브유"], steps: ["닭가슴살을 구워요", "채소를 담아요", "올리브유를 둘러요"] },
  { id: "seed-recipe-salad", name: "두부 샐러드", emoji: "🥬", minutes: 10, servings: 1, rarity: "common" as const, kcal: 180, protein: 12, ingredients: ["두부", "상추", "방울토마토"], steps: ["채소를 한 입 크기로", "두부를 올려요", "드레싱 살짝"] },
];

const menus = [
  { id: "seed-menu-sundubu", name: "순두부찌개 한 상", emoji: "🍲", category: "한식", rarity: "common" as const, kcal: 400, protein: 22 },
  { id: "seed-menu-salad", name: "닭가슴살 샐러드", emoji: "🥗", category: "샐러드", rarity: "common" as const, kcal: 250, protein: 30 },
  { id: "seed-menu-pho", name: "쌀국수", emoji: "🍜", category: "아시안", rarity: "rare" as const, kcal: 350, protein: 15 },
  { id: "seed-menu-bibim", name: "비빔밥", emoji: "🍚", category: "한식", rarity: "common" as const, kcal: 550, protein: 16 },
];

const convenience = [
  { id: "seed-conv-gimbap", name: "참치마요 삼각김밥", emoji: "🍙", brand: "GS25", rarity: "common" as const, kcal: 200, protein: 6 },
  { id: "seed-conv-yogurt", name: "그릭요거트", emoji: "🥛", brand: "fage", rarity: "common" as const, kcal: 120, protein: 10 },
  { id: "seed-conv-bar", name: "프로틴바", emoji: "🍫", brand: "마이프로틴", rarity: "rare" as const, kcal: 200, protein: 20 },
  { id: "seed-conv-salad", name: "닭가슴살 샐러드 도시락", emoji: "🥗", brand: "CU", rarity: "common" as const, kcal: 320, protein: 28 },
];

async function main() {
  for (const m of ingredientMasters)
    await db.ingredientMaster.upsert({ where: { name: m.name }, create: m, update: m });
  for (const r of recipes) await db.recipe.upsert({ where: { id: r.id }, create: r, update: r });
  for (const m of menus) await db.menu.upsert({ where: { id: m.id }, create: m, update: m });
  for (const c of convenience)
    await db.convenienceItem.upsert({ where: { id: c.id }, create: c, update: c });

  console.log(
    `🧊 seed 완료 — master ${ingredientMasters.length} · recipe ${recipes.length} · menu ${menus.length} · convenience ${convenience.length}`,
  );
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
