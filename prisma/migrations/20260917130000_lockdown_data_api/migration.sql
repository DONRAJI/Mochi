-- Supabase Data API(PostgREST) 차단 — 추가형(데이터·스키마 변경 없음, 권한만).
--
-- 왜: Supabase는 public 스키마 테이블을 anon/authenticated 역할로 인터넷 API에 자동 공개한다.
-- Prisma로 만든 테이블은 RLS가 꺼져 있어, 공개 키(anon key — Supabase 설계상 공개 정보)만 있으면
-- users·sessions·기록까지 읽고 쓸 수 있는 상태였다(Security Advisor lint 0013 rls_disabled_in_public).
-- 모찌는 이 API를 쓰지 않는다 — 서버가 Prisma(postgres 역할, RLS 우회)로만 접근하므로 앱 동작은 그대로.
--
-- 1) public의 모든 테이블에 RLS를 켠다(정책 없음 = API로는 아무 행도 안 보임)
-- 2) anon/authenticated의 기존 권한 회수 + 앞으로 만들 테이블·시퀀스·함수도 기본으로 권한 없음
--    (RLS를 켜도 이미 준 권한은 남는다 — Supabase RLS 가이드)
-- 역할이 없는 DB(예: 로컬 섀도 DB)에서도 깨지지 않게 역할 존재를 확인한다.

DO $$
DECLARE
  t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
    REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
    REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM authenticated;
  END IF;
END $$;
