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

## Firebase — 별도 SDK 설치는 없다

`@capacitor/push-notifications`가 Gradle 의존성으로 `firebase-messaging`을 **알아서 가져온다.**
우리가 할 일은 두 가지뿐:

1. **`google-services.json` 배치**: Firebase 콘솔 → 프로젝트 생성 → Android 앱 추가
   (패키지명 `app.vercel.mochi_nu_ashen.twa` 정확히) → 받은 파일을 `android/app/`에.
2. **서버 키**: Firebase 프로젝트 설정 > 서비스 계정 > 새 비공개 키 생성 → JSON에서
   `FCM_PROJECT_ID`·`FCM_CLIENT_EMAIL`·`FCM_PRIVATE_KEY`를 `.env`와 Vercel에.
   (PRIVATE_KEY는 `-----BEGIN...` 통째로, 개행 `\n` 유지)

`cap add android` 후 `android/app/build.gradle` 아래쪽에
`apply plugin: 'com.google.gms.google-services'` 줄이 있는지만 확인한다(템플릿에 포함돼 있다).
없으면 그 줄을 파일 맨 끝에 추가.

## 빌드 환경 (Android Studio 없이)

필요한 건 IDE가 아니라 **JDK 21 + Android SDK + Gradle** 셋이다. Gradle은 프로젝트에
포함된 `gradlew`가 알아서 받으므로 실제로 설치할 건 둘뿐.

```bash
winget install Microsoft.OpenJDK.21
```

Android SDK는 [명령줄 도구](https://developer.android.com/studio#command-line-tools-only)만
받아서(전체 IDE 아님) `C:\Android\cmdline-tools\latest\`에 압축을 푼다.
(`latest` 폴더 안에 `bin`·`lib`이 바로 오게 — 한 겹 더 들어가면 sdkmanager가 못 찾는다.)

환경변수 — PowerShell에서 **한 번만**:

```powershell
setx ANDROID_HOME "C:\Android"
setx PATH "$env:PATH;C:\Android\cmdline-tools\latest\bin;C:\Android\platform-tools"
```

새 터미널을 열고 SDK 설치 + 라이선스 동의:

```bash
sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0"
```

```bash
sdkmanager --licenses
```

## 빌드 & 서명

```bash
cd native && npm install && npx cap add android && npm run sync
```

⚠️ **`android/app/build.gradle`의 `versionCode`를 기존 Play 버전보다 크게 올린다**
(`cap add android`는 1로 생성한다 — 그대로 올리면 Play가 거부).

```bash
cd native/android && ./gradlew bundleRelease
```

결과: `native/android/app/build/outputs/bundle/release/app-release.aab` (**서명 안 됨**)

Gradle에 서명 설정을 넣는 대신 **jarsigner로 사후 서명**한다 — 생성물인 build.gradle을
건드리지 않아 `android/`를 지웠다 다시 만들어도 절차가 그대로다.

```bash
jarsigner -sigalg SHA256withRSA -digestalg SHA-256 -keystore <signing.keystore 경로> app-release.aab <키 별칭>
```

keystore와 별칭·비밀번호는 **최초 PWABuilder 패키지 zip 안의 `signing.keystore`와
`signing-key-info.txt`**에 있다. 다른 키로 서명하면 Play가 업로드를 거부한다.

서명된 `.aab`를 Play Console 내부 테스트에 업로드.

> 빌드는 사실상 1회성이다 — 원격 URL 모드라 앱 업데이트는 웹 배포로 이뤄진다.
> 다시 빌드할 때: 셸 설정 변경 · Capacitor 버전업 · 구글의 연간 target SDK 상향.

## 확인할 것

- 앱 실행 시 주소창 없음(WebView라 원래 없다 — DAL 검증 자체가 불필요해짐)
- 마이 > 설정 > 알림에서 리마인더 켜기 → 서버 `/api/push/cron` 실행 시 **모찌 명의** 알림
- 알림 탭 → 앱이 열리고 식단 탭으로 이동
- 레시피 원문 링크 → 시스템 브라우저로 열림(앱에 갇히지 않음)
- 뒤로가기 → 화면 이동, 첫 화면에선 앱 종료
