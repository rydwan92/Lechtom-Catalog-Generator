import { dialog } from 'electron'
import { createHash, randomUUID } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import sharp from 'sharp'
import type { MediaAsset } from '../../shared/types'
import type { SettingsService } from '../services/SettingsService'

const allowed = new Set(['.svg', '.png', '.webp', '.jpg', '.jpeg'])
type Kind = 'products' | 'logos' | 'backgrounds'

export class AssetLibraryService {
  constructor(private settings: SettingsService) {}
  private directory(kind: Kind): string { return join(this.settings.root, 'library', kind === 'logos' ? 'brands' : kind) }
  private index(): string { return join(this.settings.root, 'library', 'assets.json') }
  list(): MediaAsset[] {
    const indexed = existsSync(this.index()) ? JSON.parse(readFileSync(this.index(), 'utf8')) as Omit<MediaAsset, 'url'>[] : []
    const known = new Set(indexed.map((asset) => asset.path.toLowerCase()))
    const manual = (['logos', 'backgrounds'] as Kind[]).flatMap((kind) => {
      const directory = this.directory(kind)
      if (!existsSync(directory)) return []
      return readdirSync(directory).filter((filename) => allowed.has(extname(filename).toLowerCase())).flatMap((filename) => {
        const path = join(directory, filename)
        if (known.has(path.toLowerCase())) return []
        const stat = statSync(path)
        if (!stat.isFile()) return []
        const extension = extname(filename).toLowerCase()
        return [{ id: createHash('sha256').update(path.toLowerCase()).digest('hex').slice(0, 32), filename, originalFilename: filename, mimeType: extension === '.svg' ? 'image/svg+xml' : extension === '.png' ? 'image/png' : extension === '.webp' ? 'image/webp' : 'image/jpeg', path, width: null, height: null, fileSize: stat.size, createdAt: stat.mtime.toISOString() }]
      })
    })
    return [...indexed, ...manual].map((asset) => ({ ...asset, url: `lechtom-media://asset/${asset.id}` })).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
  getPath(id: string): string | null { return this.list().find((asset) => asset.id === id)?.path ?? null }
  resolveBrandLogo(brand: string): MediaAsset | null {
    const file = join(this.settings.root, 'library', 'brands.json')
    const aliases = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) as Record<string, string> : {}
    const normalized = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/gi, '').toLowerCase()
    const target = aliases[brand] ?? aliases[brand.toUpperCase()] ?? brand
    return this.list().find((asset) => asset.path.startsWith(this.directory('logos')) && normalized(asset.originalFilename.replace(/\.[^.]+$/, '')) === normalized(target.replace(/\.[^.]+$/, ''))) ?? null
  }
  async selectFile(kind: Kind): Promise<MediaAsset | null> {
    const selection = await dialog.showOpenDialog({ title: 'Wybierz grafikę', properties: ['openFile'], filters: [{ name: 'Grafiki', extensions: ['svg', 'png', 'webp', 'jpg', 'jpeg'] }] })
    if (selection.canceled || !selection.filePaths[0]) return null
    const source = selection.filePaths[0]
    const extension = extname(source).toLowerCase()
    if (!allowed.has(extension)) throw new Error('Nieobsługiwany format grafiki')
    const input = readFileSync(source)
    if (input.length > 20 * 1024 * 1024) throw new Error('Plik jest zbyt duży (maks. 20 MB)')
    const id = randomUUID()
    const directory = this.directory(kind)
    mkdirSync(directory, { recursive: true })
    const path = join(directory, `${id}${extension}`)
    const metadata = await sharp(input, { limitInputPixels: 40_000_000 }).metadata()
    copyFileSync(source, path)
    const row: Omit<MediaAsset, 'url'> = { id, filename: basename(path), originalFilename: basename(source), mimeType: extension === '.svg' ? 'image/svg+xml' : extension === '.png' ? 'image/png' : extension === '.webp' ? 'image/webp' : 'image/jpeg', path, width: metadata.width ?? null, height: metadata.height ?? null, fileSize: input.length, createdAt: new Date().toISOString() }
    const list = this.list().map(({ url: _url, ...asset }) => { void _url; return asset })
    writeFileSync(`${this.index()}.tmp`, JSON.stringify([...list, row], null, 2), 'utf8')
    renameSync(`${this.index()}.tmp`, this.index())
    return { ...row, url: `lechtom-media://asset/${id}` }
  }
}
