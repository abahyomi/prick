import React, { useState, useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'

function normalizeUri(raw) {
  if (!raw) return ''
  if (raw.startsWith('spotify:')) return raw
  const m = raw.match(/(?:playlist|album|track)\/([A-Za-z0-9]+)/)
  return m ? `spotify:playlist:${m[1]}` : raw
}

function fmtMs(ms) {
  const s = Math.floor((ms || 0) / 1000)
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
}

const SPOTIFY_URI = normalizeUri(import.meta.env.VITE_SPOTIFY_PLAYLIST_URI || '')

const glass = {
  backdropFilter:       'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  backgroundColor:      'rgba(var(--c-surface-rgb), 0.88)',
  border:               '1px solid rgba(var(--c-ink-rgb), 0.10)',
}

const Btn = ({ onClick, disabled, label, children, size = 30, style = {} }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    style={{
      width: size, height: size,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--c-ink)', flexShrink: 0,
      opacity: disabled ? 0.3 : 1,
      fontSize: size > 32 ? '1rem' : '0.78rem',
      transition: 'opacity 0.15s',
      ...style,
    }}
    onMouseEnter={e => !disabled && (e.currentTarget.style.opacity = '0.45')}
    onMouseLeave={e => (e.currentTarget.style.opacity = disabled ? '0.3' : '1')}
  >
    {children}
  </button>
)

export default function MusicPlayer() {
  const [collapsed, setCollapsed] = useState(true)
  const [playing,   setPlaying]   = useState(false)
  const [shuffle,   setShuffle]   = useState(false)
  const [track,     setTrack]     = useState(null)
  const [position,  setPosition]  = useState(0)   // ms
  const [duration,  setDuration]  = useState(0)   // ms
  const [volume,    setVolumeS]   = useState(0.8) // 0–1
  const [ready,     setReady]     = useState(false)

  const embedRef = useRef(null)
  const ctrlRef  = useRef(null)
  const panelRef = useRef(null)

  const progress = duration > 0 ? position / duration : 0

  // ── Spotify iFrame API ─────────────────────────────────────
  useEffect(() => {
    if (!SPOTIFY_URI || window.__spotifyApiLoading) return
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
          ctrl.addListener('ready', () => {
            setReady(true)
            // Volumen inicial
            ctrl.setVolume?.(0.8)
          })
          ctrl.addListener('playback_update', ({ data }) => {
            setPlaying(!data.isPaused)
            setPosition(data.position || 0)
            setDuration(data.duration || 0)
            if (data.track) {
              const sources = data.track.coverArt?.sources || []
              // Preferir el tamaño más pequeño disponible (última entrada)
              const thumb = sources[sources.length - 1]?.url || null
              setTrack({
                title:  data.track.name || '—',
                artist: data.track.artists?.[0]?.name || '',
                cover:  thumb,
              })
            }
          })
        }
      )
    }
  }, [])

  // ── Expand / collapse con GSAP ─────────────────────────────
  useEffect(() => {
    if (!panelRef.current) return
    if (collapsed) {
      gsap.to(panelRef.current, {
        maxHeight: 0, opacity: 0,
        duration: 0.28, ease: 'power2.in',
      })
    } else {
      gsap.fromTo(panelRef.current,
        { maxHeight: 0, opacity: 0 },
        { maxHeight: 320, opacity: 1, duration: 0.38, ease: 'power3.out' }
      )
    }
  }, [collapsed])

  const togglePlay = useCallback(() => ctrlRef.current?.togglePlay(), [])

  const handleNext     = useCallback(() => ctrlRef.current?.nextTrack?.(),     [])
  const handlePrev     = useCallback(() => ctrlRef.current?.previousTrack?.(), [])
  const handleShuffle  = useCallback(() => {
    const next = !shuffle
    setShuffle(next)
    ctrlRef.current?.setShuffle?.(next)
  }, [shuffle])

  const handleSeek = useCallback((e) => {
    if (!duration || !ctrlRef.current) return
    const rect  = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    ctrlRef.current.seek(ratio * duration / 1000)
  }, [duration])

  const handleVolume = useCallback((e) => {
    const v = parseFloat(e.target.value)
    setVolumeS(v)
    ctrlRef.current?.setVolume?.(v)
  }, [])

  if (!SPOTIFY_URI) return null

  return (
    <>
      {/* Iframe Spotify oculto */}
      <div aria-hidden="true" style={{ position:'fixed', top:0, left:0, width:0, height:0, overflow:'hidden', pointerEvents:'none', zIndex:-9999 }}>
        <div ref={embedRef} style={{ width:200, height:80 }} />
      </div>

      {/* ── Contenedor flotante ── */}
      <div
        style={{
          position:      'fixed',
          bottom:        `calc(28px + env(safe-area-inset-bottom, 0px))`,
          left:          20,
          zIndex:        46,
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'stretch',
          width:         collapsed ? 'auto' : 288,
          transition:    'width 0.3s ease',
        }}
      >
        {/* Panel expandible — sube desde el botón */}
        <div
          ref={panelRef}
          style={{
            maxHeight:  0,
            opacity:    0,
            overflow:   'hidden',
            ...glass,
            marginBottom: 4,
          }}
        >
          <div style={{ padding: '14px 14px 12px' }}>

            {/* Portada + título + artista + duración */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              {/* Album art */}
              <div style={{
                width: 56, height: 56, flexShrink: 0,
                backgroundColor: 'rgba(var(--c-ink-rgb), 0.08)',
                overflow: 'hidden',
              }}>
                {track?.cover
                  ? <img src={track.cover} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'grayscale(25%)' }} />
                  : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', opacity:0.3 }}>♫</div>
                }
              </div>

              {/* Info */}
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{
                  fontSize: '0.72rem', fontWeight: 500, color: 'var(--c-ink)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  lineHeight: 1.3,
                }}>
                  {track?.title || (ready ? '—' : 'Conectando…')}
                </p>
                <p style={{
                  fontSize: '0.6rem', color: 'var(--c-ink-dim)', marginTop: 2,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {track?.artist || ''}
                </p>
                <p style={{ fontSize: '0.58rem', color: 'var(--c-ink-dim)', marginTop: 3, opacity: 0.55 }}>
                  {fmtMs(position)} / {fmtMs(duration)}
                </p>
              </div>
            </div>

            {/* Barra de progreso */}
            <div
              onClick={handleSeek}
              style={{
                width: '100%', height: 3,
                backgroundColor: 'rgba(var(--c-ink-rgb), 0.12)',
                cursor: 'pointer', position: 'relative',
                marginBottom: 14,
              }}
            >
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${progress * 100}%`,
                backgroundColor: 'var(--c-ink)',
                transition: 'width 0.9s linear',
              }} />
            </div>

            {/* Controles: anterior / play / siguiente / aleatorio */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 12 }}>
              <Btn onClick={handleShuffle} label="Aleatorio" style={{ opacity: shuffle ? 1 : 0.35 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
                  <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
                </svg>
              </Btn>

              <Btn onClick={handlePrev} label="Anterior" disabled={!ready}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="19,20 9,12 19,4"/><rect x="5" y="4" width="2" height="16"/>
                </svg>
              </Btn>

              {/* Play / Pause — más grande */}
              <Btn onClick={togglePlay} label={playing ? 'Pausar' : 'Reproducir'} disabled={!ready} size={40}
                style={{ backgroundColor:'var(--c-ink)', color:'var(--c-surface)', borderRadius:'50%' }}
              >
                {playing
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{marginLeft:2}}><polygon points="5,3 19,12 5,21"/></svg>
                }
              </Btn>

              <Btn onClick={handleNext} label="Siguiente" disabled={!ready}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5,4 15,12 5,20"/><rect x="17" y="4" width="2" height="16"/>
                </svg>
              </Btn>

              {/* Placeholder aleatorio (simétrico) */}
              <div style={{ width: 30, height: 30 }} />
            </div>

            {/* Volumen */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--c-ink-dim)" strokeWidth="1.8" strokeLinecap="round">
                <polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
              </svg>
              <input
                type="range" min="0" max="1" step="0.02"
                value={volume}
                onChange={handleVolume}
                className="crop-slider"
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: '0.55rem', color: 'var(--c-ink-dim)', width: 22, textAlign: 'right' }}>
                {Math.round(volume * 100)}
              </span>
            </div>

          </div>
        </div>

        {/* Botón toggle ♫ / × */}
        <button
          onClick={() => setCollapsed(c => !c)}
          aria-label={collapsed ? 'Abrir reproductor' : 'Cerrar reproductor'}
          style={{
            height: 44,
            display: 'flex', alignItems: 'center',
            gap: 8,
            paddingLeft: 14, paddingRight: 14,
            color: 'var(--c-ink)',
            ...glass,
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.72')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <span style={{ fontSize: '0.92rem', lineHeight: 1 }}>{collapsed ? '♫' : '×'}</span>
          {collapsed && track && (
            <span style={{
              fontSize: '0.62rem', color: 'var(--c-ink-dim)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              maxWidth: 120,
            }}>
              {playing ? '▶ ' : ''}{track.title}
            </span>
          )}
        </button>
      </div>
    </>
  )
}
