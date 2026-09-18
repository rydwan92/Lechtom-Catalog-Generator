import { describe, expect, it } from 'vitest'
import { productQueries } from './products'

describe('ERP query allowlist', () => {
  it('reads only approved columns from GetOfferGoods', () => {
    for (const query of Object.values(productQueries)) {
      expect(query).toMatch(/^SELECT\b/)
      expect(query).toContain('FROM B2B.GetOfferGoods()')
      expect(query).not.toMatch(/\b(?:INSERT|UPDATE|DELETE|MERGE|EXEC|EXECUTE|ALTER|CREATE|DROP|TRUNCATE)\b/i)
      expect(query).not.toMatch(/CenaZakupu|Cena100/i)
    }
  })
  it('keeps user filters as parameters', () => {
    expect(productQueries.products).toContain('@pattern')
    expect(productQueries.products).toContain('@brand')
    expect(productQueries.products).toContain('@category')
    expect(productQueries.products).toContain('@type')
  })
})
