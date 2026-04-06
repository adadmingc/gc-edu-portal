-- 부관리자 테이블
CREATE TABLE IF NOT EXISTS sub_admins (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  username   TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,
  name       TEXT NOT NULL DEFAULT '',
  cat_ids    TEXT NOT NULL DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 기본 부관리자 (산업안전보건 담당)
INSERT OR IGNORE INTO sub_admins (username, password, name, cat_ids)
VALUES ('safety_admin', 'safety2026', '안전보건 담당자', '["company","dept"]');
