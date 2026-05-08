import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import app from './index'

// public/ 디렉터리의 정적 파일 서빙 (CSS, JS, 이미지 및 나머지 HTML)
app.use('/*', serveStatic({ root: './public' }))

const port = parseInt(process.env.PORT || '3000')

serve({ fetch: app.fetch, port }, () => {
  console.log(`GC 교육 포털 서버 시작 — http://localhost:${port}`)
})
