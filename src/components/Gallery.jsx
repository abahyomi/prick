import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { usePhotos } from '../context/PhotoContext'

gsap.registerPlugin(ScrollTrigger)

// Each slot: column span, aspect ratio, and depth level (0=far, 1=mid, 2=close)
const SLOT_PATTERNS = [
  { col: 'col-span-7', aspect: 'aspect-[4/5]',   depth: 2 }, // Large portrait  — close
  { col: 'col-span-5', aspect: 'aspect-square',   depth: 0 }, // Square          — far
  { col: 'col-span-4', aspect: 'aspect-[3/4]',    depth: 1 }, // Small portrait  — mid
  { col: 'col-span-8', aspect: 'aspect-[16/9]',   depth: 0 }, // Wide landscape  — far
  { col: 'col-span-5', aspect: 'aspect-[4/3]',    depth: 2 }, // Medium land.    — close
  { col: 'col-span-7', aspect: 'aspect-[3/2]',    depth: 1 }, // Wide            — mid
  { col: 'col-span-5', aspect: 'aspect-[4/5]',    depth: 0 }, // Medium portrait — far
]

// Depth config — simulates Z-axis via scale, shadow and parallax scroll speed
const DEPTH_CONFIG = [
  // far (0): subtle, recedes, slow scroll
  { scale: 0.975, parallaxY: -30,  shadow: 'none' },
  // mid (1): neutral depth
  { scale: 1.0,   parallaxY: -65,  shadow: 'var(--shadow-mid)' },
  // close (2): pops forward, fast scroll
  { scale: 1.03,  parallaxY: -110, shadow: 'var(--shadow-close)' },
]

function PhotoCard({ photo, index, onClick }) {
  const parallaxRef = useRef(null) // outer: receives scroll parallax
  const cardRef     = useRef(null) // inner: receives reveal animation
  const imgRef      = useRef(null)
  const overlayRef  = useRef(null)

  const slot  = SLOT_PATTERNS[index % SLOT_PATTERNS.length]
  const depth = DEPTH_CONFIG[slot.depth]

  // Scroll reveal (on inner card)
  useEffect(() => {
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        delay: (index % 3) * 0.07,
        scrollTrigger: {
          trigger: parallaxRef.current,
          start: 'top 92%',
          toggleActions: 'play none none none',
        },
      }
    )

    // Parallax scroll — different speed per depth layer (on outer wrapper)
    gsap.to(parallaxRef.current, {
      y: depth.parallaxY,
      ease: 'none',
      scrollTrigger: {
        trigger: parallaxRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.8,
      },
    })
  }, [index, depth.parallaxY])

  function handleMouseEnter() {
    gsap.to(imgRef.current, { scale: 1.04, duration: 0.55, ease: 'power2.out' })
    gsap.to(overlayRef.current, { opacity: 1, duration: 0.3 })
  }
  function handleMouseLeave() {
    gsap.to(imgRef.current, { scale: 1, duration: 0.55, ease: 'power2.inOut' })
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.3 })
  }

  const formatted = new Date(photo.date).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  return (
    <div ref={parallaxRef} className={`${slot.col}`} style={{ willChange: 'transform' }}>
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
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Image container */}
        <div className={`relative overflow-hidden ${slot.aspect} border border-ink`}>
          <img
            ref={imgRef}
            src={photo.thumb || photo.url}
            alt={photo.description}
            loading="lazy"
            className="w-full h-full object-cover grayscale"
            style={{ willChange: 'transform' }}
          />

          {/* Hover overlay */}
          <div
            ref={overlayRef}
            className="absolute inset-0 bg-ink flex flex-col justify-end p-4 opacity-0"
            style={{ willChange: 'opacity' }}
          >
            <p className="text-surface font-light text-sm leading-snug line-clamp-3">
              {photo.description}
            </p>
            <p className="text-meta text-surface mt-3 opacity-60">{photo.author}</p>
          </div>
        </div>

        {/* Caption */}
        <div className="flex items-baseline justify-between pt-2 pb-1">
          <span className="text-meta opacity-50">{photo.location}</span>
          <span className="text-meta opacity-50">{formatted}</span>
        </div>
      </div>
    </div>
  )
}

export default function Gallery() {
  const { photos, setSelectedPhoto, setUploadModalOpen } = usePhotos()

  useEffect(() => {
    ScrollTrigger.refresh()
  }, [photos.length])

  if (photos.length === 0) {
    return (
      <section className="px-6 py-24 text-center">
        <p className="text-meta opacity-40 mb-6">No frames yet.</p>
        <button
          onClick={() => setUploadModalOpen(true)}
          className="text-meta border border-ink px-6 py-3 hover:bg-ink hover:text-surface transition-colors duration-200"
        >
          Add the first frame
        </button>
      </section>
    )
  }

  return (
    <section className="px-6 py-10 overflow-visible">
      {/* Section label */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-ink">
        <span className="text-meta opacity-50">Archive</span>
        <span className="text-meta opacity-50">{photos.length.toString().padStart(3, '0')}</span>
      </div>

      {/* 12-col asymmetric grid with 3D depth illusion */}
      <div className="grid grid-cols-12 gap-4 md:gap-8 overflow-visible">
        {photos.map((photo, i) => (
          <PhotoCard key={photo.id} photo={photo} index={i} onClick={setSelectedPhoto} />
        ))}
      </div>

      <div className="mt-24 pt-4 border-t border-ink flex justify-between">
        <span className="text-meta opacity-30">PRICK / Vol. I</span>
        <span className="text-meta opacity-30">Abahyomi &amp; Alexandra</span>
      </div>
    </section>
  )
}
