import { randomUUID } from 'node:crypto'
import { desc, eq } from 'drizzle-orm'
import QRCode from 'qrcode'
import type { AppDatabase } from '../db/sqlite/database'
import { qrCodes } from '../db/sqlite/schema'
import type { QrCodeRecord } from '../../shared/types'

export class QrService {
  constructor(private db: AppDatabase) {}
  list(): QrCodeRecord[] { return this.db.select().from(qrCodes).orderBy(desc(qrCodes.createdAt)).all() }
  async create(input: { name: string; url: string; label: string }): Promise<QrCodeRecord> {
    const row = { ...input, id: randomUUID(), svg: await QRCode.toString(input.url, { type: 'svg', margin: 1, width: 300 }), createdAt: new Date().toISOString() }
    this.db.insert(qrCodes).values(row).run()
    return row
  }
  delete(id: string): void { this.db.delete(qrCodes).where(eq(qrCodes.id, id)).run() }
}
