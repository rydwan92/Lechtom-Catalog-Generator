import { useEffect, useState } from 'react'
import { ImageOff } from 'lucide-react'
import { clsx } from 'clsx'

export function ProductImage({ src, alt, className, eager = false }: { src: string | null | undefined; alt: string; className?: string; eager?: boolean }) {
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null)
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!src || loadedUrl === src || failedUrl === src) return
    const timer = setTimeout(() => setFailedUrl(src), 8000)
    return () => clearTimeout(timer)
  }, [src, loadedUrl, failedUrl])
  const failed = !src || failedUrl === src
  const loading = Boolean(src && loadedUrl !== src && !failed)
  return <span className={clsx('product-picture', className, loading && 'is-loading', failed && 'is-missing')}>
    {loading && <span className="product-picture-loader" aria-hidden="true"/>}
    {failed && <span className="product-picture-fallback"><ImageOff size={20} strokeWidth={1.6}/><span>Brak zdjęcia</span></span>}
    {src && !failed && <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" fetchPriority={eager ? 'auto' : 'low'} onLoad={() => setLoadedUrl(src)} onError={() => setFailedUrl(src)} className={loadedUrl === src ? 'is-ready' : ''}/>}
  </span>
}
