import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Ean13Barcode } from './Ean13Barcode'

describe('EAN-13 barcode rendering', () => {
  it('renders printable SVG bars and the human-readable number', () => {
    const markup = renderToStaticMarkup(<Ean13Barcode ean="5901234123457"/>)
    expect(markup).toContain('<svg')
    expect(markup).toContain('class="ean13-barcode"')
    expect(markup).toContain('5901234123457')
    expect(markup.match(/<rect/g)?.length).toBeGreaterThan(20)
    expect(renderToStaticMarkup(<Ean13Barcode ean="5901234123457" tall/>)).toContain('viewBox="0 0 113 95"')
  })

  it('never invents bars for an invalid or missing EAN', () => {
    expect(renderToStaticMarkup(<Ean13Barcode ean="5901234123458"/>)).not.toContain('<svg')
    expect(renderToStaticMarkup(<Ean13Barcode ean={null}/>)).toBe('')
  })
})
