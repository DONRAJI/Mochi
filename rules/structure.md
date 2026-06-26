# 폴더 구조 (Directory Structure) — 모찌

> 원칙: **`app/`은 얇게(라우팅·레이아웃·Route Handler만), 로직은 `features/`(클라)와 `server/`(서버)로.**
> StudyGroup의 `controller → service → repository` 계층을 Next.js로 옮긴 형태다.

## 전체 구조

```
mochi/
├── rules/                       # AI 공통 규칙 (단일 소스 — PR로만 변경)
│   ├── project.md
│   ├── structure.md
│   ├── security.md
│   └── conventions.md
├── prisma/
│   ├── schema.prisma            # DB 스키마 (모델 PascalCase, 컬럼 snake_case는 @map)
│   └── migrations/
├── public/
│   ├── mochi/                   # 모찌 Lottie/이미지 (상태별: happy, sleepy, idle, cheer)
│   └── stickers/                # 재료·도감 스티커 에셋
├── src/
│   ├── app/                     # ── App Router (얇게) ──
│   │   ├── (auth)/              #   라우트 그룹: 로그인·회원가입·온보딩
│   │   ├── (main)/             #   인증 후 메인 (하단 탭 레이아웃)
│   │   │   ├── page.tsx        #     🏠 홈 (모찌의 방)
│   │   │   ├── fridge/page.tsx #     🧊 냉장고
│   │   │   ├── meals/page.tsx  #     🍽️ 식단·추천
│   │   │   ├── collection/page.tsx  # 📖 도감
│   │   │   └── me/page.tsx     #     👤 마이 (기록·더보기 — 숫자는 여기에만)
│   │   ├── api/                #   Route Handlers (route.ts) — 검증+서비스 호출+ApiResponse 변환만
│   │   │   ├── auth/
│   │   │   ├── fridge/
│   │   │   ├── recommend/
│   │   │   ├── records/
│   │   │   ├── collection/
│   │   │   └── mochi/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── middleware.ts        # 보호 라우트 인증 검사 (security.md)
│   ├── features/               # ── 도메인 로직 (클라) : StudyGroup domain/ 대응 ──
│   │   ├── auth/
│   │   │   ├── api/             #   클라 호출 함수 (fetcher 래퍼)  예: login.ts
│   │   │   ├── hooks/           #   React Query 훅           예: useLogin.ts
│   │   │   ├── components/      #   도메인 전용 컴포넌트
│   │   │   └── types.ts        #   요청/응답·도메인 타입
│   │   ├── fridge/
│   │   ├── recommend/
│   │   ├── record/
│   │   ├── collection/
│   │   └── mochi/              #   마스코트 상태·성장 로직
│   ├── server/                 # ── 서버 전용 : service/repository 대응 ──
│   │   ├── services/           #   비즈니스 로직 (도메인별). Prisma 호출은 여기서만
│   │   │   ├── auth.service.ts
│   │   │   ├── fridge.service.ts
│   │   │   └── ...
│   │   ├── auth/               #   세션 발급·검증
│   │   └── db.ts              #   Prisma Client 싱글톤 (+ `import 'server-only'`)
│   ├── components/
│   │   └── ui/                #   디자인 시스템 (Button, Card, MochiAvatar, StreakWidget …)
│   ├── lib/
│   │   ├── api-response.ts    #   ApiResponse<T> 봉투 헬퍼 (StudyGroup 포팅)
│   │   ├── fetcher.ts         #   공통 fetch 래퍼 (401 일괄 처리)
│   │   ├── messages.ts        #   모찌 보이스 카피 (에러/검증 문구 중앙화)
│   │   └── utils.ts
│   ├── store/                 #   Zustand (모찌 상태·UI 전역)
│   └── types/                 #   전역 공용 타입 (예: ApiResponse, MochiState)
├── .claude/
│   ├── settings.json          # Claude Code 훅 (의존성 설치 가드)
│   └── hooks/guard-deps.mjs
├── .cursor/rules/mochi.mdc    # Cursor 룰 (rules/ 가리킴)
├── CLAUDE.md  /  AGENTS.md  /  GEMINI.md   # 얇은 진입 (rules/ 포인터)
├── .gitignore
├── .env.example
├── .pre-commit-config.yaml    # gitleaks (시크릿 커밋 차단)
├── .github/workflows/ci.yml   # lint · typecheck · test 게이트
├── eslint.config.mjs
├── tailwind.config.ts         # ★ 디자인 토큰 정의처
├── tsconfig.json
└── package.json
```

## 레이어 규칙 (의존 방향)

```
app/ (Route Handler·페이지)
   │  서버측: 검증(Zod) → server/services 호출 → ApiResponse 변환
   │  클라측: 페이지는 features/<도메인>/components 렌더만
   ▼
features/<도메인>/  (클라 로직)   ── api → hooks(React Query) → components
   ▼
server/services/   (서버 로직, 트랜잭션 경계)
   ▼
server/db.ts (Prisma)
```

- **Route Handler(`route.ts`)는 얇게**: 입력 파싱·Zod 검증 → 서비스 호출 → `ApiResponse` 래핑. 비즈니스 로직 금지. (Spring Controller 규칙 계승)
- **비즈니스 로직은 `server/services/`**: 멀티 스텝 쓰기는 Prisma `$transaction`으로 묶는다. (`@Transactional` 대응)
- **Prisma 모델을 클라에 그대로 반환 금지**: 응답 타입(`...Response`)으로 변환해 노출. (Spring "Entity 노출 금지" 계승)
- **페이지는 렌더만**: 데이터·로직은 `features/<도메인>/hooks`로 분리.
- **Server Component 기본, `'use client'`는 필요할 때만**: 상호작용·훅·브라우저 API가 필요한 컴포넌트에만.

## 네이밍 (파일/폴더)

- 도메인 폴더: 소문자 단수 (`fridge/`, `recommend/`)
- 컴포넌트 파일: `PascalCase.tsx` (`MochiAvatar.tsx`)
- 훅 파일: `use~.ts` (`useFridge.ts`)
- 서비스 파일: `<도메인>.service.ts` (`recommend.service.ts`)
- API 클라 함수 파일: 동작 기준 (`fetchRecommendedMeals.ts`) 또는 도메인 묶음 (`fridge.api.ts`)
