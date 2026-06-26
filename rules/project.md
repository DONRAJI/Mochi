# 프로젝트 (Project) — 모찌(Mochi)

> 이 파일은 **단일 소스 오브 트루스(Single Source of Truth)** 입니다.
> 프로젝트 사실·도메인·명령어·제품 원칙은 여기에만 적습니다.
> `CLAUDE.md` / `AGENTS.md` / `GEMINI.md` / `.cursor/rules/*.mdc` 는 이 파일을 **가리키기만** 하고, 내용을 복사하지 않습니다.

## 한 줄 정의

파스텔 톤의 **'죄책감 없는' 다이어트 컴패니언 앱**. "오늘 뭐 먹지"를 마스코트 '모찌'가 대신 풀어준다.
핵심 루프는 **제안 → 기록 → 수집**. 진행도는 숫자가 아니라 모찌의 성장으로 표현한다.
(상세 기획: `docs/PRD.md`)

## 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | **Next.js 15 (App Router)** + TypeScript |
| 스타일 | Tailwind CSS (파스텔 디자인 토큰) |
| 서버 상태 | TanStack Query (React Query) |
| 전역 클라 상태 | Zustand |
| 애니메이션 | Framer Motion (인터랙션) + Lottie (모찌 상태) |
| DB / ORM | PostgreSQL + Prisma |
| 인증 | HttpOnly 세션 쿠키 (`src/server/auth/`) |
| 검증 | Zod (Route Handler 경계) |
| 테스트 | Vitest + Testing Library |
| 배포/DB 호스팅 | Vercel + Supabase(또는 Neon) 무료 티어 |

> **언어 정책: TypeScript만 사용. `.js`/`.jsx` 파일 생성 금지.**

## 도메인 맵 (`src/features/`, `src/server/services/`)

| 도메인 | 책임 | P0(MVP) |
|--------|------|:---:|
| `auth` | 회원가입·로그인·온보딩(취향 태그). 체중 입력은 **선택** | ✅ |
| `fridge` | 재료 CRUD·유통기한·선호/비선호/알러지 태그·입력(수동/사진/영수증/바코드) | ✅ |
| `recommend` | 레시피·메뉴 추천(랭킹·매칭률)·외식/간편식 모드·주간 식단 | ✅ |
| `record` | 먹었어요 체크·사진 기록·체중 로그·스트릭(보호권) | ✅ |
| `collection` | 재료/요리/간편식 도감·희귀도·컴플리트·보상 | ✅(기본) |
| `mochi` | 마스코트 상태·성장·꾸미기 | ✅ |

도메인 간 의존: 다른 도메인의 내부(컴포넌트/서비스/Prisma 모델)를 직접 import 하지 않는다.
교차가 필요하면 **ID 또는 공개 타입**으로만 참조한다. (Spring의 "Entity 직접 참조 금지" 원칙을 TS로 계승)

## 명령어

```bash
npm install                 # 의존성 설치 (새 패키지 추가는 사람 승인 필요 — conventions.md 참고)
npm run dev                 # 개발 서버 (http://localhost:3000)
npm run build               # 프로덕션 빌드
npm run start               # 프로덕션 실행
npm run lint                # ESLint
npm run typecheck           # tsc --noEmit (타입 검사)
npm run test                # Vitest

npx prisma migrate dev      # 마이그레이션 생성·적용 (개발)
npx prisma generate         # Prisma Client 재생성
npx prisma studio           # DB GUI
```

## 데이터베이스 / 환경변수

- PostgreSQL(Supabase/Neon). 로컬 실제 값은 `.env.local` → **커밋 금지**(`.gitignore` 등록됨).
- 서버 전용 시크릿(`DATABASE_URL`, 세션 시크릿, 외부 API 키)은 **`NEXT_PUBLIC_` 접두사를 절대 붙이지 않는다.** (붙이면 브라우저 번들에 평문 노출 — `security.md` 참고)
- 환경변수 추가 시 `.env.example`에 **키만**(값 없이) 추가해 팀과 공유.

## 제품 불변 규칙 (모찌의 정체성 — 코드가 위반하면 안 됨)

이 다섯은 단순 스타일이 아니라 **제품 철학**이다. 에이전트가 가만 두면 반드시 어긴다.

1. **죄책감 제로**: 빨강 경고색·실패 메시지·강압적 숫자 타겟 **금지**. 에러/검증 카피도 모찌 보이스(부드럽게).
2. **홈에 숫자 금지**: 체중·칼로리·달성률 등 숫자는 홈에 노출하지 않고 `me`(마이) → '더보기'로 격리.
3. **모찌 상태는 정의된 유니온만**: `MochiState = 'happy' | 'sleepy' | 'idle' | 'cheer'`. 임의 문자열 상태 추가 금지.
4. **디자인 토큰만**: 색·라운드·그림자·간격은 `tailwind.config.ts` 토큰만 사용. 임의 hex(`bg-[#...]`)·인라인 style 색상 금지.
5. **비요리 사용자 동등**: '냉장고'는 입력 모드 하나일 뿐. 외식·간편식 모드도 동일한 제안→기록→수집 루프를 갖는다. 기능을 '요리'에만 묶지 않는다.

## 브랜치 전략

- `main` — 검수(리뷰) 완료 코드만 머지. **직접 push 금지** (GitHub Branch Protection으로 강제 — `SETUP.md`).
- `dev` — 개발 브랜치. 작업 후 PR로 `main`에 머지.
- 흐름: `dev` 작업 → 검수 → `main` 머지.
