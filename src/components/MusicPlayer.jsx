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
const PLAYLIST_ID = SPOTIFY_URI.split(':').pop()

const glass = {
  backdropFilter:       'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  backgroundColor:      'rgba(var(--c-surface-rgb), 0.9)',
  border:               '1px solid rgba(var(--c-ink-rgb), 0.10)',
}

function Btn({ onClick, disabled, label, children, big = false, active = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      style={{
        width: big ? 40 : 30, height: big ? 40 : 30,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: big ? '50%' : 0,
        backgroundColor: big ? 'var(--c-ink)' : 'transparent',
        color: big ? 'var(--c-surface)' : 'var(--c-ink)',
        flexShrink: 0,
        opacity: disabled ? 0.25 : (active ? 1 : 0.75),
        transition: 'opacity 0.15s',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = '0.45' }}
      onMouseLeave={e => { e.currentTarget.style.opacity = disabled ? '0.25' : (active ? '1' : '0.75') }}
    >
      {children}
    </button>
  )
}

export default function MusicPlayer() {
  const [collapsed,  setCollapsed]  = useState(true)
  const [playing,    setPlaying]    = useState(false)
  const [shuffle,    setShuffle]    = useState(false)
  const [ready,      setReady]      = useState(false)
  const [volume,     setVolumeS]    = useState(0.8)

  // Datos de track activo
  const [track,    setTrack]    = useState(null)  // { title, artist, cover }
  const [position, setPosition] = useState(0)     // ms
  const [duration, setDuration] = useState(0)     // ms

  // Portada del playlist como fallback (cargada sin auth via oEmbed)
  const [playlistCover, setPlaylistCover] = useState(null)

  const embedRef = useRef(null)
  const ctrlRef  = useRef(null)
  const panelRef = useRef(null)

  // ── Pre-carga portada del playlist via oEmbed (sin API key) ──
  useEffect(() => {
    if (!PLAYLIST_ID) return
    fetch(`https://open.spotify.com/oembed?url=https://open.spotify.com/playlist/${PLAYLIST_ID}`)
      .then(r => r.json())
      .then(d => d.thumbnail_url && setPlaylistCover(d.thumbnail_url))
      .catch(() => {})
  }, [])

  // ── Cargar Spotify iFrame API ──────────────────────────────
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
            ctrl.setVolume?.(0.8)
          })

          ctrl.addListener('playback_update', (e) => {
            // La API puede enviar el evento directamente o dentro de {data}
            const d = e?.data ?? e
            if (!d) return

            setPlaying(!d.isPaused)
            setPosition(d.position ?? 0)
            setDuration(d.duration ?? 0)

            const t = d.track
            if (t) {
              // Intentar cover desde distintas rutas posibles de la API
              const cover =
                t.coverArt?.sources?.[0]?.url ||
                t.album?.images?.[0]?.url      ||
                t.image                        ||
                null

              setTrack({
                title:  t.name  || t.title  || '—',
                artist: Array.isArray(t.artists)
                  ? t.artists[0]?.name || ''
                  : t.artists || '',
                cover,
              })
            }
          })
        }
      )
    }
  }, [])

  // ── Expand / collapse ──────────────────────────────────────
  useEffect(() => {
    if (!panelRef.current) return
    gsap.to(panelRef.current, collapsed
      ? { maxHeight: 0, opacity: 0, duration: 0.25, ease: 'power2.in' }
      : { maxHeight: 340, opacity: 1, duration: 0.38, ease: 'power3.out' }
    )
  }, [collapsed])

  const togglePlay   = useCallback(() => ctrlRef.current?.togglePlay(),       [])
  const handleNext   = useCallback(() => ctrlRef.current?.nextTrack?.(),      [])
  const handlePrev   = useCallback(() => ctrlRef.current?.previousTrack?.(),  [])

  const handleShuffle = useCallback(() => {
    const next = !shuffle
    setShuffle(next)
    ctrlRef.current?.setShuffle?.(next)
  }, [shuffle])

  const handleSeek = useCallback((e) => {
    if (!duration || !ctrlRef.current) return
    const r = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))
    ctrlRef.current.seek(ratio * duration / 1000)
  }, [duration])

  const handleVolume = useCallback((e) => {
    const v = parseFloat(e.target.value)
    setVolumeS(v)
    ctrlRef.current?.setVolume?.(v)
  }, [])

  if (!SPOTIFY_URI) return null

  const cover    = track?.cover || playlistCover
  const progress = duration > 0 ? position / duration : 0

  return (
    <>
      {/* Iframe Spotify — 0×0 overflow:hidden */}
      <div aria-hidden="true" style={{ position:'fixed', top:0, left:0, width:0, height:0, overflow:'hidden', pointerEvents:'none', zIndex:-9999 }}>
        <div ref={embedRef} style={{ width:200, height:80 }} />
      </div>

      {/* Player flotante */}
      <div style={{
        position:      'fixed',
        bottom:        `calc(28px + env(safe-area-inset-bottom, 0px))`,
        left:          20,
        zIndex:        46,
        width:         collapsed ? 'auto' : 272,
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'stretch',
      }}>

        {/* ── Panel expandible ── */}
        <div
          ref={panelRef}
          style={{ maxHeight:0, opacity:0, overflow:'hidden', ...glass, marginBottom:4 }}
        >
          <div style={{ padding:'14px 14px 10px' }}>

            {/* Portada + info */}
            <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:12 }}>
              {/* Cover */}
              <div style={{ width:56, height:56, flexShrink:0, backgroundColor:'rgba(var(--c-ink-rgb),0.06)', overflow:'hidden' }}>
                {cover
                  ? <img src={cover} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', opacity:0.25 }}>♫</div>
                }
              </div>

              {/* Texto */}
              <div style={{ minWidth:0, flex:1 }}>
                <p style={{ fontSize:'0.72rem', fontWeight:500, color:'var(--c-ink)', lineHeight:1.3, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
                  {track?.title || (ready ? 'Dale play ▶' : 'Conectando…')}
                </p>
                {track?.artist && (
                  <p style={{ fontSize:'0.6rem', color:'var(--c-ink-dim)', marginTop:2, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
                    {track.artist}
                  </p>
                )}
                <p style={{ fontSize:'0.57rem', color:'var(--c-ink-dim)', marginTop:3, opacity:0.5 }}>
                  {fmtMs(position)} / {fmtMs(duration)}
                </p>
              </div>
            </div>

            {/* Barra de progreso */}
            <div onClick={handleSeek} style={{ width:'100%', height:3, backgroundColor:'rgba(var(--c-ink-rgb),0.12)', cursor:'pointer', position:'relative', marginBottom:14 }}>
              <div style={{ position:'absolute', left:0, top:0, bottom:0, width:`${progress*100}%`, backgroundColor:'var(--c-ink)', transition:'width 0.9s linear' }} />
            </div>

            {/* Controles */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom:12 }}>

              {/* Shuffle */}
              <Btn onClick={handleShuffle} label="Aleatorio" active={shuffle} disabled={!ready}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 3 21 3 21 8"/>
                  <line x1="4" y1="20" x2="21" y2="3"/>
                  <polyline points="21 16 21 21 16 21"/>
                  <line x1="15" y1="15" x2="21" y2="21"/>
                </svg>
              </Btn>

              {/* Anterior */}
              <Btn onClick={handlePrev} label="Anterior" disabled={!ready}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="19,20 9,12 19,4"/><rect x="5" y="4" width="2.5" height="16"/>
                </svg>
              </Btn>

              {/* Play / Pause */}
              <Btn onClick={togglePlay} label={playing ? 'Pausar' : 'Reproducir'} disabled={!ready} big>
                {playing
                  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                  : <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{marginLeft:2}}><polygon points="5,3 19,12 5,21"/></svg>
                }
              </Btn>

              {/* Siguiente */}
              <Btn onClick={handleNext} label="Siguiente" disabled={!ready}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5,4 15,12 5,20"/><rect x="16.5" y="4" width="2.5" height="16"/>
                </svg>
              </Btn>

              {/* Repetir (placeholder visual simétrico con shuffle) */}
              <Btn label="Repetir" disabled>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="17 1 21 5 17 9"/>
                  <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                  <polyline points="7 23 3 19 7 15"/>
                  <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                </svg>
              </Btn>
            </div>

            {/* Volumen */}
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--c-ink-dim)" strokeWidth="2" strokeLinecap="round">
                <polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
              <input
                type="range" min="0" max="1" step="0.02"
                value={volume}
                onChange={handleVolume}
                className="crop-slider"
                style={{ flex:1 }}
              />
              <span style={{ fontSize:'0.55rem', color:'var(--c-ink-dim)', width:24, textAlign:'right' }}>
                {Math.round(volume * 100)}
              </span>
            </div>

          </div>
        </div>

        {/* ── Botón toggle ── */}
        <button
          onClick={() => setCollapsed(c => !c)}
          aria-label={collapsed ? 'Abrir reproductor' : 'Cerrar reproductor'}
          style={{ height:44, display:'flex', alignItems:'center', gap:8, paddingLeft:12, paddingRight:14, color:'var(--c-ink)', ...glass }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.72')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <span style={{ fontSize:'0.95rem', lineHeight:1, flexShrink:0 }}>
            {collapsed ? '♫' : '×'}
          </span>
          {collapsed && (
            <span style={{ fontSize:'0.62rem', color:'var(--c-ink-dim)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:130 }}>
              {track
                ? `${playing ? '▶ ' : ''}${track.title}`
                : 'Música'}
            </span>
          )}
        </button>

      </div>
    </>
  )
}
