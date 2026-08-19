/**
 * Digital Asset Links — 플레이스토어 TWA가 이 도메인을 신뢰하게 해 주소창을 숨긴다.
 * /.well-known/assetlinks.json 으로 서빙(정적 JSON).
 *
 * 지문 두 개가 **둘 다 필요하다** (하나로 합치면 한쪽 설치본이 깨진다):
 * - 업로드 키(PWABuilder 서명): 로컬에서 직접 설치한 테스트 APK용.
 * - **Play 앱 서명 키**: 스토어에서 받는 실제 배포본 — Google이 재서명해서 지문이 다르다.
 *   이게 빠져 있던 동안 검증이 실패해 주소창 표시·알림이 Chrome 명의·클릭 시 브라우저로
 *   열리는 증상이 났다(알림 위임은 검증 통과한 오리진에서만 발동).
 */
const ASSET_LINKS = [
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: "app.vercel.mochi_nu_ashen.twa",
      sha256_cert_fingerprints: [
        // 업로드 키 (PWABuilder 로컬 서명)
        "CB:B6:43:C1:0B:E0:7D:4C:A9:C1:84:04:D1:37:E7:9C:0B:80:25:51:28:BF:F7:CF:86:3E:3E:32:B7:95:60:97",
        // Play 앱 서명 키 (스토어 배포본 — Play Console > 앱 무결성 > 앱 서명 키 인증서)
        "EA:F3:95:68:C1:9C:34:3E:C4:5D:CD:B0:C4:F3:AE:68:8B:16:1E:86:2C:C6:49:1E:5B:09:A0:6C:75:EF:0D:1E",
      ],
    },
  },
];

export function GET() {
  return Response.json(ASSET_LINKS);
}
