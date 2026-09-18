import { useEffect, useRef, useState } from 'react'
import type { Product } from '../../../../shared/types'
import { ProductImage } from './ProductImage'
import { ProductImagePreview } from './ProductImagePreview'

export function ProductThumbnail({ product }: { product: Product }) {
  const anchorRef = useRef<HTMLButtonElement>(null)
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [open, setOpen] = useState(false)
  const clearTimers = () => { if (openTimer.current) clearTimeout(openTimer.current); if (closeTimer.current) clearTimeout(closeTimer.current) }
  const scheduleOpen = () => { clearTimers(); openTimer.current = setTimeout(() => setOpen(true), 280) }
  const scheduleClose = () => { if (openTimer.current) clearTimeout(openTimer.current); closeTimer.current = setTimeout(() => setOpen(false), 130) }
  const holdOpen = () => { if (closeTimer.current) clearTimeout(closeTimer.current) }
  useEffect(() => { const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { clearTimers(); setOpen(false) } }; document.addEventListener('keydown', onKey); return () => { clearTimers(); document.removeEventListener('keydown', onKey) } }, [])
  return <><button ref={anchorRef} type="button" className="product-thumbnail" aria-label={`Pokaż zdjęcie: ${product.name}`} aria-expanded={open} onMouseEnter={scheduleOpen} onMouseLeave={scheduleClose} onFocus={scheduleOpen} onBlur={scheduleClose} onClick={() => { clearTimers(); setOpen((value) => !value) }}><ProductImage src={product.image} alt=""/></button>{open && <ProductImagePreview product={product} anchorRef={anchorRef} onEnter={holdOpen} onLeave={scheduleClose}/>}</>
}
