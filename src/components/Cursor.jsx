import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'

export default function Cursor() {
  const dotRef   = useRef(null)
  const ringRef  = useRef(null)
  const labelRef = useRef(null)
  const magRef   = useRef(null)   // elemento "magnético" actual

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    const dot   = dotRef.current
    const ring  = ringRef.current
    const label = labelRef.current
    gsap.set([dot, ring], { x: -100, y: -100 })

    let isDown    = false
    let labelText = ''

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
      gsap.to(dot,  { x: e.clientX, y: e.clientY, duration: 0.08, ease: 'none' })
      gsap.to(ring, { x: rx,         y: ry,         duration: 0.38, ease: 'power2.out' })
    }

    function onOver(e) {
      const t = e.target
      if (!t || !(t instanceof Element)) return
      const interactive = t.closest('[data-cursor], button, a, [role="button"], img.lazy-fade')
      if (!interactive) return

      // Determinar etiqueta: data-cursor explícito > foto (img.lazy-fade) > nada
      let text = interactive.getAttribute('data-cursor') || ''
      if (!text && interactive.tagName === 'IMG' && interactive.classList.contains('lazy-fade')) {
        text = 'VER'
      }

      labelText = text
      if (label) label.textContent = text

      const isPhoto = Boolean(text)
      gsap.to(ring, {
        scale:           isDown ? 0.6 : (isPhoto ? 2.9 : 2.2),
        backgroundColor: isPhoto ? 'rgba(var(--c-ink-rgb), 0.94)' : 'rgba(var(--c-ink-rgb), 0)',
        borderColor:     isPhoto ? 'rgba(var(--c-ink-rgb), 0.94)' : 'rgba(var(--c-ink-rgb), 0.55)',
        duration:        0.28, ease: 'power2.out',
      })
      gsap.to(dot,   { scale: 0,            duration: 0.18, ease: 'power2.out' })
      gsap.to(label, { opacity: isPhoto ? 1 : 0, duration: 0.18 })

      if (interactive.hasAttribute('data-magnetic')) {
        magRef.current = interactive
      }
    }

    function onOut(e) {
      const t = e.target
      if (!t || !(t instanceof Element)) return
      const interactive = t.closest('[data-cursor], button, a, [role="button"], img.lazy-fade')
      if (!interactive) return

      labelText = ''
      if (label) label.textContent = ''
      gsap.to(ring, {
        scale: isDown ? 0.6 : 1,
        backgroundColor: 'rgba(var(--c-ink-rgb), 0)',
        borderColor:     'rgba(var(--c-ink-rgb), 0.55)',
        duration: 0.32, ease: 'power2.inOut',
      })
      gsap.to(dot,   { scale: 1, duration: 0.18, ease: 'power2.out' })
      gsap.to(label, { opacity: 0, duration: 0.15 })
      magRef.current = null
    }

    function onDown() {
      isDown = true
      gsap.to(ring, { scale: 0.6, duration: 0.14, ease: 'power2.out' })
    }
    function onUp() {
      isDown = false
      gsap.to(ring, {
        scale:    labelText ? 2.9 : 1,
        duration: 0.32, ease: 'elastic.out(1, 0.55)',
      })
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
      <div
        ref={ringRef}
        aria-hidden="true"
        style={{
          position:        'fixed',
          top: 0, left: 0,
          width: 28, height: 28,
          borderRadius:    '50%',
          border:          '1px solid rgba(var(--c-ink-rgb), 0.55)',
          backgroundColor: 'rgba(var(--c-ink-rgb), 0)',
          pointerEvents:   'none',
          zIndex:          9999,
          transform:       'translate(-50%,-50%)',
          willChange:      'transform, background-color',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
        }}
      >
        <span
          ref={labelRef}
          style={{
            color:         'var(--c-surface)',
            fontSize:      '0.42rem',
            fontWeight:    500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            opacity:       0,
            lineHeight:    1,
          }}
        />
      </div>
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
