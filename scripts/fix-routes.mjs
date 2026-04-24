import { writeFileSync, readdirSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const distPath = resolve(__dirname, '../dist')
const routesPath = resolve(distPath, '_routes.json')

const htmlFiles = readdirSync(distPath)
  .filter(f => f.endsWith('.html'))
  .flatMap(f => [
    '/' + f,
    '/' + f.replace('.html', '')
  ])

const routes = {
  version: 1,
  include: ['/*'],
  exclude: ['/static/*', ...htmlFiles]
}

writeFileSync(routesPath, JSON.stringify(routes, null, 2))
console.log('_routes.json:', JSON.stringify(routes))
