import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { gsap } from 'gsap'
import { usePhotos } from '../context/PhotoContext'

// ── Distancia Haversine (km) ───────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── Agrupa fotos por proximidad (radio 40 km) ──────────────
function buildClusters(photos, radiusKm = 40) {
  const clusters = []
  photos.forEach(photo => {
    if (photo.lat == null || photo.lng == null) return
    let best = -1, bestDist = Infinity
    clusters.forEach((c, i) => {
      const d = haversine(c.lat, c.lng, photo.lat, photo.lng)
      if (d < bestDist) { bestDist = d; best = i }
    })
    if (best >= 0 && bestDist <= radiusKm) {
      clusters[best].photos.push(photo)
      clusters[best].lat = clusters[best].photos.reduce((s, p) => s + p.lat, 0) / clusters[best].photos.length
      clusters[best].lng = clusters[best].photos.reduce((s, p) => s + p.lng, 0) / clusters[best].photos.length
    } else {
      clusters.push({ lat: photo.lat, lng: photo.lng, photos: [photo] })
    }
  })
  return clusters.map((c, i) => {
    const freq = {}
    c.photos.forEach(p => {
      const city = p.location?.split(',').pop()?.trim() || p.location || '?'
      freq[city] = (freq[city] || 0) + 1
    })
    const label = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
    return { ...c, id: i, label }
  })
}

// ── HTML del marcador (Swiss) ──────────────────────────────
function markerHtml(count, active) {
  const bg  = active ? 'var(--c-ink)'     : 'var(--c-surface)'
  const fg  = active ? 'var(--c-surface)' : 'var(--c-ink)'
  const bdr = active ? 'none'             : '1px solid var(--c-ink)'
  return `<div style="
    width:52px;height:52px;background:${bg};color:${fg};border:${bdr};
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    font-family:Inter,sans-serif;cursor:pointer;
    box-shadow:0 4px 20px rgba(0,0,0,0.35);
    transform:${active ? 'scale(1.12)' : 'scale(1)'};transition:transform 0.15s">
    <span style="font-size:1.1rem;font-weight:400;line-height:1">${count}</span>
    <span style="font-size:0.48rem;letter-spacing:0.14em;text-transform:uppercase;opacity:0.55;margin-top:3px">fotos</span>
  </div>`
}

// ── Panel inferior con fotos del cluster ───────────────────
function PhotoPanel({ cluster, onClose, onPhotoClick }) {
  const ref = useRef(null)

  useEffect(() => {
    gsap.fromTo(ref.current,
      { y: '100%' },
      { y: 0, duration: 0.4, ease: 'power3.out' }
    )
  }, [cluster.id])

  function close() {
    gsap.to(ref.current, {
      y: '100%', duration: 0.32, ease: 'power2.in',
      onComplete: onClose,
    })
  }

  // Cerrar panel ANTES de abrir el detalle para evitar superposiciones
  function openPhoto(photo) {
    gsap.to(ref.current, {
      y: '100%', duration: 0.22, ease: 'power2.in',
      onComplete: () => { onClose(); onPhotoClick(photo) },
    })
  }

  const fmt = (d, t) => {
    const s = new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
    return t ? `${s} · ${t}` : s
  }

  return (
    <div
      ref={ref}
      className="bg-surface"
      style={{
        position:      'absolute',
        bottom: 0, left: 0, right: 0,
        zIndex:        2000,
        maxHeight:     '68vh',
        display:       'flex',
        flexDirection: 'column',
        borderTop:     '1px solid var(--c-ink-faint)',
        transform:     'translateY(100%)',
        willChange:    'transform',
        boxShadow:     '0 -6px 32px rgba(0,0,0,0.28)',
      }}
    >
      {/* Drag handle */}
      <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
        <div style={{ width: 36, height: 3, borderRadius: 2, backgroundColor: 'var(--c-ink-faint)' }} />
      </div>

      {/* Cabecera */}
      <div
        className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--c-ink-faint)' }}
      >
        <div className="min-w-0">
          <h2
            className="font-semibold text-ink leading-tight"
            style={{ fontSize: 'clamp(1rem, 2.5vw, 1.6rem)', letterSpacing: '-0.02em' }}
          >
            {cluster.label}
          </h2>
          <p className="text-meta mt-0.5" style={{ color: 'var(--c-ink-dim)' }}>
            {cluster.photos.length} {cluster.photos.length === 1 ? 'fotograma' : 'fotogramas'}
          </p>
        </div>
        <button
          onClick={close}
          style={{ color: 'var(--c-ink-dim)', padding: '0.5rem 0.7rem', fontSize: '1.05rem', flexShrink: 0, marginLeft: 8 }}
          className="text-meta transition-opacity hover:opacity-40"
        >
          ✕
        </button>
      </div>

      {/* Grid scrollable */}
      <div
        className="no-scrollbar overflow-y-auto flex-1"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
      >
        <div
          className="grid p-2"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))', gap: '3px' }}
        >
          {cluster.photos.map(photo => (
            <button
              key={photo.id}
              className="aspect-[4/5] overflow-hidden relative group block"
              onClick={() => openPhoto(photo)}
              title={`${photo.location} · ${fmt(photo.date, photo.time)}`}
            >
              <img
                src={photo.thumb || photo.url}
                alt={photo.location}
                loading="lazy"
                className="w-full h-full object-cover grayscale"
                style={{ transition: 'transform 0.45s ease', display: 'block' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.07)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              />
              <div
                className="absolute inset-0 flex flex-col justify-end p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                style={{ backgroundColor: 'rgba(0,0,0,0.78)' }}
              >
                <p style={{ color: '#fff', fontSize: '0.6rem', fontWeight: 500, lineHeight: 1.3 }}>
                  {photo.location?.split(',')[0]}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.52rem', marginTop: 1 }}>
                  {fmt(photo.date, photo.time)}
                </p>
              </div>
            </button>
          ))}
        </div>
        <div className="h-4" />
      </div>
    </div>
  )
}

// ── Vista principal ────────────────────────────────────────
export default function MapView() {
  const { photos, setSelectedPhoto } = usePhotos()

  const mapDivRef    = useRef(null)
  const mapRef       = useRef(null)
  const fittedRef    = useRef(false)     // fitBounds solo una vez
  const containerRef = useRef(null)

  // Estado que indica que el mapa ya está listo (dispara el effect de marcadores)
  const [mapReady,      setMapReady]      = useState(false)
  const [activeCluster, setActiveCluster] = useState(null)

  const isDark   = !document.documentElement.classList.contains('light')
  const tileUrl  = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

  const clusters = useMemo(() => buildClusters(photos), [photos])

  // ── 1. Inicializar Leaflet (solo una vez) ──────────────
  useEffect(() => {
    if (mapRef.current) return          // ya existe
    if (!mapDivRef.current) return

    const map = L.map(mapDivRef.current, {
      center:             [38, -8],
      zoom:               5,
      zoomControl:        false,
      attributionControl: true,
    })

    L.tileLayer(tileUrl, {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>',
      subdomains:  'abcd',
      maxZoom:     19,
    }).addTo(map)

    mapRef.current = map
    // Pequeño delay para que el DOM esté renderizado antes de invalidateSize
    setTimeout(() => {
      map.invalidateSize()
      setMapReady(true)    // ← dispara el effect de marcadores
    }, 120)

    return () => {
      map.remove()
      mapRef.current  = null
      fittedRef.current = false
    }
  }, [])

  // ── 2. Añadir/actualizar marcadores cuando el mapa está listo ──
  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    const map = mapRef.current

    // Quitar marcadores anteriores (no los TileLayers)
    map.eachLayer(layer => { if (layer instanceof L.Marker) layer.remove() })

    clusters.forEach(cluster => {
      const isActive = activeCluster?.id === cluster.id

      const icon = L.divIcon({
        html:       markerHtml(cluster.photos.length, isActive),
        className:  '',
        iconSize:   [52, 52],
        iconAnchor: [26, 26],
      })

      L.marker([cluster.lat, cluster.lng], { icon })
        .addTo(map)
        .on('click', () => {
          setActiveCluster(prev => prev?.id === cluster.id ? null : cluster)
        })
    })

    // fitBounds solo la primera vez (no mover el mapa en cada click)
    if (!fittedRef.current && clusters.length) {
      fittedRef.current = true
      if (clusters.length === 1) {
        map.setView([clusters[0].lat, clusters[0].lng], 11)
      } else {
        const bounds = L.latLngBounds(clusters.map(c => [c.lat, c.lng]))
        map.fitBounds(bounds, { padding: [72, 72] })
      }
    }
  }, [mapReady, clusters, activeCluster])

  // ── Animar entrada ─────────────────────────────────────
  useEffect(() => {
    gsap.fromTo(containerRef.current,
      { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' }
    )
  }, [])

  const handlePhotoClick = useCallback(photo => {
    setSelectedPhoto(photo)
  }, [setSelectedPhoto])

  const geoCount = photos.filter(p => p.lat != null).length

  return (
    <div
      ref={containerRef}
      style={{
        position:  'relative',
        zIndex:    0,           // crea stacking context propio → panel queda dentro
        height:    'calc(100vh - 200px)',
        minHeight: '420px',
        opacity:   0,
        overflow:  'hidden',
      }}
    >
      {/* Contenedor Leaflet */}
      <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />

      {/* Panel de fotos */}
      {activeCluster && (
        <PhotoPanel
          key={activeCluster.id}
          cluster={activeCluster}
          onClose={() => setActiveCluster(null)}
          onPhotoClick={handlePhotoClick}
        />
      )}

      {/* Leyenda discreta */}
      {!activeCluster && geoCount > 0 && (
        <div
          style={{ position: 'absolute', bottom: 20, left: 20, zIndex: 1500, pointerEvents: 'none' }}
        >
          <p className="text-meta" style={{ color: 'var(--c-ink-dim)' }}>
            {geoCount} fotogramas · {clusters.length} {clusters.length === 1 ? 'lugar' : 'lugares'}
          </p>
        </div>
      )}

      {/* Hint al cargar — desaparece cuando hay marcadores */}
      {mapReady && !clusters.length && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1500 }}>
          <p className="text-meta" style={{ color: 'var(--c-ink-dim)' }}>Sin fotos geolocalizadas aún</p>
        </div>
      )}
    </div>
  )
}
