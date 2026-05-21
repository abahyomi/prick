import React, { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { usePhotos } from '../context/PhotoContext'

gsap.registerPlugin(ScrollTrigger)

// ─── Depth Z-layers ─────────────────────────────────────────
const DEPTH_SEQ = [1, 0, 2, 0, 1, 2, 0, 1, 0, 2]
const DEPTHS = [
  { parallaxY:  -8, scale: 0.96, shadow: 'none' },
  { parallaxY: -22, scale: 1.00, shadow: 'var(--shadow-float)' },
  { parallaxY: -40, scale: 1.04, shadow: 'var(--shadow-float-up)' },
]
const ASPECTS = ['aspect-[3/4]', 'aspect-[4/5]', 'aspect-square', 'aspect-[4/5]', 'aspect-[3/4]']

// ─── Grid card ──────────────────────────────────────────────
function GridCard({ photo, index, onClick }) {
  const wrapRef    = useRef(null)
  const cardRef    = useRef(null)
  const imgRef     = useRef(null)
  const overlayRef = useRef(null)

  const depth  = DEPTHS[DEPTH_SEQ[index % DEPTH_SEQ.length]]
  const aspect = ASPECTS[index % ASPECTS.length]

  useEffect(() => {
    // Aparecer: fade + sube
    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 24, filter: 'blur(4px)' },
      {
        opacity: 1, y: 0, filter: 'blur(0px)',
        duration: 0.8,
        ease: 'power2.out',
        delay: (index % 6) * 0.055,
        scrollTrigger: {
          trigger: wrapRef.current,
          start: 'top 97%',
          toggleActions: 'play none none none',
        },
      }
    )

    // Paralaje por capa
    gsap.to(wrapRef.current, {
      y: depth.parallaxY,
      ease: 'none',
      scrollTrigger: {
        trigger: wrapRef.current,
        start:   'top bottom',
        end:     'bottom top',
        scrub:   2.5,
      },
    })

    return () => ScrollTrigger.getAll()
      .filter(t => t.trigger === wrapRef.current)
      .forEach(t => t.kill())
  }, [index, depth.parallaxY])

  // Inclinación 3D al mover el ratón
  function handleMouseMove(e) {
    const rect = cardRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 2
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 2

    gsap.to(cardRef.current, {
      rotateY:            x * 9,
      rotateX:            -y * 9,
      transformPerspective: 600,
      duration: 0.4,
      ease: 'power2.out',
    })
    gsap.to(imgRef.current, {
      x: x * 5, y: y * 5,
      scale: 1.07,
      duration: 0.4,
      ease: 'power2.out',
    })
  }

  function handleEnter() {
    gsap.to(overlayRef.current, { opacity: 1, duration: 0.3 })
  }

  function handleLeave() {
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.3 })
    gsap.to(imgRef.current, { x: 0, y: 0, scale: 1, duration: 0.55, ease: 'power2.inOut' })
    gsap.to(cardRef.current, {
      rotateX: 0, rotateY: 0,
      duration: 0.7,
      ease: 'elastic.out(1, 0.6)',
    })
  }

  async function handleClick() {
    await gsap.to(cardRef.current, {
      scale: 0.96, duration: 0.12, ease: 'power2.in',
      yoyo: true, repeat: 1,
    })
    onClick(photo)
  }

  return (
    <div ref={wrapRef} style={{ willChange: 'transform' }}>
      <div
        ref={cardRef}
        style={{
          opacity:         0,
          transform:       `scale(${depth.scale})`,
          transformOrigin: 'center bottom',
          boxShadow:       depth.shadow,
          willChange:      'transform',
        }}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        {/* Foto sin bordes */}
        <div className={`relative overflow-hidden ${aspect}`}>
          <img
            ref={imgRef}
            src={photo.thumb || photo.url}
            alt={photo.location}
            loading="lazy"
            className="w-full h-full object-cover grayscale"
            style={{ willChange: 'transform' }}
          />

          {/* Overlay — siempre negro */}
          <div
            ref={overlayRef}
            className="absolute inset-0 flex flex-col justify-end p-3 opacity-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.80)', willChange: 'opacity' }}
          >
            <p className="font-light text-xs leading-snug line-clamp-2" style={{ color: 'rgba(255,255,255,0.85)' }}>
              {photo.description}
            </p>
            <p className="text-meta mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{photo.author}</p>
          </div>
        </div>

        {/* Solo lugar */}
        <p className="text-meta mt-2 truncate" style={{ color: 'var(--c-ink-dim)' }}>
          {photo.location}
        </p>
      </div>
    </div>
  )
}

// ─── Fila de lista ──────────────────────────────────────────
function ListRow({ photo, index, onClick }) {
  const rowRef = useRef(null)
  const imgRef = useRef(null)

  useEffect(() => {
    gsap.fromTo(rowRef.current,
      { opacity: 0, x: -32, filter: 'blur(3px)' },
      {
        opacity: 1, x: 0, filter: 'blur(0px)',
        duration: 0.7,
        ease: 'power2.out',
        delay: (index % 3) * 0.08,
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

  function handleEnter() { gsap.to(imgRef.current, { scale: 1.04, duration: 0.5, ease: 'power2.out' }) }
  function handleLeave() { gsap.to(imgRef.current, { scale: 1,    duration: 0.5, ease: 'power2.inOut' }) }

  const fecha = new Date(photo.date).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <div
      ref={rowRef}
      className="flex gap-8 md:gap-14 py-10"
      style={{ opacity: 0 }}
      onClick={() => onClick(photo)}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <div className="w-32 md:w-52 lg:w-64 flex-shrink-0 overflow-hidden aspect-[3/4]">
        <img
          ref={imgRef}
          src={photo.thumb || photo.url}
          alt={photo.location}
          loading="lazy"
          className="w-full h-full object-cover grayscale"
          style={{ willChange: 'transform' }}
        />
      </div>

      <div className="flex flex-col justify-between py-1 min-w-0">
        <div>
          <p className="text-meta mb-3" style={{ color: 'var(--c-ink-dim)' }}>{fecha}</p>
          <h3
            className="font-semibold leading-tight text-ink"
            style={{ fontSize: 'clamp(1.3rem, 3vw, 2.8rem)', letterSpacing: '-0.02em' }}
          >
            {photo.location}
          </h3>
          <p
            className="font-light text-sm leading-relaxed mt-3 max-w-lg"
            style={{ color: 'var(--c-ink-dim)', fontSize: '0.82rem' }}
          >
            {photo.description}
          </p>
        </div>
        <p className="text-meta mt-5" style={{ color: 'var(--c-ink-dim)', opacity: 0.6 }}>{photo.author}</p>
      </div>
    </div>
  )
}

// ─── Galería principal ──────────────────────────────────────
export default function Gallery() {
  const { photos, setSelectedPhoto, setUploadModalOpen } = usePhotos()
  const [view, setView] = useState('grid')

  useEffect(() => {
    const id = setTimeout(() => ScrollTrigger.refresh(), 120)
    return () => clearTimeout(id)
  }, [photos.length, view])

  if (photos.length === 0) {
    return (
      <section className="px-8 py-40 flex flex-col items-center gap-6">
        <p className="text-meta" style={{ color: 'var(--c-ink-dim)' }}>Sin fotogramas.</p>
        <button
          onClick={() => setUploadModalOpen(true)}
          className="text-meta hover:opacity-100 transition-opacity"
          style={{ color: 'var(--c-ink-dim)' }}
        >
          + Añadir el primero
        </button>
      </section>
    )
  }

  return (
    <section className="overflow-visible">
      {/* Barra de herramientas */}
      <div className="flex items-center justify-between px-8 pt-4 pb-10">
        <span className="text-meta" style={{ color: 'var(--c-ink-dim)' }}>
          {photos.length.toString().padStart(3, '0')}
        </span>
        <div className="flex gap-7">
          {[['grid','Cuadrícula'],['list','Lista']].map(([m, label]) => (
            <button
              key={m}
              onClick={() => setView(m)}
              className="text-meta transition-opacity"
              style={{ color: view === m ? 'var(--c-ink)' : 'var(--c-ink-dim)' }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Cuadrícula — 6 col en xl, fotos pequeñas flotando */}
      {view === 'grid' && (
        <div
          key="grid"
          className="view-enter grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-20 px-8 pb-32 overflow-visible"
        >
          {photos.map((photo, i) => (
            <GridCard key={photo.id} photo={photo} index={i} onClick={setSelectedPhoto} />
          ))}
        </div>
      )}

      {/* Lista — filas editoriales */}
      {view === 'list' && (
        <div key="list" className="view-enter px-8 pb-32">
          {photos.map((photo, i) => (
            <ListRow key={photo.id} photo={photo} index={i} onClick={setSelectedPhoto} />
          ))}
        </div>
      )}

      <div className="flex justify-between px-8 py-12">
        <span className="text-meta" style={{ color: 'var(--c-ink-dim)', opacity: 0.4 }}>PRICK</span>
        <span className="text-meta" style={{ color: 'var(--c-ink-dim)', opacity: 0.4 }}>Abahyomi &amp; Alexandra</span>
      </div>
    </section>
  )
}
