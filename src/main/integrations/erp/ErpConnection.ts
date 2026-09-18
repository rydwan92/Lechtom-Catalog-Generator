import sql from 'mssql'
import type { ErpConfig } from '../../../shared/types'

export class ErpConnection {
  private pool: sql.ConnectionPool | null = null
  private key = ''
  async getPool(config: ErpConfig): Promise<sql.ConnectionPool> {
    const nextKey = JSON.stringify(config)
    if (this.pool?.connected && this.key === nextKey) return this.pool
    await this.close()
    this.pool = await new sql.ConnectionPool({ server: config.server, database: config.database, user: config.username, password: config.password, options: { encrypt: config.encrypt, trustServerCertificate: config.trustServerCertificate, appName: 'LECHTOM Catalog Generator' }, connectionTimeout: 5000, requestTimeout: 12000, pool: { min: 0, max: 3, idleTimeoutMillis: 30000 } }).connect()
    this.key = nextKey
    return this.pool
  }
  async close(): Promise<void> { if (this.pool) { await this.pool.close(); this.pool = null; this.key = '' } }
}
