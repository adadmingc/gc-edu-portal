/**
 * Cloudflare Pages _routes.json 수정 스크립트
 * HTML 파일을 exclude에서 제거하여 Worker가 직접 서빙하도록 변경
 * (Cloudflare Pages 정적 서빙 시 .html 자동 strip → 308 redirect 문제 방지)
 */
import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const routesPath = resolve(__dirname, '../dist/_routes.json')

const routes = {
  version: 1,
  include: ['/*'],
  exclude: ['/static/*']  // static 파일만 Cloudflare Pages가 직접 서빙
}

writeFileSync(routesPath, JSON.stringify(routes, null, 2))
console.log('✅ _routes.json 수정 완료:', JSON.stringify(routes))
