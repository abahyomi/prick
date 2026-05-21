import React, { useState, useEffect, useRef, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import { gsap } from 'gsap'
import 'leaflet/dist/leaflet.css'
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

// ── Agrupa fotos por proximidad (radio en km) ──────────────
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
      // Recalcular centroide
      clusters[best].lat = clusters[best].photos.reduce((s, p) => s + p.lat, 0) / clusters[best].photos.length
      clusters[best].lng = clusters[best].photos.reduce((s, p) => s + p.lng, 0) / clusters[best].photos.length
    } else {
      clusters.push({ lat: photo.lat, lng: photo.lng, photos: [photo] })
    }
  })

  // Etiquetar con la localización más frecuente
  return clusters.map((c, i) => {
    const freq = {}
    c.photos.forEach(p => {
      // Usar la última parte (ciudad) como etiqueta
      const city = p.location?.split(',').pop()?.trim() || p.location || '?'
      freq[city] = (freq[city] || 0) + 1
    })
    const label = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
    return { ...c, id: i, label }
  })
}

// ── Ícono de marcador (div personalizado, estilo Swiss) ────
function makeIcon(count, active) {
  const size = 44
  return L.divIcon({
    html: `
      <div style="
        width:${size}px; height:${size}px;
        background:var(--c-ink); color:var(--c-surface);
        display:flex; flex-direction:column;
        align-items:center; justify-content:center;
        font-family:'Inter',sans-serif;
        font-size:0.6rem; letter-spacing:0.15em;
        font-weight:500; text-transform:uppercase;
        transition: transform 0.2s;
        transform: ${active ? 'scale(1.18)' : 'scale(1)'};
        box-shadow: ${active ? '0 0 0 2px var(--c-surface)' : 'none'};
      ">
        <span style="font-size:0.95rem; font-weight:400; letter-spacing:0; line-height:1.1">${count}</span>
        <span style="opacity:0.55; margin-top:2px">fotos</span>
      </div>`,
    className: '',
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

// ── Ajusta el mapa a los bounds de los clusters ────────────
function FitBounds({ clusters }) {
  const map = useMap()
  useEffect(() => {
    if (!clusters.length) return
    if (clusters.length === 1) {
      map.setView([clusters[0].lat, clusters[0].lng], 11)
    } else {
      const bounds = L.latLngBounds(clusters.map(c => [c.lat, c.lng]))
      map.fitBounds(bounds, { padding: [80, 80] })
    }
  }, [clusters.length])
  return null
}

// ── Panel inferior con fotos del cluster ──────────────────
function PhotoPanel({ cluster, onClose, onPhotoClick }) {
  const panelRef = useRef(null)

  useEffect(() => {
    gsap.fromTo(panelRef.current,
      { y: '100%', opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }
    )
  }, [cluster.id])

  function close() {
    gsap.to(panelRef.current, {
      y: '100%', opacity: 0, duration: 0.3, ease: 'power2.in',
      onComplete: onClose,
    })
  }

  return (
    <div
      ref={panelRef}
      className="absolute bottom-0 left-0 right-0 z-[400] bg-surface no-scrollbar"
      style={{
        maxHeight:    '62vh',
        overflowY:    'auto',
        borderTop:    '1px solid var(--c-ink-faint)',
        transform:    'translateY(100%)',
        willChange:   'transform',
      }}
    >
      {/* Cabecera */}
      <div
        className="flex items-center justify-between px-6 py-4 sticky top-0 bg-surface z-10"
        style={{ borderBottom: '1px solid var(--c-ink-faint)' }}
      >
        <div>
          <h2
            className="font-semibold leading-none text-ink"
            style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.8rem)', letterSpacing: '-0.02em' }}
          >
            {cluster.label}
          </h2>
          <p className="text-meta mt-1" style={{ color: 'var(--c-ink-dim)' }}>
            {cluster.photos.length} {cluster.photos.length === 1 ? 'fotograma' : 'fotogramas'}
          </p>
        </div>
        <button
          onClick={close}
          className="text-meta hover:opacity-50 transition-opacity"
          style={{ color: 'var(--c-ink-dim)' }}
        >
          ✕
        </button>
      </div>

      {/* Grid de fotos */}
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
                {new Date(photo.date).toLocaleDateString('es-ES', { day:'2-digit', month:'short' })}
              </p>
            </div>
          </button>
        ))}
      </div>
      <div className="h-6" />
    </div>
  )
}

// ── Vista principal del mapa ───────────────────────────────
export default function MapView() {
  const { photos, setSelectedPhoto } = usePhotos()
  const [activeCluster, setActiveCluster] = useState(null)
  const containerRef = useRef(null)

  // Detectar si dark mode está activo
  const isDark = document.documentElement.classList.contains('light') === false

  const clusters = useMemo(() => buildClusters(photos), [photos])

  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

  // Animar entrada
  useEffect(() => {
    gsap.fromTo(containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.4, ease: 'power2.out' }
    )
  }, [])

  function handleMarkerClick(cluster) {
    setActiveCluster(prev => prev?.id === cluster.id ? null : cluster)
  }

  function handlePhotoClick(photo) {
    setSelectedPhoto(photo)
  }

  return (
    <div ref={containerRef} className="relative" style={{ height: 'calc(100vh - 1px)', opacity: 0 }}>
      <MapContainer
        center={[36, -8]}
        zoom={5}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        attributionControl={true}
      >
        <TileLayer
          url={tileUrl}
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />

        <FitBounds clusters={clusters} />

        {clusters.map(cluster => (
          <Marker
            key={cluster.id}
            position={[cluster.lat, cluster.lng]}
            icon={makeIcon(cluster.photos.length, activeCluster?.id === cluster.id)}
            eventHandlers={{ click: () => handleMarkerClick(cluster) }}
          />
        ))}
      </MapContainer>

      {/* Panel de fotos del cluster seleccionado */}
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
        <div
          className="absolute bottom-6 left-6 z-[400]"
          style={{ pointerEvents: 'none' }}
        >
          <p className="text-meta" style={{ color: 'var(--c-ink-dim)' }}>
            {photos.filter(p => p.lat).length} fotogramas geolocalizados
          </p>
        </div>
      )}
    </div>
  )
}
