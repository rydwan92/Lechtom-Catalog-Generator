import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import type { Product } from '../../../../shared/types'
import { ProductImage } from './ProductImage'
import { getPreviewPosition, type PreviewPosition } from './previewPosition'

export function ProductImagePreview({ product, anchorRef, onEnter, onLeave }: { product: Product; anchorRef: RefObject<HTMLElement | null>; onEnter: () => void; onLeave: () => void }) {
  const popupRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<PreviewPosition | null>(null)
  useLayoutEffect(() => {
    const update = () => {
      const anchor = anchorRef.current?.getBoundingClientRect()
      if (!anchor) return
      setPosition(getPreviewPosition(anchor, { width: window.innerWidth, height: window.innerHeight }, { width: popupRef.current?.offsetWidth ?? 360, height: popupRef.current?.offsetHeight ?? 430 }))
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => { window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true) }
  }, [anchorRef])
  return createPortal(<div ref={popupRef} className="product-image-preview" style={position ?? { left: -10000, top: -10000 }} onMouseEnter={onEnter} onMouseLeave={onLeave} role="dialog" aria-label={`Zdjęcie produktu ${product.name}`}>
    <ProductImage src={product.image} alt={product.name} className="product-preview-picture" eager/>
    <div className="product-preview-details"><strong>{product.name}</strong><span>Kod ERP: {product.code}</span>{product.ean && <span>EAN: {product.ean}</span>}</div>
  </div>, document.body)
}
