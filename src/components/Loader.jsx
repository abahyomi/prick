import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

const LETTERS = ['P', 'R', 'I', 'C', 'K']

// 6 fotos del archivo real — 3 arriba del título, 3 abajo
const TOP_PHOTOS    = ['/photos/IMG_3383.jpg', '/photos/IMG_4521.jpg', '/photos/IMG_2842.jpg']
const BOTTOM_PHOTOS = ['/photos/IMG_3408.jpg', '/photos/IMG_4668.jpg', '/photos/IMG_2578.jpg']

function OrbitPhoto({ src, refEl }) {
  return (
    <div
      ref={refEl}
      className="overflow-hidden flex-shrink-0"
      style={{
        width:      'clamp(70px, 11vw, 220px)',
        height:     'clamp(70px, 11vw, 220px)',
        opacity:    0,
        willChange: 'transform, opacity, clip-path',
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
  const rootRef    = useRef(null)
  const letterRefs = useRef([])
  const lineRef    = useRef(null)
  const subRef     = useRef(null)
  const topRefs    = useRef([null, null, null])
  const bottomRefs = useRef([null, null, null])
  const spotRef    = useRef(null)

  useEffect(() => {
    const letters   = letterRefs.current
    const topPhotos = topRefs.current
    const botPhotos = bottomRefs.current
    const allPhotos = [...topPhotos, ...botPhotos]

    // ── Estados iniciales ─────────────────────────────────
    gsap.set(letters, {
      yPercent: 115,
      opacity:  0,
      filter:   'blur(8px)',
    })
    gsap.set(lineRef.current, { scaleX: 0, transformOrigin: 'center' })
    gsap.set(subRef.current,  { opacity: 0, y: 8 })
    gsap.set(topPhotos, {
      opacity:        0,
      y:              -42,
      scale:          0.86,
      clipPath:       'inset(0% 0 100% 0)',
      WebkitClipPath: 'inset(0% 0 100% 0)',
    })
    gsap.set(botPhotos, {
      opacity:        0,
      y:              42,
      scale:          0.86,
      clipPath:       'inset(100% 0 0% 0)',
      WebkitClipPath: 'inset(100% 0 0% 0)',
    })
    gsap.set(spotRef.current, { opacity: 0, scale: 0.92 })

    const tl = gsap.timeline({
      defaults:   { ease: 'power3.out' },
      onComplete: () => onComplete?.(),
    })

    tl
      // Spotlight de fondo emerge primero — añade profundidad al negro plano
      .to(spotRef.current, {
        opacity:  1,
        scale:    1,
        duration: 1.3,
        ease:     'power2.out',
      }, 0)

      // Letras: emergen enfocando (blur sharpening)
      .to(letters, {
        yPercent: 0,
        opacity:  1,
        filter:   'blur(0px)',
        duration: 0.95,
        stagger:  0.08,
      }, 0.12)

      // Fotos top: cortina clip-path desde la parte superior
      .to(topPhotos, {
        opacity:        1,
        y:              0,
        scale:          1,
        clipPath:       'inset(0% 0 0% 0)',
        WebkitClipPath: 'inset(0% 0 0% 0)',
        duration:       0.82,
        stagger:        0.09,
        ease:           'power3.out',
      }, '-=0.55')

      // Fotos bot: cortina clip-path desde la parte inferior
      .to(botPhotos, {
        opacity:        1,
        y:              0,
        scale:          1,
        clipPath:       'inset(0% 0 0% 0)',
        WebkitClipPath: 'inset(0% 0 0% 0)',
        duration:       0.82,
        stagger:        0.09,
        ease:           'power3.out',
      }, '<')

      // Línea
      .to(lineRef.current, {
        scaleX:   1,
        duration: 0.55,
        ease:     'power2.inOut',
      }, '-=0.4')

      // Subtítulo
      .to(subRef.current, {
        opacity:  1,
        y:        0,
        duration: 0.42,
      }, '-=0.26')

      // Flotación continua en las fotos (vida sutil)
      .add(() => {
        allPhotos.forEach((el, i) => {
          gsap.to(el, {
            y:        i % 2 === 0 ? '+=7' : '-=7',
            duration: 1.8 + i * 0.15,
            ease:     'sine.inOut',
            yoyo:     true,
            repeat:   -1,
          })
        })
      })

      // Pausa
      .to({}, { duration: 0.7 })

      // ── Salida ─────────────────────────────────────────
      // Spotlight se intensifica brevemente — flash sutil
      .to(spotRef.current, {
        opacity:  0.5,
        scale:    1.4,
        duration: 0.42,
        ease:     'power2.in',
      })

      // Fotos se dispersan con rotación opuesta arriba/abajo
      .to(topPhotos, {
        opacity:  0,
        y:        -38,
        scale:    0.92,
        rotation: -3.5,
        duration: 0.42,
        ease:     'power3.in',
        stagger:  0.05,
      }, '<')
      .to(botPhotos, {
        opacity:  0,
        y:        38,
        scale:    0.92,
        rotation: 3.5,
        duration: 0.42,
        ease:     'power3.in',
        stagger:  0.05,
      }, '<')

      // Letras vuelan arriba con motion blur
      .to(letters, {
        yPercent: -120,
        opacity:  0,
        filter:   'blur(3px)',
        duration: 0.42,
        ease:     'power3.in',
        stagger:  0.04,
      }, '-=0.18')

      // Línea, subtítulo y spotlight se desvanecen
      .to([lineRef.current, subRef.current, spotRef.current], {
        opacity:  0,
        duration: 0.26,
      }, '<')

      // Panel completo sube off-screen
      .to(rootRef.current, {
        yPercent: -100,
        duration: 0.72,
        ease:     'power4.inOut',
      }, '-=0.05')

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
      {/* Spotlight radial — añade profundidad al negro plano (mix-blend screen) */}
      <div
        ref={spotRef}
        aria-hidden="true"
        style={{
          position:      'absolute',
          top:           '50%',
          left:          '50%',
          width:         '140vw',
          height:        '80vh',
          transform:     'translate(-50%, -50%)',
          background:    'radial-gradient(ellipse, rgba(255,255,255,0.13) 0%, transparent 62%)',
          filter:        'blur(28px)',
          pointerEvents: 'none',
          mixBlendMode:  'screen',
          willChange:    'opacity, transform',
        }}
      />

      {/* Fila superior de fotos */}
      <div className="flex items-end" style={{ gap: 'clamp(4px, 0.8vw, 12px)', position: 'relative' }}>
        {TOP_PHOTOS.map((src, i) => (
          <OrbitPhoto key={i} src={src} refEl={el => (topRefs.current[i] = el)} />
        ))}
      </div>

      {/* PRICK — letras con clip-hidden */}
      <div className="flex items-end" style={{ gap: 'clamp(0.05rem, 0.5vw, 0.6rem)', position: 'relative' }}>
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
                willChange:    'transform, filter, opacity',
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
          position:        'relative',
        }}
      />

      {/* Subtítulo */}
      <p
        ref={subRef}
        className="text-meta"
        style={{ color: 'rgba(255,255,255,0.42)', letterSpacing: '0.28em', marginTop: '0.3rem', position: 'relative' }}
      >
        Abah &amp; Alex
      </p>

      {/* Fila inferior de fotos */}
      <div className="flex items-start" style={{ gap: 'clamp(4px, 0.8vw, 12px)', marginTop: '0.2rem', position: 'relative' }}>
        {BOTTOM_PHOTOS.map((src, i) => (
          <OrbitPhoto key={i} src={src} refEl={el => (bottomRefs.current[i] = el)} />
        ))}
      </div>
    </div>
  )
}
