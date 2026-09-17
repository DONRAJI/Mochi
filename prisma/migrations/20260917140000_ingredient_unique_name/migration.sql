-- 냉장고 재료: 같은 사용자·같은 이름은 하나만 (유니크 제약).
--
-- 서버 코드는 이미 같은 이름이면 새로 만들지 않고 갱신하지만(fridge.service stock), 아주 빠른 연타처럼
-- 요청이 동시에 들어오면 둘 다 '없음'을 보고 두 개를 만들 수 있었다. DB가 최종적으로 막는다.
--
-- 1) 이미 쌓인 중복 정리 — 같은 사용자·같은 이름 중 **가장 최근에 담은 것 하나만** 남긴다
--    (담은 시각이 같으면 id가 큰 쪽). 재료는 다른 테이블이 참조하지 않아 지워도 연결이 끊기지 않는다.
-- 2) 유니크 인덱스 생성

DELETE FROM "ingredients" a
USING "ingredients" b
WHERE a.user_id = b.user_id
  AND a.name = b.name
  AND (a.created_at < b.created_at OR (a.created_at = b.created_at AND a.id < b.id));

CREATE UNIQUE INDEX "ingredients_user_id_name_key" ON "ingredients"("user_id", "name");
