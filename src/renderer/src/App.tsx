import { useEffect, useState } from 'react'
import { Archive, BookOpen, Boxes, ChevronDown, CircleHelp, ContactRound, FileText, Images, LayoutDashboard, LayoutTemplate, QrCode, Settings2 } from 'lucide-react'
import { CatalogsView } from './features/catalogs/CatalogsView'
import { CatalogEditor } from './features/catalogs/CatalogEditor'
import { ProductsView } from './features/products/ProductsView'
import { SettingsView } from './features/settings/SettingsView'
import { MediaView } from './features/media/MediaView'
import { QrView } from './features/qr/QrView'
import { DashboardView } from './features/dashboard/DashboardView'
import { PrintView } from './features/catalogs/PrintView'
import { Card, EmptyState } from './components/ui'

type View = 'dashboard' | 'catalogs' | 'products' | 'manufacturers' | 'media' | 'templates' | 'qr' | 'contacts' | 'settings'
const nav: { key: View; label: string; icon: typeof Archive }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, { key: 'catalogs', label: 'Katalogi', icon: BookOpen }, { key: 'products', label: 'Produkty ERP', icon: Boxes }, { key: 'manufacturers', label: 'Producenci', icon: Archive }, { key: 'media', label: 'Media', icon: Images }, { key: 'templates', label: 'Szablony', icon: LayoutTemplate }, { key: 'qr', label: 'Kody QR', icon: QrCode }, { key: 'contacts', label: 'Kontakty', icon: ContactRound }, { key: 'settings', label: 'Ustawienia', icon: Settings2 }
]
export function App() {
  const [view, setView] = useState<View>('dashboard')
  const [catalogId, setCatalogId] = useState<string | null>(null)
  const [erpConfigured, setErpConfigured] = useState(false)
  useEffect(() => { void window.lechtom.erp.getConfig().then((x) => setErpConfigured(Boolean(x))).catch(() => setErpConfigured(false)) }, [view])
  const printId = location.hash.match(/^#\/print\/([a-f0-9-]+)$/)?.[1]
  if (printId) return <PrintView id={printId} />
  const selected = nav.find((item) => item.key === view)!
  return <div className="app-shell"><aside className="sidebar"><div className="sidebar-brand"><div className="brand-symbol">L<span>.</span></div><div><strong>LECHTOM</strong><small>CATALOG GENERATOR</small></div></div><div className="sidebar-label">WORKSPACE</div><nav className="sidebar-nav">{nav.map(({ key, label, icon: Icon }) => <button key={key} className={`nav-item ${view === key ? 'active' : ''}`} onClick={() => { setCatalogId(null); setView(key) }}><Icon size={18} strokeWidth={1.8} /><span>{label}</span>{key === 'catalogs' && <ChevronDown size={14} className="nav-chevron" />}</button>)}</nav><div className="sidebar-bottom"><div className="help-card"><CircleHelp size={18}/><strong>Centrum pomocy</strong><p>Twoje katalogi, produkty i materiały w jednym miejscu.</p></div><div className="sidebar-user"><div className="avatar">L</div><div><strong>LECHTOM</strong><small>Administrator</small></div><span className="user-dots">•••</span></div></div></aside><div className="main-shell"><header className="topbar"><div className="breadcrumbs"><span>Workspace</span><span className="bread-slash">/</span><strong>{catalogId ? 'Edytor katalogu' : selected.label}</strong></div><div className="topbar-right"><span className={`connection-pill ${erpConfigured ? 'is-connected' : ''}`}><span />{erpConfigured ? 'ERP skonfigurowany' : 'ERP niepodłączony'}</span><div className="top-avatar">L</div></div></header><main className={catalogId ? 'content content-editor' : 'content'}>{catalogId ? <CatalogEditor id={catalogId} onBack={() => setCatalogId(null)} /> : view === 'dashboard' ? <DashboardView openCatalogs={() => setView('catalogs')} openProducts={() => setView('products')} /> : view === 'catalogs' ? <CatalogsView onEdit={setCatalogId} /> : view === 'products' ? <ProductsView onSettings={() => setView('settings')} /> : view === 'settings' ? <SettingsView /> : view === 'media' ? <MediaView /> : view === 'qr' ? <QrView /> : <><div className="page-heading"><div><span className="eyebrow">LECHTOM / WORKSPACE</span><h1>{selected.label}</h1><p>Moduł przygotowany do rozbudowy w kolejnej iteracji.</p></div></div><Card><EmptyState icon={<FileText size={28}/>} title={`${selected.label} — w przygotowaniu`} description="W tej iteracji skupiamy się na produktach ERP, katalogach i eksporcie PDF." /></Card></>}</main></div></div>
}
