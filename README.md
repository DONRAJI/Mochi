# 🧊 모찌(Mochi)

> "오늘 뭐 먹지"를 모찌가 대신 풀어주는, **죄책감 없는 사전 제안형 식사 컴패니언**.
> 다이어트를 *관리(tracking)* 가 아니라 *수집(collecting)* 의 즐거움으로 바꾼다.

핵심 루프는 **제안 → 기록 → 수집**. 진행도는 숫자가 아니라 마스코트 '모찌'의 성장으로 표현한다.

## 스택

- **프레임워크**: Next.js 15 (App Router) + TypeScript — 풀스택 단일 레포
- **스타일**: Tailwind CSS (파스텔 디자인 토큰)
- **서버 상태 / 전역 상태**: TanStack Query / Zustand
- **애니메이션**: Framer Motion + Lottie
- **DB / ORM**: PostgreSQL + Prisma
- **검증**: Zod · **테스트**: Vitest + Testing Library
- **배포**: Vercel + Supabase(또는 Neon)

## 시작하기

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 — 예시를 복사해 값 채우기 (.env.local 은 깃에 올라가지 않음)
cp .env.example .env.local

# 3. Prisma 클라이언트 생성 (스키마 변경 시 재실행)
npx prisma generate
# DB 연결 후 마이그레이션:  npx prisma migrate dev

# 4. 개발 서버
npm run dev   # http://localhost:3000
```

요구사항: Node 20+ · PostgreSQL(로컬 또는 Supabase/Neon).

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` / `npm run start` | 프로덕션 빌드 / 실행 |
| `npm run lint` | ESLint (디자인 토큰 위반·임의 hex 색상 차단 포함) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest |

## 프로젝트 구조

```
src/
├── app/            # App Router — 페이지·레이아웃·Route Handler(얇게)
│   ├── (main)/     #   홈·냉장고·식단·도감·마이 (하단 5탭)
│   ├── (auth)/     #   로그인·온보딩
│   └── api/        #   Route Handlers: Zod 검증 → 서비스 → ApiResponse
├── features/       # 도메인 클라 로직 (api · hooks · components · types)
├── server/         # 서버 전용: services(비즈니스·Prisma) · auth · db
├── components/ui/  # 디자인 시스템 (Button, Card, MochiAvatar …)
├── lib/            # ApiResponse · fetcher · messages(모찌 보이스) · utils
├── store/          # Zustand
└── types/          # 공용 타입 (ApiResponse, MochiState)
```

도메인: `auth` · `fridge` · `recommend` · `record` · `collection` · `mochi`.
계층 의존 방향은 `app → features → server/services → db`. 도메인 간엔 ID/공개 타입으로만 참조한다.

## 제품 원칙 (코드가 지키는 불변 규칙)

1. **죄책감 제로** — 빨강 경고색·실패 메시지·강압적 숫자 타겟 금지. 카피도 부드러운 '모찌 보이스'.
2. **홈에 숫자 금지** — 체중·칼로리·달성률은 마이(`me`) 탭으로 격리.
3. **모찌 상태 고정** — `'happy' | 'sleepy' | 'idle' | 'cheer'` 유니온만.
4. **디자인 토큰만** — 색·라운드·그림자는 `tailwind.config.ts` 토큰만 (임의 hex 금지, lint로 강제).
5. **비요리 사용자 동등** — 외식·간편식 모드도 동일한 제안→기록→수집 루프.

## 브랜치 전략

`dev` 작업 → PR → `main` 머지. `main` 직접 push 금지(Branch Protection).
