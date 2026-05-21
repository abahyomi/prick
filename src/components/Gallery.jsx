import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { usePhotos } from '../context/PhotoContext'

gsap.registerPlugin(ScrollTrigger)

// Asymmetric grid layout — each slot defines col-span and row-span
// Pattern repeats every 5 photos
const SLOT_PATTERNS = [
  { col: 'col-span-7', aspect: 'aspect-[4/5]' },     // Large portrait
  { col: 'col-span-5', aspect: 'aspect-square' },     // Medium square
  { col: 'col-span-4', aspect: 'aspect-[3/4]' },     // Small portrait
  { col: 'col-span-8', aspect: 'aspect-[16/9]' },    // Wide landscape
  { col: 'col-span-5', aspect: 'aspect-[4/3]' },     // Medium landscape
  { col: 'col-span-7', aspect: 'aspect-[3/2]' },     // Wide
  { col: 'col-span-5', aspect: 'aspect-[4/5]' },     // Medium portrait
]

function PhotoCard({ photo, index, onClick }) {
  const cardRef = useRef(null)
  const imgRef = useRef(null)
  const overlayRef = useRef(null)
  const slot = SLOT_PATTERNS[index % SLOT_PATTERNS.length]

  // Scroll-triggered reveal
  useEffect(() => {
    const el = cardRef.current
    gsap.fromTo(
      el,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          toggleActions: 'play none none none',
        },
        delay: (index % 3) * 0.08,
      }
    )
  }, [index])

  // Hover — subtle scale + overlay fade
  function handleMouseEnter() {
    gsap.to(imgRef.current, { scale: 1.03, duration: 0.5, ease: 'power2.out' })
    gsap.to(overlayRef.current, { opacity: 1, duration: 0.3 })
  }

  function handleMouseLeave() {
    gsap.to(imgRef.current, { scale: 1, duration: 0.5, ease: 'power2.inOut' })
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.3 })
  }

  const formatted = new Date(photo.date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div
      ref={cardRef}
      className={`${slot.col} cursor-pointer group`}
      style={{ opacity: 0 }}
      onClick={() => onClick(photo)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Image container */}
      <div className={`relative overflow-hidden ${slot.aspect} border border-black`}>
        <img
          ref={imgRef}
          src={photo.thumb || photo.url}
          alt={photo.description}
          loading="lazy"
          className="w-full h-full object-cover grayscale"
          style={{ willChange: 'transform' }}
        />

        {/* Hover overlay with description */}
        <div
          ref={overlayRef}
          className="absolute inset-0 bg-black flex flex-col justify-end p-4 opacity-0"
          style={{ willChange: 'opacity' }}
        >
          <p className="text-white font-light text-sm leading-snug line-clamp-3">
            {photo.description}
          </p>
          <p className="text-meta text-white mt-3 opacity-60">{photo.author}</p>
        </div>
      </div>

      {/* Caption strip */}
      <div className="flex items-baseline justify-between pt-2 pb-1">
        <span className="text-meta opacity-50">{photo.location}</span>
        <span className="text-meta opacity-50">{formatted}</span>
      </div>
    </div>
  )
}

export default function Gallery() {
  const { photos, setSelectedPhoto, setUploadModalOpen } = usePhotos()
  const gridRef = useRef(null)

  // Stagger the whole grid on first paint (for photos already visible)
  useEffect(() => {
    ScrollTrigger.refresh()
  }, [photos.length])

  if (photos.length === 0) {
    return (
      <section className="px-6 py-24 text-center">
        <p className="text-meta opacity-40 mb-6">No frames yet.</p>
        <button
          onClick={() => setUploadModalOpen(true)}
          className="text-meta border border-black px-6 py-3 hover:bg-black hover:text-white transition-colors duration-200"
        >
          Add the first frame
        </button>
      </section>
    )
  }

  return (
    <section className="px-6 py-10">
      {/* Section label */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-black">
        <span className="text-meta opacity-50">Archive</span>
        <span className="text-meta opacity-50">{photos.length.toString().padStart(3, '0')}</span>
      </div>

      {/* Asymmetric 12-column grid */}
      <div ref={gridRef} className="grid grid-cols-12 gap-4 md:gap-6">
        {photos.map((photo, i) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            index={i}
            onClick={setSelectedPhoto}
          />
        ))}
      </div>

      {/* Footer line */}
      <div className="mt-16 pt-4 border-t border-black flex justify-between">
        <span className="text-meta opacity-30">PRICK / Vol. I</span>
        <span className="text-meta opacity-30">Abahyomi &amp; Alexandra</span>
      </div>
    </section>
  )
}
