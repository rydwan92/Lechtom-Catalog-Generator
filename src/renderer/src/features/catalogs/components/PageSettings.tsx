import { useEffect, useState } from 'react'
import { Copy, Plus, Trash2 } from 'lucide-react'
import type { CatalogPage, MediaAsset } from '../../../../../shared/types'
import { productGridCapacity } from '../../../../../shared/productGrid'
import { ProductThumbnail } from '../../../components/products/ProductThumbnail'
import { Button, Field, Input } from '../../../components/ui'

const fixed = new Set(['COVER', 'TABLE_OF_CONTENTS', 'PROMOTION', 'CONTACTS'])
const slotKey = (index: number) => `product${String(index + 1).padStart(2, '0')}`
const configString = (page: CatalogPage, key: string) => String(page.configuration[key] ?? '')
const isProductPage = (page: CatalogPage) => ['BRAND_PRODUCTS', 'PRODUCTS', 'PRODUCT_GRID_12', 'PRODUCT_GRID_16'].includes(page.pageType)

export function PageSettings({ page, brands, media, onChange, onBrandChange, onUpload, onOpenPicker, onSelectItem, onMoveItem, onDuplicate, onDelete }: {
  page: CatalogPage; brands: string[]; media: MediaAsset[];
  onChange: (next: CatalogPage) => Promise<void>; onBrandChange: (brand: string) => Promise<void>;
  onUpload: (kind: 'logos' | 'backgrounds', key: string) => Promise<void>;
  onOpenPicker: () => void; onSelectItem: (id: string) => void; onMoveItem: (from: number, to: number) => Promise<void>;
  onDuplicate: () => Promise<void>; onDelete: () => Promise<void>
}) {
  const [warning, setWarning] = useState('')
  const capacity = productGridCapacity(page.templateCode, page.pageType)
  const productPage = isProductPage(page)
  const fullImage = ['COVER', 'PROMOTION', 'CONTACTS'].includes(page.pageType)
  const imageKey = fullImage ? 'imageUrl' : 'background'
  const updateConfig = (key: string, value: unknown) => void onChange({ ...page, configuration: { ...page.configuration, [key]: value } })
  const mediaOptions = (kind: string) => media.filter((asset) => asset.path.toLowerCase().includes(`\\${kind}\\`) || asset.path.toLowerCase().includes(`/${kind}/`))

  return <div className="editor-settings">
    {productPage && <>
      <div className="setting-block"><Field label="Marka"><select className="input" value={page.manufacturerRef ?? ''} onChange={(event) => void onBrandChange(event.target.value)}><option value="">Wybierz markę</option>{brands.map((brand) => <option key={brand}>{brand}</option>)}</select></Field></div>
      <div className="setting-block"><Field label="Szablon"><select className="input" value={page.templateCode} onChange={(event) => { const template = event.target.value; const nextCapacity = productGridCapacity(template); if (page.items.some((item) => Number(item.slotKey.slice(-2)) > nextCapacity)) { setWarning(`Usuń produkty ze slotów powyżej ${nextCapacity} przed zmianą szablonu.`); return } setWarning(''); void onChange({ ...page, templateCode: template }) }}><option value="PRODUCT_GRID_12">Siatka 12</option><option value="PRODUCT_GRID_15_REFERENCE">Siatka 15</option><option value="PRODUCT_GRID_16">Siatka 16</option></select></Field>{warning && <small className="form-error">{warning}</small>}</div>
      <div className="setting-block"><div className="slot-heading"><span className="setting-label">PRODUKTY ({page.items.length}/{capacity})</span><Button size="small" onClick={onOpenPicker} disabled={page.items.length >= capacity}><Plus size={14}/> Dodaj</Button></div><div className="slot-list">{Array.from({ length: capacity }, (_, index) => { const item = page.items.find((value) => value.slotKey === slotKey(index)); return <div className={`slot-row ${item ? 'has-product' : ''}`} key={index} draggable={Boolean(item)} onDragStart={(event) => { if (item) event.dataTransfer.setData('text/plain', String(index)) }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const from = Number(event.dataTransfer.getData('text/plain')); if (Number.isInteger(from)) void onMoveItem(from, index) }}><span className="slot-number">{String(index + 1).padStart(2, '0')}</span>{item && <ProductThumbnail product={{ ...item.product, image: item.overrides.customImage || item.product.image }}/>}<button className="slot-select" onClick={() => item ? onSelectItem(item.id) : onOpenPicker()}><strong>{item ? item.overrides.displayName || item.product.name : 'Puste miejsce'}</strong>{item && <small>{item.product.code}</small>}</button></div> })}</div></div>
    </>}
    <div className="setting-block"><Field label={fullImage ? 'Grafika całej strony' : 'Tło strony'}><select className="input" value={configString(page, imageKey)} onChange={(event) => updateConfig(imageKey, event.target.value)}><option value="">{page.pageType === 'COVER' ? 'Domyślna okładka' : 'Bez grafiki'}</option>{mediaOptions('backgrounds').map((asset) => <option value={asset.url} key={asset.id}>{asset.originalFilename}</option>)}</select></Field><Button size="small" variant="secondary" onClick={() => void onUpload('backgrounds', imageKey)}>Dodaj grafikę</Button></div>
    {productPage && <><div className="setting-block"><Field label="Logo marki"><select className="input" value={configString(page, 'brandLogo')} onChange={(event) => updateConfig('brandLogo', event.target.value)}><option value="">Bez logo</option>{mediaOptions('brands').map((asset) => <option value={asset.url} key={asset.id}>{asset.originalFilename}</option>)}</select></Field><Button size="small" variant="secondary" onClick={() => void onUpload('logos', 'brandLogo')}>Dodaj logo</Button></div><div className="setting-block">{[['showEan', 'Pokaż EAN'], ['showUnit', 'Pokaż jednostkę'], ['showBox', 'Pokaż opakowanie'], ['showCode', 'Pokaż kod ERP']].map(([key, label]) => <label className="check-row" key={key}><input type="checkbox" checked={key === 'showCode' ? page.configuration[key] === true : page.configuration[key] !== false} onChange={(event) => updateConfig(key, event.target.checked)}/><span>{label}</span></label>)}</div></>}
    {page.pageType === 'PROMOTION' && <div className="setting-block"><Field label="Adres sklepu ezamshop"><ConfigText key={`${page.id}:url`} value={configString(page, 'url')} onSave={(value) => updateConfig('url', value)}/></Field></div>}
    {page.pageType === 'CONTACTS' && <><div className="setting-block"><Field label="Oddziały (jeden w wierszu)"><ConfigText key={`${page.id}:branches`} multiline value={configString(page, 'branches')} onSave={(value) => updateConfig('branches', value)}/></Field></div><div className="setting-block"><Field label="Telefony (jeden w wierszu)"><ConfigText key={`${page.id}:phones`} multiline value={configString(page, 'phones')} onSave={(value) => updateConfig('phones', value)}/></Field></div></>}
    {!fixed.has(page.pageType) && <div className="page-actions"><button onClick={() => void onDuplicate()}><Copy size={15}/> Duplikuj</button><button className="delete-page" onClick={() => void onDelete()}><Trash2 size={16}/> Usuń stronę</button></div>}
  </div>
}

function ConfigText({ value, onSave, multiline = false }: { value: string; onSave: (value: string) => void; multiline?: boolean }) {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])
  return multiline ? <textarea className="input page-textarea" value={text} onChange={(event) => setText(event.target.value)} onBlur={() => { if (text !== value) onSave(text) }}/> : <Input value={text} onChange={(event) => setText(event.target.value)} onBlur={() => { if (text !== value) onSave(text) }}/>
}
