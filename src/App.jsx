import React, { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PhotoProvider, usePhotos } from './context/PhotoContext'
import { ToastProvider, useToast }  from './context/ToastContext'
import Header      from './components/Header'
import Gallery     from './components/Gallery'
import UploadModal from './components/UploadModal'
import PhotoDetail from './components/PhotoDetail'
import Loader      from './components/Loader'
import FilmGrain   from './components/FilmGrain'
import Cursor      from './components/Cursor'
import Toast       from './components/Toast'
import { useDarkMode } from './hooks/useDarkMode'

gsap.registerPlugin(ScrollTrigger)

// ── Botón flotante fijo "+ Añadir" ───────────────────────
function FloatingAdd({ ready }) {
  const { setUploadModalOpen } = usePhotos()
  const btnRef = useRef(null)

  useEffect(() => {
    if (!ready) return
    gsap.fromTo(btnRef.current,
      { opacity: 0, scale: 0.75 },
      { opacity: 1, scale: 1, duration: 0.55, delay: 0.9, ease: 'back.out(1.8)' }
    )
  }, [ready])

  return (
    <button
      ref={btnRef}
      onClick={() => setUploadModalOpen(true)}
      aria-label="Añadir fotograma"
      style={{
        position:        'fixed',
        bottom:          28,
        right:           24,
        zIndex:          45,
        opacity:         0,
        width:           42,
        height:          42,
        border:          '1px solid var(--c-ink)',
        backgroundColor: 'var(--c-surface)',
        color:           'var(--c-ink)',
        fontSize:        '1.25rem',
        fontWeight:      300,
        lineHeight:      1,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        transition:      'background-color 0.18s, color 0.18s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = 'var(--c-ink)'
        e.currentTarget.style.color           = 'var(--c-surface)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = 'var(--c-surface)'
        e.currentTarget.style.color           = 'var(--c-ink)'
      }}
    >
      +
    </button>
  )
}

function ScrollBar() {
  const barRef = useRef(null)
  useEffect(() => {
    gsap.to(barRef.current, {
      scaleX: 1, ease: 'none',
      scrollTrigger: { start: 'top top', end: 'bottom bottom', scrub: 0 },
    })
  }, [])
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

// Inner app tiene acceso al ToastContext
function AppInner() {
  const [dark, setDark] = useDarkMode()
  const [ready, setReady] = useState(false)
  const { toast, clearToast } = useToast()

  return (
    <PhotoProvider>
      <FilmGrain />
      <Cursor />
      <ScrollBar />

      {!ready && <Loader onComplete={() => setReady(true)} />}

      <div className="min-h-screen bg-surface text-ink">
        <Header ready={ready} dark={dark} onToggleDark={() => setDark(d => !d)} />
        <main><Gallery /></main>
        <UploadModal />
        <PhotoDetail />
      </div>

      <FloatingAdd ready={ready} />

      {/* Toast global — éxito / error */}
      {toast && (
        <Toast
          key={toast.key}
          message={toast.message}
          type={toast.type}
          onDone={clearToast}
        />
      )}
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
