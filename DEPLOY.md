# 배포 가이드

개발자가 빌드한 이미지를 서버 담당자에게 전달하는 절차입니다.

---

## 개발자가 할 일 (빌드 & 패키징)

### 사전 조건

- Docker Desktop 설치 필요 ([https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop))
- 프로젝트 루트 폴더에서 작업

### 1단계 — 의존성 설치 (처음 1회 또는 package.json 변경 시)

```bash
npm install
```

> `package-lock.json` 파일이 생성/갱신됩니다. 커밋에 포함해주세요.

### 2단계 — Docker 이미지 빌드

```bash
docker build -t gc-edu-portal:버전 .
```

**버전 예시:**
```bash
docker build -t gc-edu-portal:1.0.0 .
```

> 빌드 시간은 처음에는 5~10분, 이후에는 캐시 덕분에 1~2분 정도 걸립니다.

### 3단계 — 이미지를 파일로 저장 (압축)

```bash
docker save gc-edu-portal:버전 | gzip > gc-edu-portal-버전.tar.gz
```

**버전 예시:**
```bash
docker save gc-edu-portal:1.0.0 | gzip > gc-edu-portal-1.0.0.tar.gz
```

> 파일 크기는 약 200~300MB 정도입니다.

### 4단계 — 서버 담당자에게 전달

아래 파일을 전달합니다.

```
gc-edu-portal-1.0.0.tar.gz   ← 이미지 파일
```

> `docker-compose.yml`, `.env`, 소스코드는 전달하지 않아도 됩니다.

---

## 서버 담당자가 할 일 (배포)

### 1단계 — 이미지 로드

```bash
docker load < gc-edu-portal-1.0.0.tar.gz
```

### 2단계 — docker-compose.yml의 이미지 버전 변경

```yaml
# docker-compose.yml
services:
  app:
    image: gc-edu-portal:1.0.0   # ← 전달받은 버전으로 변경
```

### 3단계 — 컨테이너 재시작

```bash
docker compose up -d
```

### 4단계 — 정상 동작 확인

```bash
docker compose logs app
curl http://localhost:30011/api/health
```

---

## 버전 관리 규칙 (권장)

| 변경 유형 | 버전 예시 |
|-----------|-----------|
| 기능 추가 | 1.0.0 → 1.1.0 |
| 버그 수정 | 1.1.0 → 1.1.1 |
| 큰 변경 | 1.x.x → 2.0.0 |

---

## 참고 — 기존 이미지 정리

오래된 이미지가 쌓이면 디스크를 차지합니다. 주기적으로 정리하세요.

```bash
# 사용하지 않는 이미지 목록 확인
docker images gc-edu-portal

# 특정 버전 삭제
docker rmi gc-edu-portal:1.0.0
```
