import { useEffect, useState } from 'react'
import { ImagePlus, Images, Plus } from 'lucide-react'
import type { MediaAsset } from '../../../../shared/types'
import { Button, Card, EmptyState } from '../../components/ui'

export function MediaView() {
  const [items, setItems] = useState<MediaAsset[]>([])
  const [error, setError] = useState('')
  const reload = () => window.lechtom.media.list().then(setItems)
  useEffect(() => { void reload() }, [])
  const upload = async () => { try { await window.lechtom.media.selectFile('products'); await reload(); setError('') } catch (e) { setError((e as Error).message) } }
  return <><div className="page-heading"><div><span className="eyebrow">ZASOBY / PLIKI</span><h1>Media</h1><p>Grafiki produktów, logotypy i tła katalogów.</p></div><Button onClick={() => void upload()}><Plus size={17}/> Dodaj grafikę</Button></div>{error && <p className="form-error">{error}</p>}<Card className="media-card">{items.length ? <div className="media-grid">{items.map((item) => <div className="media-tile" key={item.id}><div className="media-preview"><img src={item.url} alt={item.originalFilename}/></div><strong title={item.originalFilename}>{item.originalFilename}</strong><small>{item.width} × {item.height} · {Math.round(item.fileSize / 1024)} KB</small></div>)}</div> : <EmptyState icon={<Images size={30}/>} title="Biblioteka jest pusta" description="Dodaj zdjęcia produktów lub logotypy. Pliki będą przechowywane na dysku aplikacji." action={<Button onClick={() => void upload()}><ImagePlus size={16}/> Wybierz grafikę</Button>}/>}</Card></>
}
