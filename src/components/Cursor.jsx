import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'

export default function Cursor() {
  const dotRef  = useRef(null)
  const ringRef = useRef(null)

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    const dot  = dotRef.current
    const ring = ringRef.current
    gsap.set([dot, ring], { x: -100, y: -100 })

    function onMove(e) {
      gsap.to(dot,  { x: e.clientX, y: e.clientY, duration: 0.08, ease: 'none' })
      gsap.to(ring, { x: e.clientX, y: e.clientY, duration: 0.38, ease: 'power2.out' })
    }

    function onOver(e) {
      if (e.target.closest('button, a, [role="button"], img')) {
        gsap.to(ring, { scale: 2.2, opacity: 0.55, duration: 0.3, ease: 'power2.out' })
        gsap.to(dot,  { scale: 0, duration: 0.2 })
      }
    }

    function onOut(e) {
      if (e.target.closest('button, a, [role="button"], img')) {
        gsap.to(ring, { scale: 1, opacity: 1, duration: 0.35, ease: 'power2.inOut' })
        gsap.to(dot,  { scale: 1, duration: 0.2 })
      }
    }

    window.addEventListener('mousemove', onMove)
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout',  onOut)
    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout',  onOut)
    }
  }, [])

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden="true"
        style={{
          position:      'fixed',
          top: 0, left: 0,
          width: 28, height: 28,
          borderRadius:  '50%',
          // Usa el token de color → visible tanto en oscuro como en claro
          border:        '1px solid rgba(var(--c-ink-rgb), 0.55)',
          pointerEvents: 'none',
          zIndex:        9999,
          transform:     'translate(-50%,-50%)',
          willChange:    'transform',
        }}
      />
      <div
        ref={dotRef}
        aria-hidden="true"
        style={{
          position:        'fixed',
          top: 0, left: 0,
          width: 4, height: 4,
          borderRadius:    '50%',
          backgroundColor: 'rgba(var(--c-ink-rgb), 0.88)',
          pointerEvents:   'none',
          zIndex:          10000,
          transform:       'translate(-50%,-50%)',
          willChange:      'transform',
        }}
      />
    </>
  )
}
