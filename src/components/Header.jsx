import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { usePhotos } from '../context/PhotoContext'

export default function Header({ ready, dark, onToggleDark }) {
  const { setUploadModalOpen, photos } = usePhotos()
  const titleRef = useRef(null)
  const metaRef  = useRef(null)
  const navRef   = useRef(null)

  useEffect(() => {
    if (!ready) return

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    tl.fromTo(navRef.current,
        { opacity: 0, y: -6 },
        { opacity: 1, y: 0, duration: 0.55 }
      )
      .fromTo(titleRef.current,
        { yPercent: 105, opacity: 0 },
        { yPercent: 0,   opacity: 1, duration: 1.0 },
        '-=0.1'
      )
      .fromTo(metaRef.current,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.55 },
        '-=0.25'
      )
  }, [ready])

  return (
    <header className="w-full">
      {/* Nav */}
      <div
        ref={navRef}
        className="flex items-center justify-between px-8 pt-7 pb-2"
        style={{ opacity: 0 }}
      >
        <span className="text-meta" style={{ color: 'var(--c-ink-dim)' }}>
          {new Date().getFullYear()}
        </span>

        <div className="flex items-center gap-7">
          <span className="text-meta" style={{ color: 'var(--c-ink-dim)' }}>
            {photos.length} fotogramas
          </span>

          <button
            onClick={onToggleDark}
            aria-label="Cambiar tema"
            className="text-meta transition-opacity hover:opacity-100"
            style={{ color: 'var(--c-ink-dim)' }}
          >
            <span className="theme-icon" />
          </button>

          <button
            onClick={() => setUploadModalOpen(true)}
            className="text-meta text-surface bg-ink px-4 py-2 hover:opacity-70 transition-opacity"
            style={{ letterSpacing: '0.22em' }}
          >
            + Añadir
          </button>
        </div>
      </div>

      {/* Título */}
      <div className="px-8 pt-5 pb-3 overflow-hidden">
        <h1
          ref={titleRef}
          className="font-bold leading-none select-none text-ink"
          style={{
            fontSize:      'clamp(5rem, 18vw, 18rem)',
            letterSpacing: '-0.04em',
            opacity:       0,
          }}
        >
          PRICK
        </h1>
      </div>

      {/* Subtítulo */}
      <div
        ref={metaRef}
        className="flex flex-wrap items-end justify-between gap-4 px-8 pb-10"
        style={{ opacity: 0 }}
      >
        <div>
          <p
            className="font-medium leading-tight text-ink"
            style={{ fontSize: 'clamp(0.75rem, 2vw, 1.1rem)', letterSpacing: '0.18em', textTransform: 'uppercase' }}
          >
            Abahyomi &amp; Alexandra
          </p>
        </div>
        <p className="text-meta" style={{ color: 'var(--c-ink-dim)' }}>
          La memoria hecha imagen.
        </p>
      </div>
    </header>
  )
}
