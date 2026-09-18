import { useEffect, useState } from 'react'
import type { Catalog } from '../../../../shared/types'
import { CatalogPageRenderer } from '../../components/CatalogPageRenderer'

export function PrintView({ id }: { id: string }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  useEffect(() => { let active = true; void window.lechtom.catalog.get(id).then((result) => { if (active) setCatalog(result) }).catch(() => { window.__CATALOG_PRINT_READY__ = false }); return () => { active = false } }, [id])
  useEffect(() => { if (!catalog) return; let active = true; void (async () => { await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))); await document.fonts.ready; await Promise.all(Array.from(document.images).map((img) => img.decode().catch(() => undefined))); if (active) window.__CATALOG_PRINT_READY__ = true })(); return () => { active = false } }, [catalog])
  if (!catalog) return null
  return <div className="print-document">{catalog.pages.filter((page) => page.enabled).map((page, index) => <CatalogPageRenderer key={page.id} catalog={catalog} page={page} pageNumber={index + 1}/>)}</div>
}
