-- 씨앗 슬롯-처음 규칙 (#2) — 그날 base 씨앗을 지급한 끼니 슬롯 기록(추가형, nullable).
-- 등록/취소 반복 farming 차단: (KST일, 슬롯) 조합이 처음일 때만 base 씨앗 지급.
ALTER TABLE "users" ADD COLUMN "seed_slots" TEXT;
