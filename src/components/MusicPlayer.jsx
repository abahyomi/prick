import React, { useState, useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'

// Normaliza URI o URL de Spotify → spotify:playlist:ID
function normalizeUri(raw) {
  if (!raw) return ''
  if (raw.startsWith('spotify:')) return raw
  const m = raw.match(/(?:playlist|album|track)\/([A-Za-z0-9]+)/)
  return m ? `spotify:playlist:${m[1]}` : raw
}

const SPOTIFY_URI = normalizeUri(import.meta.env.VITE_SPOTIFY_PLAYLIST_URI || '')

const glass = {
  backdropFilter:         'blur(22px)',
  WebkitBackdropFilter:   'blur(22px)',
  backgroundColor:        'rgba(var(--c-surface-rgb), 0.82)',
  border:                 '1px solid rgba(var(--c-ink-rgb), 0.10)',
}

export default function MusicPlayer() {
  const [collapsed, setCollapsed] = useState(true)
  const [playing,   setPlaying]   = useState(false)
  const [track,     setTrack]     = useState(null)   // { title, artist }
  const [progress,  setProgress]  = useState(0)      // 0–1
  const [duration,  setDuration]  = useState(0)      // ms
  const [ready,     setReady]     = useState(false)

  const embedRef    = useRef(null)  // div que Spotify convierte en iframe
  const ctrlRef     = useRef(null)  // EmbedController
  const innerRef    = useRef(null)  // panel expandible
  const rootRef     = useRef(null)  // botón raíz para GSAP

  // ── Cargar Spotify iFrame API ──────────────────────────────
  useEffect(() => {
    if (!SPOTIFY_URI) return

    // Limpia la instancia anterior si ya existe
    if (window.__spotifyApiLoading) return
    window.__spotifyApiLoading = true

    const script = document.createElement('script')
    script.src   = 'https://open.spotify.com/embed/iframe-api/v1'
    script.async = true
    document.head.appendChild(script)

    window.onSpotifyIframeApiReady = (API) => {
      if (!embedRef.current) return
      API.createController(
        embedRef.current,
        { uri: SPOTIFY_URI, width: '200', height: '80' },
        (ctrl) => {
          ctrlRef.current = ctrl
          ctrl.addListener('ready', () => setReady(true))
          ctrl.addListener('playback_update', ({ data }) => {
            setPlaying(!data.isPaused)
            setDuration(data.duration || 0)
            if (data.duration > 0) setProgress(data.position / data.duration)
            if (data.track?.name) {
              setTrack({
                title:  data.track.name,
                artist: data.track.artists?.[0]?.name || '',
              })
            }
          })
        }
      )
    }
  }, [])

  // ── Animar collapse / expand ────────────────────────────────
  useEffect(() => {
    if (!innerRef.current) return
    if (collapsed) {
      gsap.to(innerRef.current, { width: 0, opacity: 0, duration: 0.25, ease: 'power2.in' })
    } else {
      gsap.fromTo(innerRef.current,
        { width: 0, opacity: 0 },
        { width: 220, opacity: 1, duration: 0.32, ease: 'power2.out' }
      )
    }
  }, [collapsed])

  const togglePlay = useCallback(() => ctrlRef.current?.togglePlay(), [])

  const handleSeek = useCallback((e) => {
    if (!duration || !ctrlRef.current) return
    const rect  = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    ctrlRef.current.seek(ratio * duration / 1000) // ms → s
  }, [duration])

  if (!SPOTIFY_URI) return null

  return (
    <>
      {/* Spotify iframe oculto — posicionado fuera de la vista pero en el DOM */}
      <div
        ref={embedRef}
        aria-hidden="true"
        style={{
          position:      'fixed',
          bottom:        -400,
          left:          0,
          width:         200,
          height:        80,
          opacity:       0.01,
          pointerEvents: 'none',
          zIndex:        -1,
        }}
      />

      {/* ── Player personalizado ── */}
      <div
        ref={rootRef}
        style={{
          position:    'fixed',
          bottom:      `calc(28px + env(safe-area-inset-bottom, 0px))`,
          left:        20,
          zIndex:      46,
          display:     'flex',
          alignItems:  'center',
          minHeight:   44,
          ...glass,
        }}
      >
        {/* Botón de nota musical / colapsar */}
        <button
          onClick={() => setCollapsed(c => !c)}
          aria-label={collapsed ? 'Abrir reproductor' : 'Cerrar reproductor'}
          style={{
            width:          44,
            height:         44,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            color:          'var(--c-ink)',
            fontSize:       collapsed ? '1rem' : '0.9rem',
            flexShrink:     0,
            transition:     'opacity 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.55')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          {collapsed ? '♫' : '×'}
        </button>

        {/* Panel expandible */}
        <div
          ref={innerRef}
          style={{
            width:      0,
            opacity:    0,
            overflow:   'hidden',
            display:    'flex',
            alignItems: 'center',
            gap:        10,
          }}
        >
          {/* Info + barra */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{
              fontSize:     '0.68rem',
              fontWeight:   500,
              color:        'var(--c-ink)',
              whiteSpace:   'nowrap',
              overflow:     'hidden',
              textOverflow: 'ellipsis',
              maxWidth:     110,
              lineHeight:   1.3,
            }}>
              {track?.title || (ready ? '—' : 'Conectando…')}
            </p>
            {track?.artist && (
              <p style={{
                fontSize:     '0.58rem',
                color:        'var(--c-ink-dim)',
                whiteSpace:   'nowrap',
                overflow:     'hidden',
                textOverflow: 'ellipsis',
                maxWidth:     110,
                marginTop:    1,
              }}>
                {track.artist}
              </p>
            )}
            {/* Barra de progreso clickable */}
            <div
              onClick={handleSeek}
              style={{
                width:           '100%',
                height:          2,
                backgroundColor: 'rgba(var(--c-ink-rgb), 0.15)',
                marginTop:       5,
                cursor:          'pointer',
                position:        'relative',
              }}
            >
              <div style={{
                position:         'absolute',
                left: 0, top: 0, bottom: 0,
                width:            `${progress * 100}%`,
                backgroundColor:  'var(--c-ink)',
                transition:       'width 0.8s linear',
              }} />
            </div>
          </div>

          {/* Play / Pause */}
          <button
            onClick={togglePlay}
            disabled={!ready}
            aria-label={playing ? 'Pausar' : 'Reproducir'}
            style={{
              width:          36,
              height:         36,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              color:          'var(--c-ink)',
              fontSize:       '0.88rem',
              flexShrink:     0,
              opacity:        ready ? 1 : 0.35,
              transition:     'opacity 0.2s',
            }}
            onMouseEnter={e => ready && (e.currentTarget.style.opacity = '0.55')}
            onMouseLeave={e => (e.currentTarget.style.opacity = ready ? '1' : '0.35')}
          >
            {playing ? '⏸' : '▶'}
          </button>

          {/* Espacio derecho */}
          <div style={{ width: 6 }} />
        </div>
      </div>
    </>
  )
}
