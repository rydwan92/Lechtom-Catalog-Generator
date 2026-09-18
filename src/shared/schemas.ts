import { z } from 'zod'

export const erpConfigSchema = z.object({ server: z.string().trim().min(1), database: z.string().trim().min(1), authenticationType: z.literal('sql'), username: z.string().trim().min(1), password: z.string().optional(), encrypt: z.boolean(), trustServerCertificate: z.boolean() })
export const productFilterSchema = z.object({ query: z.string().max(100).optional(), manufacturer: z.string().max(100).optional(), category: z.string().max(100).optional(), page: z.number().int().min(1).default(1), pageSize: z.number().int().min(1).max(100).default(25) })
export const productIdSchema = z.object({ gidNumer: z.number().int(), gidTyp: z.number().int() })
export const catalogInputSchema = z.object({ id: z.string().uuid().optional(), name: z.string().trim().min(1).max(120), title: z.string().trim().min(1).max(160), subtitle: z.string().max(240), validFrom: z.string().nullable(), validTo: z.string().nullable() })
export const pageTypeSchema = z.enum(['COVER', 'TABLE_OF_CONTENTS', 'PRODUCT_GRID_12', 'PRODUCT_GRID_16', 'BRANDS', 'CONTACTS', 'PROMOTION', 'CUSTOM'])
export const catalogPageItemSchema = z.object({ id: z.string().uuid(), pageId: z.string().uuid(), slotKey: z.string().max(50), erpProductGidNumer: z.number().int(), erpProductGidTyp: z.number().int(), sortOrder: z.number().int(), customData: z.record(z.string(), z.unknown()) })
export const catalogPageSchema = z.object({ id: z.string().uuid(), catalogId: z.string().uuid(), pageType: pageTypeSchema, templateCode: z.string().max(50), sortOrder: z.number().int(), manufacturerRef: z.string().nullable(), configuration: z.record(z.string(), z.unknown()), enabled: z.boolean(), items: z.array(catalogPageItemSchema) })
export const qrInputSchema = z.object({ name: z.string().trim().min(1).max(120), url: z.url().max(1000), label: z.string().max(200) })
