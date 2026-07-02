import { PrismaClient, type Rarity } from "@prisma/client";

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

// 비요리 포용(불변 #5): 외식·간편식도 요리처럼 풍부한 카탈로그를 가져야 제안→기록→수집이 산다.
type SeedMenu = { id: string; name: string; emoji: string; category: string; rarity: Rarity; kcal: number; protein: number };
type SeedConv = { id: string; name: string; emoji: string; brand: string; rarity: Rarity; kcal: number; protein: number };

const menus: SeedMenu[] = [
  { id: "seed-menu-sundubu", name: "순두부찌개 한 상", emoji: "🍲", category: "한식", rarity: "common", kcal: 400, protein: 22 },
  { id: "seed-menu-salad", name: "닭가슴살 샐러드", emoji: "🥗", category: "샐러드", rarity: "common", kcal: 250, protein: 30 },
  { id: "seed-menu-pho", name: "쌀국수", emoji: "🍜", category: "아시안", rarity: "rare", kcal: 350, protein: 15 },
  { id: "seed-menu-bibim", name: "비빔밥", emoji: "🍚", category: "한식", rarity: "common", kcal: 550, protein: 16 },
  { id: "seed-menu-kimchi-jjigae", name: "김치찌개 백반", emoji: "🍲", category: "한식", rarity: "common", kcal: 480, protein: 20 },
  { id: "seed-menu-doenjang", name: "된장찌개 백반", emoji: "🥘", category: "한식", rarity: "common", kcal: 450, protein: 18 },
  { id: "seed-menu-jeyuk", name: "제육볶음 덮밥", emoji: "🍚", category: "한식", rarity: "common", kcal: 700, protein: 28 },
  { id: "seed-menu-bulgogi", name: "불고기 정식", emoji: "🥩", category: "한식", rarity: "rare", kcal: 650, protein: 32 },
  { id: "seed-menu-galbitang", name: "갈비탕", emoji: "🍲", category: "한식", rarity: "rare", kcal: 500, protein: 30 },
  { id: "seed-menu-naengmyeon", name: "물냉면", emoji: "🍜", category: "한식", rarity: "common", kcal: 550, protein: 16 },
  { id: "seed-menu-samgyetang", name: "삼계탕", emoji: "🍲", category: "한식", rarity: "rare", kcal: 600, protein: 45 },
  { id: "seed-menu-yukgaejang", name: "육개장", emoji: "🍲", category: "한식", rarity: "common", kcal: 450, protein: 25 },
  { id: "seed-menu-jjajang", name: "짜장면", emoji: "🍜", category: "중식", rarity: "common", kcal: 700, protein: 16 },
  { id: "seed-menu-jjamppong", name: "짬뽕", emoji: "🍜", category: "중식", rarity: "common", kcal: 680, protein: 24 },
  { id: "seed-menu-mapo", name: "마파두부 덮밥", emoji: "🍚", category: "중식", rarity: "common", kcal: 600, protein: 22 },
  { id: "seed-menu-fried-rice", name: "중화 볶음밥", emoji: "🍚", category: "중식", rarity: "common", kcal: 650, protein: 15 },
  { id: "seed-menu-tangsuyuk", name: "탕수육", emoji: "🍖", category: "중식", rarity: "rare", kcal: 550, protein: 20 },
  { id: "seed-menu-salmon-don", name: "연어덮밥", emoji: "🍣", category: "일식", rarity: "rare", kcal: 550, protein: 30 },
  { id: "seed-menu-gyudon", name: "규동", emoji: "🍚", category: "일식", rarity: "common", kcal: 680, protein: 26 },
  { id: "seed-menu-udon", name: "우동", emoji: "🍜", category: "일식", rarity: "common", kcal: 450, protein: 14 },
  { id: "seed-menu-sushi", name: "초밥 세트", emoji: "🍣", category: "일식", rarity: "rare", kcal: 500, protein: 24 },
  { id: "seed-menu-katsu", name: "돈카츠 정식", emoji: "🍱", category: "일식", rarity: "common", kcal: 800, protein: 30 },
  { id: "seed-menu-tomato-pasta", name: "토마토 파스타", emoji: "🍝", category: "양식", rarity: "common", kcal: 600, protein: 16 },
  { id: "seed-menu-cream-pasta", name: "크림 파스타", emoji: "🍝", category: "양식", rarity: "common", kcal: 800, protein: 18 },
  { id: "seed-menu-pizza", name: "마르게리타 피자", emoji: "🍕", category: "양식", rarity: "common", kcal: 700, protein: 26 },
  { id: "seed-menu-steak-salad", name: "스테이크 샐러드", emoji: "🥩", category: "양식", rarity: "rare", kcal: 450, protein: 35 },
  { id: "seed-menu-risotto", name: "리조또", emoji: "🍚", category: "양식", rarity: "common", kcal: 650, protein: 18 },
  { id: "seed-menu-tteokbokki", name: "떡볶이", emoji: "🌶️", category: "분식", rarity: "common", kcal: 500, protein: 10 },
  { id: "seed-menu-gimbap", name: "김밥", emoji: "🍙", category: "분식", rarity: "common", kcal: 480, protein: 12 },
  { id: "seed-menu-ramen", name: "라면", emoji: "🍜", category: "분식", rarity: "common", kcal: 500, protein: 11 },
  { id: "seed-menu-sundae", name: "순대국밥", emoji: "🍲", category: "분식", rarity: "common", kcal: 550, protein: 28 },
  { id: "seed-menu-padthai", name: "팟타이", emoji: "🍜", category: "아시안", rarity: "rare", kcal: 650, protein: 18 },
  { id: "seed-menu-nasi", name: "나시고랭", emoji: "🍚", category: "아시안", rarity: "rare", kcal: 700, protein: 16 },
  { id: "seed-menu-avocado-toast", name: "아보카도 토스트", emoji: "🥑", category: "브런치", rarity: "common", kcal: 450, protein: 14 },
  { id: "seed-menu-grilled-chicken", name: "그릴드 치킨", emoji: "🍗", category: "단품", rarity: "rare", kcal: 500, protein: 40 },
  { id: "seed-menu-burger", name: "수제버거", emoji: "🍔", category: "양식", rarity: "common", kcal: 750, protein: 32 },
];

const convenience: SeedConv[] = [
  { id: "seed-conv-gimbap", name: "참치마요 삼각김밥", emoji: "🍙", brand: "GS25", rarity: "common", kcal: 200, protein: 6 },
  { id: "seed-conv-yogurt", name: "그릭요거트", emoji: "🥛", brand: "fage", rarity: "common", kcal: 120, protein: 10 },
  { id: "seed-conv-bar", name: "프로틴바", emoji: "🍫", brand: "마이프로틴", rarity: "rare", kcal: 200, protein: 20 },
  { id: "seed-conv-salad", name: "닭가슴살 샐러드 도시락", emoji: "🥗", brand: "CU", rarity: "common", kcal: 320, protein: 28 },
  { id: "seed-conv-tri-bibim", name: "전주비빔 삼각김밥", emoji: "🍙", brand: "CU", rarity: "common", kcal: 210, protein: 5 },
  { id: "seed-conv-tri-spam", name: "스팸마요 삼각김밥", emoji: "🍙", brand: "세븐일레븐", rarity: "common", kcal: 230, protein: 7 },
  { id: "seed-conv-kimbap-tuna", name: "참치김밥", emoji: "🍙", brand: "GS25", rarity: "common", kcal: 350, protein: 12 },
  { id: "seed-conv-kimbap-veg", name: "야채김밥", emoji: "🍙", brand: "이마트24", rarity: "common", kcal: 320, protein: 9 },
  { id: "seed-conv-dosirak-jeyuk", name: "제육 도시락", emoji: "🍱", brand: "CU", rarity: "common", kcal: 650, protein: 25 },
  { id: "seed-conv-dosirak-bulgogi", name: "불고기 도시락", emoji: "🍱", brand: "GS25", rarity: "common", kcal: 600, protein: 24 },
  { id: "seed-conv-dosirak-chickenmayo", name: "치킨마요 덮밥", emoji: "🍱", brand: "세븐일레븐", rarity: "common", kcal: 700, protein: 22 },
  { id: "seed-conv-salad-ricotta", name: "리코타치즈 샐러드", emoji: "🥗", brand: "GS25", rarity: "common", kcal: 300, protein: 12 },
  { id: "seed-conv-salad-cobb", name: "콥 샐러드", emoji: "🥗", brand: "CU", rarity: "rare", kcal: 350, protein: 20 },
  { id: "seed-conv-sandwich-egg", name: "에그 샌드위치", emoji: "🥪", brand: "GS25", rarity: "common", kcal: 350, protein: 14 },
  { id: "seed-conv-sandwich-ham", name: "햄치즈 샌드위치", emoji: "🥪", brand: "세븐일레븐", rarity: "common", kcal: 400, protein: 16 },
  { id: "seed-conv-sandwich-club", name: "클럽 샌드위치", emoji: "🥪", brand: "CU", rarity: "common", kcal: 450, protein: 20 },
  { id: "seed-conv-yogurt-drink", name: "마시는 요거트", emoji: "🥛", brand: "매일", rarity: "common", kcal: 150, protein: 6 },
  { id: "seed-conv-milk", name: "저지방 우유", emoji: "🥛", brand: "서울우유", rarity: "common", kcal: 90, protein: 9 },
  { id: "seed-conv-string-cheese", name: "스트링 치즈", emoji: "🧀", brand: "자연치즈", rarity: "common", kcal: 80, protein: 7 },
  { id: "seed-conv-protein-drink", name: "프로틴 음료", emoji: "🥤", brand: "매일", rarity: "rare", kcal: 180, protein: 25 },
  { id: "seed-conv-chicken-sausage", name: "닭가슴살 소시지", emoji: "🌭", brand: "허닭", rarity: "common", kcal: 120, protein: 18 },
  { id: "seed-conv-smoked-chicken", name: "훈제 닭가슴살", emoji: "🍗", brand: "허닭", rarity: "rare", kcal: 110, protein: 23 },
  { id: "seed-conv-egg", name: "삶은 계란 2입", emoji: "🥚", brand: "CU", rarity: "common", kcal: 140, protein: 12 },
  { id: "seed-conv-fruit-cup", name: "컵과일", emoji: "🍓", brand: "GS25", rarity: "common", kcal: 90, protein: 1 },
  { id: "seed-conv-banana", name: "바나나", emoji: "🍌", brand: "이마트24", rarity: "common", kcal: 105, protein: 1 },
  { id: "seed-conv-soymilk", name: "두유", emoji: "🥛", brand: "정식품", rarity: "common", kcal: 130, protein: 7 },
  { id: "seed-conv-almond", name: "아몬드 한 봉", emoji: "🥜", brand: "GS25", rarity: "common", kcal: 180, protein: 6 },
  { id: "seed-conv-cup-ramen", name: "컵라면", emoji: "🍜", brand: "농심", rarity: "common", kcal: 350, protein: 8 },
  { id: "seed-conv-miyeok", name: "즉석 미역국밥", emoji: "🍚", brand: "오뚜기", rarity: "common", kcal: 400, protein: 10 },
  { id: "seed-conv-frozen-rice", name: "냉동 볶음밥", emoji: "🍚", brand: "비비고", rarity: "common", kcal: 550, protein: 12 },
  { id: "seed-conv-protein-bread", name: "단백질 빵", emoji: "🍞", brand: "파리바게뜨", rarity: "common", kcal: 250, protein: 15 },
  { id: "seed-conv-croffle", name: "크로플", emoji: "🧇", brand: "세븐일레븐", rarity: "common", kcal: 400, protein: 6 },
  { id: "seed-conv-tofu-bar", name: "두부바", emoji: "🍫", brand: "풀무원", rarity: "rare", kcal: 150, protein: 15 },
  { id: "seed-conv-oatmeal", name: "오트밀 컵", emoji: "🥣", brand: "퀘이커", rarity: "common", kcal: 250, protein: 8 },
  { id: "seed-conv-chicken-steak", name: "닭가슴살 스테이크", emoji: "🍗", brand: "아임닭", rarity: "rare", kcal: 130, protein: 26 },
  { id: "seed-conv-yakult", name: "요구르트", emoji: "🥛", brand: "hy", rarity: "common", kcal: 60, protein: 2 },
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
