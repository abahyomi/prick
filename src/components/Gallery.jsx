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

// ─── Tarjeta de cuadrícula ───────────────────────────────────
function GridCard({ photo, index, onClick }) {
  const wrapRef    = useRef(null)
  const cardRef    = useRef(null)
  const imgRef     = useRef(null)
  const overlayRef = useRef(null)

  const depth = DEPTHS[DEPTH_SEQ[index % DEPTH_SEQ.length]]

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
        {/* Foto — siempre 4:5 con cover */}
        <div className="relative overflow-hidden aspect-[4/5] photo-placeholder">
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
// Fotos pequeñas (~w-14/20) para caber 6-8 por fold.
// Animación en dos pasos: imagen con wipe clip-path + texto con fade-rise.
function ListRow({ photo, index, onClick }) {
  const rowRef  = useRef(null)
  const imgRef  = useRef(null)
  const textRef = useRef(null)

  useEffect(() => {
    const row  = rowRef.current
    const img  = imgRef.current
    const txt  = textRef.current

    // Estados iniciales ocultos
    gsap.set(img, { clipPath: 'inset(0 100% 0 0)', filter: 'blur(4px)' })
    gsap.set(txt, { opacity: 0, y: 12 })

    const st = ScrollTrigger.create({
      trigger: row,
      start:   'top 97%',
      once:    true,
      onEnter: () => {
        const tl = gsap.timeline({ delay: (index % 4) * 0.045 })

        // Imagen: wipe de izquierda a derecha + desenfoque
        tl.to(img, {
          clipPath: 'inset(0 0% 0 0)',
          filter:   'blur(0px)',
          duration: 0.62,
          ease:     'power2.inOut',
        })
        // Texto: sube y aparece justo después
        .to(txt, {
          opacity:  1,
          y:        0,
          duration: 0.5,
          ease:     'power2.out',
        }, '-=0.38')
      },
    })

    return () => st.kill()
  }, [index])

  const handleEnter = useCallback(() => {
    gsap.to(imgRef.current, { scale: 1.05, duration: 0.45, ease: 'power2.out' })
  }, [])
  const handleLeave = useCallback(() => {
    gsap.to(imgRef.current, { scale: 1, duration: 0.45, ease: 'power2.inOut' })
  }, [])

  const onImgLoad = useCallback(e => e.target.classList.add('loaded'), [])

  const fecha = new Date(photo.date).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <div
      ref={rowRef}
      className="flex items-center gap-4 md:gap-6 py-3 md:py-4"
      onClick={() => onClick(photo)}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {/* Miniatura compacta — w-14 sm:w-16 md:w-20 */}
      <div className="w-14 sm:w-16 md:w-20 flex-shrink-0 overflow-hidden aspect-[2/3] photo-placeholder relative">
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

      {/* Metadatos compactos */}
      <div ref={textRef} className="flex flex-col justify-center min-w-0 flex-1 gap-1">
        <div className="flex items-baseline gap-3 min-w-0">
          <h3
            className="font-medium leading-none text-ink truncate"
            style={{ fontSize: 'clamp(0.78rem, 1.6vw, 1.05rem)', letterSpacing: '-0.01em' }}
          >
            {photo.location}
          </h3>
          <span className="text-meta flex-shrink-0" style={{ color: 'var(--c-ink-dim)' }}>
            {new Date(photo.date).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
          </span>
        </div>

        <p
          className="font-light leading-snug line-clamp-1"
          style={{ fontSize: '0.7rem', color: 'var(--c-ink-dim)' }}
        >
          {photo.description}
        </p>

        <div className="flex gap-3">
          {[photo.author, photo.camera].filter(Boolean).map((v, i) => (
            <span key={i} className="text-meta" style={{ color: 'var(--c-ink-dim)', opacity: 0.45 }}>
              {v}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Tarjeta galería infinita ────────────────────────────────
// Edge-to-edge, sin texto. Blur dinámico: max en bordes del viewport, cero en el centro.
function GaleriaCard({ photo, index, onClick }) {
  const cardRef = useRef(null)
  const imgRef  = useRef(null)

  useEffect(() => {
    const img = imgRef.current

    // Estado inicial: blur máximo, se limpia al entrar en el centro
    gsap.set(img, { filter: 'grayscale(1) blur(9px)', opacity: 0.35 })

    // Animación de aparición (solo la primera vez)
    gsap.fromTo(cardRef.current,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.45,
        ease: 'power2.out',
        delay: (index % 6) * 0.035,
        scrollTrigger: {
          trigger: cardRef.current,
          start:   'top 105%',
          toggleActions: 'play none none none',
        },
      }
    )

    // Blur continuo según posición en el viewport
    // Zona central (15%–85% del recorrido): nítido
    // Bordes (0–15% y 85–100%): blur progresivo hasta 9px
    const setFilter  = gsap.quickSetter(img, 'filter')
    const setOpacity = gsap.quickSetter(img, 'opacity')

    const blurST = ScrollTrigger.create({
      trigger: cardRef.current,
      start:   'top bottom',
      end:     'bottom top',
      onUpdate(self) {
        const p = self.progress
        let blur = 0
        let alpha = 1

        if (p < 0.15) {
          const t = p / 0.15
          blur  = (1 - t) * 9
          alpha = 0.35 + t * 0.65
        } else if (p > 0.85) {
          const t = (p - 0.85) / 0.15
          blur  = t * 9
          alpha = 1 - t * 0.65
        }

        setFilter(`grayscale(1) blur(${blur.toFixed(1)}px)`)
        setOpacity(alpha)
      },
    })

    return () => {
      blurST.kill()
      ScrollTrigger.getAll()
        .filter(t => t.trigger === cardRef.current)
        .forEach(t => t.kill())
    }
  }, [index])

  const handleEnter = useCallback(() => {
    gsap.to(imgRef.current, { scale: 1.04, duration: 0.5, ease: 'power2.out' })
  }, [])
  const handleLeave = useCallback(() => {
    gsap.to(imgRef.current, { scale: 1, duration: 0.5, ease: 'power2.inOut' })
  }, [])

  const onImgLoad = useCallback(e => e.target.classList.add('loaded'), [])

  return (
    <div
      ref={cardRef}
      className="aspect-[4/5] overflow-hidden relative"
      style={{ opacity: 0 }}
      onClick={() => onClick(photo)}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <img
        ref={imgRef}
        src={photo.thumb || photo.url}
        alt=""
        loading="lazy"
        onLoad={onImgLoad}
        className="lazy-fade w-full h-full object-cover absolute inset-0"
        style={{ willChange: 'transform, filter' }}
      />
    </div>
  )
}

// ─── Tarjeta "+" para añadir ────────────────────────────────
function AddCard({ onClick, tall = true }) {
  const ref = useRef(null)

  useEffect(() => {
    gsap.fromTo(ref.current,
      { opacity: 0 },
      {
        opacity: 1, duration: 0.5, ease: 'power2.out',
        scrollTrigger: {
          trigger: ref.current, start: 'top 98%',
          toggleActions: 'play none none none',
        },
      }
    )
    return () => ScrollTrigger.getAll()
      .filter(t => t.trigger === ref.current).forEach(t => t.kill())
  }, [])

  return (
    <div
      ref={ref}
      className={`${tall ? 'aspect-[4/5]' : 'aspect-[4/5]'} flex items-center justify-center`}
      style={{
        opacity:    0,
        border:     '1px dashed rgba(var(--c-ink-rgb), 0.14)',
        transition: 'border-color 0.2s',
      }}
      onClick={onClick}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(var(--c-ink-rgb), 0.5)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(var(--c-ink-rgb), 0.14)')}
    >
      <span style={{ fontSize: '1.4rem', fontWeight: 200, color: 'var(--c-ink-dim)', lineHeight: 1 }}>
        +
      </span>
    </div>
  )
}

// ─── Galería principal ────────────────────────────────────────
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

  const VIEWS = [['grid', 'Cuadrícula'], ['list', 'Lista'], ['galeria', 'Galería']]

  return (
    <section className="overflow-visible">
      {/* Barra de controles */}
      <div className="flex items-center justify-between px-8 pt-2 pb-10">
        <span className="text-meta" style={{ color: 'var(--c-ink-dim)' }}>
          {photos.length.toString().padStart(3, '0')}
        </span>
        <div className="flex gap-6">
          {VIEWS.map(([m, label]) => (
            <button
              key={m}
              onClick={() => setView(m)}
              className="text-meta transition-all"
              style={{
                color:   view === m ? 'var(--c-ink)' : 'var(--c-ink-dim)',
                opacity: view === m ? 1 : 0.65,
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
          <AddCard onClick={() => setUploadModalOpen(true)} />
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

      {/* Vista galería infinita — sin texto, edge-to-edge, 6 col en desktop */}
      {view === 'galeria' && (
        <div
          key="galeria"
          className="view-enter grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
          style={{ gap: 0 }}
        >
          {photos.map((photo, i) => (
            <GaleriaCard key={photo.id} photo={photo} index={i} onClick={setSelectedPhoto} />
          ))}
          {/* Última celda: añadir foto */}
          <div
            className="aspect-[4/5] flex items-center justify-center"
            style={{ backgroundColor: 'rgba(var(--c-ink-rgb), 0.03)', transition: 'background-color 0.2s' }}
            onClick={() => setUploadModalOpen(true)}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(var(--c-ink-rgb), 0.08)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(var(--c-ink-rgb), 0.03)')}
          >
            <span style={{ fontSize: '1.2rem', fontWeight: 200, color: 'var(--c-ink-dim)' }}>+</span>
          </div>
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
