import React, { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { usePhotos } from '../context/PhotoContext'

// ─── Contador animado de 3 dígitos ─────────────────────────
function AnimatedCount({ value }) {
  const ref     = useRef(null)
  const prevRef = useRef(value)

  useEffect(() => {
    const from = prevRef.current
    const to   = value
    if (from === to || !ref.current) return
    const obj = { v: from }
    const tw  = gsap.to(obj, {
      v: to,
      duration: 0.8,
      ease: 'power3.out',
      onUpdate: () => {
        if (ref.current) ref.current.textContent = String(Math.round(obj.v)).padStart(3, '0')
      },
    })
    prevRef.current = to
    return () => tw.kill()
  }, [value])

  return <span ref={ref}>{String(value).padStart(3, '0')}</span>
}

export default function Header({ ready, dark, onToggleDark, page, onPageChange }) {
  const { setUploadModalOpen, photos } = usePhotos()
  const titleRef     = useRef(null)
  const titleWrapRef = useRef(null)
  const metaRef      = useRef(null)
  const navRef       = useRef(null)
  const pageNavRef   = useRef(null)
  const indicatorRef = useRef(null)
  const indicatorInitRef = useRef(false)

  // ── Entrada animada ───────────────────────────────────────
  useEffect(() => {
    if (!ready) return
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.fromTo(navRef.current,   { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.5 })
      .fromTo(titleRef.current, { yPercent: 108, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.0 }, '-=0.05')
      .fromTo(metaRef.current,  { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.3')
  }, [ready])

  // ── Parallax sutil del título PRICK siguiendo el cursor ──
  useEffect(() => {
    if (!ready) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const el = titleRef.current
    if (!el) return

    const onMove = (e) => {
      const w = window.innerWidth, h = window.innerHeight
      const x = (e.clientX / w - 0.5) * 2  // -1..1
      const y = (e.clientY / h - 0.5) * 2
      gsap.to(el, {
        x:           x * -10,
        y:           y * -5,
        skewX:       x * 0.6,
        duration:    0.8,
        ease:        'power2.out',
        overwrite:   'auto',
      })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [ready])

  // ── Indicador deslizante en la nav de páginas ────────────
  useEffect(() => {
    if (!ready) return
    if (!pageNavRef.current || !indicatorRef.current) return

    const move = () => {
      const active = pageNavRef.current.querySelector(`[data-page="${page}"]`)
      if (!active) return
      const r  = active.getBoundingClientRect()
      const nr = pageNavRef.current.getBoundingClientRect()
      if (!indicatorInitRef.current) {
        gsap.set(indicatorRef.current, { x: r.left - nr.left, width: r.width, opacity: 0 })
        gsap.to(indicatorRef.current,  { opacity: 1, duration: 0.4, delay: 0.4 })
        indicatorInitRef.current = true
      } else {
        gsap.to(indicatorRef.current, {
          x: r.left - nr.left, width: r.width,
          duration: 0.55, ease: 'power3.out',
        })
      }
    }

    move()
    window.addEventListener('resize', move)
    return () => window.removeEventListener('resize', move)
  }, [page, ready])

  const NAV_PAGES = [
    { id: 'gallery',  label: 'Archivo' },
    { id: 'map',      label: 'Mapa'    },
    { id: 'timeline', label: 'Tiempo'  },
  ]

  return (
    <header className="w-full">
      {/* Barra superior */}
      <div ref={navRef} className="flex items-center justify-between px-8 pt-8 pb-0" style={{ opacity: 0 }}>
        {/* Wordmark */}
        <span className="text-meta select-none" style={{ color: 'var(--c-ink-dim)', letterSpacing: '0.30em' }}>
          PRICK &nbsp;/ {new Date().getFullYear()}
        </span>

        <nav className="flex items-center gap-8">
          <span className="text-meta" style={{ color: 'var(--c-ink-dim)' }}>
            <AnimatedCount value={photos.length} />&nbsp;fotogramas
          </span>

          {/* Toggle tema */}
          <button
            onClick={onToggleDark}
            aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="text-meta transition-opacity"
            style={{ color: 'var(--c-ink-dim)', lineHeight: 1 }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--c-ink)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--c-ink-dim)')}
          >
            <span className="theme-icon" />
          </button>

          {/* CTA añadir */}
          <button
            onClick={() => setUploadModalOpen(true)}
            data-magnetic
            className="text-meta transition-opacity"
            style={{ backgroundColor: 'var(--c-ink)', color: 'var(--c-surface)', padding: '0.45rem 1.1rem', letterSpacing: '0.20em' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.72')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            + Añadir
          </button>
        </nav>
      </div>

      {/* Título */}
      <div ref={titleWrapRef} className="px-8 pt-4 pb-2 overflow-hidden">
        <h1
          ref={titleRef}
          className="font-bold leading-none select-none"
          style={{ fontSize: 'clamp(4.5rem, 17vw, 17rem)', letterSpacing: '-0.045em', color: 'var(--c-ink)', opacity: 0, willChange: 'transform' }}
        >
          PRICK
        </h1>
      </div>

      {/* Subtítulo + navegación de páginas */}
      <div ref={metaRef} className="flex flex-wrap items-baseline justify-between gap-3 px-8 pb-6" style={{ opacity: 0 }}>
        <p
          className="font-medium"
          style={{ fontSize: 'clamp(0.7rem, 1.8vw, 1rem)', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--c-ink)', opacity: 0.55 }}
        >
          Abahyomi &amp; Alexandra
        </p>

        {/* Navegación Archivo / Mapa / Tiempo + Imprimir */}
        <nav ref={pageNavRef} className="flex items-center gap-6 relative" style={{ paddingBottom: 6 }}>
          {/* Indicador deslizante */}
          <span
            ref={indicatorRef}
            aria-hidden="true"
            style={{
              position:        'absolute',
              bottom:          0,
              left:            0,
              height:          1,
              backgroundColor: 'var(--c-ink)',
              pointerEvents:   'none',
              willChange:      'transform, width',
            }}
          />

          {NAV_PAGES.map(({ id, label }) => (
            <button
              key={id}
              data-page={id}
              onClick={() => onPageChange(id)}
              className="text-meta transition-all"
              style={{
                color:         page === id ? 'var(--c-ink)' : 'var(--c-ink-dim)',
                paddingBottom: '2px',
                letterSpacing: '0.22em',
              }}
              onMouseEnter={e => { if (page !== id) e.currentTarget.style.color = 'rgba(var(--c-ink-rgb), 0.7)' }}
              onMouseLeave={e => { if (page !== id) e.currentTarget.style.color = 'var(--c-ink-dim)' }}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => window.print()}
            className="text-meta transition-opacity hover:opacity-50"
            style={{ color: 'var(--c-ink-dim)' }}
            title="Imprimir / Guardar como PDF"
          >
            ⎙
          </button>
        </nav>
      </div>
    </header>
  )
}
