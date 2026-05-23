import React, { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PhotoProvider, usePhotos } from './context/PhotoContext'
import { ToastProvider, useToast }  from './context/ToastContext'
import Header       from './components/Header'
import Gallery      from './components/Gallery'
import MapView      from './components/MapView'
import TimelineView from './components/TimelineView'
import UploadModal  from './components/UploadModal'
import PhotoDetail  from './components/PhotoDetail'
import Loader       from './components/Loader'
import FilmGrain    from './components/FilmGrain'
import Cursor       from './components/Cursor'
import Toast        from './components/Toast'
import MusicPlayer  from './components/MusicPlayer'
import PrintView    from './components/PrintView'
import { useDarkMode } from './hooks/useDarkMode'

gsap.registerPlugin(ScrollTrigger)

// ── Botón flotante "+ Añadir" ─────────────────────────────
function FloatingAdd({ ready, page }) {
  const { setUploadModalOpen } = usePhotos()
  const btnRef   = useRef(null)
  const innerRef = useRef(null)

  useEffect(() => {
    if (!ready) return
    gsap.fromTo(btnRef.current,
      { opacity: 0, scale: 0.75 },
      { opacity: 1, scale: 1, duration: 0.55, delay: 0.9, ease: 'back.out(1.8)' }
    )
  }, [ready])

  // Efecto magnético: el botón se desplaza ligeramente hacia el cursor
  useEffect(() => {
    if (!ready) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    if (page === 'map' || page === 'timeline') return
    const btn   = btnRef.current
    const inner = innerRef.current
    if (!btn || !inner) return

    const range = 90
    let active = false

    const onMove = (e) => {
      const r  = btn.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top  + r.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const d  = Math.sqrt(dx * dx + dy * dy)

      if (d < range) {
        const k = (1 - d / range) * 0.32
        gsap.to(btn,   { x: dx * k,       y: dy * k,       duration: 0.32, ease: 'power2.out' })
        gsap.to(inner, { x: dx * k * 0.4, y: dy * k * 0.4, duration: 0.32, ease: 'power2.out' })
        active = true
      } else if (active) {
        gsap.to(btn,   { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, 0.55)' })
        gsap.to(inner, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, 0.55)' })
        active = false
      }
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [ready, page])

  // No mostrar en mapa ni timeline
  if (page === 'map' || page === 'timeline') return null

  return (
    <button
      ref={btnRef}
      onClick={() => setUploadModalOpen(true)}
      aria-label="Añadir fotograma"
      style={{
        position: 'fixed', bottom: 28, right: 24, zIndex: 45,
        opacity: 0, width: 42, height: 42,
        border: '1px solid var(--c-ink)',
        backgroundColor: 'var(--c-surface)', color: 'var(--c-ink)',
        fontSize: '1.25rem', fontWeight: 300, lineHeight: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background-color 0.18s, color 0.18s',
        willChange: 'transform',
      }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor='var(--c-ink)'; e.currentTarget.style.color='var(--c-surface)' }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor='var(--c-surface)'; e.currentTarget.style.color='var(--c-ink)' }}
    >
      <span ref={innerRef} style={{ display: 'block', willChange: 'transform' }}>+</span>
    </button>
  )
}

// ── Barra de progreso de scroll ───────────────────────────
function ScrollBar({ page }) {
  const barRef = useRef(null)
  useEffect(() => {
    if (page === 'map') return
    const st = ScrollTrigger.create({
      start: 'top top', end: 'bottom bottom',
      onUpdate: self => { if (barRef.current) gsap.set(barRef.current, { scaleX: self.progress }) },
    })
    return () => st.kill()
  }, [page])

  if (page === 'map') return null
  return (
    <div ref={barRef} style={{
      position: 'fixed', top: 0, left: 0,
      height: '1px', width: '100%',
      backgroundColor: 'var(--c-ink)', opacity: 0.2,
      transformOrigin: 'left center', scaleX: 0,
      zIndex: 50, pointerEvents: 'none',
    }} />
  )
}

// ── App interior ──────────────────────────────────────────
function AppInner() {
  const [dark, setDark] = useDarkMode()
  const [ready, setReady]   = useState(false)
  const [page,  setPage]    = useState('gallery') // 'gallery' | 'map'
  const { toast, clearToast } = useToast()

  return (
    <PhotoProvider>
      <FilmGrain />
      <Cursor />
      <ScrollBar page={page} />

      {!ready && <Loader onComplete={() => setReady(true)} />}

      <div className="min-h-screen bg-surface text-ink">
        <Header
          ready={ready}
          dark={dark}
          onToggleDark={() => setDark(d => !d)}
          page={page}
          onPageChange={setPage}
        />
        <main>
          {page === 'gallery'  && <Gallery />}
          {page === 'map'      && <MapView />}
          {page === 'timeline' && <TimelineView />}
        </main>
        <UploadModal />
        <PhotoDetail />
      </div>

      <FloatingAdd ready={ready} page={page} />
      <MusicPlayer />

      {toast && (
        <Toast key={toast.key} message={toast.message} type={toast.type} onDone={clearToast} />
      )}

      {/* Layout solo para imprimir — invisible en pantalla */}
      <PrintView />
    </PhotoProvider>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  )
}
