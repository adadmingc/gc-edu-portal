---
name: docker-build-deploy
description: gc-edu-portal Docker 이미지를 버전 태그로 빌드하고 .tar.gz 압축 파일로 저장하는 스킬. 사용자가 "도커 빌드", "이미지 만들어줘", "배포 파일 만들어줘", "docker build", "새 버전 빌드", "tar.gz로 저장" 등을 언급하면 반드시 이 스킬을 사용할 것.
---

## 개요

이 스킬은 두 단계로 실행됩니다:
1. `docker build` — 버전 태그를 붙여 이미지 빌드
2. `docker save | gzip` — 이미지를 `.tar.gz` 파일로 압축 저장

---

## Step 1: 현재 버전 확인 및 다음 버전 제안

기존 이미지 목록을 확인해 최신 버전을 파악합니다:

```bash
docker images gc-edu-portal --format "{{.Tag}}" | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -1
```

- 버전이 있으면 → 패치 버전을 1 올려 제안 (예: `1.0.1` → `1.0.2`)
- 버전이 없으면 → `1.0.0` 제안

사용자에게 제안 버전을 보여주고 확인받습니다. 사용자가 다른 버전을 원하면 그 버전을 사용합니다.

---

## Step 2: Docker 이미지 빌드

프로젝트 루트(Dockerfile이 있는 위치)에서 실행합니다:

```bash
docker build -t gc-edu-portal:{VERSION} .
```

빌드 진행 상황을 사용자에게 실시간으로 알려줍니다.  
빌드 실패 시 에러 로그를 출력하고 중단합니다.

---

## Step 3: 이미지를 .tar.gz로 저장

빌드 성공 후 이미지를 파일로 압축 저장합니다:

```bash
docker save gc-edu-portal:{VERSION} | gzip > gc-edu-portal-{VERSION}.tar.gz
```

저장 위치는 현재 디렉터리(프로젝트 루트)입니다.

---

## Step 4: 완료 안내

작업 완료 후 다음 정보를 사용자에게 알립니다:
- 생성된 파일명 및 경로
- 파일 크기
- 서버 담당자에게 전달할 파일임을 안내

```
✅ 완료!
파일: gc-edu-portal-{VERSION}.tar.gz
크기: {SIZE}
이 파일을 서버 담당자에게 전달하세요.
```

---

## 주의사항

- Dockerfile은 반드시 현재 디렉터리(프로젝트 루트)에 있어야 합니다
- 빌드 중 `package.json` 변경이 있었다면 `npm install`로 `package-lock.json`을 먼저 갱신해야 합니다
- 생성된 `.tar.gz` 파일은 용량이 크므로(200~500MB) git에 커밋하지 마세요
