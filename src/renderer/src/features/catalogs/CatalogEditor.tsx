import { useCallback, useEffect, useMemo, useState } from 'react'
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowLeft, Download, GripVertical, Layers3, Pencil, Plus, Save } from 'lucide-react'
import type { Catalog, CatalogPage, CatalogPageItem, MediaAsset, PageType, Product } from '../../../../shared/types'
import { productGridCapacity, type ProductGridTemplate } from '../../../../shared/productGrid'
import { CatalogPageRenderer } from '../../components/CatalogPageRenderer'
import { Button } from '../../components/ui'
import { CatalogMetaDialog } from './CatalogMetaDialog'
import { ProductPicker } from './components/ProductPicker'
import { ProductInspector } from './components/ProductInspector'
import { PageSettings } from './components/PageSettings'

const pageLabels: Record<PageType, string> = { COVER: 'Okładka', TABLE_OF_CONTENTS: 'Spis treści', BRAND_PRODUCTS: 'Strona marki', PRODUCTS: 'Produkty', PRODUCT_GRID_12: '12 produktów', PRODUCT_GRID_16: '16 produktów', BRANDS: 'Marki', CONTACTS: 'Oddziały i marki', PROMOTION: 'Reklama ezamshop', TEXT: 'Tekst', CUSTOM: 'Strona własna' }
const fixed = new Set<PageType>(['COVER', 'TABLE_OF_CONTENTS', 'PROMOTION', 'CONTACTS'])
const slotKey = (index: number) => `product${String(index + 1).padStart(2, '0')}`

export function CatalogEditor({ id, onBack }: { id: string; onBack: () => void }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [inspectingId, setInspectingId] = useState<string | null>(null)
  const [picker, setPicker] = useState(false)
  const [editingMeta, setEditingMeta] = useState(false)
  const [brands, setBrands] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [types, setTypes] = useState<string[]>([])
  const [media, setMedia] = useState<MediaAsset[]>([])
  const [message, setMessage] = useState('')
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const reload = useCallback(async () => {
    const result = await window.lechtom.catalog.get(id)
    setCatalog(result)
    setSelectedId((current) => result?.pages.some((page) => page.id === current) ? current : result?.pages[0]?.id ?? null)
  }, [id])
  useEffect(() => {
    void reload().catch((reason: Error) => setMessage(reason.message))
    void window.lechtom.media.list().then(setMedia).catch(() => undefined)
    void window.lechtom.erp.getBrands().then(setBrands).catch(() => undefined)
    void window.lechtom.erp.getCategories().then(setCategories).catch(() => undefined)
    void window.lechtom.erp.getTypes().then(setTypes).catch(() => undefined)
  }, [reload])
  const selected = useMemo(() => catalog?.pages.find((page) => page.id === selectedId), [catalog, selectedId])
  const inspected = selected?.items.find((item) => item.id === inspectingId)
  const markSaved = () => setSavedAt(new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }))
  const run = async (action: () => Promise<void>) => { try { await action(); markSaved() } catch (reason) { setMessage((reason as Error).message) } }
  const savePage = async (page: CatalogPage) => { await window.lechtom.catalog.savePage(page); await reload() }
  const changePage = async (page: CatalogPage) => run(() => savePage(page))
  const changeBrand = async (brand: string) => {
    if (!selected) return
    await run(async () => { const logo = brand ? await window.lechtom.media.resolveBrandLogo(brand) : null; await savePage({ ...selected, manufacturerRef: brand, configuration: { ...selected.configuration, brandLogo: logo?.url ?? '' } }) })
  }
  const upload = async (kind: 'logos' | 'backgrounds', key: string) => {
    if (!selected) return
    await run(async () => { const asset = await window.lechtom.media.selectFile(kind); if (asset) { setMedia((current) => [asset, ...current]); await savePage({ ...selected, configuration: { ...selected.configuration, [key]: asset.url } }) } })
  }
  const addPage = async (template: ProductGridTemplate) => {
    if (!catalog) return
    await run(async () => { const page: CatalogPage = { id: crypto.randomUUID(), catalogId: catalog.id, pageType: 'BRAND_PRODUCTS', templateCode: template, sortOrder: catalog.pages.length - 2, manufacturerRef: null, configuration: {}, enabled: true, items: [] }; await window.lechtom.catalog.savePage(page); setSelectedId(page.id); setInspectingId(null); await reload() })
  }
  const duplicate = async () => {
    if (!selected || fixed.has(selected.pageType)) return
    await run(async () => { const pageId = crypto.randomUUID(); await window.lechtom.catalog.savePage({ ...selected, id: pageId, items: [] }); await window.lechtom.catalog.setPageItems(pageId, selected.items.map((item) => ({ ...item, id: crypto.randomUUID(), pageId }))); setSelectedId(pageId); setInspectingId(null); await reload() })
  }
  const removePage = async () => {
    if (!selected || fixed.has(selected.pageType)) return
    await run(async () => { await window.lechtom.catalog.deletePage(selected.id); setSelectedId(null); setInspectingId(null); await reload() })
  }
  const reorderPages = async (event: DragEndEvent) => {
    if (!catalog || !event.over || event.active.id === event.over.id) return
    const oldIndex = catalog.pages.findIndex((page) => page.id === event.active.id)
    const newIndex = catalog.pages.findIndex((page) => page.id === event.over?.id)
    if (oldIndex < 2 || newIndex < 2 || oldIndex >= catalog.pages.length - 2 || newIndex >= catalog.pages.length - 2) return
    const pages = arrayMove(catalog.pages, oldIndex, newIndex)
    setCatalog({ ...catalog, pages })
    await run(async () => { await window.lechtom.catalog.reorderPages(catalog.id, pages.map((page) => page.id)); await reload() })
  }
  const addProducts = async (products: Product[]) => {
    if (!selected) return
    const capacity = productGridCapacity(selected.templateCode, selected.pageType)
    if (products.length > capacity - selected.items.length) throw new Error('Za mało wolnych miejsc na stronie')
    const items = [...selected.items]
    for (const product of products) {
      const position = Array.from({ length: capacity }, (_, index) => index).find((index) => !items.some((item) => item.slotKey === slotKey(index)))
      if (position === undefined) break
      items.push({ id: crypto.randomUUID(), pageId: selected.id, slotKey: slotKey(position), erpId: product.erpGidNumer, erpProductGidNumer: product.erpGidNumer, erpProductGidTyp: product.erpGidTyp, sortOrder: position, customData: {}, overrides: { displayName: null, weightLabel: null, boxLabel: null, customImage: null, hiddenFields: [] }, product })
    }
    await window.lechtom.catalog.setPageItems(selected.id, items)
    setPicker(false)
    await reload()
    markSaved()
  }
  const updateItem = async (next: CatalogPageItem) => {
    if (!selected) return
    const latest = await window.lechtom.catalog.get(id)
    const currentPage = latest?.pages.find((page) => page.id === next.pageId)
    if (!currentPage) throw new Error('Nie znaleziono strony produktu')
    await window.lechtom.catalog.setPageItems(next.pageId, currentPage.items.map((item) => item.id === next.id ? next : item))
    await reload()
    markSaved()
  }
  const removeItem = async () => {
    if (!selected || !inspected) return
    await window.lechtom.catalog.setPageItems(selected.id, selected.items.filter((item) => item.id !== inspected.id))
    setInspectingId(null)
    await reload()
    markSaved()
  }
  const moveItem = async (from: number, to: number) => {
    if (!selected || from === to || !selected.items.some((item) => item.slotKey === slotKey(from))) return
    await run(async () => { const items = selected.items.map((item) => ({ ...item, slotKey: item.slotKey === slotKey(from) ? slotKey(to) : item.slotKey === slotKey(to) ? slotKey(from) : item.slotKey })); await window.lechtom.catalog.setPageItems(selected.id, items.map((item) => ({ ...item, sortOrder: Number(item.slotKey.slice(-2)) - 1 }))); await reload() })
  }
  const exportPdf = async () => { try { const path = await window.lechtom.pdf.export(id); if (path) setMessage(`Zapisano PDF: ${path}`) } catch (reason) { setMessage((reason as Error).message) } }

  if (!catalog || !selected) return <div className="editor-loading">Ładowanie katalogu...</div>
  const pageNumber = catalog.pages.findIndex((page) => page.id === selected.id) + 1
  return <div className="editor">
    <div className="editor-top"><div><button className="back-link" onClick={onBack}><ArrowLeft size={16}/> Wszystkie katalogi</button><div className="editor-title"><h1>{catalog.name}</h1><span className="badge">Szkic</span></div><p>{catalog.pages.length} stron · Edytor katalogu A4</p></div><div className="editor-top-actions"><span className="saved-indicator"><Save size={14}/>{savedAt ? `Zapisano ${savedAt}` : 'Zapis automatyczny'}</span><Button variant="secondary" onClick={() => setEditingMeta(true)}><Pencil size={15}/> Edytuj dane</Button><Button onClick={() => void exportPdf()}><Download size={17}/> Eksportuj PDF</Button></div></div>
    {message && <div className="editor-message" role="status" onClick={() => setMessage('')}>{message}</div>}
    <div className="editor-workspace">
      <div className="editor-left"><div className="editor-panel-head"><div><strong>Strony katalogu</strong><small>Przeciągnij strony produktów</small></div><Layers3 size={18}/></div><DndContext collisionDetection={closestCenter} onDragEnd={(event) => void reorderPages(event)}><SortableContext items={catalog.pages.map((page) => page.id)} strategy={verticalListSortingStrategy}><div className="editor-pages">{catalog.pages.map((page, index) => <SortablePage key={page.id} page={page} index={index} selected={page.id === selectedId} onSelect={() => { setSelectedId(page.id); setInspectingId(null); setPicker(false) }}/>)}</div></SortableContext></DndContext><div className="editor-add"><span>DODAJ STRONĘ PRODUKTÓW</span><button onClick={() => void addPage('PRODUCT_GRID_12')}><Plus size={15}/> Siatka 12</button><button onClick={() => void addPage('PRODUCT_GRID_15_REFERENCE')}><Plus size={15}/> Siatka 15</button><button onClick={() => void addPage('PRODUCT_GRID_16')}><Plus size={15}/> Siatka 16</button></div></div>
      <div className="editor-center"><div className="preview-bar"><span>PODGLĄD STRONY <strong>{pageNumber} / {catalog.pages.length}</strong></span><span>A4 · 210 × 297 mm</span></div><div className="page-scale"><CatalogPageRenderer catalog={catalog} page={selected} pageNumber={pageNumber} onSelectItem={setInspectingId}/></div></div>
      <div className="editor-right">{inspected ? <ProductInspector key={inspected.id} item={inspected} onBack={() => setInspectingId(null)} onUpdate={updateItem} onRemove={removeItem}/> : <><div className="editor-panel-head"><div><strong>Ustawienia strony</strong><small>{pageLabels[selected.pageType]}</small></div></div><PageSettings page={selected} brands={brands} media={media} onChange={changePage} onBrandChange={changeBrand} onUpload={upload} onOpenPicker={() => setPicker(true)} onSelectItem={setInspectingId} onMoveItem={moveItem} onDuplicate={duplicate} onDelete={removePage}/></>}</div>
    </div>
    {editingMeta && <CatalogMetaDialog catalog={catalog} onClose={() => setEditingMeta(false)} onSaved={() => void reload()}/>}
    {picker && <ProductPicker key={selected.id} page={selected} brands={brands} categories={categories} types={types} onAdd={addProducts} onClose={() => setPicker(false)}/>}
  </div>
}

function SortablePage({ page, index, selected, onSelect }: { page: CatalogPage; index: number; selected: boolean; onSelect: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: page.id, disabled: fixed.has(page.pageType) })
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`editor-page-row ${selected ? 'selected' : ''}`}><button className="drag-handle" {...attributes} {...listeners} disabled={fixed.has(page.pageType)}><GripVertical size={17}/></button><button className="page-row-select" onClick={onSelect}><span className="page-index">{String(index + 1).padStart(2, '0')}</span><div><strong>{page.manufacturerRef || pageLabels[page.pageType]}</strong><small>{pageLabels[page.pageType]}</small></div></button></div>
}
