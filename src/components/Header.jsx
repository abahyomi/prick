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
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: 0.5 }
      )
      .fromTo(titleRef.current,
        { yPercent: 108, opacity: 0 },
        { yPercent: 0,   opacity: 1, duration: 1.0 },
        '-=0.05'
      )
      .fromTo(metaRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.6 },
        '-=0.3'
      )
  }, [ready])

  const count = photos.length.toString().padStart(3, '0')

  return (
    <header className="w-full">
      {/* Barra superior */}
      <div
        ref={navRef}
        className="flex items-center justify-between px-8 pt-8 pb-0"
        style={{ opacity: 0 }}
      >
        {/* Wordmark pequeño */}
        <span
          className="text-meta select-none"
          style={{ color: 'var(--c-ink-dim)', letterSpacing: '0.30em' }}
        >
          PRICK &nbsp;/ {new Date().getFullYear()}
        </span>

        <nav className="flex items-center gap-8">
          <span className="text-meta" style={{ color: 'var(--c-ink-dim)' }}>
            {count}&nbsp;fotogramas
          </span>

          {/* Toggle tema */}
          <button
            onClick={onToggleDark}
            aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="text-meta transition-opacity"
            style={{ color: 'var(--c-ink-dim)', lineHeight: 1 }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--c-ink)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--c-ink-dim)'}
          >
            <span className="theme-icon" />
          </button>

          {/* CTA añadir */}
          <button
            onClick={() => setUploadModalOpen(true)}
            className="text-meta transition-opacity"
            style={{
              backgroundColor: 'var(--c-ink)',
              color:           'var(--c-surface)',
              padding:         '0.45rem 1.1rem',
              letterSpacing:   '0.20em',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.72')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            + Añadir
          </button>
        </nav>
      </div>

      {/* Título principal */}
      <div className="px-8 pt-4 pb-2 overflow-hidden">
        <h1
          ref={titleRef}
          className="font-bold leading-none select-none"
          style={{
            fontSize:      'clamp(4.5rem, 17vw, 17rem)',
            letterSpacing: '-0.045em',
            color:         'var(--c-ink)',
            opacity:       0,
          }}
        >
          PRICK
        </h1>
      </div>

      {/* Subtítulo */}
      <div
        ref={metaRef}
        className="flex flex-wrap items-baseline justify-between gap-3 px-8 pb-12"
        style={{ opacity: 0 }}
      >
        <p
          className="font-medium"
          style={{
            fontSize:      'clamp(0.7rem, 1.8vw, 1rem)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color:         'var(--c-ink)',
            opacity:       0.55,
          }}
        >
          Abahyomi &amp; Alexandra
        </p>
        <p className="text-meta" style={{ color: 'var(--c-ink-dim)' }}>
          La memoria hecha imagen.
        </p>
      </div>
    </header>
  )
}
