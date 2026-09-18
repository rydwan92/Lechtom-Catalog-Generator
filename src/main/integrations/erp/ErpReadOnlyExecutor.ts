import sql from 'mssql'
import type { ErpConfig } from '../../../shared/types'
import { ErpConnection } from './ErpConnection'
import type { ReadQueryName } from './ErpTypes'
import { productQueries } from './queries/products'

const queries: Record<ReadQueryName, string> = { connectionTest: 'SELECT 1 AS ConnectionOk, DB_NAME() AS DatabaseName, @@SERVERNAME AS ServerName', ...productQueries }
type Inputs = Record<string, string | number>

export class ErpReadOnlyExecutor {
  constructor(private connection: ErpConnection) {}
  async executeErpReadQuery<T>(config: ErpConfig, name: ReadQueryName, inputs: Inputs = {}): Promise<T[]> {
    const statement = queries[name]
    if (!statement || !/^SELECT\b/i.test(statement) || /;|--|\/\*/.test(statement)) throw new Error('Niedozwolone zapytanie ERP')
    const pool = await this.connection.getPool(config)
    const request = pool.request()
    for (const [key, value] of Object.entries(inputs)) request.input(key, typeof value === 'number' ? sql.Int : sql.NVarChar, value)
    const started = Date.now()
    try { const result = await request.query<T>(statement); return result.recordset as T[] }
    catch (error) { console.error(JSON.stringify({ timestamp: new Date().toISOString(), operation: name, durationMs: Date.now() - started, errorType: error instanceof Error ? error.name : 'UnknownError' })); throw new Error('Brak połączenia z bazą ERP') }
  }
}
