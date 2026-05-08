# ── 빌드 스테이지 (TypeScript → JavaScript 변환만 담당) ────
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ── 실행 스테이지 (서버 아키텍처에서 네이티브 모듈 직접 컴파일) ──
FROM node:20-alpine
WORKDIR /app

# better-sqlite3 네이티브 컴파일용 (서버 아키텍처 기준)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY migrations ./migrations
COPY scripts ./scripts
COPY public ./public

RUN mkdir -p data

ENV PORT=3000
ENV DB_PATH=/app/data/gc-edu-portal.db

EXPOSE 3000

CMD ["sh", "-c", "node scripts/migrate.js && node dist/server.js"]
