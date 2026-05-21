import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function Loader({ onComplete }) {
  const rootRef    = useRef(null)
  const leftARef   = useRef(null)
  const rightARef  = useRef(null)
  const lineRef    = useRef(null)
  const subRef     = useRef(null)
  const volRef     = useRef(null)

  useEffect(() => {
    // Initial state
    gsap.set(leftARef.current,  { xPercent: -120, opacity: 0 })
    gsap.set(rightARef.current, { xPercent:  120, opacity: 0 })
    gsap.set(lineRef.current,   { scaleX: 0, transformOrigin: 'center' })
    gsap.set(subRef.current,    { opacity: 0, y: 14 })
    gsap.set(volRef.current,    { opacity: 0 })

    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: () => onComplete?.(),
    })

    tl
      // Both A's slide in toward each other
      .to([leftARef.current, rightARef.current], {
        xPercent: 0, opacity: 1,
        duration: 1.0,
        stagger: 0.05,
      })
      // Connecting line expands from center
      .to(lineRef.current, {
        scaleX: 1,
        duration: 0.55,
        ease: 'power2.inOut',
      }, '-=0.25')
      // Subtitle rises up
      .to(subRef.current, {
        opacity: 1, y: 0,
        duration: 0.45,
      }, '-=0.15')
      // Small vol number
      .to(volRef.current, {
        opacity: 0.35,
        duration: 0.4,
      }, '-=0.1')
      // Hold
      .to({}, { duration: 0.85 })
      // Exit: letters split apart, screen slides up
      .to([leftARef.current, rightARef.current], {
        xPercent: (i) => i === 0 ? -30 : 30,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.in',
        stagger: 0.04,
      })
      .to([lineRef.current, subRef.current, volRef.current], {
        opacity: 0, duration: 0.3,
      }, '<')
      // Whole panel slides up off screen
      .to(rootRef.current, {
        yPercent: -100,
        duration: 0.75,
        ease: 'power4.inOut',
      }, '-=0.05')

    return () => tl.kill()
  }, [])

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ backgroundColor: '#000000' }}
    >
      {/* Monogram */}
      <div className="flex items-end gap-2 md:gap-6 overflow-visible">
        <span
          ref={leftARef}
          className="font-bold select-none leading-none"
          style={{
            color: '#ffffff',
            fontSize: 'clamp(7rem, 22vw, 22rem)',
            letterSpacing: '-0.05em',
          }}
        >
          A
        </span>
        <span
          ref={rightARef}
          className="font-bold select-none leading-none"
          style={{
            color: '#ffffff',
            fontSize: 'clamp(7rem, 22vw, 22rem)',
            letterSpacing: '-0.05em',
          }}
        >
          A
        </span>
      </div>

      {/* Dividing line */}
      <div
        ref={lineRef}
        style={{
          width: 'clamp(8rem, 24vw, 24rem)',
          height: '1px',
          backgroundColor: '#ffffff',
          marginTop: '1rem',
        }}
      />

      {/* Subtitle */}
      <p
        ref={subRef}
        className="text-meta mt-4"
        style={{ color: '#ffffff', letterSpacing: '0.35em' }}
      >
        Abahyomi &times; Alexandra
      </p>

      {/* Vol */}
      <p
        ref={volRef}
        className="text-meta absolute bottom-8 right-8"
        style={{ color: '#ffffff' }}
      >
        Vol. I
      </p>
    </div>
  )
}
