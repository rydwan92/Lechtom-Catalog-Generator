import { describe, expect, it } from 'vitest'
import { getTableOfContents } from './CatalogPageRenderer'
import type { Catalog } from '../../../shared/types'

describe('catalog table of contents', () => {
  it('follows current page order and shows the first occurrence of each manufacturer', () => {
    const catalog = { pages: [{ enabled: true, pageType: 'COVER', manufacturerRef: null }, { enabled: true, pageType: 'PRODUCT_GRID_12', manufacturerRef: 'Hortex' }, { enabled: true, pageType: 'PRODUCT_GRID_12', manufacturerRef: 'Hortex' }, { enabled: true, pageType: 'PRODUCT_GRID_16', manufacturerRef: 'Aviko' }] } as Catalog
    expect(getTableOfContents(catalog)).toEqual([{ name: 'Hortex', page: 2 }, { name: 'Aviko', page: 4 }])
  })
})
