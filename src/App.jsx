import React, { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PhotoProvider } from './context/PhotoContext'
import Header    from './components/Header'
import Gallery   from './components/Gallery'
import UploadModal from './components/UploadModal'
import PhotoDetail from './components/PhotoDetail'
import Loader    from './components/Loader'
import FilmGrain from './components/FilmGrain'
import Cursor    from './components/Cursor'
import { useDarkMode } from './hooks/useDarkMode'

gsap.registerPlugin(ScrollTrigger)

// Thin scroll-progress bar along the top
function ScrollBar() {
  const barRef = useRef(null)

  useEffect(() => {
    gsap.to(barRef.current, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: {
        start: 'top top',
        end:   'bottom bottom',
        scrub: 0,
      },
    })
  }, [])

  return (
    <div
      ref={barRef}
      style={{
        position:        'fixed',
        top:             0,
        left:            0,
        height:          '1px',
        width:           '100%',
        backgroundColor: 'var(--c-ink)',
        opacity:         0.2,
        transformOrigin: 'left center',
        scaleX:          0,
        zIndex:          50,
        pointerEvents:   'none',
      }}
    />
  )
}

export default function App() {
  const [dark, setDark] = useDarkMode()
  const [ready, setReady] = useState(false)

  return (
    <PhotoProvider>
      {/* Persistent layers */}
      <FilmGrain />
      <Cursor />
      <ScrollBar />

      {!ready && <Loader onComplete={() => setReady(true)} />}

      <div className="min-h-screen bg-surface text-ink">
        <Header ready={ready} dark={dark} onToggleDark={() => setDark((d) => !d)} />
        <main>
          <Gallery />
        </main>
        <UploadModal />
        <PhotoDetail />
      </div>
    </PhotoProvider>
  )
}
