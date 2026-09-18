import { clsx } from 'clsx'
import type { Catalog, CatalogPage } from '../../../shared/types'
import defaultCover from '../assets/titleFrontPage.jpg'

const stringValue = (page: CatalogPage, key: string) => String(page.configuration[key] ?? '')

export function getTableOfContents(catalog: Catalog): { name: string; page: number }[] {
  const seen = new Set<string>()
  return catalog.pages.filter((page) => page.enabled).flatMap((page, index) => {
    if (!['BRAND_PRODUCTS', 'PRODUCTS', 'PRODUCT_GRID_12', 'PRODUCT_GRID_16'].includes(page.pageType)) return []
    const name = page.manufacturerRef || 'Produkty'
    if (seen.has(name)) return []
    seen.add(name)
    return [{ name, page: index + 1 }]
  })
}

export function CatalogPageRenderer({ catalog, page, pageNumber }: { catalog: Catalog; page: CatalogPage; pageNumber: number }) {
  const isGrid = ['BRAND_PRODUCTS', 'PRODUCTS', 'PRODUCT_GRID_12', 'PRODUCT_GRID_16'].includes(page.pageType)
  const slots = page.templateCode === 'PRODUCT_GRID_16' || page.pageType === 'PRODUCT_GRID_16' ? 16 : 12
  const background = stringValue(page, 'background') || catalog.settings.defaultBackground
  const coverImage = stringValue(page, 'imageUrl') || defaultCover
  const brands = [...new Set(catalog.pages.filter((value) => ['BRAND_PRODUCTS', 'PRODUCTS', 'PRODUCT_GRID_12', 'PRODUCT_GRID_16'].includes(value.pageType)).map((value) => value.manufacturerRef).filter(Boolean))]
  return <article className={clsx('a4-page', page.pageType === 'COVER' && 'a4-cover')}>
    {background && page.pageType !== 'COVER' && <img className="page-background" src={background} alt=""/>}
    {page.pageType === 'COVER' && <img className="cover-photo" src={coverImage} alt="Okładka katalogu"/>}
    {page.pageType === 'TABLE_OF_CONTENTS' && <div className="print-content"><PrintHeader label="SPIS TREŚCI" page={pageNumber}/><h2>Spis treści</h2><p className="print-lead">Marki w katalogu</p><div className="toc-list">{getTableOfContents(catalog).map((entry) => <div className="toc-row" key={entry.name}><strong>{entry.name}</strong><span className="toc-dots"/><span>{String(entry.page).padStart(2, '0')}</span></div>)}</div><PrintFooter page={pageNumber}/></div>}
    {isGrid && <div className="print-content"><PrintHeader label="OFERTA PRODUKTOWA" page={pageNumber}/><div className="grid-heading"><div><span className="print-eyebrow">MARKA</span><h2>{page.manufacturerRef || 'Wybrane produkty'}</h2></div>{stringValue(page, 'brandLogo') ? <img className="brand-logo" src={stringValue(page, 'brandLogo')} alt={page.manufacturerRef ?? 'Logo marki'}/> : <div className="grid-heading-mark">LECHTOM<span>.</span></div>}</div><div className={clsx('product-grid', slots === 16 && 'product-grid-16')}>{Array.from({ length: slots }, (_, index) => { const item = page.items.find((value) => value.slotKey === `product${String(index + 1).padStart(2, '0')}`); const product = item?.product; const image = item?.overrides.customImage || product?.image; return <div className="product-tile" key={index}>{product ? <>{page.configuration.showEan !== false && !item.overrides.hiddenFields.includes('ean') && <span className="product-ean">{product.ean || product.code}</span>}<div className="product-image">{image ? <img src={image} alt=""/> : <span>LECHTOM</span>}</div><strong>{item.overrides.displayName || product.name}</strong><div className="product-meta"><span>{page.configuration.showUnit !== false && !item.overrides.hiddenFields.includes('unit') ? item.overrides.weightLabel || product.unit.displayUnit : ''}</span><span>{page.configuration.showBox !== false && !item.overrides.hiddenFields.includes('box') ? item.overrides.boxLabel || (product.itemsPerBox ? `${product.itemsPerBox} szt.` : '') : ''}</span></div>{page.configuration.showCode === true && !item.overrides.hiddenFields.includes('code') && <small className="product-code">{product.code}</small>}</> : <div className="product-placeholder"><span>+</span><small>Slot {String(index + 1).padStart(2, '0')}</small></div>}</div> })}</div><PrintFooter page={pageNumber}/></div>}
    {page.pageType === 'PROMOTION' && (stringValue(page, 'imageUrl') ? <img className="cover-photo" src={stringValue(page, 'imageUrl')} alt="Reklama sklepu ezamshop"/> : <div className="print-content promotion-content"><PrintHeader label="EZAMSHOP" page={pageNumber}/><span className="print-eyebrow">SKLEP INTERNETOWY LECHTOM</span><h2>ezamshop</h2><p>Zamawiaj online</p>{stringValue(page, 'url') && <strong>{stringValue(page, 'url')}</strong>}<PrintFooter page={pageNumber}/></div>)}
    {page.pageType === 'CONTACTS' && (stringValue(page, 'imageUrl') ? <img className="cover-photo" src={stringValue(page, 'imageUrl')} alt="Oddziały i marki LECHTOM"/> : <div className="print-content"><PrintHeader label="LECHTOM" page={pageNumber}/><h2>Kontakt i marki</h2><div className="contact-columns"><section><h3>Oddziały</h3>{stringValue(page, 'branches') ? stringValue(page, 'branches').split('\n').map((line, index) => <p key={index}>{line}</p>) : <p className="print-lead">Dodaj oddziały w edytorze.</p>}</section><section><h3>Telefony</h3>{stringValue(page, 'phones') ? stringValue(page, 'phones').split('\n').map((line, index) => <p key={index}>{line}</p>) : <p className="print-lead">Dodaj numery telefonów w edytorze.</p>}</section></div><div className="contact-brands"><h3>Marki w katalogu</h3><div>{brands.map((brand) => <span key={brand}>{brand}</span>)}</div></div><PrintFooter page={pageNumber}/></div>)}
    {!['COVER', 'TABLE_OF_CONTENTS', 'BRAND_PRODUCTS', 'PRODUCTS', 'PRODUCT_GRID_12', 'PRODUCT_GRID_16', 'PROMOTION', 'CONTACTS'].includes(page.pageType) && <div className="print-content"><PrintHeader label={page.pageType} page={pageNumber}/><h2>{catalog.title}</h2><PrintFooter page={pageNumber}/></div>}
  </article>
}
function PrintHeader({ label, page }: { label: string; page: number }) { return <div className="print-header"><span>LECHTOM<span className="accent">.</span></span><span>{label} / {String(page).padStart(2, '0')}</span></div> }
function PrintFooter({ page }: { page: number }) { return <div className="print-footer"><span>LECHTOM • KATALOG PRODUKTOWY</span><span>{String(page).padStart(2, '0')}</span></div> }
