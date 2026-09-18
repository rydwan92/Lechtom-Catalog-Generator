import { useEffect, useState } from 'react'
import type { Catalog, Product } from '../../../../shared/types'
import { CatalogPageRenderer } from '../../components/CatalogPageRenderer'

export function PrintView({ id }: { id: string }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [products, setProducts] = useState<Record<string, Product | null>>({})
  useEffect(() => { let active = true; void (async () => { try { const result = await window.lechtom.catalog.get(id); if (!result || !active) return; const items = result.pages.flatMap((page) => page.items); const pairs = await Promise.all(items.map(async (item) => { const key = `${item.erpProductGidTyp}:${item.erpProductGidNumer}`; try { return [key, await window.lechtom.erp.getProduct({ gidNumer: item.erpProductGidNumer, gidTyp: item.erpProductGidTyp })] as const } catch { return [key, null] as const } })); if (active) { setProducts(Object.fromEntries(pairs)); setCatalog(result) } } catch { window.__CATALOG_PRINT_READY__ = false } })(); return () => { active = false } }, [id])
  useEffect(() => { if (!catalog) return; let active = true; void (async () => { await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))); await document.fonts.ready; await Promise.all(Array.from(document.images).map((img) => img.decode().catch(() => undefined))); if (active) window.__CATALOG_PRINT_READY__ = true })(); return () => { active = false } }, [catalog])
  if (!catalog) return null
  return <div className="print-document">{catalog.pages.filter((page) => page.enabled).map((page, index) => <CatalogPageRenderer key={page.id} catalog={catalog} page={page} pageNumber={index + 1} products={products}/>)}</div>
}
