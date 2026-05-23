import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

// Toast global — éxito en verde, error en rojo, neutro en gris
export default function Toast({ message, type = 'success', onDone }) {
  const ref = useRef(null)
  const barRef = useRef(null)

  useEffect(() => {
    if (!message) return
    const HOLD = 3.2  // segundos visibles

    const tl = gsap.timeline()
    tl.fromTo(ref.current,
      { opacity: 0, y: 20, filter: 'blur(4px)' },
      { opacity: 1, y: 0,  filter: 'blur(0px)', duration: 0.35, ease: 'power3.out' }
    )
    // Barra de progreso: se vacía durante el hold
    if (barRef.current) {
      tl.fromTo(barRef.current,
        { scaleX: 1 },
        { scaleX: 0, duration: HOLD, ease: 'none', transformOrigin: 'left center' },
        '<'
      )
    } else {
      tl.to({}, { duration: HOLD })
    }
    tl.to(ref.current, { opacity: 0, y: -8, duration: 0.25, onComplete: onDone })
    return () => tl.kill()
  }, [message])

  if (!message) return null

  const colors = {
    success: { bg: 'rgba(10,10,10,0.95)', text: 'rgba(140,255,140,0.95)' },
    error:   { bg: 'rgba(10,10,10,0.95)', text: 'rgba(255,110,110,0.95)' },
    info:    { bg: 'rgba(10,10,10,0.95)', text: 'rgba(180,180,180,0.95)' },
  }
  const c = colors[type] || colors.info

  return (
    <div
      ref={ref}
      aria-live="polite"
      style={{
        position:        'fixed',
        bottom:          28,
        left:            '50%',
        transform:       'translateX(-50%)',
        zIndex:          10002,
        backgroundColor: c.bg,
        color:           c.text,
        padding:         '0.55rem 1.6rem',
        pointerEvents:   'none',
        whiteSpace:      'nowrap',
        overflow:        'hidden',
      }}
    >
      <p className="text-meta" style={{ color: c.text }}>{message}</p>
      <div
        ref={barRef}
        aria-hidden="true"
        style={{
          position:        'absolute',
          bottom:          0,
          left:            0,
          height:          1,
          width:           '100%',
          backgroundColor: c.text,
          opacity:         0.35,
          transformOrigin: 'left center',
          willChange:      'transform',
        }}
      />
    </div>
  )
}
