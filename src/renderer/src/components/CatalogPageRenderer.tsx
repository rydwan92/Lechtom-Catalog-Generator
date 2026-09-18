import type { Catalog, CatalogPage, Product } from '../../../shared/types'
import { clsx } from 'clsx'
import defaultCover from '../assets/titleFrontPage.jpg'

export function getTableOfContents(catalog: Catalog): { name: string; page: number }[] {
  const seen = new Set<string>()
  return catalog.pages.filter((page) => page.enabled).flatMap((page, index) => { const name = page.manufacturerRef; if (!name || seen.has(name)) return []; seen.add(name); return [{ name, page: index + 1 }] })
}

export function CatalogPageRenderer({ catalog, page, pageNumber, products, coverImage = defaultCover }: { catalog: Catalog; page: CatalogPage; pageNumber: number; products?: Record<string, Product | null>; coverImage?: string }) {
  const isGrid = page.pageType === 'PRODUCT_GRID_12' || page.pageType === 'PRODUCT_GRID_16'
  const slots = page.pageType === 'PRODUCT_GRID_16' ? 16 : 12
  return <article className={clsx('a4-page', page.pageType === 'COVER' && 'a4-cover')}>
    {page.pageType === 'COVER' && <>
      {coverImage && <img className="cover-photo" src={coverImage} alt="" />}
      {!coverImage && <>
      <div className="cover-shade" />
      <div className="cover-top"><div className="cover-brand">LECHTOM<span>.</span></div><span>KATALOG PRODUKTOWY</span></div>
      <div className="cover-copy"><span className="cover-kicker">OFERTA DLA BIZNESU</span><h1>{catalog.title}</h1><p>{catalog.subtitle || 'Wybór produktów dla profesjonalnej gastronomii i handlu.'}</p><div className="cover-date">{catalog.validFrom && catalog.validTo ? `${catalog.validFrom} — ${catalog.validTo}` : 'Aktualna oferta'}</div></div>
      <div className="cover-footer"><span>LECHTOM CATALOG GENERATOR</span><span>01 / {String(catalog.pages.length).padStart(2, '0')}</span></div></>}
    </>}
    {page.pageType === 'TABLE_OF_CONTENTS' && <div className="print-content"><PrintHeader label="SPIS TREŚCI" page={pageNumber} /><h2>Poznaj naszą ofertę</h2><p className="print-lead">Producenci i marki w tym katalogu</p><div className="toc-list">{getTableOfContents(catalog).map((entry) => <div className="toc-row" key={entry.name}><strong>{entry.name}</strong><span className="toc-dots" /><span>{String(entry.page).padStart(2, '0')}</span></div>)}</div><PrintFooter page={pageNumber} /></div>}
    {isGrid && <div className="print-content"><PrintHeader label="OFERTA PRODUKTOWA" page={pageNumber} /><div className="grid-heading"><div><span className="print-eyebrow">PRODUCENT</span><h2>{page.manufacturerRef || 'Wybrane produkty'}</h2></div><div className="grid-heading-mark">LECHTOM<span>.</span></div></div><div className={clsx('product-grid', slots === 16 && 'product-grid-16')}>{Array.from({ length: slots }, (_, index) => { const item = page.items.find((x) => x.slotKey === `product${String(index + 1).padStart(2, '0')}`); const product = item && products?.[`${item.erpProductGidTyp}:${item.erpProductGidNumer}`]; return <div className="product-tile" key={index}>{product ? <><span className="product-ean">{product.ean ?? product.code}</span><div className="product-image">{product.image ? <img src={product.image} alt="" /> : <span>LECHTOM</span>}</div><strong>{String(item?.customData.marketingName || product.name)}</strong><div className="product-meta"><span>{product.weight ? `${product.weight} kg` : product.unit.displayUnit}</span><span>{product.itemsPerBox ? `${product.itemsPerBox} szt.` : ''}</span></div></> : <div className="product-placeholder"><span>+</span><small>Slot {String(index + 1).padStart(2, '0')}</small></div>}</div> })}</div><PrintFooter page={pageNumber} /></div>}
    {!['COVER', 'TABLE_OF_CONTENTS', 'PRODUCT_GRID_12', 'PRODUCT_GRID_16'].includes(page.pageType) && <div className="print-content"><PrintHeader label={page.pageType.replaceAll('_', ' ')} page={pageNumber} /><h2>{page.manufacturerRef || catalog.title}</h2><p className="print-lead">Dodaj treść strony w kolejnej iteracji edytora.</p><PrintFooter page={pageNumber} /></div>}
  </article>
}
function PrintHeader({ label, page }: { label: string; page: number }) { return <div className="print-header"><span>LECHTOM<span className="accent">.</span></span><span>{label} / {String(page).padStart(2, '0')}</span></div> }
function PrintFooter({ page }: { page: number }) { return <div className="print-footer"><span>LECHTOM • OFERTA PRODUKTOWA</span><span>{String(page).padStart(2, '0')}</span></div> }
