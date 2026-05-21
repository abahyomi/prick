import React, { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { usePhotos } from '../context/PhotoContext'

gsap.registerPlugin(ScrollTrigger)

// ─── Depth system (3 Z-layers) ─────────────────────────────
const DEPTH_SEQ = [2, 0, 1, 0, 2, 1, 0, 2, 0, 1] // cycles per index
const DEPTHS = [
  { parallaxY: -10, scale: 0.965, shadow: 'none' },                  // far
  { parallaxY: -26, scale: 1.000, shadow: 'var(--shadow-float)' },    // mid
  { parallaxY: -44, scale: 1.030, shadow: 'var(--shadow-float-up)' }, // close
]
const ASPECTS = ['aspect-[3/4]', 'aspect-square', 'aspect-[4/5]', 'aspect-square', 'aspect-[3/4]']

// ─── Grid card ──────────────────────────────────────────────
function GridCard({ photo, index, onClick }) {
  const wrapRef    = useRef(null) // parallax target
  const cardRef    = useRef(null) // reveal target
  const imgRef     = useRef(null)
  const overlayRef = useRef(null)

  const depth  = DEPTHS[DEPTH_SEQ[index % DEPTH_SEQ.length]]
  const aspect = ASPECTS[index % ASPECTS.length]

  useEffect(() => {
    // Entrance: subtle lift-in, staggered by column position
    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power2.out',
        delay: (index % 5) * 0.06,
        scrollTrigger: {
          trigger: wrapRef.current,
          start: 'top 96%',
          toggleActions: 'play none none none',
        },
      }
    )

    // Per-layer parallax scroll
    gsap.to(wrapRef.current, {
      y: depth.parallaxY,
      ease: 'none',
      scrollTrigger: {
        trigger: wrapRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 2.2,
      },
    })

    return () => ScrollTrigger.getAll().forEach((t) => {
      if (t.trigger === wrapRef.current) t.kill()
    })
  }, [index, depth.parallaxY])

  function handleEnter() {
    gsap.to(imgRef.current,     { scale: 1.06, duration: 0.55, ease: 'power2.out' })
    gsap.to(overlayRef.current, { opacity: 1,  duration: 0.28 })
  }
  function handleLeave() {
    gsap.to(imgRef.current,     { scale: 1,   duration: 0.55, ease: 'power2.inOut' })
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.28 })
  }

  return (
    <div ref={wrapRef} style={{ willChange: 'transform' }}>
      <div
        ref={cardRef}
        className="cursor-pointer"
        style={{
          opacity: 0,
          transform: `scale(${depth.scale})`,
          transformOrigin: 'center bottom',
          boxShadow: depth.shadow,
        }}
        onClick={() => onClick(photo)}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        {/* Photo — no border */}
        <div className={`relative overflow-hidden ${aspect}`}>
          <img
            ref={imgRef}
            src={photo.thumb || photo.url}
            alt={photo.description}
            loading="lazy"
            className="w-full h-full object-cover grayscale"
            style={{ willChange: 'transform' }}
          />

          {/* Overlay — hardcoded black so it never goes white in dark mode */}
          <div
            ref={overlayRef}
            className="absolute inset-0 flex flex-col justify-end p-3 opacity-0"
            style={{ willChange: 'opacity', backgroundColor: 'rgba(0,0,0,0.82)' }}
          >
            <p className="font-light text-xs leading-snug line-clamp-3" style={{ color: '#fff' }}>
              {photo.description}
            </p>
            <p className="text-meta mt-2 opacity-60" style={{ color: '#fff' }}>{photo.author}</p>
          </div>
        </div>

        {/* Caption */}
        <div className="flex items-baseline justify-between pt-2">
          <span className="text-meta opacity-40">{photo.location}</span>
          <span className="text-meta opacity-25">
            {new Date(photo.date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── List row ───────────────────────────────────────────────
function ListRow({ photo, index, onClick }) {
  const rowRef = useRef(null)
  const imgRef = useRef(null)

  useEffect(() => {
    gsap.fromTo(rowRef.current,
      { opacity: 0, x: -28 },
      {
        opacity: 1,
        x: 0,
        duration: 0.65,
        ease: 'power2.out',
        delay: (index % 4) * 0.07,
        scrollTrigger: {
          trigger: rowRef.current,
          start: 'top 95%',
          toggleActions: 'play none none none',
        },
      }
    )

    return () => ScrollTrigger.getAll().forEach((t) => {
      if (t.trigger === rowRef.current) t.kill()
    })
  }, [index])

  function handleEnter() { gsap.to(imgRef.current, { scale: 1.04, duration: 0.5, ease: 'power2.out' }) }
  function handleLeave() { gsap.to(imgRef.current, { scale: 1,    duration: 0.5, ease: 'power2.inOut' }) }

  const formatted = new Date(photo.date).toLocaleDateString('en-GB', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <div
      ref={rowRef}
      className="flex gap-8 md:gap-14 cursor-pointer py-10"
      style={{ opacity: 0 }}
      onClick={() => onClick(photo)}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {/* Photo */}
      <div className="w-36 md:w-56 lg:w-72 flex-shrink-0 overflow-hidden aspect-[3/4]">
        <img
          ref={imgRef}
          src={photo.thumb || photo.url}
          alt={photo.description}
          loading="lazy"
          className="w-full h-full object-cover grayscale"
          style={{ willChange: 'transform' }}
        />
      </div>

      {/* Metadata */}
      <div className="flex flex-col justify-between py-1 min-w-0">
        <div>
          <p className="text-meta opacity-30 mb-3">{formatted}</p>
          <h3
            className="font-black leading-none text-ink"
            style={{ fontSize: 'clamp(1.4rem, 3.5vw, 3.2rem)', letterSpacing: '-0.03em' }}
          >
            {photo.location}
          </h3>
          <p className="font-light text-sm leading-relaxed mt-4 opacity-60 max-w-xl">
            {photo.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-4 mt-5">
          {photo.camera   && <span className="text-meta opacity-25">{photo.camera}</span>}
          {photo.iso      && <span className="text-meta opacity-25">ISO {photo.iso}</span>}
          {photo.aperture && <span className="text-meta opacity-25">{photo.aperture}</span>}
          {photo.shutter  && <span className="text-meta opacity-25">{photo.shutter}</span>}
          {photo.author   && <span className="text-meta opacity-25">{photo.author}</span>}
        </div>
      </div>
    </div>
  )
}

// ─── Gallery ────────────────────────────────────────────────
export default function Gallery() {
  const { photos, setSelectedPhoto, setUploadModalOpen } = usePhotos()
  const [view, setView] = useState('grid')

  useEffect(() => {
    // Small delay so new DOM is laid out before ScrollTrigger measures
    const id = setTimeout(() => ScrollTrigger.refresh(), 100)
    return () => clearTimeout(id)
  }, [photos.length, view])

  if (photos.length === 0) {
    return (
      <section className="px-8 py-32 flex flex-col items-center gap-6">
        <p className="text-meta opacity-25">No frames yet.</p>
        <button
          onClick={() => setUploadModalOpen(true)}
          className="text-meta opacity-50 hover:opacity-100 transition-opacity"
        >
          + Add the first frame
        </button>
      </section>
    )
  }

  return (
    <section className="overflow-visible">
      {/* Toolbar — no lines */}
      <div className="flex items-center justify-between px-8 pt-8 pb-8">
        <span className="text-meta opacity-25">{photos.length.toString().padStart(3, '0')}&nbsp;frames</span>
        <div className="flex gap-6">
          {['grid', 'list'].map((m) => (
            <button
              key={m}
              onClick={() => setView(m)}
              className={`text-meta capitalize transition-opacity ${
                view === m ? 'opacity-100' : 'opacity-25 hover:opacity-60'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Grid view — 5-col, floating, ~10 per fold */}
      {view === 'grid' && (
        <div
          key="grid"
          className="view-enter grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-16 px-8 overflow-visible pb-24"
        >
          {photos.map((photo, i) => (
            <GridCard key={photo.id} photo={photo} index={i} onClick={setSelectedPhoto} />
          ))}
        </div>
      )}

      {/* List view — spacious editorial rows */}
      {view === 'list' && (
        <div key="list" className="view-enter px-8 pb-24">
          {photos.map((photo, i) => (
            <ListRow key={photo.id} photo={photo} index={i} onClick={setSelectedPhoto} />
          ))}
        </div>
      )}

      {/* Footer text — no lines */}
      <div className="flex justify-between px-8 py-10">
        <span className="text-meta opacity-15">PRICK</span>
        <span className="text-meta opacity-15">Abahyomi &amp; Alexandra</span>
      </div>
    </section>
  )
}
