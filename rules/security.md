# 보안 규칙 (Security Rules) — 모찌

팀 전원이 반드시 준수한다. AI 도구가 코드를 생성할 때도 따른다.
**중요 규칙은 산문으로 끝내지 않고 실제 장치(hook/CI/브랜치 보호)로 강제한다 → `SETUP.md`.**

## 1. 민감 정보 관리

**절대 Git에 커밋 금지:**
- 세션 시크릿, 외부 API 키(영양 DB·이미지 인식 등), DB 접속 정보
- `.env`, `.env.local`, `*.key`, `*.pem`

`.gitignore` 필수(이미 등록됨): `.env*`(단 `.env.example` 제외).

**Next.js 환경변수 — 가장 흔한 사고:**
- `NEXT_PUBLIC_` 접두사가 붙은 변수는 **브라우저 번들에 평문으로 박힌다.** → 시크릿에 절대 사용 금지.
- 서버 전용 값(`DATABASE_URL`, `SESSION_SECRET`, `OPENAI_API_KEY` 등)은 접두사 없이 두고, **Route Handler·서버 서비스에서만** 읽는다.
- 외부 API 키는 클라에서 직접 호출하지 말고 **반드시 Route Handler를 경유**(키가 클라로 새지 않게).
- 새 변수는 `.env.example`에 키만 추가.

## 2. 인증 (세션)

JWT를 Spring처럼 다루지 않고 **Next 친화적 세션 쿠키**로 간다.

- **세션 토큰 저장: `HttpOnly` + `Secure` + `SameSite=Lax` 쿠키.** JS에서 접근 불가.
  - `localStorage`/`sessionStorage`에 토큰 저장 **금지** (XSS 탈취 위험).
- 세션 검증은 **`src/middleware.ts`에서 보호 라우트 차단** + **각 Route Handler/서비스에서 재확인**(다층 방어).
- 비밀번호는 `bcrypt`(또는 `argon2`)로 해싱. **평문 DB 저장 금지.**
- 만료: 액세스 30분 / 갱신(refresh) 7일. 갱신 토큰은 서버 DB에 저장해 폐기 가능하게 관리.
- 인증 로직은 `src/server/auth/`에 모은다. (직접 구현 대신 Auth.js 채택도 가능 — 채택 시 이 규칙을 그 설정으로 매핑)

## 3. 입력 검증 (Zod)

- **모든 Route Handler는 입력을 신뢰하지 않는다.** body·query·params를 **Zod 스키마로 검증**한 뒤 서비스로 넘긴다.
- 검증 실패는 `400` + `ApiResponse` 에러로 응답. (`@Valid` 대응)
- 검증 스키마는 해당 도메인 `features/<도메인>/types.ts` 또는 `server/services` 옆에 둔다.

## 4. 권한 / 소유자 검증

- 다른 사용자의 리소스에 접근/변경하는 요청은 **서비스 레이어에서 소유자 검증 필수**.

```ts
// server/services/record.service.ts
const log = await db.weightLog.findUnique({ where: { id } });
if (!log || log.userId !== session.userId) {
  throw new AppError("FORBIDDEN", "접근 권한이 없어요.");
}
```

- 권한 체크를 **프론트에서만 하지 말 것.** 라우트 가드는 UX용이고, 진짜 검증은 서버에서.

## 5. API 보안

- **페이지네이션 없는 전체 조회 API 생성 금지** (대량 데이터 노출 방지). 목록은 `?page=&size=` 필수.
- **에러 응답에 스택 트레이스·DB 정보·내부 구조 포함 금지.** Route Handler는 항상 `ApiResponse` 에러 봉투로만 응답하고, 원본 에러는 서버 로그로만.
- 인증/업로드 등 민감 엔드포인트에는 레이트 리밋 고려.

## 6. 파일 업로드 (모찌 특화 — 냉장고/식사 사진)

사진 인식·영수증 스캔은 실제 공격면이다.

- 업로드 파일의 **타입·크기를 서버에서 검증**(클라 검증만 믿지 않음). 허용 MIME 화이트리스트.
- 파일명은 **서버에서 재생성**(사용자 입력 파일명 그대로 저장 금지 — 경로 조작 방지).
- 원본은 리포지토리/공개 경로가 아닌 **외부 스토리지**(예: Supabase Storage)에 저장.
- 이미지 인식 외부 API 호출은 **서버에서만**(5장·1장).

## 7. 프론트엔드 / React·Next 경계

- 사용자 입력을 `innerHTML`로 직접 삽입 **금지**. `dangerouslySetInnerHTML` 사용 **금지** (XSS). (StudyGroup 계승)
- 보호가 필요한 페이지는 `middleware.ts`에서 라우터 레벨로 차단.
- **Server → Client 경계 주의(Next 특화):**
  - 서버 전용 모듈(`server/db.ts` 등)에는 `import 'server-only'`를 붙여 클라 번들 유입을 차단.
  - **Server Component에서 Client Component로 시크릿을 props로 넘기지 않는다.** (직렬화되어 HTML에 노출됨.) 필요한 최소 데이터만 전달.
- CORS: 같은 오리진(Next API)은 대체로 불필요. **외부에 API를 열 경우에만** 오리진을 명시적으로 화이트리스트(와일드카드 `*` 단독 금지).
