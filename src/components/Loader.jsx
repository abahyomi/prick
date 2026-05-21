import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

const LETTERS = ['P', 'R', 'I', 'C', 'K']

// 6 fotos del archivo real — 3 arriba del título, 3 abajo
const TOP_PHOTOS    = ['/photos/IMG_3383.jpg', '/photos/IMG_4521.jpg', '/photos/IMG_2842.jpg']
const BOTTOM_PHOTOS = ['/photos/IMG_3408.jpg', '/photos/IMG_4668.jpg', '/photos/IMG_2578.jpg']

function OrbitPhoto({ src, refEl, position }) {
  return (
    <div
      ref={refEl}
      className="overflow-hidden flex-shrink-0"
      style={{
        width:           'clamp(70px, 11vw, 220px)',
        height:          'clamp(70px, 11vw, 220px)',
        opacity:         0,
        willChange:      'transform, opacity',
      }}
    >
      <img
        src={src}
        alt=""
        className="w-full h-full object-cover grayscale"
        style={{ display: 'block' }}
      />
    </div>
  )
}

export default function Loader({ onComplete }) {
  const rootRef      = useRef(null)
  const letterRefs   = useRef([])
  const lineRef      = useRef(null)
  const subRef       = useRef(null)
  const topRefs      = useRef([null, null, null])
  const bottomRefs   = useRef([null, null, null])

  useEffect(() => {
    const letters     = letterRefs.current
    const topPhotos   = topRefs.current
    const botPhotos   = bottomRefs.current
    const allPhotos   = [...topPhotos, ...botPhotos]

    // ── Estados iniciales ─────────────────────────────────
    gsap.set(letters,   { yPercent: 115, opacity: 0 })
    gsap.set(lineRef.current, { scaleX: 0, transformOrigin: 'center' })
    gsap.set(subRef.current,  { opacity: 0, y: 8 })
    gsap.set(topPhotos,  { opacity: 0, y: -28, scale: 0.88 })
    gsap.set(botPhotos,  { opacity: 0, y:  28, scale: 0.88 })

    const tl = gsap.timeline({
      defaults:   { ease: 'power3.out' },
      onComplete: () => onComplete?.(),
    })

    tl
      // Letras emergen desde abajo
      .to(letters, {
        yPercent: 0, opacity: 1,
        duration: 0.82,
        stagger: 0.07,
      })

      // Fotos aparecen desde arriba y abajo simultáneamente
      .to(topPhotos, {
        opacity: 1, y: 0, scale: 1,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power2.out',
      }, '-=0.45')
      .to(botPhotos, {
        opacity: 1, y: 0, scale: 1,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power2.out',
      }, '<')

      // Línea
      .to(lineRef.current, {
        scaleX: 1,
        duration: 0.45,
        ease: 'power2.inOut',
      }, '-=0.3')

      // Subtítulo
      .to(subRef.current, {
        opacity: 1, y: 0,
        duration: 0.38,
      }, '-=0.2')

      // Flotación suave continua en las fotos
      .add(() => {
        allPhotos.forEach((el, i) => {
          gsap.to(el, {
            y: i % 2 === 0 ? '+=7' : '-=7',
            duration: 1.8 + i * 0.15,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
          })
        })
      })

      // Pausa
      .to({}, { duration: 0.65 })

      // Salida: fotos se dispersan
      .to(topPhotos, { opacity: 0, y: -24, scale: 0.9, duration: 0.35, ease: 'power2.in', stagger: 0.05 })
      .to(botPhotos, { opacity: 0, y:  24, scale: 0.9, duration: 0.35, ease: 'power2.in', stagger: 0.05 }, '<')

      // Letras vuelan hacia arriba
      .to(letters, {
        yPercent: -115, opacity: 0,
        duration: 0.38,
        ease: 'power2.in',
        stagger: 0.04,
      }, '-=0.1')
      .to([lineRef.current, subRef.current], { opacity: 0, duration: 0.22 }, '<')

      // Panel sube off-screen
      .to(rootRef.current, {
        yPercent: -100,
        duration: 0.68,
        ease: 'power4.inOut',
      }, '-=0.08')

    return () => {
      tl.kill()
      gsap.killTweensOf(allPhotos)
    }
  }, [])

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center select-none"
      style={{ backgroundColor: '#000', gap: 'clamp(8px, 1.5vw, 20px)' }}
    >
      {/* Fila superior de fotos */}
      <div className="flex items-end" style={{ gap: 'clamp(4px, 0.8vw, 12px)' }}>
        {TOP_PHOTOS.map((src, i) => (
          <OrbitPhoto key={i} src={src} refEl={el => (topRefs.current[i] = el)} />
        ))}
      </div>

      {/* PRICK — letras con clip-hidden */}
      <div className="flex items-end" style={{ gap: 'clamp(0.05rem, 0.5vw, 0.6rem)' }}>
        {LETTERS.map((l, i) => (
          <div key={l} style={{ overflow: 'hidden', lineHeight: 1 }}>
            <span
              ref={el => (letterRefs.current[i] = el)}
              className="block font-bold"
              style={{
                color:         '#fff',
                fontSize:      'clamp(4.5rem, 15vw, 15rem)',
                letterSpacing: '-0.04em',
                lineHeight:    0.92,
              }}
            >
              {l}
            </span>
          </div>
        ))}
      </div>

      {/* Línea */}
      <div
        ref={lineRef}
        style={{
          width:           'clamp(6rem, 20vw, 20rem)',
          height:          '1px',
          backgroundColor: 'rgba(255,255,255,0.4)',
          marginTop:       '0.2rem',
        }}
      />

      {/* Subtítulo más pequeño */}
      <p
        ref={subRef}
        className="text-meta"
        style={{ color: 'rgba(255,255,255,0.42)', letterSpacing: '0.28em', marginTop: '0.3rem' }}
      >
        Abah &amp; Alex
      </p>

      {/* Fila inferior de fotos */}
      <div className="flex items-start" style={{ gap: 'clamp(4px, 0.8vw, 12px)', marginTop: '0.2rem' }}>
        {BOTTOM_PHOTOS.map((src, i) => (
          <OrbitPhoto key={i} src={src} refEl={el => (bottomRefs.current[i] = el)} />
        ))}
      </div>
    </div>
  )
}
