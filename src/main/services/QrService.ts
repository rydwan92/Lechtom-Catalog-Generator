import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import QRCode from 'qrcode'
import type { QrCodeRecord } from '../../shared/types'
import type { SettingsService } from './SettingsService'

export class QrService {
  constructor(private settings: SettingsService) {}
  private file(): string { return join(this.settings.root, 'library', 'qr.json') }
  list(): QrCodeRecord[] { return existsSync(this.file()) ? JSON.parse(readFileSync(this.file(), 'utf8')) as QrCodeRecord[] : [] }
  private save(rows: QrCodeRecord[]): void { mkdirSync(join(this.settings.root, 'library'), { recursive: true }); writeFileSync(`${this.file()}.tmp`, JSON.stringify(rows, null, 2), 'utf8'); renameSync(`${this.file()}.tmp`, this.file()) }
  async create(input: { name: string; url: string; label: string }): Promise<QrCodeRecord> {
    const row = { ...input, id: randomUUID(), svg: await QRCode.toString(input.url, { type: 'svg', margin: 1, width: 300 }), createdAt: new Date().toISOString() }
    this.save([...this.list(), row])
    return row
  }
  delete(id: string): void { this.save(this.list().filter((row) => row.id !== id)) }
}
