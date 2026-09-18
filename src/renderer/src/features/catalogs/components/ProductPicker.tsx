import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Search } from 'lucide-react'
import type { CatalogPage, PagedResult, Product } from '../../../../../shared/types'
import { productGridCapacity } from '../../../../../shared/productGrid'
import { ProductThumbnail } from '../../../components/products/ProductThumbnail'
import { Button, Input } from '../../../components/ui'

const PAGE_SIZE = 30

export function ProductPicker({ page, brands, categories, types, onAdd, onClose }: { page: CatalogPage; brands: string[]; categories: string[]; types: string[]; onAdd: (products: Product[]) => Promise<void>; onClose: () => void }) {
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')
  const [brand, setBrand] = useState(page.manufacturerRef ?? '')
  const [category, setCategory] = useState('')
  const [type, setType] = useState('')
  const [number, setNumber] = useState(1)
  const [result, setResult] = useState<PagedResult<Product> | null>(null)
  const [selected, setSelected] = useState<Record<string, Product>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const capacity = productGridCapacity(page.templateCode, page.pageType)
  const freeSlots = capacity - page.items.length
  const selectedCount = Object.keys(selected).length
  const occupied = new Set(page.items.map((item) => item.erpId))

  useEffect(() => { const timer = setTimeout(() => { setQuery(input); setNumber(1) }, 280); return () => clearTimeout(timer) }, [input])
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    void window.lechtom.erp.getProducts({ query, manufacturer: brand, category, type, page: number, pageSize: PAGE_SIZE })
      .then((data) => { if (active) setResult(data) })
      .catch((reason: Error) => { if (active) { setResult(null); setError(reason.message || 'Nie udało się pobrać produktów z ERP.') } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [query, brand, category, type, number])

  const filter = (setter: (value: string) => void, value: string) => { setter(value); setNumber(1) }
  const toggle = (product: Product) => {
    setSelected((current) => {
      const next = { ...current }
      if (next[product.id]) delete next[product.id]
      else if (Object.keys(next).length < freeSlots) next[product.id] = product
      return next
    })
  }
  const submit = async () => {
    if (!selectedCount || selectedCount > freeSlots) return
    setSubmitting(true)
    try { await onAdd(Object.values(selected)) } catch (reason) { setError((reason as Error).message); setSubmitting(false) }
  }

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <div className="modal product-picker" role="dialog" aria-modal="true" aria-label="Dodaj produkty">
      <div className="picker-head"><div><span className="eyebrow">PRODUKTY ERP</span><h2>Dodaj produkty do strony</h2><p>Wybrano <strong>{selectedCount}</strong> produktów · Miejsca na stronie: <strong>{page.items.length} / {capacity}</strong></p></div><button className="picker-close" onClick={onClose} aria-label="Zamknij">×</button></div>
      <div className="picker-controls"><div className="search-wrap"><Search size={18}/><Input value={input} onChange={(event) => setInput(event.target.value)} autoFocus placeholder="Nazwa, kod lub EAN..."/></div><div className="picker-filters"><select className="input" value={brand} onChange={(event) => filter(setBrand, event.target.value)}><option value="">Wszystkie marki</option>{brands.map((value) => <option key={value}>{value}</option>)}</select><select className="input" value={category} onChange={(event) => filter(setCategory, event.target.value)}><option value="">Wszystkie kategorie</option>{categories.map((value) => <option key={value}>{value}</option>)}</select><select className="input" value={type} onChange={(event) => filter(setType, event.target.value)}><option value="">Wszystkie typy</option>{types.map((value) => <option key={value}>{value}</option>)}</select></div></div>
      <div className="picker-scroll" aria-busy={loading}>
        {loading && <div className="picker-state">Ładowanie produktów...</div>}
        {!loading && error && <div className="picker-state picker-error">{error}</div>}
        {!loading && !error && !result?.items.length && <div className="picker-state">Nie znaleziono produktów dla wybranych filtrów.</div>}
        {!loading && !error && result?.items.map((product) => {
          const isChecked = Boolean(selected[product.id])
          const alreadyOnPage = occupied.has(product.erpGidNumer)
          const disabled = alreadyOnPage || (!isChecked && selectedCount >= freeSlots)
          return <div className={`picker-product ${isChecked ? 'is-selected' : ''}`} key={product.id}>
            <input id={`picker-${product.id}`} type="checkbox" checked={isChecked} disabled={disabled} onChange={() => toggle(product)}/>
            <ProductThumbnail product={product}/>
            <label htmlFor={`picker-${product.id}`} className="picker-product-info"><strong>{product.name}</strong><span>Kod: {product.code}{product.ean ? ` · EAN: ${product.ean}` : ''}</span><small>{product.brand ?? 'Bez marki'} · {product.category ?? 'Bez kategorii'} · {product.type ?? 'Bez typu'}</small></label>
            {alreadyOnPage && <span className="picker-added">Na stronie</span>}
          </div>
        })}
      </div>
      <div className="picker-pagination"><span>{result ? `${result.total.toLocaleString('pl-PL')} wyników · Strona ${number} z ${Math.max(1, Math.ceil(result.total / PAGE_SIZE))}` : '—'}</span><div><Button size="small" variant="secondary" disabled={number <= 1 || loading} onClick={() => setNumber((value) => value - 1)}><ArrowLeft size={14}/> Poprzednia</Button><Button size="small" variant="secondary" disabled={!result || number * PAGE_SIZE >= result.total || loading} onClick={() => setNumber((value) => value + 1)}>Następna <ArrowRight size={14}/></Button></div></div>
      <div className="picker-actions"><span>{freeSlots ? `Możesz dodać jeszcze ${freeSlots - selectedCount}` : 'Strona jest pełna'}</span><div><Button variant="secondary" onClick={onClose}>Anuluj</Button><Button disabled={!selectedCount || submitting || freeSlots <= 0} onClick={() => void submit()}>{submitting ? 'Dodawanie...' : `Dodaj ${selectedCount} produktów`}</Button></div></div>
    </div>
  </div>
}
