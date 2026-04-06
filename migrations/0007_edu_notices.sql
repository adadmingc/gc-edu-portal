-- ═══════════════════════════════════════════
-- 마이그레이션 0007: 교육 공지 게시판
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS edu_notices (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  content     TEXT DEFAULT '',
  author      TEXT DEFAULT '',
  is_pinned   INTEGER DEFAULT 0,
  view_count  INTEGER DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS edu_notice_files (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  notice_id   INTEGER NOT NULL,
  file_name   TEXT NOT NULL,
  file_data   TEXT NOT NULL,
  file_size   INTEGER DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (notice_id) REFERENCES edu_notices(id)
);
