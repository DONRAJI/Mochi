# CLAUDE.md — 모찌(Mochi)

> Claude Code 진입 문서. **짧게 유지(60줄 이하).** 상세는 전부 `rules/`에 있고, 이 파일은 가리키기만 한다.
> 규칙을 바꿀 땐 이 파일이 아니라 **`rules/`를 수정**한다. (단일 소스 오브 트루스)

## 프로젝트

파스텔 톤 **'죄책감 없는' 다이어트 컴패니언**. 핵심 루프: 제안 → 기록 → 수집.
진행도는 숫자가 아니라 마스코트 '모찌'로 표현한다. (상세 기획 → `docs/PRD.md`)

## 스택

Next.js 15 (App Router) · TypeScript · Tailwind · TanStack Query · Zustand · Framer Motion + Lottie · Prisma + PostgreSQL · Zod

## 반드시 지킬 것 (5)

1. **죄책감 제로**: 빨강 경고색·실패 메시지·강압적 숫자 타겟 금지. 에러/검증 카피도 모찌 보이스(부드럽게).
2. **홈에 숫자 금지**: 체중·칼로리·달성률은 `me`(마이) → '더보기'로 격리.
3. **모찌 상태는 정의된 유니온만**: `'happy' | 'sleepy' | 'idle' | 'cheer'`. 임의 상태 추가 금지.
4. **디자인 토큰만**: 색·라운드·그림자는 `tailwind.config.ts` 토큰만. 임의 hex·인라인 style 색상 금지.
5. **TypeScript만**: `.js`/`.jsx` 생성 금지. 새 패키지 설치는 사람 승인 필요.

## 명령어

```bash
npm run dev          # 개발 (localhost:3000)
npm run build
npm run lint
npm run typecheck    # tsc --noEmit
npm run test         # vitest
npx prisma migrate dev
```

## 도메인 핵심

- 도메인: `auth` · `fridge` · `recommend` · `record` · `collection` · `mochi`
- 비요리 사용자도 동일 루프(외식·간편식 모드)로 흡수 — '냉장고'는 입력 모드 하나일 뿐.
- 도감 = 리텐션 엔진. 도메인 간엔 ID/공개 타입으로만 참조.

## 세부 규칙 (필요할 때 펼쳐 볼 것)

- 폴더 구조 → `rules/structure.md`
- 보안 → `rules/security.md`
- 컨벤션 → `rules/conventions.md`
- 프로젝트 사실·제품 원칙 → `rules/project.md`
