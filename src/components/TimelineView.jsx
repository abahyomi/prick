import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { gsap } from 'gsap'
import { usePhotos } from '../context/PhotoContext'

const MESES   = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const M_CORTO = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']

// ── Construir estructura de timeline ─────────────────────
function useTimeline(photos) {
  return useMemo(() => {
    const map = {}
    photos.forEach(p => {
      const d = new Date(p.date + 'T00:00:00')
      const y = d.getFullYear(), m = d.getMonth()
      const k = `${y}-${String(m + 1).padStart(2, '0')}`
      if (!map[k]) map[k] = { key: k, year: y, month: m, photos: [] }
      map[k].photos.push(p)
    })
    return Object.values(map).sort((a, b) =>
      b.year !== a.year ? b.year - a.year : b.month - a.month
    )
  }, [photos])
}

// ── Agrupar por día ───────────────────────────────────────
function groupByDay(photos) {
  const map = {}
  photos.forEach(p => {
    if (!map[p.date]) {
      const d = new Date(p.date + 'T00:00:00')
      map[p.date] = {
        date:   p.date,
        label:  d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase(),
        photos: [],
      }
    }
    map[p.date].photos.push(p)
  })
  return Object.values(map).sort((a, b) => b.date.localeCompare(a.date))
}

// ── Tarjeta de foto en tira ───────────────────────────────
function StripCard({ photo, delay, onClick }) {
  const ref    = useRef(null)
  const imgRef = useRef(null)

  useEffect(() => {
    gsap.fromTo(ref.current,
      { opacity: 0, x: 10, filter: 'blur(3px)' },
      { opacity: 1, x: 0, filter: 'blur(0px)',
        duration: 0.52, ease: 'power2.out', delay }
    )
  }, [delay])

  const onLoad = useCallback(e => e.target.classList.add('loaded'), [])

  return (
    <div
      ref={ref}
      onClick={() => onClick(photo)}
      style={{ width: 130, flexShrink: 0, cursor: 'pointer', opacity: 0 }}
      onMouseEnter={() => gsap.to(imgRef.current, { scale: 1.06, duration: 0.38, ease: 'power2.out' })}
      onMouseLeave={() => gsap.to(imgRef.current, { scale: 1,    duration: 0.45, ease: 'power2.inOut' })}
    >
      <div className="overflow-hidden aspect-[4/5] photo-placeholder relative">
        <img
          ref={imgRef}
          src={photo.thumb || photo.url}
          alt={photo.location}
          loading="lazy"
          onLoad={onLoad}
          className="lazy-fade w-full h-full object-cover grayscale absolute inset-0"
          style={{ willChange: 'transform' }}
        />
      </div>
      <p
        className="text-meta mt-2 truncate"
        style={{ color: 'var(--c-ink-dim)', maxWidth: 130 }}
      >
        {photo.location?.split(',')[0]}
      </p>
      {photo.time && (
        <p style={{ fontSize: '0.55rem', color: 'var(--c-ink-dim)', opacity: 0.4, marginTop: 2 }}>
          {photo.time.slice(0, 5)}
        </p>
      )}
    </div>
  )
}

// ── Panel de contenido del mes ────────────────────────────
function MonthPanel({ entry, onPhotoClick }) {
  const ref  = useRef(null)
  const days = useMemo(() => groupByDay(entry.photos), [entry.key])

  useEffect(() => {
    gsap.fromTo(ref.current,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.38, ease: 'power2.out' }
    )
  }, [])

  let globalIdx = 0

  return (
    <div ref={ref} style={{ opacity: 0 }}>
      {/* Encabezado del mes */}
      <div style={{ borderBottom: '1px solid var(--c-ink-faint)', paddingBottom: 20, marginBottom: 32 }}>
        <h2
          style={{
            fontSize:      'clamp(3rem, 8vw, 6.5rem)',
            fontWeight:    700,
            letterSpacing: '-0.045em',
            lineHeight:    0.88,
            color:         'var(--c-ink)',
          }}
        >
          {MESES[entry.month].toUpperCase()}
        </h2>
        <p className="text-meta mt-3" style={{ color: 'var(--c-ink-dim)' }}>
          {entry.year}&nbsp;&nbsp;·&nbsp;&nbsp;
          {entry.photos.length} {entry.photos.length === 1 ? 'fotograma' : 'fotogramas'}
        </p>
      </div>

      {/* Grupos por día */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
        {days.map((day, dayIdx) => {
          const dayStart = globalIdx
          globalIdx += day.photos.length
          return (
            <div key={day.date}>
              {/* Etiqueta del día */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span
                  className="text-meta"
                  style={{ color: 'var(--c-ink-dim)', flexShrink: 0, letterSpacing: '0.18em' }}
                >
                  {day.label}
                </span>
                <div style={{ flex: 1, height: 1, backgroundColor: 'var(--c-ink-faint)' }} />
                <span
                  className="text-meta"
                  style={{ color: 'var(--c-ink-dim)', opacity: 0.38, flexShrink: 0 }}
                >
                  {day.photos.length}
                </span>
              </div>

              {/* Tira horizontal de fotos */}
              <div
                className="no-scrollbar"
                style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}
              >
                {day.photos.map((p, i) => (
                  <StripCard
                    key={p.id}
                    photo={p}
                    delay={dayIdx * 0.04 + i * 0.07}
                    onClick={onPhotoClick}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Navegación lateral (spine) ────────────────────────────
function TimelineNav({ entries, active, onSelect }) {
  const years = useMemo(() => {
    const map = {}
    entries.forEach(e => {
      if (!map[e.year]) map[e.year] = []
      map[e.year].push(e)
    })
    return Object.entries(map).sort(([a], [b]) => +b - +a)
  }, [entries])

  return (
    <div style={{ paddingBottom: 64 }}>
      {years.map(([year, monthEntries]) => (
        <div key={year}>
          {/* Año fantasma sticky */}
          <div
            style={{
              padding:         '28px 28px 6px',
              position:        'sticky',
              top:             0,
              backgroundColor: 'var(--c-surface)',
              zIndex:          1,
            }}
          >
            <span
              style={{
                fontSize:      'clamp(2rem, 3vw, 2.8rem)',
                fontWeight:    700,
                letterSpacing: '-0.04em',
                color:         'var(--c-ink)',
                opacity:       0.1,
                lineHeight:    1,
                userSelect:    'none',
              }}
            >
              {year}
            </span>
          </div>

          {/* Meses con spine */}
          <div style={{ position: 'relative', paddingLeft: 28 }}>
            {/* Línea vertical */}
            <div
              style={{
                position:        'absolute',
                left:            35,
                top:             0,
                bottom:          0,
                width:           1,
                backgroundColor: 'var(--c-ink-faint)',
              }}
            />

            {monthEntries.map(entry => {
              const isActive = entry.key === active
              return (
                <button
                  key={entry.key}
                  onClick={() => onSelect(entry.key)}
                  style={{
                    display:    'flex',
                    alignItems: 'center',
                    gap:        14,
                    width:      '100%',
                    padding:    '10px 20px 10px 0',
                    textAlign:  'left',
                  }}
                >
                  {/* Nodo */}
                  <div
                    style={{
                      width:           8,
                      height:          8,
                      borderRadius:    '50%',
                      flexShrink:      0,
                      backgroundColor: isActive ? 'var(--c-ink)' : 'transparent',
                      border:          `1px solid ${isActive ? 'var(--c-ink)' : 'rgba(var(--c-ink-rgb), 0.28)'}`,
                      transition:      'all 0.18s ease',
                      marginLeft:      3,
                    }}
                  />

                  {/* Mes + contador */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span
                      className="text-meta"
                      style={{
                        color:         isActive ? 'var(--c-ink)' : 'var(--c-ink-dim)',
                        transition:    'color 0.18s',
                        letterSpacing: '0.18em',
                      }}
                    >
                      {M_CORTO[entry.month]}
                    </span>
                    <span
                      className="text-meta"
                      style={{
                        color:      'var(--c-ink-dim)',
                        opacity:    isActive ? 0.65 : 0.3,
                        fontSize:   '0.55rem',
                        transition: 'opacity 0.18s',
                      }}
                    >
                      {entry.photos.length}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Vista principal ───────────────────────────────────────
export default function TimelineView() {
  const { photos, setSelectedPhoto } = usePhotos()
  const entries = useTimeline(photos)
  const [active, setActive] = useState(() => entries[0]?.key || null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!active && entries.length) setActive(entries[0].key)
  }, [entries])

  useEffect(() => {
    gsap.fromTo(containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.45, ease: 'power2.out' }
    )
  }, [])

  const activeEntry = entries.find(e => e.key === active)

  if (entries.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
        <p className="text-meta" style={{ color: 'var(--c-ink-dim)' }}>Sin fotogramas aún</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} style={{ opacity: 0, minHeight: 'calc(100vh - 200px)' }}>

      {/* Mobile: tabs horizontales */}
      <div
        className="no-scrollbar sm:hidden"
        style={{
          display:      'flex',
          gap:          24,
          overflowX:    'auto',
          padding:      '0 28px 20px',
          borderBottom: '1px solid var(--c-ink-faint)',
          marginBottom: 28,
        }}
      >
        {entries.map(entry => {
          const isActive = entry.key === active
          return (
            <button
              key={entry.key}
              onClick={() => setActive(entry.key)}
              style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}
            >
              <span
                className="text-meta"
                style={{
                  color:         isActive ? 'var(--c-ink)' : 'var(--c-ink-dim)',
                  letterSpacing: '0.18em',
                  borderBottom:  isActive ? '1px solid var(--c-ink)' : '1px solid transparent',
                  paddingBottom: 2,
                  transition:    'color 0.18s, border-color 0.18s',
                }}
              >
                {M_CORTO[entry.month]}
              </span>
              <span style={{ fontSize: '0.52rem', color: 'var(--c-ink-dim)', opacity: 0.4 }}>
                {entry.year}
              </span>
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start' }}>

        {/* Sidebar desktop */}
        <aside
          className="no-scrollbar hidden sm:block"
          style={{
            width:       200,
            flexShrink:  0,
            borderRight: '1px solid var(--c-ink-faint)',
            position:    'sticky',
            top:         0,
            maxHeight:   '100vh',
            overflowY:   'auto',
          }}
        >
          <TimelineNav entries={entries} active={active} onSelect={setActive} />
        </aside>

        {/* Contenido principal */}
        <main style={{ flex: 1, minWidth: 0, padding: '28px 32px 80px' }}>
          {activeEntry && (
            <MonthPanel
              key={active}
              entry={activeEntry}
              onPhotoClick={setSelectedPhoto}
            />
          )}
        </main>
      </div>
    </div>
  )
}
