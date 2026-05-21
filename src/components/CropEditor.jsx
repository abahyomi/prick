import React, { useState, useRef, useEffect, useCallback } from 'react'
import { gsap } from 'gsap'

// Carga una imagen con soporte cross-origin (Supabase Storage, rutas locales, data URLs)
function loadImg(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload  = () => resolve(img)
    img.onerror = () => {
      // Segundo intento sin crossOrigin (para data URLs y same-origin)
      const img2 = new Image()
      img2.onload  = () => resolve(img2)
      img2.onerror = reject
      img2.src = src
    }
    img.src = src
  })
}

// Convierte data URL a File para subirla igual que cualquier imagen
export function dataUrlToFile(dataUrl, name = 'reencuadre.jpg') {
  const [head, b64] = dataUrl.split(',')
  const mime = head.match(/:(.*?);/)[1]
  const bytes = atob(b64)
  const arr   = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new File([arr], name, { type: mime })
}

export default function CropEditor({ src, onSave, onCancel }) {
  const rootRef      = useRef(null)
  const containerRef = useRef(null)

  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [saving, setSaving]       = useState(false)

  // Refs para drag y pinch sin re-renders
  const drag  = useRef({ on: false, lx: 0, ly: 0 })
  const pinch = useRef({ on: false, d: 0 })

  useEffect(() => {
    gsap.fromTo(rootRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.28, ease: 'power2.out' }
    )
  }, [])

  // ── Drag (pointer events — funciona en mouse y touch) ───
  const onDown = useCallback(e => {
    if (e.touches?.length === 2) return
    drag.current = { on: true, lx: e.clientX, ly: e.clientY }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }, [])

  const onMove = useCallback(e => {
    if (!drag.current.on) return
    const dx = e.clientX - drag.current.lx
    const dy = e.clientY - drag.current.ly
    drag.current.lx = e.clientX
    drag.current.ly = e.clientY
    setTransform(t => ({ ...t, x: t.x + dx, y: t.y + dy }))
  }, [])

  const onUp = useCallback(() => { drag.current.on = false }, [])

  // ── Pinch zoom (touch) ──────────────────────────────────
  const onTouchMove = useCallback(e => {
    if (e.touches.length !== 2) return
    e.preventDefault()
    const dx = e.touches[0].clientX - e.touches[1].clientX
    const dy = e.touches[0].clientY - e.touches[1].clientY
    const d  = Math.hypot(dx, dy)
    if (pinch.current.on) {
      const ratio = d / pinch.current.d
      setTransform(t => ({ ...t, scale: Math.min(Math.max(t.scale * ratio, 0.25), 6) }))
    }
    pinch.current = { on: true, d }
  }, [])

  const onTouchEnd = useCallback(() => { pinch.current.on = false }, [])

  // ── Rueda (desktop) ─────────────────────────────────────
  const onWheel = useCallback(e => {
    e.preventDefault()
    const f = e.deltaY > 0 ? 0.93 : 1.07
    setTransform(t => ({ ...t, scale: Math.min(Math.max(t.scale * f, 0.25), 6) }))
  }, [])

  // ── Exportar ─────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true)
    try {
      const cnt = containerRef.current
      const img = await loadImg(src)

      const CW = cnt.offsetWidth
      const CH = cnt.offsetHeight

      // Tamaño renderizado: la imagen llena el alto del contenedor
      const rndH = CH
      const rndW = img.naturalWidth * (CH / img.naturalHeight)

      // Canvas de salida: 1080 de ancho, mismo ratio que el contenedor
      const OUT_W = 1080
      const OUT_H = Math.round(OUT_W * CH / CW)
      const s = OUT_H / CH  // escala CSS→salida

      const canvas = document.createElement('canvas')
      canvas.width  = OUT_W
      canvas.height = OUT_H
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, OUT_W, OUT_H)

      // Centro de la imagen en coords CSS
      const imgCX = CW / 2 + transform.x
      const imgCY = CH / 2 + transform.y

      // Tamaño con zoom
      const sW = rndW * transform.scale
      const sH = rndH * transform.scale

      ctx.drawImage(img, (imgCX - sW / 2) * s, (imgCY - sH / 2) * s, sW * s, sH * s)

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
      onSave(dataUrl)
    } catch (err) {
      console.error('[CropEditor]', err)
      setSaving(false)
    }
  }

  // Corners para el marco visual
  const CORNERS = [
    { pos: 'top-0 left-0',     bdr: 'border-t border-l' },
    { pos: 'top-0 right-0',    bdr: 'border-t border-r' },
    { pos: 'bottom-0 left-0',  bdr: 'border-b border-l' },
    { pos: 'bottom-0 right-0', bdr: 'border-b border-r' },
  ]

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[70] flex flex-col select-none"
      style={{ backgroundColor: '#000', opacity: 0 }}
    >
      {/* Barra superior */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
        <button
          onClick={onCancel}
          className="text-meta transition-opacity hover:opacity-50"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          ← Cancelar
        </button>
        <p className="text-meta hidden sm:block" style={{ color: 'rgba(255,255,255,0.22)' }}>
          Arrastra · Pellizca · Rueda
        </p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-meta disabled:opacity-30 transition-opacity hover:opacity-70"
          style={{
            backgroundColor: 'rgba(255,255,255,0.9)',
            color:   '#000',
            padding: '0.4rem 1.2rem',
            minWidth: '6.5rem',
          }}
        >
          {saving ? 'Procesando…' : 'Aplicar'}
        </button>
      </div>

      {/* Marco de recorte */}
      <div className="flex-1 flex items-center justify-center px-6 pb-2">
        <div
          ref={containerRef}
          className="relative overflow-hidden w-full"
          style={{
            maxWidth:    '440px',
            aspectRatio: '4/5',
            touchAction: 'none',
          }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onWheel={onWheel}
        >
          {/* Foto */}
          <img
            src={src}
            alt=""
            draggable={false}
            className="absolute grayscale"
            style={{
              top:       '50%',
              left:      '50%',
              height:    '100%',
              width:     'auto',
              maxWidth:  'none',
              transform: `translate(-50%,-50%) translate(${transform.x}px,${transform.y}px) scale(${transform.scale})`,
              transformOrigin: 'center',
            }}
          />

          {/* Rejilla de tercios */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: [
                'linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)',
                'linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)',
              ].join(','),
              backgroundSize: '33.333% 33.333%',
            }}
          />

          {/* Esquinas del marco */}
          {CORNERS.map(({ pos, bdr }) => (
            <div
              key={pos}
              className={`absolute ${pos} ${bdr} w-5 h-5 pointer-events-none`}
              style={{ borderColor: 'rgba(255,255,255,0.65)' }}
            />
          ))}
        </div>
      </div>

      {/* Slider de zoom */}
      <div className="flex items-center gap-4 px-8 pb-8 flex-shrink-0">
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '1.1rem', fontWeight: 200 }}>−</span>
        <input
          type="range"
          min="25"
          max="600"
          value={Math.round(transform.scale * 100)}
          onChange={e => setTransform(t => ({ ...t, scale: e.target.value / 100 }))}
          className="flex-1 crop-slider"
        />
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '1.1rem', fontWeight: 200 }}>+</span>
      </div>
    </div>
  )
}
