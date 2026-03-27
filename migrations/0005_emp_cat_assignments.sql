-- ═══════════════════════════════════════════
-- 마이그레이션 0005: 직원별 교육 배정
-- ═══════════════════════════════════════════

-- 직원별 해당 교육 배정 테이블
CREATE TABLE IF NOT EXISTS emp_cat_assignments (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  emp_id   TEXT NOT NULL,
  cat_id   TEXT NOT NULL,
  UNIQUE(emp_id, cat_id)
);

-- 기존 직원들은 기본적으로 법정의무교육만 배정
-- (관리자가 이후 개별 설정 가능)
