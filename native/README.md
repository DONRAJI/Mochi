# 모찌 안드로이드 셸 (Capacitor)

TWA를 대체하는 네이티브 셸. **원격 URL 모드**라 웹 배포가 곧 앱 반영이고, 셸은
FCM 푸시·뒤로가기·외부링크 같은 네이티브 연결만 담당한다. (배경·결정은 `../workflow.md` §7)

- 웹 앱과 **의존성이 분리**돼 있다(이 폴더의 `package.json`) — 웹 번들은 Capacitor를 모른다.
- 앱 동작 배선은 여기가 아니라 웹 앱 쪽에 있다: `src/features/notify/native.ts`,
  `NativeShellBridge.tsx`. 원격 URL 모드에선 로드되는 게 웹 앱이기 때문.

## ⚠️ 절대 바꾸지 말 것

- **appId `app.vercel.mochi_nu_ashen.twa`** — 기존 TWA와 같은 패키지명이어야 Play에서
  **새 앱이 아니라 업데이트**로 올라간다(테스터·심사 진행 유지). 바꾸면 되돌릴 수 없다.
- **서명 keystore** — 최초 PWABuilder 패키지의 `signing.keystore`와 같은 키로 서명해야
  Play가 받는다. 잃어버리면 Play Console에서 업로드 키 재설정 요청이 필요하다.

## 준비 (최초 1회)

1. **Firebase**: 콘솔에서 프로젝트 생성 → Android 앱 추가(패키지명 위와 동일) →
   `google-services.json` 다운로드 → `android/app/google-services.json`에 배치.
2. **서버 키**: Firebase 프로젝트 설정 > 서비스 계정 > 새 비공개 키 생성 → JSON에서
   `FCM_PROJECT_ID`·`FCM_CLIENT_EMAIL`·`FCM_PRIVATE_KEY`를 `.env`와 Vercel에.
3. **Android Studio** 설치(첫 빌드 환경 구성이 가장 오래 걸린다).

## 빌드

```bash
cd native
npm install
npx cap add android        # 최초 1회 — android/ 생성
npm run sync               # 설정·플러그인 반영 (설정 바꿀 때마다)
npm run open               # Android Studio 열기
```

Android Studio에서:
1. `android/app/build.gradle`의 `versionCode`를 **기존 Play 버전보다 크게** (재업로드 거부 방지)
2. Build > Generate Signed Bundle / APK > **Android App Bundle**
3. 위 keystore로 서명 → `.aab` 생성 → Play Console 내부 테스트에 업로드

## 확인할 것

- 앱 실행 시 주소창 없음(WebView라 원래 없다 — DAL 검증 자체가 불필요해짐)
- 마이 > 설정 > 알림에서 리마인더 켜기 → 서버 `/api/push/cron` 실행 시 **모찌 명의** 알림
- 알림 탭 → 앱이 열리고 식단 탭으로 이동
- 레시피 원문 링크 → 시스템 브라우저로 열림(앱에 갇히지 않음)
- 뒤로가기 → 화면 이동, 첫 화면에선 앱 종료
