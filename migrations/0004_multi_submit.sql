-- ═══════════════════════════════════════════
-- 마이그레이션 0004: 다중 이수증 제출 + 공통 보고서 양식
-- Cloudflare D1 Console에서 한 줄씩 실행
-- ═══════════════════════════════════════════

-- 1. 이수증 다중 제출 테이블 (제출 이력)
CREATE TABLE IF NOT EXISTS training_submissions (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  emp_id           TEXT NOT NULL,
  cat_id           TEXT NOT NULL,
  period           TEXT NOT NULL DEFAULT '',   -- 예: '2024-1분기', '2024-상반기', '수시'
  submitted_at     TEXT NOT NULL,
  file_name        TEXT DEFAULT '',
  file_data        TEXT DEFAULT '',
  train_hours      TEXT DEFAULT '',
  approved         INTEGER DEFAULT NULL,       -- NULL=대기, 1=승인, 0=반려
  approved_at      TEXT DEFAULT '',
  rejected_at      TEXT DEFAULT '',
  supplement_requested INTEGER DEFAULT 0,
  supplement_reason    TEXT DEFAULT '',
  supplement_at        TEXT DEFAULT '',
  note             TEXT DEFAULT '',
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 공통 교육결과 보고서 양식 + 설명 테이블
CREATE TABLE IF NOT EXISTS report_templates (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL DEFAULT '교육결과 보고서 양식',
  description TEXT DEFAULT '',    -- 관리자가 작성하는 설명/안내
  file_name   TEXT DEFAULT '',
  file_data   TEXT DEFAULT '',
  is_active   INTEGER DEFAULT 1,  -- 1=활성, 0=비활성
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
