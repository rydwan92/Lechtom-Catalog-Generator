import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Boxes, RefreshCw, Search } from 'lucide-react'
import type { PagedResult, Product } from '../../../../shared/types'
import { ProductThumbnail } from '../../components/products/ProductThumbnail'
import { Button, Card, EmptyState, Input } from '../../components/ui'

export function ProductsView({ onSettings }: { onSettings: () => void }) {
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState('')
  const [type, setType] = useState('')
  const [brands, setBrands] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [types, setTypes] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<PagedResult<Product> | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => { setQuery(input); setPage(1) }, 300)
    return () => clearTimeout(timer)
  }, [input])
  useEffect(() => {
    void window.lechtom.erp.getBrands().then(setBrands).catch(() => undefined)
    void window.lechtom.erp.getCategories().then(setCategories).catch(() => undefined)
    void window.lechtom.erp.getTypes().then(setTypes).catch(() => undefined)
  }, [reloadToken])
  useEffect(() => {
    let active = true
    setLoading(true)
    void window.lechtom.erp.getProducts({ query, manufacturer: brand, category, type, page, pageSize: 25 })
      .then((data) => { if (active) { setResult(data); setError('') } })
      .catch((reason: Error) => { if (active) { setResult(null); setError(reason.message.includes('Skonfiguruj') ? 'Skonfiguruj połączenie w Ustawieniach ERP.' : 'Sprawdź połączenie i spróbuj ponownie.') } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [query, brand, category, type, page, reloadToken])
  const setFilter = (setter: (value: string) => void, value: string) => { setter(value); setPage(1) }

  return <>
    <div className="page-heading"><div><span className="eyebrow">ŹRÓDŁO DANYCH / COMARCH ERP XL</span><h1>Produkty ERP</h1><p>Produkty z funkcji B2B.GetOfferGoods().</p></div><div className="heading-count"><Boxes size={18}/>{result ? `${result.total.toLocaleString('pl-PL')} produktów` : 'Baza produktów'}</div></div>
    <Card className="table-card">
      <div className="table-toolbar"><div className="search-wrap"><Search size={18}/><Input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Nazwa, kod lub EAN..."/></div></div>
      <div className="product-filters"><select className="input" value={brand} onChange={(event) => setFilter(setBrand, event.target.value)}><option value="">Wszystkie marki</option>{brands.map((value) => <option key={value}>{value}</option>)}</select><select className="input" value={category} onChange={(event) => setFilter(setCategory, event.target.value)}><option value="">Wszystkie kategorie</option>{categories.map((value) => <option key={value}>{value}</option>)}</select><select className="input" value={type} onChange={(event) => setFilter(setType, event.target.value)}><option value="">Wszystkie typy</option>{types.map((value) => <option key={value}>{value}</option>)}</select></div>
      {error ? <EmptyState icon={<Boxes size={29}/>} title="Brak połączenia z bazą ERP" description={error} action={<div className="empty-actions"><Button onClick={() => setReloadToken((value) => value + 1)}><RefreshCw size={15}/> Spróbuj ponownie</Button><Button variant="secondary" onClick={onSettings}>Ustawienia ERP</Button></div>}/> : <>
        <div className="table-scroll"><table className="data-table"><thead><tr><th>Zdjęcie</th><th>Kod</th><th>EAN</th><th>Nazwa produktu</th><th>Marka</th><th>Kategoria</th><th>Typ</th><th>JM</th><th>VAT</th></tr></thead><tbody>{result?.items.map((product) => <tr key={product.id}><td className="product-photo-cell"><ProductThumbnail product={product}/></td><td className="code-cell">{product.code}</td><td>{product.ean ?? '—'}</td><td className="name-cell">{product.name}</td><td>{product.brand ?? '—'}</td><td>{product.category ?? '—'}</td><td>{product.type ?? '—'}</td><td><span className="unit-badge">{product.unit.displayUnit}</span></td><td>{product.vatRate == null ? '—' : `${product.vatRate}%`}</td></tr>)}</tbody></table>{loading && <div className="table-loading">Ładowanie produktów...</div>}{!loading && result?.items.length === 0 && <div className="table-no-results">Nie znaleziono produktów.</div>}</div>
        <div className="table-footer"><span>{result ? `Strona ${page} z ${Math.max(1, Math.ceil(result.total / 25))}` : '—'}</span><div><Button size="small" variant="secondary" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}><ArrowLeft size={15}/> Poprzednia</Button><Button size="small" variant="secondary" disabled={!result || page * 25 >= result.total || loading} onClick={() => setPage((value) => value + 1)}>Następna <ArrowRight size={15}/></Button></div></div>
      </>}
    </Card>
    <p className="table-footnote">Dane pochodzą bezpośrednio z ERP i są dostępne tylko do odczytu.</p>
  </>
}
