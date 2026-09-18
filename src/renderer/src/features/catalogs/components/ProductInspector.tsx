import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, RotateCcw, Trash2, Upload } from 'lucide-react'
import type { CatalogPageItem } from '../../../../../shared/types'
import { ProductImage } from '../../../components/products/ProductImage'
import { Button, Field, Input } from '../../../components/ui'

type Overrides = CatalogPageItem['overrides']
const fieldLabels: { key: string; label: string }[] = [
  { key: 'ean', label: 'EAN' }, { key: 'code', label: 'Kod ERP' }, { key: 'unit', label: 'Jednostka / waga' }, { key: 'box', label: 'Opakowanie' }
]

export function ProductInspector({ item, onBack, onUpdate, onRemove }: { item: CatalogPageItem; onBack: () => void; onUpdate: (next: CatalogPageItem) => Promise<void>; onRemove: () => Promise<void> }) {
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [overrides, setOverrides] = useState(item.overrides)
  const currentItem = useRef(item)
  const saveQueue = useRef<Promise<void>>(Promise.resolve())
  const pending = useRef(0)
  useEffect(() => { setStatus('') }, [item.id])
  const update = async (patch: Partial<Overrides>) => {
    const next = { ...currentItem.current, overrides: { ...currentItem.current.overrides, ...patch } }
    currentItem.current = next
    setOverrides(next.overrides)
    pending.current += 1
    setBusy(true)
    setStatus('Zapisywanie...')
    try { saveQueue.current = saveQueue.current.catch(() => undefined).then(() => onUpdate(next)); await saveQueue.current; setStatus('Zapisano w projekcie') }
    catch (reason) { setStatus((reason as Error).message || 'Nie udało się zapisać zmian') }
    finally { pending.current -= 1; if (pending.current === 0) setBusy(false) }
  }
  const upload = async () => {
    try { const asset = await window.lechtom.media.selectFile('products'); if (asset) await update({ customImage: asset.url }) }
    catch (reason) { setStatus((reason as Error).message) }
  }
  const toggleField = (key: string, visible: boolean) => {
    const hiddenFields = visible ? currentItem.current.overrides.hiddenFields.filter((value) => value !== key) : [...new Set([...currentItem.current.overrides.hiddenFields, key])]
    void update({ hiddenFields })
  }
  return <>
    <div className="editor-panel-head"><div><strong>Produkt</strong><small>Slot {item.slotKey.slice(-2)} · {item.product.code}</small></div><button className="inspector-back" onClick={onBack} aria-label="Wróć do ustawień strony"><ArrowLeft size={16}/></button></div>
    <div className="editor-settings inspector-settings">
      <ProductImage src={overrides.customImage || item.product.image} alt={item.product.name} className="inspector-picture" eager/>
      <strong className="inspector-product-name">{item.product.name}</strong>
      <p className="inspector-product-meta">Kod ERP: {item.product.code}{item.product.ean && <> · EAN: {item.product.ean}</>}</p>
      <div className="inspector-image-actions"><Button size="small" variant="secondary" onClick={() => void upload()} disabled={busy}><Upload size={14}/> Wgraj zdjęcie</Button>{overrides.customImage && <Button size="small" variant="ghost" onClick={() => void update({ customImage: null })} disabled={busy}><RotateCcw size={14}/> Zdjęcie z ERP</Button>}</div>
      <div className="setting-block"><OverrideInput key={`${item.id}:name`} label="Nazwa w katalogu" value={overrides.displayName ?? ''} placeholder={item.product.name} onSave={(value) => update({ displayName: value || null })}/><OverrideInput key={`${item.id}:weight`} label="Waga / jednostka" value={overrides.weightLabel ?? ''} placeholder={item.product.unit.displayUnit} onSave={(value) => update({ weightLabel: value || null })}/><OverrideInput key={`${item.id}:box`} label="Ilość w opakowaniu" value={overrides.boxLabel ?? ''} placeholder={item.product.itemsPerBox ? `${item.product.itemsPerBox} szt.` : 'np. 12 szt.'} onSave={(value) => update({ boxLabel: value || null })}/></div>
      <div className="setting-block"><span className="setting-label">POLA NA KARCIE PRODUKTU</span>{fieldLabels.map(({ key, label }) => <label className="check-row" key={key}><input type="checkbox" checked={!overrides.hiddenFields.includes(key)} onChange={(event) => toggleField(key, event.target.checked)}/><span>{label}</span></label>)}</div>
      <div className="inspector-footer"><span className={status.startsWith('Nie') ? 'form-error' : ''} role="status">{status}</span><button className="delete-page" onClick={() => void onRemove()} disabled={busy}><Trash2 size={16}/> Usuń produkt ze strony</button></div>
    </div>
  </>
}

function OverrideInput({ label, value, placeholder, onSave }: { label: string; value: string; placeholder: string; onSave: (value: string) => Promise<void> }) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  return <Field label={label}><Input value={draft} placeholder={placeholder} onChange={(event) => setDraft(event.target.value)} onBlur={() => { if (draft !== value) void onSave(draft.trim()) }} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur() }}/></Field>
}
