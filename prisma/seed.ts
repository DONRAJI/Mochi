import { PrismaClient } from "@prisma/client";

/**
 * 시드 콘텐츠 (PRD 리스크 #4: 추천 품질은 시드 양에 달림).
 * 실행: `npx -y tsx prisma/seed.ts`  또는  `npx prisma db seed`
 * 3모드 대칭(불변 #5): 요리=Recipe · 외식=Menu · 간편식=ConvenienceItem.
 * id를 고정해 createMany + skipDuplicates 로 멱등하게(여러 번 돌려도 안전).
 */
const db = new PrismaClient();

async function main() {
  await db.recipe.createMany({
    data: [
      { id: "seed-recipe-egg", name: "계란 스크램블", minutes: 10, servings: 1, rarity: "common" },
      { id: "seed-recipe-tofu", name: "김치두부조림", minutes: 15, servings: 1, rarity: "common" },
      { id: "seed-recipe-bowl", name: "단백질 볼", minutes: 20, servings: 1, rarity: "rare" },
    ],
    skipDuplicates: true,
  });

  await db.menu.createMany({
    data: [
      { id: "seed-menu-sundubu", name: "순두부찌개 한 상", category: "한식", rarity: "common" },
      { id: "seed-menu-salad", name: "닭가슴살 샐러드", category: "샐러드", rarity: "common" },
      { id: "seed-menu-pho", name: "쌀국수", category: "아시안", rarity: "rare" },
    ],
    skipDuplicates: true,
  });

  await db.convenienceItem.createMany({
    data: [
      { id: "seed-conv-gimbap", name: "참치마요 삼각김밥", brand: "GS25", rarity: "common" },
      { id: "seed-conv-yogurt", name: "그릭요거트", brand: "fage", rarity: "common" },
      { id: "seed-conv-bar", name: "프로틴바", brand: "마이프로틴", rarity: "rare" },
    ],
    skipDuplicates: true,
  });

  console.log("🧊 seed 완료 — recipe/menu/convenience 시드 등록");
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
