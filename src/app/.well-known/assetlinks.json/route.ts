/**
 * Digital Asset Links — 플레이스토어 TWA가 이 도메인을 신뢰하게 해 주소창을 숨긴다.
 * /.well-known/assetlinks.json 으로 서빙(정적 JSON). 앱 서명키 지문(PWABuilder 생성)과 일치해야 함.
 * 앱 재서명/키 변경 시 sha256 지문을 갱신할 것.
 */
const ASSET_LINKS = [
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: "app.vercel.mochi_nu_ashen.twa",
      sha256_cert_fingerprints: [
        "CB:B6:43:C1:0B:E0:7D:4C:A9:C1:84:04:D1:37:E7:9C:0B:80:25:51:28:BF:F7:CF:86:3E:3E:32:B7:95:60:97",
      ],
    },
  },
];

export function GET() {
  return Response.json(ASSET_LINKS);
}
