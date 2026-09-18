import { describe, expect, it } from 'vitest'
import { mapProduct, mapUnit } from './ErpMapper'

describe('ERP product mapping', () => {
  it('preserves a kilogram base unit when no valid alternative exists', () => { expect(mapUnit('kg').displayUnit).toBe('kg'); expect(mapUnit('kg', { unit: 'szt.', numerator: 0, denominator: 1 }).hasAlternativeUnit).toBe(false) })
  it('uses a verified conversion only when both terms are positive', () => { expect(mapUnit('karton', { unit: 'szt.', numerator: 8, denominator: 1 })).toMatchObject({ displayUnit: 'szt.', conversionFactor: 8, hasAlternativeUnit: true }) })
  it('does not invent fields that have not been verified in ERP', () => { expect(mapProduct({ Twr_GIDNumer: 42, Twr_GIDTyp: 16, Twr_Kod: 'X', Twr_Nazwa: 'Produkt', Twr_Jm: 'kg', Twr_StawkaPodSpr: 23 })).toMatchObject({ id: '16:42', ean: null, manufacturer: null, stock: null, unit: { displayUnit: 'kg' } }) })
})
