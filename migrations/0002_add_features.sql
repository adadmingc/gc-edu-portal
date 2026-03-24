-- ═══════════════════════════════════════════
-- 마이그레이션 0002: 교육시간 + 교육지침/양식
-- Cloudflare D1에서 실행:
--   wrangler d1 execute gc-edu-portal-db --file=migrations/0002_add_features.sql
-- ═══════════════════════════════════════════

-- 1. training 테이블에 교육시간 컬럼 추가
ALTER TABLE training ADD COLUMN train_hours TEXT DEFAULT '';

-- 2. 교육 지침 / 결과보고서 양식 테이블 생성
CREATE TABLE IF NOT EXISTS edu_docs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  cat_id     TEXT NOT NULL,
  doc_type   TEXT NOT NULL DEFAULT 'guideline',  -- 'guideline' | 'report_form'
  title      TEXT NOT NULL,
  file_name  TEXT DEFAULT '',
  file_data  TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
