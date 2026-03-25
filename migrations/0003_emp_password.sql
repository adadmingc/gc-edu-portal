-- ═══════════════════════════════════════════
-- 마이그레이션 0003: 직원 비밀번호 기능 추가
-- Cloudflare D1 Console에서 실행:
--   ALTER TABLE employees ADD COLUMN emp_password TEXT DEFAULT '';
-- ═══════════════════════════════════════════

-- 직원 테이블에 비밀번호 컬럼 추가 (기본값 빈 문자열 = 비밀번호 미설정)
ALTER TABLE employees ADD COLUMN emp_password TEXT DEFAULT '';
