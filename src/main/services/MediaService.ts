import { app, dialog } from 'electron'
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import sharp from 'sharp'
import { desc, eq } from 'drizzle-orm'
import type { AppDatabase } from '../db/sqlite/database'
import { mediaAssets } from '../db/sqlite/schema'
import type { MediaAsset } from '../../shared/types'

const allowed = new Set(['.svg', '.png', '.webp', '.jpg', '.jpeg'])
export class MediaService {
  constructor(private db: AppDatabase) {}
  list(): MediaAsset[] { return this.db.select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt)).all().map((row) => ({ ...row, url: `lechtom-media://asset/${row.id}` })) }
  getPath(id: string): string | null { return this.db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).get()?.path ?? null }
  async selectFile(kind: 'products' | 'logos' | 'backgrounds'): Promise<MediaAsset | null> {
    const result = await dialog.showOpenDialog({ title: 'Wybierz grafikę', properties: ['openFile'], filters: [{ name: 'Grafiki', extensions: ['svg', 'png', 'webp', 'jpg', 'jpeg'] }] })
    if (result.canceled || !result.filePaths[0]) return null
    const source = result.filePaths[0]
    if (!allowed.has(extname(source).toLowerCase())) throw new Error('Nieobsługiwany format grafiki')
    const input = await readFile(source)
    if (input.length > 20 * 1024 * 1024) throw new Error('Plik jest zbyt duży (maks. 20 MB)')
    const id = randomUUID()
    const directory = join(app.getPath('userData'), 'media', kind)
    await mkdir(directory, { recursive: true })
    const path = join(directory, `${id}.webp`)
    const converted = await sharp(input, { limitInputPixels: 40_000_000 }).rotate().webp({ quality: 95 }).toBuffer({ resolveWithObject: true })
    await writeFile(path, converted.data)
    const row = { id, filename: `${id}.webp`, originalFilename: source.split(/[\\/]/).pop() ?? 'grafika', mimeType: 'image/webp', path, width: converted.info.width, height: converted.info.height, fileSize: converted.data.length, createdAt: new Date().toISOString() }
    this.db.insert(mediaAssets).values(row).run()
    return { ...row, url: `lechtom-media://asset/${id}` }
  }
}
