import { writeFileSync, readdirSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const distPath = resolve(__dirname, '../dist')
const routesPath = resolve(distPath, '_routes.json')

// dist/ 폴더의 HTML 파일 자동 감지
let htmlExcludes = ['/static/*']
try {
  const files = readdirSync(distPath)
  files.filter(f => f.endsWith('.html')).forEach(f => {
    const name = '/' + f
    htmlExcludes.push(name)
    // .html 없는 경로도 추가 (Cloudflare Pages URL strip 대응)
    htmlExcludes.push(name.replace('.html', ''))
  })
} catch(e) {}

const routes = {
  version: 1,
  include: ['/*'],
  exclude: htmlExcludes
}

writeFileSync(routesPath, JSON.stringify(routes, null, 2))
console.log('✅ _routes.json 수정 완료:', JSON.stringify(routes))
