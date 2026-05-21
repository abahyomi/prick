import React, { useEffect, useRef, useState, useCallback } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { usePhotos } from '../context/PhotoContext'

gsap.registerPlugin(ScrollTrigger)

// ─── Profundidad Z ──────────────────────────────────────────
const DEPTH_SEQ = [1, 0, 2, 0, 1, 2, 0, 1, 0, 2]
const DEPTHS = [
  { parallaxY:  -8, scale: 0.965, shadow: 'none' },
  { parallaxY: -20, scale: 1.000, shadow: 'var(--shadow-float)' },
  { parallaxY: -38, scale: 1.032, shadow: 'var(--shadow-float-up)' },
]
const ASPECTS = ['aspect-[3/4]', 'aspect-[4/5]', 'aspect-square', 'aspect-[4/5]', 'aspect-[3/4]']

// ─── Tarjeta de cuadrícula ───────────────────────────────────
function GridCard({ photo, index, onClick }) {
  const wrapRef    = useRef(null)
  const cardRef    = useRef(null)
  const imgRef     = useRef(null)
  const overlayRef = useRef(null)

  const depth  = DEPTHS[DEPTH_SEQ[index % DEPTH_SEQ.length]]
  const aspect = ASPECTS[index % ASPECTS.length]

  useEffect(() => {
    // Aparición suave: blur + sube
    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 22, filter: 'blur(5px)' },
      {
        opacity: 1, y: 0, filter: 'blur(0px)',
        duration: 0.85,
        ease: 'power2.out',
        delay: (index % 6) * 0.05,
        scrollTrigger: {
          trigger: wrapRef.current,
          start:   'top 97%',
          toggleActions: 'play none none none',
        },
      }
    )

    // Paralaje diferenciado por capa
    gsap.to(wrapRef.current, {
      y: depth.parallaxY,
      ease: 'none',
      scrollTrigger: {
        trigger: wrapRef.current,
        start: 'top bottom',
        end:   'bottom top',
        scrub: 2.5,
      },
    })

    return () => ScrollTrigger.getAll()
      .filter(t => t.trigger === wrapRef.current)
      .forEach(t => t.kill())
  }, [index, depth.parallaxY])

  // Inclinación 3D suave
  const handleMouseMove = useCallback((e) => {
    const rect = cardRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 2
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 2
    gsap.to(cardRef.current, {
      rotateY: x * 8, rotateX: -y * 8,
      transformPerspective: 700,
      duration: 0.45, ease: 'power2.out',
    })
    gsap.to(imgRef.current, {
      x: x * 4, y: y * 4, scale: 1.07,
      duration: 0.45, ease: 'power2.out',
    })
  }, [])

  const handleEnter = useCallback(() => {
    gsap.to(overlayRef.current, { opacity: 1, duration: 0.28 })
  }, [])

  const handleLeave = useCallback(() => {
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.28 })
    gsap.to(imgRef.current, { x: 0, y: 0, scale: 1, duration: 0.55, ease: 'power2.inOut' })
    gsap.to(cardRef.current, {
      rotateX: 0, rotateY: 0,
      duration: 0.75, ease: 'elastic.out(1, 0.55)',
    })
  }, [])

  const handleClick = useCallback(async () => {
    await gsap.to(cardRef.current, {
      scale: 0.95, duration: 0.1, ease: 'power2.in',
      yoyo: true, repeat: 1,
    })
    onClick(photo)
  }, [photo, onClick])

  // Fade cuando la imagen carga
  const onImgLoad = useCallback((e) => {
    e.target.classList.add('loaded')
  }, [])

  return (
    <div ref={wrapRef} style={{ willChange: 'transform' }}>
      <div
        ref={cardRef}
        style={{
          opacity: 0,
          transform: `scale(${depth.scale})`,
          transformOrigin: 'center bottom',
          boxShadow: depth.shadow,
          willChange: 'transform',
        }}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        {/* Foto */}
        <div
          className={`relative overflow-hidden ${aspect} photo-placeholder`}
        >
          <img
            ref={imgRef}
            src={photo.thumb || photo.url}
            alt={photo.location}
            loading="lazy"
            onLoad={onImgLoad}
            className="lazy-fade w-full h-full object-cover grayscale absolute inset-0"
            style={{ willChange: 'transform' }}
          />

          {/* Overlay siempre negro */}
          <div
            ref={overlayRef}
            className="absolute inset-0 flex flex-col justify-end p-3 opacity-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.78)', willChange: 'opacity' }}
          >
            <p
              className="font-light leading-snug line-clamp-2"
              style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.82)' }}
            >
              {photo.description}
            </p>
            <p className="text-meta mt-2" style={{ color: 'rgba(255,255,255,0.38)' }}>
              {photo.author}
            </p>
          </div>
        </div>

        {/* Solo lugar */}
        <p
          className="text-meta mt-2 truncate"
          style={{ color: 'var(--c-ink-dim)' }}
        >
          {photo.location}
        </p>
      </div>
    </div>
  )
}

// ─── Fila de lista ───────────────────────────────────────────
function ListRow({ photo, index, onClick }) {
  const rowRef = useRef(null)
  const imgRef = useRef(null)

  useEffect(() => {
    gsap.fromTo(rowRef.current,
      { opacity: 0, x: -28, filter: 'blur(3px)' },
      {
        opacity: 1, x: 0, filter: 'blur(0px)',
        duration: 0.7, ease: 'power2.out',
        delay: (index % 3) * 0.07,
        scrollTrigger: {
          trigger: rowRef.current,
          start:   'top 96%',
          toggleActions: 'play none none none',
        },
      }
    )

    return () => ScrollTrigger.getAll()
      .filter(t => t.trigger === rowRef.current)
      .forEach(t => t.kill())
  }, [index])

  const handleEnter = useCallback(() => {
    gsap.to(imgRef.current, { scale: 1.04, duration: 0.5, ease: 'power2.out' })
  }, [])
  const handleLeave = useCallback(() => {
    gsap.to(imgRef.current, { scale: 1, duration: 0.5, ease: 'power2.inOut' })
  }, [])

  const onImgLoad = useCallback(e => e.target.classList.add('loaded'), [])

  const fecha = new Date(photo.date).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <div
      ref={rowRef}
      className="flex gap-8 md:gap-12 py-10"
      style={{ opacity: 0 }}
      onClick={() => onClick(photo)}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {/* Miniatura */}
      <div className="w-28 md:w-48 lg:w-60 flex-shrink-0 overflow-hidden aspect-[3/4] photo-placeholder relative">
        <img
          ref={imgRef}
          src={photo.thumb || photo.url}
          alt={photo.location}
          loading="lazy"
          onLoad={onImgLoad}
          className="lazy-fade w-full h-full object-cover grayscale absolute inset-0"
          style={{ willChange: 'transform' }}
        />
      </div>

      {/* Metadatos */}
      <div className="flex flex-col justify-between py-1 min-w-0 flex-1">
        <div>
          <p className="text-meta mb-3" style={{ color: 'var(--c-ink-dim)' }}>
            {fecha}
          </p>
          <h3
            className="font-semibold leading-none text-ink"
            style={{ fontSize: 'clamp(1.2rem, 3vw, 2.6rem)', letterSpacing: '-0.025em' }}
          >
            {photo.location}
          </h3>
          <p
            className="font-light mt-4 max-w-xl leading-relaxed"
            style={{ fontSize: '0.82rem', color: 'var(--c-ink-dim)' }}
          >
            {photo.description}
          </p>
        </div>

        {/* Técnica mínima */}
        <div className="flex flex-wrap gap-4 mt-5">
          {[photo.camera, photo.iso && `ISO ${photo.iso}`, photo.aperture, photo.author]
            .filter(Boolean)
            .map((v, i) => (
              <span key={i} className="text-meta" style={{ color: 'var(--c-ink-dim)', opacity: 0.55 }}>
                {v}
              </span>
            ))}
        </div>
      </div>
    </div>
  )
}

// ─── Galería ─────────────────────────────────────────────────
export default function Gallery() {
  const { photos, setSelectedPhoto, setUploadModalOpen } = usePhotos()
  const [view, setView] = useState('grid')

  useEffect(() => {
    const id = setTimeout(() => ScrollTrigger.refresh(), 150)
    return () => clearTimeout(id)
  }, [photos.length, view])

  if (photos.length === 0) {
    return (
      <section className="px-8 py-48 flex flex-col items-center gap-8">
        <p className="text-meta" style={{ color: 'var(--c-ink-dim)' }}>
          Sin fotogramas aún.
        </p>
        <button
          onClick={() => setUploadModalOpen(true)}
          className="text-meta transition-opacity"
          style={{ color: 'var(--c-ink-dim)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--c-ink)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--c-ink-dim)')}
        >
          + Añadir el primero
        </button>
      </section>
    )
  }

  return (
    <section className="overflow-visible">
      {/* Barra de controles */}
      <div className="flex items-center justify-between px-8 pt-2 pb-10">
        <span className="text-meta" style={{ color: 'var(--c-ink-dim)' }}>
          {photos.length.toString().padStart(3, '0')}
        </span>
        <div className="flex gap-7">
          {[['grid', 'Cuadrícula'], ['list', 'Lista']].map(([m, label]) => (
            <button
              key={m}
              onClick={() => setView(m)}
              className="text-meta transition-all"
              style={{
                color:   view === m ? 'var(--c-ink)' : 'var(--c-ink-dim)',
                opacity: view === m ? 1 : 0.7,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Vista cuadrícula */}
      {view === 'grid' && (
        <div
          key="grid"
          className="view-enter grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-5 gap-y-16 px-8 pb-32 overflow-visible"
        >
          {photos.map((photo, i) => (
            <GridCard key={photo.id} photo={photo} index={i} onClick={setSelectedPhoto} />
          ))}
        </div>
      )}

      {/* Vista lista */}
      {view === 'list' && (
        <div key="list" className="view-enter list-rows px-8 pb-32">
          {photos.map((photo, i) => (
            <ListRow key={photo.id} photo={photo} index={i} onClick={setSelectedPhoto} />
          ))}
        </div>
      )}

      {/* Pie */}
      <div
        className="flex justify-between px-8 py-10"
        style={{ borderTop: '1px solid var(--c-ink-faint)' }}
      >
        <span className="text-meta" style={{ color: 'var(--c-ink-dim)', opacity: 0.5 }}>PRICK</span>
        <span className="text-meta" style={{ color: 'var(--c-ink-dim)', opacity: 0.5 }}>Abahyomi &amp; Alexandra</span>
      </div>
    </section>
  )
}
