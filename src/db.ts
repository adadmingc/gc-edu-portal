import Database from 'better-sqlite3'
import { mkdirSync, existsSync } from 'fs'
import { dirname } from 'path'

const DB_PATH = process.env.DB_PATH || './data/gc-edu-portal.db'

const dataDir = dirname(DB_PATH)
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
}

const sqlite = new Database(DB_PATH)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

type RunResult = { meta: { last_row_id: number } }
type AllResult<T> = { results: T[] }

function makeStatement(sql: string) {
  function withArgs(...args: unknown[]) {
    return {
      async first<T = unknown>(): Promise<T | null> {
        return (sqlite.prepare(sql).get(...args) as T) ?? null
      },
      async all<T = unknown>(): Promise<AllResult<T>> {
        return { results: sqlite.prepare(sql).all(...args) as T[] }
      },
      async run(): Promise<RunResult> {
        const info = sqlite.prepare(sql).run(...args)
        return { meta: { last_row_id: Number(info.lastInsertRowid) } }
      },
    }
  }

  return {
    bind(...args: unknown[]) {
      return withArgs(...args)
    },
    async first<T = unknown>(): Promise<T | null> {
      return (sqlite.prepare(sql).get() as T) ?? null
    },
    async all<T = unknown>(): Promise<AllResult<T>> {
      return { results: sqlite.prepare(sql).all() as T[] }
    },
    async run(): Promise<RunResult> {
      const info = sqlite.prepare(sql).run()
      return { meta: { last_row_id: Number(info.lastInsertRowid) } }
    },
  }
}

export const DB = {
  prepare: (sql: string) => makeStatement(sql),
}

export default sqlite
