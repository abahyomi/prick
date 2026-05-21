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

// ── Agrupa fotos por proximidad ────────────────────────────
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

// ── Panel de fotos del cluster ─────────────────────────────
function PhotoPanel({ cluster, onClose, onPhotoClick }) {
  const ref = useRef(null)

  useEffect(() => {
    gsap.fromTo(ref.current,
      { y: '100%', opacity: 0 },
      { y: 0, opacity: 1, duration: 0.38, ease: 'power3.out' }
    )
  }, [cluster.id])

  function close() {
    gsap.to(ref.current, {
      y: '100%', opacity: 0, duration: 0.28, ease: 'power2.in',
      onComplete: onClose,
    })
  }

  return (
    <div
      ref={ref}
      className="absolute bottom-0 left-0 right-0 z-[1000] bg-surface no-scrollbar"
      style={{ maxHeight: '62vh', overflowY: 'auto', borderTop: '1px solid var(--c-ink-faint)', transform: 'translateY(100%)', willChange: 'transform' }}
    >
      {/* Cabecera */}
      <div className="flex items-center justify-between px-6 py-4 sticky top-0 bg-surface z-10" style={{ borderBottom: '1px solid var(--c-ink-faint)' }}>
        <div>
          <h2 className="font-semibold leading-none text-ink" style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.8rem)', letterSpacing: '-0.02em' }}>
            {cluster.label}
          </h2>
          <p className="text-meta mt-1" style={{ color: 'var(--c-ink-dim)' }}>
            {cluster.photos.length} {cluster.photos.length === 1 ? 'fotograma' : 'fotogramas'}
          </p>
        </div>
        <button onClick={close} className="text-meta hover:opacity-50 transition-opacity" style={{ color: 'var(--c-ink-dim)' }}>✕</button>
      </div>

      {/* Grid miniaturas */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-px p-px">
        {cluster.photos.map(photo => (
          <button
            key={photo.id}
            className="aspect-[4/5] overflow-hidden relative group"
            onClick={() => onPhotoClick(photo)}
          >
            <img
              src={photo.thumb || photo.url}
              alt={photo.location}
              className="w-full h-full object-cover grayscale transition-transform duration-500 group-hover:scale-105"
            />
            <div
              className="absolute inset-0 flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ backgroundColor: 'rgba(0,0,0,0.72)' }}
            >
              <p className="text-meta" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.55rem' }}>
                {new Date(photo.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
              </p>
            </div>
          </button>
        ))}
      </div>
      <div className="h-6" />
    </div>
  )
}

// ── HTML del marcador Swiss ────────────────────────────────
function markerHtml(count, active) {
  const bg  = active ? 'var(--c-ink)'    : 'var(--c-surface)'
  const fg  = active ? 'var(--c-surface)' : 'var(--c-ink)'
  const bdr = active ? 'none' : '1px solid var(--c-ink)'
  return `<div style="
    width:48px;height:48px;
    background:${bg};color:${fg};border:${bdr};
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    font-family:'Inter',sans-serif;cursor:pointer;
    transition:transform 0.15s;transform:${active ? 'scale(1.15)' : 'scale(1)'}">
    <span style="font-size:1rem;font-weight:400;line-height:1.1">${count}</span>
    <span style="font-size:0.5rem;letter-spacing:0.15em;text-transform:uppercase;opacity:0.6;margin-top:1px">fotos</span>
  </div>`
}

// ── Mapa principal (Leaflet puro sin react-leaflet) ────────
export default function MapView() {
  const { photos, setSelectedPhoto } = usePhotos()
  const mapDivRef    = useRef(null)
  const mapRef       = useRef(null)   // instancia L.Map
  const markersRef   = useRef([])     // L.Marker[]
  const containerRef = useRef(null)
  const [activeCluster, setActiveCluster] = useState(null)

  const isDark = !document.documentElement.classList.contains('light')

  const clusters = useMemo(() => buildClusters(photos), [photos])

  // Tiles según tema
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

  // ── Inicializar mapa ───────────────────────────────────
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return

    const map = L.map(mapDivRef.current, {
      center:         [36, -8],
      zoom:           5,
      zoomControl:    false,
      attributionControl: true,
    })

    L.tileLayer(tileUrl, {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>',
      subdomains:  'abcd',
      maxZoom:     19,
    }).addTo(map)

    mapRef.current = map

    // Limpiar al desmontar
    return () => {
      map.remove()
      mapRef.current   = null
      markersRef.current = []
    }
  }, [])

  // ── Sincronizar marcadores cuando cambian clusters ─────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Limpiar marcadores anteriores
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    if (!clusters.length) return

    clusters.forEach(cluster => {
      const icon = L.divIcon({
        html:       markerHtml(cluster.photos.length, activeCluster?.id === cluster.id),
        className:  '',
        iconSize:   [48, 48],
        iconAnchor: [24, 24],
      })

      const marker = L.marker([cluster.lat, cluster.lng], { icon })
        .addTo(map)
        .on('click', () => {
          setActiveCluster(prev => prev?.id === cluster.id ? null : cluster)
        })

      markersRef.current.push(marker)
    })

    // Ajustar bounds
    if (clusters.length === 1) {
      map.setView([clusters[0].lat, clusters[0].lng], 11)
    } else {
      const bounds = L.latLngBounds(clusters.map(c => [c.lat, c.lng]))
      map.fitBounds(bounds, { padding: [80, 80] })
    }
  }, [clusters, activeCluster])

  // ── Actualizar iconos al cambiar cluster activo ────────
  useEffect(() => {
    markersRef.current.forEach((marker, i) => {
      const cluster = clusters[i]
      if (!cluster) return
      marker.setIcon(L.divIcon({
        html:       markerHtml(cluster.photos.length, activeCluster?.id === cluster.id),
        className:  '',
        iconSize:   [48, 48],
        iconAnchor: [24, 24],
      }))
    })
  }, [activeCluster, clusters])

  // ── Forzar invalidateSize cuando se monta la vista ────
  useEffect(() => {
    const t = setTimeout(() => mapRef.current?.invalidateSize(), 100)
    return () => clearTimeout(t)
  }, [])

  // ── Animar entrada ────────────────────────────────────
  useEffect(() => {
    gsap.fromTo(containerRef.current,
      { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' }
    )
  }, [])

  const handlePhotoClick = useCallback((photo) => {
    setSelectedPhoto(photo)
  }, [setSelectedPhoto])

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      style={{ height: 'calc(100vh - 200px)', minHeight: 400, opacity: 0 }}
    >
      {/* Contenedor del mapa Leaflet */}
      <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />

      {/* Panel inferior con fotos del cluster */}
      {activeCluster && (
        <PhotoPanel
          key={activeCluster.id}
          cluster={activeCluster}
          onClose={() => setActiveCluster(null)}
          onPhotoClick={handlePhotoClick}
        />
      )}

      {/* Leyenda */}
      {!activeCluster && clusters.length > 0 && (
        <div className="absolute bottom-5 left-5 z-[500]" style={{ pointerEvents: 'none' }}>
          <p className="text-meta" style={{ color: 'var(--c-ink-dim)' }}>
            {photos.filter(p => p.lat).length} fotogramas · {clusters.length} {clusters.length === 1 ? 'lugar' : 'lugares'}
          </p>
        </div>
      )}
    </div>
  )
}
