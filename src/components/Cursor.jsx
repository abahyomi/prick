import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'

// Custom cursor — only shown on pointer (non-touch) devices
export default function Cursor() {
  const dotRef  = useRef(null)
  const ringRef = useRef(null)

  useEffect(() => {
    // Only activate on pointer devices
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    const dot  = dotRef.current
    const ring = ringRef.current

    // Keep cursor off-screen until first move
    gsap.set([dot, ring], { x: -100, y: -100 })

    function onMove(e) {
      gsap.to(dot,  { x: e.clientX, y: e.clientY, duration: 0.08, ease: 'none' })
      gsap.to(ring, { x: e.clientX, y: e.clientY, duration: 0.38, ease: 'power2.out' })
    }

    // Expand ring on any hoverable element
    function onOver(e) {
      if (e.target.closest('button, a, [role="button"], img')) {
        gsap.to(ring, { scale: 2.2, opacity: 0.6, duration: 0.3, ease: 'power2.out' })
        gsap.to(dot,  { scale: 0,   duration: 0.2 })
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
      {/* Lagged ring */}
      <div
        ref={ringRef}
        aria-hidden="true"
        style={{
          position:      'fixed',
          top:           0,
          left:          0,
          width:         28,
          height:        28,
          borderRadius:  '50%',
          border:        '1px solid rgba(214,214,214,0.45)',
          pointerEvents: 'none',
          zIndex:        9999,
          transform:     'translate(-50%,-50%)',
          willChange:    'transform',
        }}
      />
      {/* Precise dot */}
      <div
        ref={dotRef}
        aria-hidden="true"
        style={{
          position:        'fixed',
          top:             0,
          left:            0,
          width:           4,
          height:          4,
          borderRadius:    '50%',
          backgroundColor: 'rgba(214,214,214,0.9)',
          pointerEvents:   'none',
          zIndex:          10000,
          transform:       'translate(-50%,-50%)',
          willChange:      'transform',
        }}
      />
    </>
  )
}
