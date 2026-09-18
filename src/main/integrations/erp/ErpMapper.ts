import type { Product, ProductUnitInfo } from '../../../shared/types'
import type { ErpProductRow } from './ErpTypes'

export function mapUnit(baseUnit: string, alternative?: { unit: string; numerator: number; denominator: number } | null): ProductUnitInfo {
  const valid = alternative && alternative.unit.trim() && alternative.numerator > 0 && alternative.denominator > 0
  return { baseUnit, displayUnit: valid ? alternative.unit : baseUnit, conversionNumerator: valid ? alternative.numerator : null, conversionDenominator: valid ? alternative.denominator : null, conversionFactor: valid ? alternative.numerator / alternative.denominator : null, hasAlternativeUnit: Boolean(valid) }
}

export function mapProduct(row: ErpProductRow): Product {
  const alternative = row.JmDodatkowa && row.PrzeliczL && row.PrzeliczM ? { unit: row.JmDodatkowa, numerator: Number(row.PrzeliczL), denominator: Number(row.PrzeliczM) } : null
  return { id: `0:${row.Id}`, erpGidNumer: row.Id, erpGidTyp: 0, code: row.Kod, ean: row.EAN, name: row.Nazwa, type: row.Typ, group: row.Grupa, manufacturer: row.Marka, brand: row.Marka, category: row.Kategoria, unit: mapUnit(row.Jm, alternative), weight: null, itemsPerBox: null, vatRate: row.Vat == null ? null : Number(row.Vat), image: row.UrlImage, stock: null, active: true }
}
