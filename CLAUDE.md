# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

GC 임직원 교육 관리 포털. 교육 이수 현황 관리, 수료증 제출/승인, 온보딩 체크리스트, 공지사항 등을 제공하는 사내 시스템.

- **Framework:** Hono (TypeScript + JSX)
- **Build:** Vite + @hono/vite-build
- **Deploy:** Cloudflare Pages (Edge Workers)
- **Database:** Cloudflare D1 (SQLite)

---

## 개발 명령어

```bash
npm install              # 의존성 설치
npm run dev              # Vite 개발 서버 (포트 5173)
npm run dev:sandbox      # wrangler pages dev (포트 3000, D1 바인딩 포함)
npm run build            # 프로덕션 빌드 (Vite → dist/ + fix-routes)
npm run preview          # 빌드 결과 미리보기
```

### PM2로 로컬 실행 (D1 포함)

```bash
npm run build
pm2 start ecosystem.config.cjs   # npx wrangler pages dev dist --ip 0.0.0.0 --port 3000
pm2 logs gc-edu-portal
pm2 restart gc-edu-portal
```

---

## 배포

### Cloudflare Pages 배포

```bash
npm run deploy       # wrangler pages deploy dist --project-name gc-edu-portal
npm run deploy:prod  # 동일 (프로젝트명 명시)
```

### 최초 프로젝트 생성 (최초 1회)

```bash
npx wrangler pages project create gc-edu-portal --production-branch main
```

### 빌드 프로세스

1. Vite가 `src/index.tsx` → `dist/` 번들링
2. `scripts/fix-routes.mjs`가 `dist/_routes.json` 생성 (Cloudflare Pages 라우팅용)

---

## 데이터베이스 (Cloudflare D1)

### 연결 방법

`wrangler.jsonc`에서 D1 바인딩 설정:

```jsonc
{
  "d1_databases": [{
    "binding": "DB",
    "database_name": "gc-edu-portal-db",
    "database_id": "a8ab4cc2-8664-43b1-adc6-5a3b909f068f"
  }]
}
```

코드에서 `c.env.DB`로 접근 (`D1Database` 타입):

```typescript
// src/index.tsx
const result = await c.env.DB.prepare('SELECT * FROM employees WHERE emp_id = ?')
  .bind(empId)
  .first()

const list = await c.env.DB.prepare('SELECT * FROM training').all()
await c.env.DB.prepare('INSERT INTO employees (name) VALUES (?)').bind(name).run()
```

### 마이그레이션 실행

```bash
# 로컬 D1 (dev 환경)
wrangler d1 execute gc-edu-portal-db --local --file=migrations/0001_initial.sql

# 프로덕션 D1
wrangler d1 execute gc-edu-portal-db --file=migrations/0001_initial.sql
```

마이그레이션 파일: `migrations/0001_initial.sql` ~ `0007_edu_notices.sql` (순서대로 실행 필요)

### 주요 테이블

| 테이블 | 역할 |
|--------|------|
| `employees` | 임직원 마스터 (id, name, emp_id, dept, rank) |
| `training` | 교육 이수 현황 (emp_id, cat_id, submitted, approved, file_data) |
| `training_submissions` | 다중 제출 이력 (period별 제출) |
| `sub_admins` | 부관리자 계정 (cat_ids로 권한 범위 지정) |
| `guideline_links` | 교육 자료 링크 (cat_id별 분류) |
| `edu_docs` | 교육 문서/서식 (Base64 파일 저장) |
| `edu_notices` | 교육 공지사항 + `edu_notice_files` 첨부파일 |
| `onboarding_employees` | 온보딩 대상자 |
| `onboarding_checklist_items` | 온보딩 체크리스트 항목 |
| `onboarding_progress` | 개인별 진행 현황 |
| `emp_cat_assignments` | 임직원-교육 카테고리 배정 |
| `settings` | 시스템 설정 (key-value) |

파일은 Base64로 SQLite에 직접 저장 (500MB 제한).

---

## 아키텍처

### 파일 구조

```
src/
  index.tsx       # Hono 앱 진입점 — 모든 API 라우트 정의
  renderer.tsx    # JSX 렌더러 설정
public/
  admin.html      # 관리자 대시보드 (SPA)
  employee.html   # 임직원 포털 (SPA)
  admin-login.html / employee-login.html
  admin-onboarding.html / onboarding.html
  guideline.html / notice.html / index.html
  static/
    api.js        # 클라이언트 API 헬퍼 (fetch wrapper)
    style.css     # 전역 스타일
migrations/       # SQL 마이그레이션 (0001~0007)
scripts/
  fix-routes.mjs  # 빌드 후 _routes.json 생성
webapp_new/       # 개발 중인 차기 버전 (별도 package.json)
```

### 라우팅 패턴

`src/index.tsx`에서 HTML 페이지 서빙 + REST API를 모두 처리:

```typescript
// HTML 페이지
app.get('/', (c) => c.html(...))
app.get('/admin', serveStatic(...))

// API
app.post('/api/auth/admin', ...)
app.get('/api/employees', ...)
app.post('/api/training/:empId/:catId', ...)
```

모든 `/api/*` 경로에 CORS 미들웨어 적용.

### 인증

| 역할 | 방식 |
|------|------|
| 관리자 | `X-Admin-Token` 헤더 (settings 테이블의 `admin_token` 값과 비교) |
| 부관리자 | username + password → 세션은 localStorage |
| 임직원 | 이름 + 사번 + 선택적 비밀번호 |

### API 엔드포인트 그룹

- `/api/auth/*` — 로그인, 비밀번호 변경
- `/api/employees*` — 임직원 CRUD, 비밀번호 관리
- `/api/training*` — 교육 이수 현황, 파일 제출
- `/api/submissions*` — 다중 제출 (기간별)
- `/api/guideline*` — 교육 자료 링크 관리
- `/api/edu-docs*` — 교육 문서 파일 관리
- `/api/notices*` — 공지사항 + 첨부파일
- `/api/sub-admins*` — 부관리자 관리
- `/api/assignments*` — 임직원-카테고리 배정
- `/api/onboarding/*` — 온보딩 체크리스트 및 진행현황
- `/api/export*` — 데이터 CSV/Excel 내보내기
- `/api/storage/*` — DB 용량 통계
- `/api/health` — 헬스체크

### 프론트엔드

프레임워크 없는 바닐라 HTML/CSS/JS. 각 HTML 파일이 독립적인 SPA처럼 동작하며, `public/static/api.js`의 fetch 헬퍼로 API 호출. 상태는 localStorage에 저장.

---

## 주의사항

- `webapp_new/` 디렉터리는 차기 버전 개발 중 — 현재 프로덕션은 루트의 `src/` 사용
- 파일 데이터는 Base64로 D1에 저장 — 대용량 파일 처리 시 DB 용량(500MB) 주의
- `wrangler.jsonc`의 `database_id`는 실제 Cloudflare 계정에 연결된 고정값
