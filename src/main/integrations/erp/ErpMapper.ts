import type { Product, ProductUnitInfo } from '../../../shared/types'
import type { ErpProductRow } from './ErpTypes'

export function mapUnit(baseUnit: string, alternative?: { unit: string; numerator: number; denominator: number } | null): ProductUnitInfo {
  const valid = alternative && alternative.unit.trim() && alternative.numerator > 0 && alternative.denominator > 0
  return { baseUnit, displayUnit: valid ? alternative.unit : baseUnit, conversionNumerator: valid ? alternative.numerator : null, conversionDenominator: valid ? alternative.denominator : null, conversionFactor: valid ? alternative.numerator / alternative.denominator : null, hasAlternativeUnit: Boolean(valid) }
}

export function mapProduct(row: ErpProductRow): Product {
  return { id: `${row.Twr_GIDTyp}:${row.Twr_GIDNumer}`, erpGidNumer: row.Twr_GIDNumer, erpGidTyp: row.Twr_GIDTyp, code: row.Twr_Kod, ean: null, name: row.Twr_Nazwa, manufacturer: null, brand: null, category: null, unit: mapUnit(row.Twr_Jm), weight: null, itemsPerBox: null, vatRate: row.Twr_StawkaPodSpr, image: null, stock: null, active: true }
}
