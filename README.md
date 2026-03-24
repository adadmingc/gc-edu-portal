# 지씨 교육 포털 (GC Edu Portal)

## 프로젝트 개요
- **이름**: 지씨 교육 포털 (GC Education Portal)
- **목표**: 직원 교육 이수 관리 및 자격증 제출, 관리자 승인 처리를 위한 내부 포털
- **주요 기능**: 직원 포털, 관리자 대시보드, 교육 방침 안내, 로그인/인증

## 페이지 구성

| 경로 | 파일 | 설명 |
|------|------|------|
| `/` | `index.html` | 홈 — 직원/관리자 선택 화면 |
| `/employee.html` | `employee.html` | 직원 포털 — 교육 이수 현황, 자격증 제출 |
| `/employee-login.html` | `employee-login.html` | 직원 로그인 |
| `/admin.html` | `admin.html` | 관리자 대시보드 — 직원 관리, 자격증 승인 |
| `/admin-login.html` | `admin-login.html` | 관리자 로그인 |
| `/guideline.html` | `guideline.html` | 교육 방침 안내 |

## API 엔드포인트
- `GET /api/health` — 서비스 상태 확인

## 기술 스택
- **Framework**: Hono (TypeScript)
- **Build**: Vite + @hono/vite-build
- **Deploy**: Cloudflare Pages
- **Frontend**: Vanilla HTML/CSS/JS (Noto Sans KR, Barlow Condensed, DM Mono 폰트)

## 개발 환경 실행
```bash
npm install
npm run build
pm2 start ecosystem.config.cjs
```

## Cloudflare Pages 배포
```bash
# 1. Deploy 탭에서 Cloudflare API 키 설정
# 2. 아래 명령어 실행
npm run build
npx wrangler pages project create gc-edu-portal --production-branch main
npx wrangler pages deploy dist --project-name gc-edu-portal
```

## 배포 현황
- **플랫폼**: Cloudflare Pages (예정)
- **상태**: 🔄 로컬 빌드 완료 / ⏳ Cloudflare 배포 대기 (API 키 설정 필요)
- **마지막 업데이트**: 2026-03-24
