import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const routesPath = resolve(__dirname, '../dist/_routes.json')

const routes = {
  version: 1,
  include: ['/api/*'],
  exclude: ['/*']
}

writeFileSync(routesPath, JSON.stringify(routes, null, 2))
console.log('_routes.json written:', JSON.stringify(routes))
