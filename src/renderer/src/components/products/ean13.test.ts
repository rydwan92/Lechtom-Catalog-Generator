import { describe, expect, it } from 'vitest'
import { encodeEan13 } from './ean13'

describe('EAN-13 encoder', () => {
  it('encodes a valid GTIN-13 with the correct guards and parity', () => {
    const encoded = encodeEan13('5901234123457')
    expect(encoded?.digits).toBe('5901234123457')
    expect(encoded?.bars).toHaveLength(95)
    expect(encoded?.bars.startsWith('101')).toBe(true)
    expect(encoded?.bars.slice(45, 50)).toBe('01010')
    expect(encoded?.bars.endsWith('101')).toBe(true)
    expect(encoded?.bars.slice(3, 10)).toBe('0001011') // first digit 5 selects L for the next digit 9
  })

  it('accepts surrounding whitespace but rejects invalid checksums and other formats', () => {
    expect(encodeEan13(' 4006381333931 ')).not.toBeNull()
    expect(encodeEan13('5901234123458')).toBeNull()
    expect(encodeEan13('123')).toBeNull()
    expect(encodeEan13(null)).toBeNull()
  })
})
