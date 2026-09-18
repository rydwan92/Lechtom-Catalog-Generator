import { app, safeStorage } from 'electron'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import type { ErpConfig } from '../../../shared/types'

type StoredConfig = Omit<ErpConfig, 'password'> & { encryptedPassword: string }
export class ErpConfigStore {
  private path = join(app.getPath('userData'), 'erp-config.json')
  get(): ErpConfig | null {
    if (!existsSync(this.path)) return null
    const saved = JSON.parse(readFileSync(this.path, 'utf8')) as StoredConfig
    return { server: saved.server, database: saved.database, authenticationType: saved.authenticationType, username: saved.username, encrypt: saved.encrypt, trustServerCertificate: saved.trustServerCertificate, password: safeStorage.decryptString(Buffer.from(saved.encryptedPassword, 'base64')) }
  }
  getPublic(): Omit<ErpConfig, 'password'> | null {
    const config = this.get()
    if (!config) return null
    const { password: _password, ...publicConfig } = config
    void _password
    return publicConfig
  }
  save(config: ErpConfig): void {
    if (!safeStorage.isEncryptionAvailable()) throw new Error('Bezpieczne przechowywanie hasła nie jest dostępne')
    const password = config.password || this.get()?.password
    if (!password) throw new Error('Podaj hasło ERP')
    const { password: _password, ...publicConfig } = config
    void _password
    const stored: StoredConfig = { ...publicConfig, encryptedPassword: safeStorage.encryptString(password).toString('base64') }
    writeFileSync(this.path, JSON.stringify(stored), { encoding: 'utf8', mode: 0o600 })
  }
}
