import { describe, expect, it } from 'vitest'
import { mapProduct, mapUnit } from './ErpMapper'

describe('ERP product mapping', () => {
  it('preserves a kilogram base unit when no valid alternative exists', () => { expect(mapUnit('kg').displayUnit).toBe('kg'); expect(mapUnit('kg', { unit: 'szt.', numerator: 0, denominator: 1 }).hasAlternativeUnit).toBe(false) })
  it('uses a verified conversion only when both terms are positive', () => { expect(mapUnit('karton', { unit: 'szt.', numerator: 8, denominator: 1 })).toMatchObject({ displayUnit: 'szt.', conversionFactor: 8, hasAlternativeUnit: true }) })
  it('maps the approved function columns without prices', () => { expect(mapProduct({ Id: 42, Kod: 'X', Nazwa: 'Produkt', Typ: 'Gastro', Grupa: 'Mrożonki', Marka: 'Hortex', Vat: 23, EAN: '123', Jm: 'kg', JmDodatkowa: null, PrzeliczL: null, PrzeliczM: null, Kategoria: 'Owoce', UrlImage: 'https://example.com/a.webp' })).toMatchObject({ id: '0:42', ean: '123', brand: 'Hortex', category: 'Owoce', image: 'https://example.com/a.webp', unit: { displayUnit: 'kg' } }) })
})
