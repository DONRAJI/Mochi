import "server-only";
import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * 비밀번호 해싱 (security.md §2: 평문 저장 금지).
 * Node 내장 scrypt(메모리-하드 KDF) 사용 — 새 의존성 없음. bcrypt/argon2로 교체 시 이 파일만 바꾸면 됨.
 * 저장 형식: `scrypt$<salt-hex>$<hash-hex>`
 */
const scrypt = promisify(_scrypt);
const KEYLEN = 64;
const SCHEME = "scrypt";

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, KEYLEN)) as Buffer;
  return `${SCHEME}$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== SCHEME || !salt || !hash) return false;
  const derived = (await scrypt(password, salt, KEYLEN)) as Buffer;
  const hashBuf = Buffer.from(hash, "hex");
  if (hashBuf.length !== derived.length) return false;
  return timingSafeEqual(hashBuf, derived);
}
