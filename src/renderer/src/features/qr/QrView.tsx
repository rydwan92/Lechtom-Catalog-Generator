import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, QrCode, Trash2 } from 'lucide-react'
import type { QrCodeRecord } from '../../../../shared/types'
import { qrInputSchema } from '../../../../shared/schemas'
import { Button, Card, EmptyState, Field, Input } from '../../components/ui'

type QrInput = { name: string; url: string; label: string }
export function QrView() {
  const [items, setItems] = useState<QrCodeRecord[]>([])
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const { register, handleSubmit, reset, formState: { errors } } = useForm<QrInput>({ resolver: zodResolver(qrInputSchema), defaultValues: { name: '', url: '', label: '' } })
  const reload = () => window.lechtom.qr.list().then(setItems)
  useEffect(() => { void reload() }, [])
  const create = handleSubmit(async (input) => { try { await window.lechtom.qr.create(input); reset(); setCreating(false); await reload() } catch (e) { setError((e as Error).message) } })
  return <><div className="page-heading"><div><span className="eyebrow">ZASOBY / KODY</span><h1>Kody QR</h1><p>Twórz kody prowadzące do stron i ofert online.</p></div><Button onClick={() => setCreating(true)}><Plus size={17}/> Nowy kod QR</Button></div><Card className="media-card">{items.length ? <div className="qr-grid">{items.map((item) => <div className="qr-tile" key={item.id}><div className="qr-image" dangerouslySetInnerHTML={{ __html: item.svg }}/><strong>{item.name}</strong><p>{item.label}</p><small>{item.url}</small><button className="icon-button" onClick={() => void window.lechtom.qr.delete(item.id).then(reload)} title="Usuń kod"><Trash2 size={16}/></button></div>)}</div> : <EmptyState icon={<QrCode size={30}/>} title="Brak kodów QR" description="Utwórz kod, który później przypniesz do strony katalogu." action={<Button onClick={() => setCreating(true)}><Plus size={16}/> Nowy kod QR</Button>}/>}</Card>{creating && <div className="modal-backdrop" onClick={() => setCreating(false)}><div className="modal" onClick={(e) => e.stopPropagation()}><div className="modal-heading"><div><span className="eyebrow">NOWY ZASÓB</span><h2>Utwórz kod QR</h2></div></div><form onSubmit={create}><Field label="Nazwa"><Input {...register('name')} placeholder="np. Sklep internetowy"/>{errors.name && <small className="form-error">Podaj nazwę</small>}</Field><Field label="Adres URL"><Input {...register('url')} placeholder="https://..."/>{errors.url && <small className="form-error">Podaj poprawny adres URL</small>}</Field><Field label="Etykieta"><Input {...register('label')} placeholder="np. Zamawiaj towar online!"/></Field>{error && <p className="form-error">{error}</p>}<div className="modal-actions"><Button type="button" variant="secondary" onClick={() => setCreating(false)}>Anuluj</Button><Button type="submit">Utwórz kod QR</Button></div></form></div></div>}</>
}
