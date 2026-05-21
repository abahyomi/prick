import React, { useState, useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'

function normalizeUri(raw) {
  if (!raw) return ''
  if (raw.startsWith('spotify:')) return raw
  const m = raw.match(/(?:playlist|album|track)\/([A-Za-z0-9]+)/)
  return m ? `spotify:playlist:${m[1]}` : raw
}

// Formatea segundos o ms a M:SS — detecta la unidad automáticamente
function fmt(val) {
  if (!val || val <= 0) return '0:00'
  const sec = val > 3600 ? Math.floor(val / 1000) : Math.floor(val) // >3600 = ms
  const m   = Math.floor(sec / 60)
  const s   = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const SPOTIFY_URI = normalizeUri(import.meta.env.VITE_SPOTIFY_PLAYLIST_URI || '')

const glass = {
  backdropFilter:       'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  backgroundColor:      'rgba(var(--c-surface-rgb), 0.92)',
  border:               '1px solid rgba(var(--c-ink-rgb), 0.10)',
}

export default function MusicPlayer() {
  const [open,     setOpen]    = useState(false)
  const [playing,  setPlaying] = useState(false)
  const [ready,    setReady]   = useState(false)
  const [title,    setTitle]   = useState('')
  const [artist,   setArtist]  = useState('')
  const [pos,      setPos]     = useState(0)
  const [dur,      setDur]     = useState(0)

  const embedRef = useRef(null)
  const ctrlRef  = useRef(null)
  const panelRef = useRef(null)

  // ── Cargar Spotify iFrame API ──────────────────────────────
  useEffect(() => {
    if (!SPOTIFY_URI || window.__spotifyLoaded) return
    window.__spotifyLoaded = true

    const script    = document.createElement('script')
    script.src      = 'https://open.spotify.com/embed/iframe-api/v1'
    script.async    = true
    document.head.appendChild(script)

    window.onSpotifyIframeApiReady = (API) => {
      if (!embedRef.current) return

      API.createController(
        embedRef.current,
        { uri: SPOTIFY_URI, width: '300', height: '80' },
        (ctrl) => {
          ctrlRef.current = ctrl

          ctrl.addListener('ready', () => setReady(true))

          ctrl.addListener('playback_update', (evt) => {
            // La API puede envolver en {data} o no
            const d = evt?.data ?? evt
            if (!d) return

            setPlaying(!d.isPaused)

            // Posición / duración: la API envía ms, pero algunos builds en segundos
            const rawPos = d.position ?? 0
            const rawDur = d.duration ?? 0
            setPos(rawPos)
            setDur(rawDur)

            // Track info — distintas versiones del API usan campos distintos
            const t = d.track
            if (t) {
              setTitle(t.name || t.title || '')
              setArtist(
                Array.isArray(t.artists)
                  ? (t.artists[0]?.name ?? '')
                  : (typeof t.artists === 'string' ? t.artists : '')
              )
            }
          })
        }
      )
    }
  }, [])

  // ── Panel GSAP ─────────────────────────────────────────────
  useEffect(() => {
    if (!panelRef.current) return
    gsap.to(panelRef.current, open
      ? { maxHeight: 160, opacity: 1, duration: 0.32, ease: 'power3.out' }
      : { maxHeight: 0,   opacity: 0, duration: 0.22, ease: 'power2.in'  }
    )
  }, [open])

  const togglePlay = useCallback(() => ctrlRef.current?.togglePlay(),      [])
  const nextTrack  = useCallback(() => ctrlRef.current?.nextTrack?.(),     [])

  const seek = useCallback((e) => {
    if (!dur || !ctrlRef.current) return
    const r     = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))
    // seek espera segundos — si dur es ms, dividir por 1000
    const posSec = ratio * (dur > 3600 ? dur / 1000 : dur)
    ctrlRef.current.seek(posSec)
  }, [dur])

  if (!SPOTIFY_URI) return null

  const progress = dur > 0 ? pos / dur : 0
  const hasTrack = Boolean(title)

  return (
    <>
      {/* Iframe Spotify — visibility:hidden mantiene dimensiones sin mostrarlo */}
      <div
        aria-hidden="true"
        style={{
          position:   'fixed',
          bottom:     -300,
          left:       0,
          visibility: 'hidden',
          pointerEvents: 'none',
          zIndex:     -1,
        }}
      >
        <div ref={embedRef} style={{ width: 300, height: 80 }} />
      </div>

      {/* Contenedor flotante */}
      <div style={{
        position:      'fixed',
        bottom:        `calc(24px + env(safe-area-inset-bottom, 0px))`,
        left:          20,
        zIndex:        46,
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'stretch',
        minWidth:      44,
        width:         open ? 260 : 'auto',
        transition:    'width 0.3s ease',
      }}>

        {/* Panel expandible */}
        <div
          ref={panelRef}
          style={{ maxHeight: 0, opacity: 0, overflow: 'hidden', ...glass, marginBottom: 3 }}
        >
          <div style={{ padding: '12px 14px 10px' }}>

            {/* Título + artista */}
            <p style={{
              fontSize: '0.75rem', fontWeight: 500, color: 'var(--c-ink)',
              lineHeight: 1.25, marginBottom: 2,
              overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
            }}>
              {hasTrack ? title : (ready ? 'Dale al play ▶' : 'Conectando…')}
            </p>

            {artist && (
              <p style={{
                fontSize: '0.62rem', color: 'var(--c-ink-dim)',
                overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                marginBottom: 10,
              }}>
                {artist}
              </p>
            )}

            {/* Barra de progreso + tiempo */}
            <div
              onClick={seek}
              style={{ width: '100%', height: 3, backgroundColor: 'rgba(var(--c-ink-rgb),0.12)', cursor: 'pointer', position: 'relative', marginBottom: 6 }}
            >
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${progress * 100}%`, backgroundColor: 'var(--c-ink)', transition: 'width 1s linear' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: '0.55rem', color: 'var(--c-ink-dim)' }}>{fmt(pos)}</span>
              <span style={{ fontSize: '0.55rem', color: 'var(--c-ink-dim)' }}>{fmt(dur)}</span>
            </div>

            {/* Controles: play/pause + siguiente */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>

              {/* Play / Pause */}
              <button
                onClick={togglePlay}
                disabled={!ready}
                aria-label={playing ? 'Pausar' : 'Reproducir'}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  backgroundColor: 'var(--c-ink)', color: 'var(--c-surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: ready ? 1 : 0.3, flexShrink: 0,
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => { if (ready) e.currentTarget.style.opacity = '0.6' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = ready ? '1' : '0.3' }}
              >
                {playing
                  ? <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                  : <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}><polygon points="5,3 19,12 5,21"/></svg>
                }
              </button>

              {/* Siguiente */}
              <button
                onClick={nextTrack}
                disabled={!ready}
                aria-label="Siguiente"
                style={{
                  width: 30, height: 30,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--c-ink)', opacity: ready ? 0.7 : 0.25,
                  flexShrink: 0, transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => { if (ready) e.currentTarget.style.opacity = '1' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = ready ? '0.7' : '0.25' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5,4 15,12 5,20"/>
                  <rect x="17" y="4" width="2.5" height="16"/>
                </svg>
              </button>

            </div>
          </div>
        </div>

        {/* Botón ♫ / × */}
        <button
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Cerrar reproductor' : 'Abrir reproductor'}
          style={{
            height: 44, display: 'flex', alignItems: 'center',
            gap: 8, paddingLeft: 12, paddingRight: 14, color: 'var(--c-ink)',
            ...glass,
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <span style={{ fontSize: '0.9rem', lineHeight: 1, flexShrink: 0 }}>
            {open ? '×' : '♫'}
          </span>
          {!open && (
            <span style={{ fontSize: '0.62rem', color: 'var(--c-ink-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}>
              {title ? `${playing ? '▶ ' : ''}${title}` : 'Música'}
            </span>
          )}
        </button>

      </div>
    </>
  )
}
