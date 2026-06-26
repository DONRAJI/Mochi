# SETUP.md — 강제 장치 세팅 & 하네스 키우기

> 핵심 철학: **산문은 방향, 장치는 신뢰.** `rules/`의 "금지" 문장은 *의도*고, 아래 장치들이 그걸 *실제로* 막는다.
> "프롬프트로만 권한 통제하기"는 신뢰 시스템이 아니다 — 중요한 규칙은 hook/CI/브랜치 보호로 강제한다.

---

## 0. 규칙 ↔ 강제 장치 매핑

| 규칙 (rules/에 산문으로 적힘) | 실제 강제 장치 | 어디서 |
|---|---|---|
| `main` 직접 push 금지 | GitHub Branch Protection | §1 |
| 시크릿/`.env` 커밋 금지 | `.gitignore` + **gitleaks** pre-commit | §2 |
| TS만, 타입 깨진 코드 머지 금지 | ESLint + `tsc --noEmit` **CI 게이트** | §3 |
| 테스트 주석처리/실패 머지 금지 | Vitest **CI 게이트** | §3 |
| 새 라이브러리 임의 설치 금지 | **Claude Code PreToolUse 훅** | §4 |
| 디자인 토큰만 사용 (모찌) | lint(하드코딩 색상 차단) | §5 |

---

## 1. 브랜치 보호 (`main` push 차단)

GitHub → **Settings → Branches → Add branch ruleset** (또는 Branch protection rules):
- 대상: `main`
- ☑ Require a pull request before merging (+ 최소 1 리뷰)
- ☑ Require status checks to pass → CI 잡(`lint`, `typecheck`, `test`) 선택
- ☑ Do not allow bypassing the above settings (관리자도 우회 금지 — 진짜 강제)

> 이 한 번의 설정이 "main 직접 push 금지" 산문보다 강력하다.

## 2. 시크릿 커밋 차단 (gitleaks)

[pre-commit](https://pre-commit.com) 사용. 설정은 `.pre-commit-config.yaml`에 포함됨.

```bash
pipx install pre-commit        # 또는 brew install pre-commit
pre-commit install             # git hook 등록 (커밋마다 자동 실행)
pre-commit run --all-files     # 전체 1회 점검
```
- 추가로 GitHub → Settings → **Code security → Secret scanning** 활성화(원격 2차 방어).

## 3. CI 게이트 (lint · typecheck · test)

`.github/workflows/ci.yml` 포함됨. `dev`/`main` 대상 PR마다 실행되어 **하나라도 실패하면 머지 차단**(§1과 연동).
- 로컬에서도 커밋 전에: `npm run lint && npm run typecheck && npm run test`.

## 4. 의존성 설치 가드 (Claude Code 훅)

`.claude/settings.json` + `.claude/hooks/guard-deps.mjs` 포함됨.
- Claude Code가 `npm install <pkg>` / `npm i <pkg>` / `yarn add` / `pnpm add`를 실행하려 하면 **PreToolUse 훅이 차단**하고 사람 승인을 요구한다.
- 락파일에서 전체 설치(`npm install` / `npm ci`)는 허용된다.
- 승인 후 설치할 땐 `rules/conventions.md`의 의존성 정책대로 PR에 사유 한 줄을 남긴다.

> Cursor/Codex 등 다른 에이전트엔 이 훅이 적용되지 않으니, 그쪽은 §2·§3(커밋·CI 단계)에서 락파일 변경을 리뷰로 잡는다.

## 5. 디자인 토큰 강제 (모찌)

목표: 임의 색상(`bg-[#ff0000]`, `style={{ color: '#...' }}`) 차단 → `tailwind.config.ts` 토큰만 사용.
- 1차(가벼움): ESLint 규칙으로 인라인 style 색상·Tailwind 임의값 색상 경고.
- 2차(원하면): stylelint + `stylelint-config-tailwindcss`로 하드코딩 색상 에러 처리.
- CI(§3) lint 단계에 포함시키면 토큰 위반이 머지 전에 잡힌다.

---

## 6. 하네스 키우기 (Day 0 → 이후)

이 패키지는 **Day 0 씨앗**이다. 처음부터 완벽을 노리지 말고, 반복되는 실수를 보며 래칫을 돌린다.

**래칫 원칙**: 에이전트가 같은 실수를 2번 하면 → `rules/`에 한 줄 추가. 그래도 반복되면 → 위 §1~§5처럼 **장치로 승격**.

**모찌에서 곧 만나게 될 실수(미리 대비)**
- 빨강 에러 토스트/실패 카피 생성 → 제품 불변 #1 위반. `rules/conventions.md`에 적힘 → 반복되면 lint 룰.
- 홈에 숫자(칼로리/체중) 노출 → #2 위반.
- 즉흥 모찌 상태 문자열 → #3 위반(타입으로 1차 차단됨).
- 색상 하드코딩 → #4 위반(§5).
- 애니메이션 라이브러리 임의 추가 → §4 훅이 차단.

**Week 2~4 확장 (필요해지면)**
- **Context7 MCP** 연결: App Router·TanStack Query 등 **모델 학습 이후 변경이 잦은** 라이브러리 최신 문서를 가져오게.
- **GitHub MCP**: 이슈/PR 관리가 들어오면.
- **slash command / Skill**: 도메인 하나를 까는 반복 작업(`route.ts → service → features(api·hooks·components·types) → page`)을 한 커맨드로 묶기.
- **서브에이전트**: "도메인 X 전체 탐색 후 테스트 작성" 같은 크고 독립적인 작업을 분리해 메인 컨텍스트를 깨끗하게.

**안티패턴(StudyGroup에서 가져온 교훈)**
- 진입 파일(`CLAUDE/AGENTS/GEMINI/.mdc`)에 규칙을 **복사하지 말 것** — `rules/`만 수정, 진입 파일은 포인터 유지. (과거 `GEMINI.md`가 `CLAUDE.md` 복사본이 되어 제목까지 틀어졌던 사고 방지)
- `CLAUDE.md` 60줄 넘기지 말 것.
- 겹치는 커스텀 도구 난립 금지(10개 이내로).
