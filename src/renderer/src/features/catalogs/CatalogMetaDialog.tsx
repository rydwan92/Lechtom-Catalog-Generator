import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import type { Catalog, CatalogInput } from '../../../../shared/types'
import { catalogInputSchema } from '../../../../shared/schemas'
import { Button, Field, Input } from '../../components/ui'

export function CatalogMetaDialog({ catalog, onClose, onSaved }: { catalog: Catalog; onClose: () => void; onSaved: () => void }) {
  const [error, setError] = useState('')
  const { register, handleSubmit } = useForm<CatalogInput>({ resolver: zodResolver(catalogInputSchema), defaultValues: { id: catalog.id, name: catalog.name, title: catalog.title, subtitle: catalog.subtitle, validFrom: catalog.validFrom, validTo: catalog.validTo } })
  const save = handleSubmit(async (data) => { try { await window.lechtom.catalog.save({ ...data, validFrom: data.validFrom || null, validTo: data.validTo || null }); onSaved(); onClose() } catch (e) { setError((e as Error).message) } })
  return <div className="modal-backdrop" onClick={onClose}><div className="modal" onClick={(e) => e.stopPropagation()}><div className="modal-heading"><div><span className="eyebrow">KATALOG</span><h2>Edytuj dane katalogu</h2></div></div><form onSubmit={save}><Field label="Nazwa robocza"><Input {...register('name')} /></Field><Field label="Tytuł na okładce"><Input {...register('title')} /></Field><Field label="Podtytuł"><Input {...register('subtitle')} /></Field><div className="form-grid"><Field label="Ważny od"><Input type="date" {...register('validFrom')} /></Field><Field label="Ważny do"><Input type="date" {...register('validTo')} /></Field></div>{error && <p className="form-error">{error}</p>}<div className="modal-actions"><Button type="button" variant="secondary" onClick={onClose}>Anuluj</Button><Button type="submit">Zapisz zmiany</Button></div></form></div></div>
}
