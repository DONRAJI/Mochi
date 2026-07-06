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
  { name: "새우", category: "단백질", emoji: "🦐", kcal: 99, protein: 24, aliases: [], rarity: "rare" as const },
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
  // 단백질
  { name: "돼지고기", category: "단백질", emoji: "🥓", kcal: 242, protein: 17, aliases: ["삼겹살", "목살"] },
  { name: "소고기", category: "단백질", emoji: "🥩", kcal: 250, protein: 26, aliases: ["쇠고기", "한우"] },
  { name: "참치", category: "단백질", emoji: "🐟", kcal: 132, protein: 28, aliases: [] },
  { name: "연어", category: "단백질", emoji: "🍣", kcal: 208, protein: 20, aliases: [], rarity: "rare" as const },
  { name: "오징어", category: "단백질", emoji: "🦑", kcal: 92, protein: 18, aliases: [], rarity: "rare" as const },
  { name: "콩", category: "단백질", emoji: "🫘", kcal: 127, protein: 9, aliases: ["대두"] },
  // 채소
  { name: "감자", category: "채소", emoji: "🥔", kcal: 77, protein: 2, aliases: [] },
  { name: "고구마", category: "채소", emoji: "🍠", kcal: 86, protein: 1, aliases: [] },
  { name: "마늘", category: "채소", emoji: "🧄", kcal: 149, protein: 6, aliases: ["다진마늘"] },
  { name: "오이", category: "채소", emoji: "🥒", kcal: 15, protein: 1, aliases: [] },
  { name: "파프리카", category: "채소", emoji: "🫑", kcal: 31, protein: 1, aliases: ["피망"] },
  { name: "버섯", category: "채소", emoji: "🍄", kcal: 22, protein: 3, aliases: ["표고버섯", "느타리버섯"] },
  { name: "옥수수", category: "채소", emoji: "🌽", kcal: 96, protein: 3, aliases: [] },
  { name: "가지", category: "채소", emoji: "🍆", kcal: 25, protein: 1, aliases: [] },
  { name: "아보카도", category: "채소", emoji: "🥑", kcal: 160, protein: 2, aliases: [], rarity: "rare" as const },
  { name: "시금치", category: "채소", emoji: "🥬", kcal: 23, protein: 3, aliases: [] },
  // 유제품
  { name: "버터", category: "유제품", emoji: "🧈", kcal: 717, protein: 1, aliases: [] },
  { name: "요거트", category: "유제품", emoji: "🍦", kcal: 59, protein: 10, aliases: ["그릭요거트", "요구르트"] },
  // 곡물
  { name: "현미", category: "곡물", emoji: "🌾", kcal: 112, protein: 2, aliases: ["현미밥"] },
  { name: "빵", category: "곡물", emoji: "🍞", kcal: 265, protein: 9, aliases: ["식빵"] },
  { name: "오트밀", category: "곡물", emoji: "🥣", kcal: 389, protein: 17, aliases: ["귀리"] },
  // 과일
  { name: "바나나", category: "과일", emoji: "🍌", kcal: 89, protein: 1, aliases: [] },
  { name: "사과", category: "과일", emoji: "🍎", kcal: 52, protein: 0, aliases: [] },
  { name: "딸기", category: "과일", emoji: "🍓", kcal: 32, protein: 1, aliases: [] },
  { name: "블루베리", category: "과일", emoji: "🫐", kcal: 57, protein: 1, aliases: [] },
  { name: "포도", category: "과일", emoji: "🍇", kcal: 69, protein: 1, aliases: [] },
  { name: "레몬", category: "과일", emoji: "🍋", kcal: 29, protein: 1, aliases: [] },
];

const recipes = [
  { id: "seed-recipe-egg", name: "계란 스크램블", emoji: "🍳", minutes: 10, servings: 1, rarity: "common" as const, kcal: 200, protein: 16, ingredients: ["계란", "우유", "버터"], steps: ["계란을 풀어요", "약불에서 부드럽게 저어요", "소금 살짝 마무리"] },
  { id: "seed-recipe-tofu", name: "김치두부조림", emoji: "🍲", minutes: 15, servings: 1, rarity: "common" as const, kcal: 360, protein: 18, ingredients: ["두부", "김치", "대파"], steps: ["두부를 도톰하게 썰어요", "김치와 자작하게 끓여요", "참기름 한 방울"] },
  { id: "seed-recipe-bowl", name: "단백질 볼", emoji: "🥗", minutes: 20, servings: 1, rarity: "rare" as const, kcal: 420, protein: 35, ingredients: ["닭가슴살", "방울토마토", "현미밥", "올리브유"], steps: ["닭가슴살을 구워요", "채소를 담아요", "올리브유를 둘러요"] },
  { id: "seed-recipe-salad", name: "두부 샐러드", emoji: "🥬", minutes: 10, servings: 1, rarity: "common" as const, kcal: 180, protein: 12, ingredients: ["두부", "상추", "방울토마토"], steps: ["채소를 한 입 크기로", "두부를 올려요", "드레싱 살짝"] },
  // 🔓 히든 콤보 (PRD 7.3#3) — 조합을 다 가지면 해금. rarity로 아스피레이션.
  { id: "seed-recipe-hidden-tofukimchi", name: "두부김치계란볶음", emoji: "🍳", minutes: 15, servings: 1, rarity: "rare" as const, kcal: 340, protein: 22, ingredients: ["두부", "김치", "계란", "대파"], steps: ["두부를 으깨 볶아요", "김치를 넣어 볶아요", "계란을 풀어 마무리"], hiddenCombo: ["두부", "김치", "계란"] },
  { id: "seed-recipe-hidden-chicken", name: "닭가슴살 현미볼", emoji: "🥗", minutes: 20, servings: 1, rarity: "rare" as const, kcal: 400, protein: 38, ingredients: ["닭가슴살", "현미", "브로콜리"], steps: ["닭가슴살을 구워요", "현미밥을 담아요", "브로콜리를 올려요"], hiddenCombo: ["닭가슴살", "현미", "브로콜리"] },
  { id: "seed-recipe-hidden-shrimpavo", name: "새우 아보카도 포케", emoji: "🍤", minutes: 15, servings: 1, rarity: "epic" as const, kcal: 380, protein: 26, ingredients: ["새우", "아보카도", "방울토마토", "현미"], steps: ["새우를 데쳐요", "아보카도를 썰어요", "현미밥 위에 담아요"], hiddenCombo: ["새우", "아보카도", "방울토마토"] },
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

// 모찌 뽑기 카드 16종 (PRD 12) — 4등급×4. imageUrl = public/mochi-cards/{id}.webp.
const mochiCards: {
  id: string;
  name: string;
  rarity: Rarity;
  flavor: string;
  foodTheme: string;
  sortOrder: number;
}[] = [
  // COMMON — 냉장고 기본 재료
  { id: "tofu", name: "두부 모찌", rarity: "common", foodTheme: "두부", sortOrder: 1, flavor: "부드럽고 든든해요. 모찌가 제일 자주 만나는 친구예요 🧈" },
  { id: "egg", name: "계란 모찌", rarity: "common", foodTheme: "계란", sortOrder: 2, flavor: "동글동글 노른자를 쏙! 아침을 깨우는 모찌예요 🥚" },
  { id: "milk", name: "우유 모찌", rarity: "common", foodTheme: "우유", sortOrder: 3, flavor: "하얗고 고소해요. 뼈가 튼튼해지는 기분! 🥛" },
  { id: "banana", name: "바나나 모찌", rarity: "common", foodTheme: "바나나", sortOrder: 4, flavor: "달콤하고 말랑해요. 기운이 쑥 나요 🍌" },
  // COMMON — 확장팩 2
  { id: "cabbage", name: "양배추 모찌", rarity: "common", foodTheme: "양배추", sortOrder: 5, flavor: "아삭아삭 초록 잎을 얹었어요. 속이 편안해져요 🥬" },
  { id: "apple", name: "사과 모찌", rarity: "common", foodTheme: "사과", sortOrder: 6, flavor: "빨갛고 아삭! 하루 한 알 기분 좋은 모찌 🍎" },
  { id: "carrot", name: "당근 모찌", rarity: "common", foodTheme: "당근", sortOrder: 7, flavor: "주황 당근을 쏙. 눈이 반짝반짝해져요 🥕" },
  { id: "corn", name: "옥수수 모찌", rarity: "common", foodTheme: "옥수수", sortOrder: 8, flavor: "노랗고 톡톡 달콤해요. 기분까지 노란빛 🌽" },
  // RARE
  { id: "shrimp", name: "새우 모찌", rarity: "rare", foodTheme: "새우", sortOrder: 5, flavor: "탱글탱글 새우를 얹었어요. 조금 특별한 날 🦐" },
  { id: "cheese", name: "치즈 모찌", rarity: "rare", foodTheme: "치즈", sortOrder: 6, flavor: "고소함이 사르르 녹아요. 기분 좋은 발견! 🧀" },
  { id: "broccoli", name: "브로콜리 모찌", rarity: "rare", foodTheme: "브로콜리", sortOrder: 7, flavor: "초록초록 건강해요. 모찌가 힘이 나요 🥦" },
  { id: "tomato", name: "토마토 모찌", rarity: "rare", foodTheme: "토마토", sortOrder: 8, flavor: "새콤달콤 반짝여요. 상큼한 하루 🍅" },
  // EPIC — 든든한 영양
  { id: "salmon", name: "연어 모찌", rarity: "epic", foodTheme: "연어", sortOrder: 9, flavor: "분홍빛 연어를 폭! 영양 가득 든든해요 🍣" },
  { id: "avocado", name: "아보카도 모찌", rarity: "epic", foodTheme: "아보카도", sortOrder: 10, flavor: "부드러운 초록 크림 같아요. 귀한 손님 🥑" },
  { id: "steak", name: "스테이크 모찌", rarity: "epic", foodTheme: "스테이크", sortOrder: 11, flavor: "육즙 가득! 오늘은 든든하게 먹은 날 🥩" },
  { id: "sweet-potato", name: "고구마 모찌", rarity: "epic", foodTheme: "고구마", sortOrder: 12, flavor: "포근하고 달콤해요. 마음까지 따뜻 🍠" },
  // LEGENDARY — 완성 요리
  { id: "bibimbap", name: "비빔밥 모찌", rarity: "legendary", foodTheme: "비빔밥", sortOrder: 13, flavor: "알록달록 다 모였어요. 만나서 정말 반가워요! 🍲" },
  { id: "ramen", name: "라멘 모찌", rarity: "legendary", foodTheme: "라멘", sortOrder: 14, flavor: "따끈한 국물에 퐁당! 전설의 한 그릇 🍜" },
  { id: "bento", name: "도시락 모찌", rarity: "legendary", foodTheme: "도시락", sortOrder: 15, flavor: "정성 가득 도시락. 오늘도 잘 챙겨 먹었어요 🍱" },
  { id: "dessert", name: "디저트 모찌", rarity: "legendary", foodTheme: "디저트", sortOrder: 16, flavor: "달콤한 마무리. 가장 특별한 모찌예요 🍰" },
];

async function main() {
  for (const m of ingredientMasters)
    await db.ingredientMaster.upsert({ where: { name: m.name }, create: m, update: m });
  for (const r of recipes) await db.recipe.upsert({ where: { id: r.id }, create: r, update: r });
  for (const m of menus) await db.menu.upsert({ where: { id: m.id }, create: m, update: m });
  for (const c of convenience)
    await db.convenienceItem.upsert({ where: { id: c.id }, create: c, update: c });
  // sortOrder를 등급 순(일반→레어→에픽→전설)으로 재계산 — 카드를 추가해도 도감이 등급별로 묶인다.
  const RANK: Record<string, number> = { common: 0, rare: 1, epic: 2, legendary: 3, seasonal: 4 };
  const orderedCards = [...mochiCards].sort((a, b) => RANK[a.rarity] - RANK[b.rarity]);
  for (let i = 0; i < orderedCards.length; i++) {
    const c = orderedCards[i];
    const data = { ...c, imageUrl: `/mochi-cards/${c.id}.webp`, sortOrder: i + 1 };
    await db.mochiCard.upsert({ where: { id: c.id }, create: data, update: data });
  }

  console.log(
    `🧊 seed 완료 — master ${ingredientMasters.length} · recipe ${recipes.length} · menu ${menus.length} · convenience ${convenience.length} · mochiCard ${mochiCards.length}`,
  );
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
