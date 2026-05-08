import Database from 'better-sqlite3'
import { readFileSync, readdirSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = process.env.DB_PATH || join(__dirname, '../data/gc-edu-portal.db')
const MIGRATIONS_DIR = join(__dirname, '../migrations')

const dataDir = dirname(DB_PATH)
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

const files = readdirSync(MIGRATIONS_DIR)
  .filter(f => f.endsWith('.sql'))
  .sort()

for (const file of files) {
  console.log(`마이그레이션 실행: ${file}`)
  try {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8')
    db.exec(sql)
    console.log(`  ✓ 완료`)
  } catch (e) {
    console.error(`  ✗ 오류: ${e.message}`)
  }
}

db.close()
console.log('마이그레이션 완료')
