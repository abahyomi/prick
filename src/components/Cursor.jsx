import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'

export default function Cursor() {
  const dotRef    = useRef(null)
  const ringRef   = useRef(null)
  const labelRef  = useRef(null)   // pill "VER" — elemento independiente
  const labelTxtRef = useRef(null) // texto dentro del pill
  const magRef    = useRef(null)

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    const dot     = dotRef.current
    const ring    = ringRef.current
    const label   = labelRef.current
    const labelTx = labelTxtRef.current

    gsap.set([dot, ring, label], { x: -100, y: -100 })

    let isDown   = false
    let hasLabel = false

    function onMove(e) {
      // Magnético: el anillo es atraído ligeramente hacia el centro
      const mag = magRef.current
      let rx = e.clientX, ry = e.clientY
      if (mag) {
        const r = mag.getBoundingClientRect()
        const cx = r.left + r.width  / 2
        const cy = r.top  + r.height / 2
        rx = e.clientX + (cx - e.clientX) * 0.28
        ry = e.clientY + (cy - e.clientY) * 0.28
      }
      gsap.to(dot,   { x: e.clientX, y: e.clientY, duration: 0.08, ease: 'none' })
      gsap.to(ring,  { x: rx,         y: ry,         duration: 0.38, ease: 'power2.out' })
      gsap.to(label, { x: e.clientX, y: e.clientY, duration: 0.18, ease: 'power3.out' })
    }

    function onOver(e) {
      const t = e.target
      if (!t || !(t instanceof Element)) return
      const interactive = t.closest('[data-cursor], button, a, [role="button"], img.lazy-fade')
      if (!interactive) return

      // Etiqueta: data-cursor explícito > foto auto-VER > nada
      let text = interactive.getAttribute('data-cursor') || ''
      if (!text && interactive.tagName === 'IMG' && interactive.classList.contains('lazy-fade')) {
        text = 'Ver ↗'
      }

      hasLabel = Boolean(text)
      if (hasLabel && labelTx) labelTx.textContent = text

      if (hasLabel) {
        // Pill visible: ocultar anillo y punto
        gsap.to(ring, { scale: 0, opacity: 0, duration: 0.22, ease: 'power2.out' })
        gsap.to(dot,  { scale: 0, opacity: 0, duration: 0.18 })
        gsap.to(label, {
          opacity:  1,
          scale:    isDown ? 0.92 : 1,
          duration: 0.32, ease: 'power3.out',
        })
      } else {
        // Anillo grande, sin pill
        gsap.to(ring, {
          scale: isDown ? 0.6 : 2.2,
          opacity: 0.6,
          duration: 0.28, ease: 'power2.out',
        })
        gsap.to(dot,   { scale: 0, opacity: 0, duration: 0.18 })
        gsap.to(label, { opacity: 0, scale: 0.5, duration: 0.18 })
      }

      if (interactive.hasAttribute('data-magnetic')) {
        magRef.current = interactive
      }
    }

    function onOut(e) {
      const t = e.target
      if (!t || !(t instanceof Element)) return
      const interactive = t.closest('[data-cursor], button, a, [role="button"], img.lazy-fade')
      if (!interactive) return

      hasLabel = false
      gsap.to(ring,  { scale: 1, opacity: 1, duration: 0.3, ease: 'power2.inOut' })
      gsap.to(dot,   { scale: 1, opacity: 1, duration: 0.2 })
      gsap.to(label, { opacity: 0, scale: 0.5, duration: 0.2 })
      magRef.current = null
    }

    function onDown() {
      isDown = true
      if (hasLabel) {
        gsap.to(label, { scale: 0.88, duration: 0.14, ease: 'power2.out' })
      } else {
        gsap.to(ring,  { scale: 0.6, duration: 0.14, ease: 'power2.out' })
      }
    }
    function onUp() {
      isDown = false
      if (hasLabel) {
        gsap.to(label, { scale: 1, duration: 0.3, ease: 'elastic.out(1, 0.55)' })
      } else {
        gsap.to(ring,  { scale: 1, duration: 0.3, ease: 'elastic.out(1, 0.55)' })
      }
    }

    window.addEventListener('mousemove', onMove)
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout',  onOut)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('mouseup',   onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout',  onOut)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('mouseup',   onUp)
    }
  }, [])

  return (
    <>
      {/* Anillo (cursor por defecto) */}
      <div
        ref={ringRef}
        aria-hidden="true"
        style={{
          position:      'fixed',
          top: 0, left: 0,
          width: 28, height: 28,
          borderRadius:  '50%',
          border:        '1px solid rgba(var(--c-ink-rgb), 0.55)',
          pointerEvents: 'none',
          zIndex:        9999,
          transform:     'translate(-50%,-50%)',
          willChange:    'transform, opacity',
        }}
      />

      {/* Pill "VER" — elemento independiente, texto crisp a su tamaño natural */}
      <div
        ref={labelRef}
        aria-hidden="true"
        style={{
          position:        'fixed',
          top: 0, left: 0,
          padding:         '8px 14px',
          backgroundColor: 'var(--c-ink)',
          color:           'var(--c-surface)',
          borderRadius:    '999px',
          opacity:         0,
          pointerEvents:   'none',
          zIndex:          9999,
          transform:       'translate(-50%,-50%) scale(0.5)',
          willChange:      'transform, opacity',
          whiteSpace:      'nowrap',
        }}
      >
        <span
          ref={labelTxtRef}
          style={{
            fontSize:      '0.62rem',
            fontWeight:    500,
            letterSpacing: '0.20em',
            textTransform: 'uppercase',
            lineHeight:    1,
            display:       'inline-block',
          }}
        >Ver ↗</span>
      </div>

      {/* Punto central */}
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
