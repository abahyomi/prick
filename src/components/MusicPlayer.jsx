import React, { useState, useEffect } from 'react'

function getPlaylistId(raw) {
  if (!raw) return ''
  const m = raw.match(/playlist\/([A-Za-z0-9]+)/)
  return m ? m[1] : raw.split(':').pop()
}

const PLAYLIST_ID = getPlaylistId(import.meta.env.VITE_SPOTIFY_PLAYLIST_URI || '')

const glass = {
  backdropFilter:       'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  backgroundColor:      'rgba(var(--c-surface-rgb), 0.92)',
  border:               '1px solid rgba(var(--c-ink-rgb), 0.10)',
}

export default function MusicPlayer() {
  const [open, setOpen] = useState(false)

  // theme=0 → dark, theme=1 → light — se sincroniza con el tema de la web
  const [dark, setDark] = useState(!document.documentElement.classList.contains('light'))

  useEffect(() => {
    const obs = new MutationObserver(() => {
      setDark(!document.documentElement.classList.contains('light'))
    })
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  if (!PLAYLIST_ID) return null

  const src = `https://open.spotify.com/embed/playlist/${PLAYLIST_ID}?utm_source=generator&theme=${dark ? 0 : 1}`

  return (
    <div style={{
      position:      'fixed',
      bottom:        `calc(24px + env(safe-area-inset-bottom, 0px))`,
      left:          20,
      zIndex:        46,
      display:       'flex',
      flexDirection: 'column',
      alignItems:    'stretch',
    }}>

      {/* Embed nativo de Spotify — colapsable */}
      <div style={{
        maxHeight:  open ? 96 : 0,
        overflow:   'hidden',
        opacity:    open ? 1 : 0,
        transition: 'max-height 0.34s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease',
        marginBottom: open ? 4 : 0,
        width:      300,
        // Envolver en glass sutil para integración visual
        ...glass,
      }}>
        <iframe
          title="Spotify Player"
          src={src}
          width="300"
          height="80"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          style={{ display:'block' }}
        />
      </div>

      {/* Botón toggle ♫ / × */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Cerrar reproductor' : 'Abrir reproductor'}
        style={{
          height:      44,
          paddingLeft:  12,
          paddingRight: 14,
          display:     'flex',
          alignItems:  'center',
          gap:          8,
          color:       'var(--c-ink)',
          transition:  'opacity 0.18s',
          ...glass,
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        <span style={{ fontSize:'0.9rem', lineHeight:1 }}>
          {open ? '×' : '♫'}
        </span>
        {!open && (
          <span style={{ fontSize:'0.62rem', color:'var(--c-ink-dim)' }}>
            Música
          </span>
        )}
      </button>

    </div>
  )
}
