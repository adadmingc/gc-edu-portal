# 로컬 테스트 가이드

개발 중 로컬에서 앱을 실행하고 테스트하는 방법을 정리합니다.

---

## 사전 준비

### Node.js 설치 확인

```bash
node -v   # v20 이상 권장
npm -v
```

### better-sqlite3 네이티브 모듈 빌드 도구

`better-sqlite3`는 네이티브 모듈이라 처음 설치 시 컴파일이 필요합니다.

**Windows:**
```bash
npm install --global windows-build-tools
# 또는 Visual Studio Build Tools 설치 후 진행
```

**Mac:**
```bash
xcode-select --install
```

**Linux:**
```bash
sudo apt install python3 make g++
```

---

## 방법 1 — 개발 서버 (코드 수정 시 자동 반영)

소스코드를 수정하면서 즉시 확인할 때 사용합니다.

```bash
# 1. 의존성 설치 (처음 1회)
npm install

# 2. 개발 서버 실행
npm run dev
```

- 접속 주소: `http://localhost:5173`
- 코드 수정 시 자동으로 반영됩니다 (Hot Reload)
- SQLite DB 파일 위치: `./data/gc-edu-portal.db` (자동 생성)

> **주의:** 개발 서버 첫 실행 시 DB가 없으면 빈 상태로 시작됩니다.  
> 아래 마이그레이션을 먼저 실행하세요.

### 마이그레이션 실행 (DB 초기화)

```bash
node scripts/migrate.js
```

---

## 방법 2 — 빌드 후 실행 (배포 환경과 동일)

실제 서버 배포 환경과 동일한 방식으로 테스트할 때 사용합니다.

```bash
# 1. 의존성 설치
npm install

# 2. 빌드
npm run build

# 3. 마이그레이션
node scripts/migrate.js

# 4. 서버 실행
npm start
```

- 접속 주소: `http://localhost:3000`
- 환경변수를 변경하려면 `.env` 파일 생성 후 실행

### .env 파일 생성 (선택)

```bash
cp .env.example .env
# .env 파일 내용 수정 후 다시 npm start
```

---

## 방법 3 — Docker로 로컬 테스트 (서버 배포 환경과 완전히 동일)

서버에 올리기 전에 Docker 환경을 로컬에서 검증할 때 사용합니다.

```bash
# 1. 이미지 빌드
docker build -t gc-edu-portal:test .

# 2. 컨테이너 실행
docker run --rm \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e PORT=3000 \
  -e DB_PATH=/app/data/gc-edu-portal.db \
  gc-edu-portal:test
```

**Windows PowerShell의 경우:**
```powershell
docker run --rm `
  -p 3000:3000 `
  -v ${PWD}/data:/app/data `
  -e PORT=3000 `
  -e DB_PATH=/app/data/gc-edu-portal.db `
  gc-edu-portal:test
```

- 접속 주소: `http://localhost:3000`
- 종료: `Ctrl + C`

---

## API 동작 확인

서버가 실행 중인 상태에서 아래 명령어로 API를 확인합니다.

### 헬스체크

```bash
curl http://localhost:3000/api/health
```

**정상 응답:**
```json
{"ok":true,"service":"지씨 교육 포털","time":"2026-..."}
```

### 관리자 로그인 테스트

```bash
curl -X POST http://localhost:3000/api/auth/admin \
  -H "Content-Type: application/json" \
  -d '{"password":"hr2026"}'
```

**정상 응답:**
```json
{"ok":true,"data":{"type":"admin"}}
```

### 직원 목록 조회

```bash
curl http://localhost:3000/api/employees \
  -H "X-Admin-Token: hr2026"
```

---

## 테스트 방법 선택 가이드

| 상황 | 권장 방법 |
|------|----------|
| 기능 개발 중 빠른 확인 | 방법 1 (개발 서버) |
| 배포 전 최종 검증 | 방법 2 (빌드 후 실행) |
| Docker 환경 이상 여부 확인 | 방법 3 (Docker) |

---

## 자주 발생하는 문제

### DB 파일이 없다는 오류
```bash
node scripts/migrate.js
```
마이그레이션을 실행하면 `data/` 폴더와 DB 파일이 자동 생성됩니다.

### better-sqlite3 빌드 오류 (Windows)
```bash
npm install --global windows-build-tools
npm install
```

### 포트가 이미 사용 중
```bash
# 사용 중인 프로세스 확인 (Windows)
netstat -ano | findstr :3000

# 사용 중인 프로세스 확인 (Mac/Linux)
lsof -i :3000
```
