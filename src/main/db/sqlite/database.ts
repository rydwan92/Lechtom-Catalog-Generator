import { app } from 'electron'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { join } from 'node:path'
import { mkdirSync } from 'node:fs'
import * as schema from './schema'
import { pageTemplates } from './schema'

export type AppDatabase = ReturnType<typeof createDatabase>

export function createDatabase() {
  const directory = join(app.getPath('userData'), 'database')
  mkdirSync(directory, { recursive: true })
  const sqlite = new Database(join(directory, 'catalog.db'))
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  const db = drizzle(sqlite, { schema })
  migrate(db, { migrationsFolder: join(app.getAppPath(), 'drizzle') })
  const templates = [
    { code: 'COVER', name: 'Okładka', pageType: 'COVER', slots: ['cover'] },
    { code: 'TABLE_OF_CONTENTS', name: 'Spis treści', pageType: 'TABLE_OF_CONTENTS', slots: ['entries'] },
    { code: 'PRODUCT_GRID_12', name: 'Siatka 12 produktów', pageType: 'PRODUCT_GRID_12', slots: Array.from({ length: 12 }, (_, i) => `product${String(i + 1).padStart(2, '0')}`) },
    { code: 'PRODUCT_GRID_16', name: 'Siatka 16 produktów', pageType: 'PRODUCT_GRID_16', slots: Array.from({ length: 16 }, (_, i) => `product${String(i + 1).padStart(2, '0')}`) }
  ]
  for (const template of templates) db.insert(pageTemplates).values({ id: template.code, ...template }).onConflictDoNothing().run()
  return db
}
