-- 직원 테이블
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  emp_id TEXT UNIQUE NOT NULL,
  dept TEXT DEFAULT '',
  rank TEXT DEFAULT '',
  join_date TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 교육 이수 현황 테이블
CREATE TABLE IF NOT EXISTS training (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  emp_id TEXT NOT NULL,
  cat_id TEXT NOT NULL,
  submitted INTEGER DEFAULT 0,
  submitted_at TEXT DEFAULT '',
  file_name TEXT DEFAULT '',
  file_data TEXT DEFAULT '',
  approved INTEGER DEFAULT NULL,
  approved_at TEXT DEFAULT '',
  rejected_at TEXT DEFAULT '',
  supplement_requested INTEGER DEFAULT 0,
  supplement_reason TEXT DEFAULT '',
  supplement_at TEXT DEFAULT '',
  UNIQUE(emp_id, cat_id)
);

-- 시스템 설정 테이블
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 교육 방침 자료 테이블
CREATE TABLE IF NOT EXISTS guideline_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cat_id TEXT NOT NULL,
  emoji TEXT DEFAULT '',
  name TEXT NOT NULL,
  url TEXT DEFAULT '',
  link_desc TEXT DEFAULT '',
  type TEXT DEFAULT 'link',
  video_name TEXT DEFAULT '',
  video_data TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0
);

-- 기본 관리자 비밀번호 설정
INSERT OR IGNORE INTO settings (key, value) VALUES ('admin_pw', 'hr2026');

-- 기본 직원 데이터
INSERT OR IGNORE INTO employees (name, emp_id, dept, rank, join_date) VALUES
  ('김민준', '2024001', '경영관리부', '대리', '2024-03-04'),
  ('이서연', '2024002', '영업부', '사원', '2024-04-01'),
  ('박지훈', '2023005', '개발팀', '과장', '2023-01-10');
