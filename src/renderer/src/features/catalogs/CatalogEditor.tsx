import { useCallback, useEffect, useMemo, useState } from 'react'
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowLeft, Copy, Download, GripVertical, Layers3, Pencil, Plus, Save, Search, Trash2 } from 'lucide-react'
import type { Catalog, CatalogPage, MediaAsset, Product, PageType } from '../../../../shared/types'
import { CatalogPageRenderer } from '../../components/CatalogPageRenderer'
import { Button, Field, Input } from '../../components/ui'
import { CatalogMetaDialog } from './CatalogMetaDialog'

const pageLabels: Record<PageType, string> = { COVER: 'Okładka', TABLE_OF_CONTENTS: 'Spis treści', BRAND_PRODUCTS: 'Strona marki', PRODUCTS: 'Produkty', PRODUCT_GRID_12: '12 produktów', PRODUCT_GRID_16: '16 produktów', BRANDS: 'Marki', CONTACTS: 'Oddziały i marki', PROMOTION: 'Reklama ezamshop', TEXT: 'Tekst', CUSTOM: 'Strona własna' }
const fixed = new Set<PageType>(['COVER', 'TABLE_OF_CONTENTS', 'PROMOTION', 'CONTACTS'])
const slotKey = (index: number) => `product${String(index + 1).padStart(2, '0')}`
const configString = (page: CatalogPage, key: string) => String(page.configuration[key] ?? '')

export function CatalogEditor({ id, onBack }: { id: string; onBack: () => void }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [editingMeta, setEditingMeta] = useState(false)
  const [picker, setPicker] = useState(false)
  const [query, setQuery] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [choices, setChoices] = useState<Product[]>([])
  const [checked, setChecked] = useState<Record<string, Product>>({})
  const [brands, setBrands] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [types, setTypes] = useState<string[]>([])
  const [media, setMedia] = useState<MediaAsset[]>([])
  const reload = useCallback(async () => { const result = await window.lechtom.catalog.get(id); setCatalog(result); setSelectedId((current) => result?.pages.some((page) => page.id === current) ? current : result?.pages[0]?.id ?? null) }, [id])
  useEffect(() => { void reload(); void window.lechtom.media.list().then(setMedia); void window.lechtom.erp.getManufacturers().then(setBrands).catch(() => undefined); void window.lechtom.erp.getCategories().then(setCategories).catch(() => undefined); void window.lechtom.erp.getTypes().then(setTypes).catch(() => undefined) }, [reload])
  const selected = useMemo(() => catalog?.pages.find((page) => page.id === selectedId), [catalog, selectedId])
  useEffect(() => {
    if (!picker) return
    let active = true
    const timer = setTimeout(() => { void window.lechtom.erp.getProducts({ query, manufacturer: brandFilter, category: categoryFilter, type: typeFilter, pageSize: 100 }).then((result) => { if (active) setChoices(result.items) }).catch((error: Error) => { if (active) setMessage(error.message) }) }, 250)
    return () => { active = false; clearTimeout(timer) }
  }, [picker, query, brandFilter, categoryFilter, typeFilter])
  const savePage = async (page: CatalogPage) => { try { await window.lechtom.catalog.savePage(page); await reload() } catch (error) { setMessage((error as Error).message) } }
  const update = (patch: Partial<CatalogPage>) => { if (selected) void savePage({ ...selected, ...patch }) }
  const updateConfig = (key: string, value: unknown) => { if (selected) update({ configuration: { ...selected.configuration, [key]: value } }) }
  const upload = async (kind: 'logos' | 'backgrounds' | 'products', key: string) => { try { const asset = await window.lechtom.media.selectFile(kind); if (asset) { setMedia((current) => [asset, ...current]); updateConfig(key, asset.url) } } catch (error) { setMessage((error as Error).message) } }
  const addPage = async (type: 'PRODUCT_GRID_12' | 'PRODUCT_GRID_16') => { if (!catalog) return; const page: CatalogPage = { id: crypto.randomUUID(), catalogId: catalog.id, pageType: 'BRAND_PRODUCTS', templateCode: type, sortOrder: catalog.pages.length - 2, manufacturerRef: null, configuration: {}, enabled: true, items: [] }; await window.lechtom.catalog.savePage(page); setSelectedId(page.id); await reload() }
  const duplicate = async () => { if (!selected || fixed.has(selected.pageType)) return; const pageId = crypto.randomUUID(); const copy = { ...selected, id: pageId, items: [] }; await window.lechtom.catalog.savePage(copy); await window.lechtom.catalog.setPageItems(pageId, selected.items.map((item) => ({ ...item, id: crypto.randomUUID(), pageId }))); setSelectedId(pageId); await reload() }
  const removePage = async () => { if (!selected || fixed.has(selected.pageType)) return; await window.lechtom.catalog.deletePage(selected.id); setSelectedId(null); await reload() }
  const onDragEnd = async (event: DragEndEvent) => {
    if (!catalog || !event.over || event.active.id === event.over.id) return
    const oldIndex = catalog.pages.findIndex((page) => page.id === event.active.id)
    const newIndex = catalog.pages.findIndex((page) => page.id === event.over?.id)
    if (oldIndex < 2 || newIndex < 2 || oldIndex >= catalog.pages.length - 2 || newIndex >= catalog.pages.length - 2) return
    const pages = arrayMove(catalog.pages, oldIndex, newIndex)
    setCatalog({ ...catalog, pages })
    try { await window.lechtom.catalog.reorderPages(catalog.id, pages.map((page) => page.id)); await reload() } catch (error) { setMessage((error as Error).message); await reload() }
  }
  const addSelected = async () => {
    if (!selected) return
    const capacity = selected.templateCode === 'PRODUCT_GRID_16' ? 16 : 12
    const items = [...selected.items]
    for (const product of Object.values(checked)) {
      const position = Array.from({ length: capacity }, (_, index) => index).find((index) => !items.some((item) => item.slotKey === slotKey(index)))
      if (position === undefined) break
      items.push({ id: crypto.randomUUID(), pageId: selected.id, slotKey: slotKey(position), erpId: product.erpGidNumer, erpProductGidNumer: product.erpGidNumer, erpProductGidTyp: product.erpGidTyp, sortOrder: position, customData: {}, overrides: { displayName: null, weightLabel: null, boxLabel: null, customImage: null, hiddenFields: [] }, product })
    }
    try { await window.lechtom.catalog.setPageItems(selected.id, items); setPicker(false); setChecked({}); await reload() } catch (error) { setMessage((error as Error).message) }
  }
  const moveItem = async (from: number, to: number) => {
    if (!selected || from === to) return
    const items = selected.items.map((item) => ({ ...item, slotKey: item.slotKey === slotKey(from) ? slotKey(to) : item.slotKey === slotKey(to) ? slotKey(from) : item.slotKey }))
    await window.lechtom.catalog.setPageItems(selected.id, items.map((item) => ({ ...item, sortOrder: Number(item.slotKey.slice(-2)) - 1 })))
    await reload()
  }
  const removeItem = async (id: string) => { if (!selected) return; await window.lechtom.catalog.setPageItems(selected.id, selected.items.filter((item) => item.id !== id)); await reload() }
  const exportPdf = async () => { try { const path = await window.lechtom.pdf.export(id); setMessage(path ? `Zapisano PDF: ${path}` : '') } catch (error) { setMessage((error as Error).message) } }
  if (!catalog || !selected) return <div className="editor-loading">Ładowanie katalogu...</div>
  const capacity = selected.templateCode === 'PRODUCT_GRID_16' ? 16 : 12
  const isGrid = ['BRAND_PRODUCTS', 'PRODUCTS', 'PRODUCT_GRID_12', 'PRODUCT_GRID_16'].includes(selected.pageType)
  const mediaOptions = (kind: string) => media.filter((asset) => asset.path.toLowerCase().includes(`\\${kind}\\`) || asset.path.toLowerCase().includes(`/${kind}/`))
  return <div className="editor">
    <div className="editor-top"><div><button className="back-link" onClick={onBack}><ArrowLeft size={16}/> Wszystkie katalogi</button><div className="editor-title"><h1>{catalog.name}</h1><span className="badge">Szkic</span></div><p>{catalog.pages.length} stron · Edytor katalogu A4</p></div><div className="editor-top-actions"><span className="saved-indicator"><Save size={14}/> Zapis automatyczny</span><Button variant="secondary" onClick={() => setEditingMeta(true)}><Pencil size={15}/> Edytuj dane</Button><Button onClick={() => void exportPdf()}><Download size={17}/> Eksportuj PDF</Button></div></div>
    {message && <div className="editor-message" onClick={() => setMessage('')}>{message}</div>}
    <div className="editor-workspace"><div className="editor-left"><div className="editor-panel-head"><div><strong>Strony katalogu</strong><small>Przeciągnij strony produktów</small></div><Layers3 size={18}/></div><DndContext collisionDetection={closestCenter} onDragEnd={(event) => void onDragEnd(event)}><SortableContext items={catalog.pages.map((page) => page.id)} strategy={verticalListSortingStrategy}><div className="editor-pages">{catalog.pages.map((page, index) => <SortablePage key={page.id} page={page} index={index} selected={page.id === selectedId} onSelect={() => setSelectedId(page.id)}/>)}</div></SortableContext></DndContext><div className="editor-add"><span>DODAJ STRONĘ PRODUKTÓW</span><button onClick={() => void addPage('PRODUCT_GRID_12')}><Plus size={15}/> Siatka 12</button><button onClick={() => void addPage('PRODUCT_GRID_16')}><Plus size={15}/> Siatka 16</button></div></div>
    <div className="editor-center"><div className="preview-bar"><span>PODGLĄD STRONY <strong>{catalog.pages.findIndex((page) => page.id === selected.id) + 1} / {catalog.pages.length}</strong></span><span>A4 · 210 × 297 mm</span></div><div className="page-scale"><CatalogPageRenderer catalog={catalog} page={selected} pageNumber={catalog.pages.findIndex((page) => page.id === selected.id) + 1}/></div></div>
    <div className="editor-right"><div className="editor-panel-head"><div><strong>Ustawienia strony</strong><small>{pageLabels[selected.pageType]}</small></div></div><div className="editor-settings">
      {isGrid && <><div className="setting-block"><Field label="Marka"><select className="input" value={selected.manufacturerRef ?? ''} onChange={async (event) => { const brand = event.target.value; const logo = brand ? await window.lechtom.media.resolveBrandLogo(brand) : null; await savePage({ ...selected, manufacturerRef: brand, configuration: { ...selected.configuration, brandLogo: logo?.url ?? '' } }) }}><option value="">Wybierz markę</option>{brands.map((brand) => <option key={brand}>{brand}</option>)}</select></Field></div><div className="setting-block"><Field label="Szablon"><select className="input" value={selected.templateCode} onChange={(event) => { if (event.target.value === 'PRODUCT_GRID_12' && selected.items.some((item) => Number(item.slotKey.slice(-2)) > 12)) { setMessage('Usuń produkty ze slotów 13–16 przed zmianą szablonu'); return } update({ templateCode: event.target.value }) }}><option value="PRODUCT_GRID_12">PRODUCT_GRID_12</option><option value="PRODUCT_GRID_16">PRODUCT_GRID_16</option></select></Field></div><div className="setting-block"><span className="setting-label">PRODUKTY ({selected.items.length}/{capacity})</span><Button size="small" onClick={() => setPicker(true)}><Plus size={14}/> Dodaj produkty</Button><div className="slot-list">{Array.from({ length: capacity }, (_, index) => { const item = selected.items.find((value) => value.slotKey === slotKey(index)); return <div className="slot-row" key={index} draggable={Boolean(item)} onDragStart={(event) => { if (item) event.dataTransfer.setData('text/plain', String(index)) }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const from = Number(event.dataTransfer.getData('text/plain')); if (Number.isInteger(from)) void moveItem(from, index) }}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item?.product?.name ?? 'Puste miejsce'}</strong>{item && <button title="Usuń produkt" onClick={() => void removeItem(item.id)}><Trash2 size={13}/></button>}</div> })}</div></div></>}
      <div className="setting-block"><Field label={selected.pageType === 'COVER' || selected.pageType === 'PROMOTION' || selected.pageType === 'CONTACTS' ? 'Grafika całej strony' : 'Tło strony'}><select className="input" value={configString(selected, selected.pageType === 'COVER' || selected.pageType === 'PROMOTION' || selected.pageType === 'CONTACTS' ? 'imageUrl' : 'background')} onChange={(event) => updateConfig(selected.pageType === 'COVER' || selected.pageType === 'PROMOTION' || selected.pageType === 'CONTACTS' ? 'imageUrl' : 'background', event.target.value)}><option value="">{selected.pageType === 'COVER' ? 'Domyślna okładka' : 'Bez grafiki'}</option>{mediaOptions('backgrounds').map((asset) => <option value={asset.url} key={asset.id}>{asset.originalFilename}</option>)}</select></Field><Button size="small" variant="secondary" onClick={() => void upload('backgrounds', selected.pageType === 'COVER' || selected.pageType === 'PROMOTION' || selected.pageType === 'CONTACTS' ? 'imageUrl' : 'background')}>Dodaj grafikę</Button></div>
      {isGrid && <><div className="setting-block"><Field label="Logo marki"><select className="input" value={configString(selected, 'brandLogo')} onChange={(event) => updateConfig('brandLogo', event.target.value)}><option value="">Bez logo</option>{mediaOptions('brands').map((asset) => <option value={asset.url} key={asset.id}>{asset.originalFilename}</option>)}</select></Field><Button size="small" variant="secondary" onClick={() => void upload('logos', 'brandLogo')}>Dodaj logo</Button></div><div className="setting-block">{[['showEan', 'Pokaż EAN'], ['showUnit', 'Pokaż jednostkę'], ['showBox', 'Pokaż opakowanie'], ['showCode', 'Pokaż kod ERP']].map(([key, label]) => <label className="check-row" key={key}><input type="checkbox" checked={selected.configuration[key] !== false} onChange={(event) => updateConfig(key, event.target.checked)}/>{label}</label>)}</div></>}
      {selected.pageType === 'PROMOTION' && <div className="setting-block"><Field label="Adres sklepu ezamshop"><ConfigText key={`${selected.id}:url`} value={configString(selected, 'url')} onSave={(value) => updateConfig('url', value)}/></Field></div>}
      {selected.pageType === 'CONTACTS' && <><div className="setting-block"><Field label="Oddziały (jeden w wierszu)"><ConfigText key={`${selected.id}:branches`} multiline value={configString(selected, 'branches')} onSave={(value) => updateConfig('branches', value)}/></Field></div><div className="setting-block"><Field label="Telefony (jeden w wierszu)"><ConfigText key={`${selected.id}:phones`} multiline value={configString(selected, 'phones')} onSave={(value) => updateConfig('phones', value)}/></Field></div></>}
      {!fixed.has(selected.pageType) && <div className="page-actions"><button onClick={() => void duplicate()}><Copy size={15}/> Duplikuj</button><button className="delete-page" onClick={() => void removePage()}><Trash2 size={16}/> Usuń stronę</button></div>}
    </div></div></div>
    {editingMeta && <CatalogMetaDialog catalog={catalog} onClose={() => setEditingMeta(false)} onSaved={() => void reload()}/>}
    {picker && <div className="modal-backdrop" onClick={() => setPicker(false)}><div className="modal product-picker" onClick={(event) => event.stopPropagation()}><div className="modal-heading"><div><span className="eyebrow">PRODUKTY ERP</span><h2>Dodaj produkty</h2></div></div><div className="search-wrap"><Search size={18}/><Input value={query} onChange={(event) => setQuery(event.target.value)} autoFocus placeholder="Nazwa, kod lub EAN..."/></div><div className="picker-filters"><select className="input" value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)}><option value="">Wszystkie marki</option>{brands.map((brand) => <option key={brand}>{brand}</option>)}</select><select className="input" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="">Wszystkie kategorie</option>{categories.map((category) => <option key={category}>{category}</option>)}</select><select className="input" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="">Wszystkie typy</option>{types.map((type) => <option key={type}>{type}</option>)}</select></div><div className="picker-results">{choices.map((product) => <label className="picker-choice" key={product.id}><input type="checkbox" checked={Boolean(checked[product.id])} onChange={(event) => setChecked((current) => { const next = { ...current }; if (event.target.checked) next[product.id] = product; else delete next[product.id]; return next })}/><strong>{product.name}</strong><small>{product.code} · {product.brand ?? 'bez marki'}</small></label>)}</div><div className="modal-actions"><Button variant="secondary" onClick={() => setPicker(false)}>Zamknij</Button><Button disabled={!Object.keys(checked).length || selected.items.length >= capacity} onClick={() => void addSelected()}>Dodaj zaznaczone ({Object.keys(checked).length})</Button></div></div></div>}
  </div>
}

function SortablePage({ page, index, selected, onSelect }: { page: CatalogPage; index: number; selected: boolean; onSelect: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: page.id, disabled: fixed.has(page.pageType) })
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`editor-page-row ${selected ? 'selected' : ''}`}><button className="drag-handle" {...attributes} {...listeners} disabled={fixed.has(page.pageType)}><GripVertical size={17}/></button><button className="page-row-select" onClick={onSelect}><span className="page-index">{String(index + 1).padStart(2, '0')}</span><div><strong>{page.manufacturerRef || pageLabels[page.pageType]}</strong><small>{pageLabels[page.pageType]}</small></div></button></div>
}

function ConfigText({ value, onSave, multiline = false }: { value: string; onSave: (value: string) => void; multiline?: boolean }) {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])
  return multiline ? <textarea className="input page-textarea" value={text} onChange={(event) => setText(event.target.value)} onBlur={() => { if (text !== value) onSave(text) }}/> : <Input value={text} onChange={(event) => setText(event.target.value)} onBlur={() => { if (text !== value) onSave(text) }}/>
}
