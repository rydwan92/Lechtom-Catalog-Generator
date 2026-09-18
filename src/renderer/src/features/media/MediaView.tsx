import { useEffect, useState } from 'react'
import { ImagePlus, Images, Plus } from 'lucide-react'
import type { MediaAsset } from '../../../../shared/types'
import { Button, Card, EmptyState } from '../../components/ui'

export function MediaView() {
  const [items, setItems] = useState<MediaAsset[]>([])
  const [error, setError] = useState('')
  const reload = () => window.lechtom.media.list().then(setItems)
  useEffect(() => { void reload() }, [])
  const upload = async (kind: 'products' | 'logos' | 'backgrounds') => { try { await window.lechtom.media.selectFile(kind); await reload(); setError('') } catch (e) { setError((e as Error).message) } }
  return <><div className="page-heading"><div><span className="eyebrow">ZASOBY / PLIKI</span><h1>Media</h1><p>Grafiki produktów, logotypy i tła katalogów.</p></div><div className="media-actions"><Button variant="secondary" onClick={() => void upload('logos')}><Plus size={17}/> Logo</Button><Button variant="secondary" onClick={() => void upload('backgrounds')}><Plus size={17}/> Tło</Button><Button onClick={() => void upload('products')}><Plus size={17}/> Grafika produktu</Button></div></div>{error && <p className="form-error">{error}</p>}<Card className="media-card">{items.length ? <div className="media-grid">{items.map((item) => <div className="media-tile" key={item.id}><div className="media-preview"><img src={item.url} alt={item.originalFilename}/></div><strong title={item.originalFilename}>{item.originalFilename}</strong><small>{item.width} × {item.height} · {Math.round(item.fileSize / 1024)} KB</small></div>)}</div> : <EmptyState icon={<Images size={30}/>} title="Biblioteka jest pusta" description="Dodaj grafiki, logotypy lub tła. Pliki będą przechowywane na dysku." action={<Button onClick={() => void upload('backgrounds')}><ImagePlus size={16}/> Wybierz grafikę</Button>}/>}</Card></>
}
