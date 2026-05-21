import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

const LETTERS = ['P', 'R', 'I', 'C', 'K']

export default function Loader({ onComplete }) {
  const rootRef   = useRef(null)
  const letterRefs = useRef([])   // one ref per letter span
  const lineRef   = useRef(null)
  const subRef    = useRef(null)
  const volRef    = useRef(null)

  useEffect(() => {
    const letters = letterRefs.current

    // Initial states — letters start below their clipping containers
    gsap.set(letters,       { yPercent: 115, opacity: 0 })
    gsap.set(lineRef.current,  { scaleX: 0, transformOrigin: 'center' })
    gsap.set(subRef.current,   { opacity: 0, y: 12 })
    gsap.set(volRef.current,   { opacity: 0 })

    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: () => onComplete?.(),
    })

    tl
      // Letters rise up one by one through clip containers
      .to(letters, {
        yPercent: 0,
        opacity: 1,
        duration: 0.85,
        stagger: 0.08,
      })
      // Línea desde el centro
      .to(lineRef.current, {
        scaleX: 1,
        duration: 0.5,
        ease: 'power2.inOut',
      }, '-=0.3')
      // Subtítulo sube
      .to(subRef.current, {
        opacity: 1, y: 0,
        duration: 0.42,
      }, '-=0.15')
      // Número de volumen
      .to(volRef.current, {
        opacity: 0.3,
        duration: 0.35,
      }, '-=0.1')
      // Pausa
      .to({}, { duration: 0.7 })
      // Salida: letras se van hacia arriba con stagger
      .to(letters, {
        yPercent: -115,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.in',
        stagger: 0.05,
      })
      .to([lineRef.current, subRef.current, volRef.current], {
        opacity: 0, duration: 0.25,
      }, '<')
      // Panel sube off-screen
      .to(rootRef.current, {
        yPercent: -100,
        duration: 0.72,
        ease: 'power4.inOut',
      }, '-=0.1')

    return () => tl.kill()
  }, [])

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center select-none"
      style={{ backgroundColor: '#000' }}
    >
      {/* PRICK — letras con contenedor clip-hidden para el slide-up */}
      <div className="flex items-end" style={{ gap: 'clamp(0.1rem, 0.8vw, 1rem)' }}>
        {LETTERS.map((l, i) => (
          <div key={l} style={{ overflow: 'hidden', lineHeight: 1 }}>
            <span
              ref={el => (letterRefs.current[i] = el)}
              className="block font-bold"
              style={{
                color:         '#fff',
                fontSize:      'clamp(5.5rem, 18vw, 18rem)',
                letterSpacing: '-0.045em',
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
          width:           'clamp(7rem, 22vw, 22rem)',
          height:          '1px',
          backgroundColor: 'rgba(255,255,255,0.5)',
          marginTop:       '1.2rem',
        }}
      />

      {/* Subtítulo */}
      <p
        ref={subRef}
        className="text-meta mt-4"
        style={{ color: 'rgba(255,255,255,0.55)', letterSpacing: '0.32em' }}
      >
        Abahyomi &times; Alexandra
      </p>

      {/* Vol */}
      <p
        ref={volRef}
        className="text-meta absolute bottom-8 right-8"
        style={{ color: 'rgba(255,255,255,0.3)' }}
      >
        Vol. I
      </p>
    </div>
  )
}
