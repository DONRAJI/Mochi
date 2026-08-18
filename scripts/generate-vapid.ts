/**
 * VAPID 키 쌍 생성 — 웹푸시(리마인더)용. 실행: npx tsx scripts/generate-vapid.ts
 * 출력 세 줄을 .env와 Vercel env에 넣는다. 개인키는 서버 전용(NEXT_PUBLIC_ 금지).
 * 키를 바꾸면 기존 구독이 전부 무효가 되므로(구독이 공개키에 묶임) 한 번 정해 유지할 것.
 */
import { generateKeyPairSync } from "node:crypto";

const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const pub = publicKey.export({ format: "jwk" });
const priv = privateKey.export({ format: "jwk" });
if (!pub.x || !pub.y || !priv.d) throw new Error("JWK export에 좌표가 없어요");

// PushManager.applicationServerKey가 요구하는 형태 = 비압축 P-256 (0x04 || x || y)
const raw = Buffer.concat([
  Buffer.from([4]),
  Buffer.from(pub.x, "base64url"),
  Buffer.from(pub.y, "base64url"),
]);

console.log(`VAPID_PUBLIC_KEY=${raw.toString("base64url")}`);
console.log(`VAPID_PRIVATE_KEY=${priv.d}`);
console.log("VAPID_SUBJECT=mailto:<본인 이메일>");
