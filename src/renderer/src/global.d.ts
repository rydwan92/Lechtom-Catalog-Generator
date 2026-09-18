import type { LechtomApi } from '../../shared/types'

declare global { interface Window { lechtom: LechtomApi; __CATALOG_PRINT_READY__?: boolean } }
export {}
