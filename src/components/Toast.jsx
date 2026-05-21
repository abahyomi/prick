import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

// Toast global — éxito en verde, error en rojo, neutro en gris
export default function Toast({ message, type = 'success', onDone }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!message) return
    const tl = gsap.timeline()
    tl.fromTo(ref.current,
      { opacity: 0, y: 20, filter: 'blur(4px)' },
      { opacity: 1, y: 0,  filter: 'blur(0px)', duration: 0.35, ease: 'power3.out' }
    )
    .to({}, { duration: 3.2 })
    .to(ref.current, { opacity: 0, y: -8, duration: 0.25, onComplete: onDone })
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
      }}
    >
      <p className="text-meta" style={{ color: c.text }}>{message}</p>
    </div>
  )
}
