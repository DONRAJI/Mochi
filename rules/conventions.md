# 코드 컨벤션 (Conventions) — 모찌

## 공통

- 언어: **TypeScript만** (`.js`/`.jsx` 생성 금지). 들여쓰기 2칸.
- 브랜치: `dev` 작업 → 검수 → `main` 머지. `main` 직접 push 금지(Branch Protection으로 강제).
- 포맷/린트: ESLint + Prettier. 커밋/PR 전 `npm run lint && npm run typecheck` 통과 필수(CI 게이트).

## API 설계

**URL 규칙 (RESTful):**
```
POST   /api/auth/signup
POST   /api/auth/login
GET    /api/fridge/ingredients?page=0&size=20&tag=
POST   /api/fridge/ingredients
DELETE /api/fridge/ingredients/{id}
GET    /api/recommend/meals?mode=cook|eatout|convenience
POST   /api/records/meals            # '먹었어요' 체크
POST   /api/records/weight
GET    /api/collection?type=ingredient|recipe|convenience
GET    /api/mochi/state
```
- 복수형 명사 (`/ingredient` ✗ → `/ingredients` ✓)
- 동사 금지 (`/getMeals` ✗ → `GET /meals` ✓), 행위는 HTTP 메서드로
- 목록은 **반드시 페이지네이션** 파라미터 포함

**공통 응답 봉투 `ApiResponse<T>` (`src/lib/api-response.ts`):**
```ts
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };
```
```jsonc
// 성공
{ "success": true, "data": { /* ... */ } }
// 실패
{ "success": false, "error": { "code": "UNAUTHORIZED", "message": "로그인이 필요해요." } }
```

**HTTP 상태 코드:** `200` 조회/수정 · `201` 생성 · `400` 검증 실패 · `401` 미인증 · `403` 권한 없음 · `404` 없음

## 네이밍

- 컴포넌트: `PascalCase` (`MochiAvatar`, `RecipeCard`)
- 훅: `camelCase` + `use` 접두사 (`useFridge`, `usePagination`)
- API 클라 함수: `camelCase` 동사 (`fetchRecommendedMeals`, `markMealEaten`)
- 서버 서비스 함수: `camelCase` 동사 (`getRecommendations`, `createIngredient`)
- 타입/인터페이스: `PascalCase`, 접두사 없음 (`Ingredient`, `MealDetailResponse`)
- 상수: `UPPER_SNAKE_CASE`
- Prisma 모델: `PascalCase` / 필드 `camelCase` / 테이블·컬럼 snake_case는 `@@map`·`@map`

**DTO(타입) 네이밍:**
- 요청: `[기능]Request` (`CreateIngredientRequest`)
- 응답: `[기능]Response` (`MealDetailResponse`)

## 컴포넌트 규칙

- 페이지: `app/(그룹)/[도메인]/page.tsx`. **페이지는 렌더만**, 로직은 `features/<도메인>/hooks`로.
- props 타입은 컴포넌트 파일 상단에 `interface [컴포넌트명]Props`로 정의.
- **Server Component 기본**, `'use client'`는 상호작용/훅/브라우저 API가 필요한 컴포넌트에만.
- 공용 UI는 `components/ui/`, 도메인 전용은 `features/<도메인>/components/`.

## API 호출 규칙

- **컴포넌트에서 `fetch`/`axios` 직접 호출 금지.**
- 순서: `features/<도메인>/api/*` 함수 → **TanStack Query**(`useQuery`/`useMutation`)로 호출.
- 공통 처리는 `lib/fetcher.ts`(에러 정규화)와 **Query 전역 핸들러**(401 → 로그인 이동)에서 일괄.
- '먹었어요' 같은 즉시 피드백은 `useMutation`의 **optimistic update**로 모찌가 바로 반응하게.

## 상태 관리

- 서버 상태(API 데이터): **TanStack Query**
- 전역 클라 상태(모찌 상태·로그인 여부·UI): **Zustand**
- 컴포넌트 로컬 상태: `useState`

## 서버 레이어 규칙

- **Route Handler는 얇게**: Zod 검증 → 서비스 호출 → `ApiResponse` 변환. 비즈니스 로직 금지.
- **비즈니스 로직은 `server/services/`**, Prisma 호출도 여기서만. 멀티 스텝 쓰기는 `db.$transaction(...)`.
- **Prisma 모델을 클라에 그대로 반환 금지** → `...Response` 타입으로 변환.
- 도메인 간: 다른 도메인 내부를 직접 import 하지 않고 **ID/공개 타입**으로만 참조.

## 모찌 특화 컨벤션 (이 프로젝트만의 규칙)

- **모찌 상태 타입 고정**: `type MochiState = 'happy' | 'sleepy' | 'idle' | 'cheer'`. 문자열 리터럴 산발·임의 상태 추가 금지.
- **디자인 토큰만**: 색/라운드/그림자/간격은 `tailwind.config.ts` 토큰(`cream`,`peach`,`mint`,`lavender`,`rounded-mochi`,`shadow-mochi`)만. **임의 hex(`bg-[#...]`)·인라인 style 색상 금지.**
- **카피 톤 = 모찌 보이스**: 에러·검증·빈 상태 문구는 `lib/messages.ts`에 중앙화하고 부드러운 톤. "실패/오류/❌" 같은 단어·빨강 강조 지양. (제품 불변 규칙 #1)
- **숫자 노출 위치**: 체중·칼로리·달성률 컴포넌트는 `me`(마이) 트리 밖에서 import 금지. 홈에 숫자 금지. (제품 불변 규칙 #2)
- **애니메이션 프리셋**: 인터랙션은 Framer Motion 스프링(`whileTap={{ scale: 0.92 }}`), 모찌 상태 전환은 Lottie. 정의된 프리셋 사용, 매번 새로 만들지 않기.

## 의존성 정책

- **새 패키지 설치는 사람 승인 필요.** 에이전트가 `npm install <pkg>`/`add`를 시도하면 `.claude/hooks/guard-deps.mjs`가 차단한다.
- 승인 후엔 **왜 필요한지 한 줄을 PR 설명에 남기고** 설치한다. (번들 비대·보안 표면 관리)
