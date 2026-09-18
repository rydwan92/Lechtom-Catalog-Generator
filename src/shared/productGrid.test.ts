import { describe, expect, it } from 'vitest'
import { productGridCapacity } from './productGrid'

describe('product grid capacity', () => {
  it('keeps the editor, picker, and renderer on the same number of slots', () => {
    expect(productGridCapacity('PRODUCT_GRID_12')).toBe(12)
    expect(productGridCapacity('PRODUCT_GRID_15_REFERENCE')).toBe(15)
    expect(productGridCapacity('PRODUCT_GRID_16')).toBe(16)
    expect(productGridCapacity('', 'PRODUCT_GRID_16')).toBe(16)
  })
})
