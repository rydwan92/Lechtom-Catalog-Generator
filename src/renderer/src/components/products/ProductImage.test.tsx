import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ProductImage } from './ProductImage'

describe('product image fallback', () => {
  it('shows a placeholder when ERP has no image', () => {
    const html = renderToStaticMarkup(<ProductImage src={null} alt="Produkt"/>)
    expect(html).toContain('Brak zdjęcia')
    expect(html).not.toContain('<img')
  })
})
