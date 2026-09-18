import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/main/db/sqlite/schema.ts',
  out: './drizzle',
  dbCredentials: { url: './catalog-dev.db' }
})
