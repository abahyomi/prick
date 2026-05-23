import React, { useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react'
import { gsap } from 'gsap'
import * as Exifr from 'exifr'
import { usePhotos } from '../context/PhotoContext'
import { usePhotoUpload } from '../hooks/usePhotoUpload'
import { useToast } from '../context/ToastContext'

const EMPTY_FORM = {
  date:        new Date().toISOString().split('T')[0],
  location:    '',
  description: '',
  author:      'Abahyomi',
  camera:      '',
  iso:         '',
  aperture:    '',
  shutter:     '',
  lat:         null,
  lng:         null,
  time:        '',
}

// ── EXIF helpers ────────────────────────────────────────────
async function extractExif(file) {
  try {
    const tags = await Exifr.parse(file, {
      tiff: true, exif: true, gps: true, iptc: false, xmp: false,
    })
    if (!tags) return {}

    const result = {}

    // Fecha — DateTimeOriginal es un objeto Date en exifr
    const dt = tags.DateTimeOriginal ?? tags.DateTime ?? tags.CreateDate
    if (dt instanceof Date && !isNaN(dt)) {
      result.date = dt.toISOString().split('T')[0]
      result.time = dt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false })
    }

    // Cámara — para Apple solo usar el Model (ya incluye "iPhone 14")
    const make  = (tags.Make  || '').trim()
    const model = (tags.Model || '').trim()
    if (model) {
      const makeNoBrand = make.toLowerCase()
      // Si el modelo ya contiene la marca (ej. "Apple iPhone"), usa solo el modelo
      result.camera = model.toLowerCase().includes(makeNoBrand) || makeNoBrand === 'apple'
        ? model
        : `${make} ${model}`.trim()
    } else if (make) {
      result.camera = make
    }

    // Técnica
    if (tags.ISO)          result.iso      = String(tags.ISO)
    if (tags.FNumber)      result.aperture = `f/${Number(tags.FNumber).toFixed(1).replace('.0','')}`
    if (tags.ExposureTime) {
      const t = Number(tags.ExposureTime)
      result.shutter = t >= 1 ? `${t}s` : `1/${Math.round(1 / t)}s`
    }

    // GPS — exifr devuelve decimal con signo (N=+, S=−, E=+, W=−)
    const lat = tags.latitude  ?? tags.GPSLatitude
    const lng = tags.longitude ?? tags.GPSLongitude
    if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
      // Guardar coordenadas numéricas para el mapa
      result.lat = parseFloat(lat.toFixed(6))
      result.lng = parseFloat(lng.toFixed(6))
      result.location = await reverseGeocode(lat, lng)
    }

    return result
  } catch (e) {
    console.warn('[EXIF]', e)
    return {}
  }
}

async function reverseGeocode(lat, lng) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`,
      { headers: { 'User-Agent': 'PRICK-Diary/1.0' } }
    )
    const d = await r.json()
    const a = d.address || {}
    const city    = a.city || a.town || a.village || a.municipality || a.county
    const country = a.country
    return [city, country].filter(Boolean).join(', ')
  } catch { return '' }
}

export default function UploadModal() {
  const { uploadModalOpen, setUploadModalOpen, addPhoto } = usePhotos()
  const { upload, uploading, progress } = usePhotoUpload()
  const { showToast } = useToast()

  const [form,        setForm]       = useState(EMPTY_FORM)
  const [previewUrl,  setPreviewUrl] = useState(null)
  const [file,        setFile]       = useState(null)
  const [dragging,    setDragging]   = useState(false)
  const [submitting,  setSubmitting] = useState(false) // cubre también la fase de DB
  const [localError,  setLocalError] = useState(null)

  const overlayRef   = useRef(null)
  const panelRef     = useRef(null)
  const titleRef     = useRef(null)
  const fileInputRef = useRef(null)

  // Abrir con cascada — useLayoutEffect evita el flash de un frame
  useLayoutEffect(() => {
    if (!uploadModalOpen) { document.body.style.overflow = ''; return }
    document.body.style.overflow = 'hidden'

    const overlay = overlayRef.current
    const panel   = panelRef.current
    const title   = titleRef.current
    if (!overlay || !panel) return

    const sections = Array.from(panel.querySelectorAll('[data-anim]'))

    const tl = gsap.timeline()

    // 1. Backdrop con blur progresivo
    tl.fromTo(overlay,
      {
        opacity: 0,
        backdropFilter: 'blur(0px)',
        WebkitBackdropFilter: 'blur(0px)',
      },
      {
        opacity: 1,
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        duration: 0.55,
        ease: 'power2.out',
      },
      0
    )

    // 2. Panel: sube + escala sutil
    tl.fromTo(panel,
      { y: 90, opacity: 0, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, duration: 0.78, ease: 'expo.out' },
      0.05
    )

    // 3. Título "Nuevo fotograma" con letter-spacing editorial
    if (title) {
      tl.fromTo(title,
        { letterSpacing: '0.55em', opacity: 0 },
        { letterSpacing: '0.20em', opacity: 1, duration: 0.6, ease: 'power3.out' },
        0.25
      )
    }

    // 4. Secciones internas en cascada
    if (sections.length) {
      tl.fromTo(sections,
        { y: 26, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.52, stagger: 0.07, ease: 'power3.out' },
        0.3
      )
    }
  }, [uploadModalOpen])

  // Cerrar con Escape
  useEffect(() => {
    if (!uploadModalOpen) return
    const onKey = (e) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [uploadModalOpen])

  function close() {
    const overlay = overlayRef.current
    const panel   = panelRef.current
    if (!overlay || !panel) {
      setUploadModalOpen(false)
      setForm(EMPTY_FORM); setPreviewUrl(null); setFile(null)
      setLocalError(null); setSubmitting(false)
      return
    }
    const sections = Array.from(panel.querySelectorAll('[data-anim]'))

    const tl = gsap.timeline({
      onComplete: () => {
        setUploadModalOpen(false)
        setForm(EMPTY_FORM)
        setPreviewUrl(null)
        setFile(null)
        setLocalError(null)
        setSubmitting(false)
      },
    })

    // 1. Secciones se contraen rápido
    if (sections.length) {
      tl.to(sections, {
        y: 10, opacity: 0,
        duration: 0.2, stagger: 0.02, ease: 'power2.in',
      }, 0)
    }

    // 2. Panel baja + escala
    tl.to(panel, {
      y: 56, opacity: 0, scale: 0.97,
      duration: 0.36, ease: 'power2.in',
    }, 0.08)

    // 3. Backdrop pierde blur y se desvanece
    tl.to(overlay, {
      opacity: 0,
      backdropFilter: 'blur(0px)',
      WebkitBackdropFilter: 'blur(0px)',
      duration: 0.34, ease: 'power2.in',
    }, 0.1)
  }

  const handleFile = useCallback(async (f) => {
    if (!f || !f.type.startsWith('image/')) return
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))

    // Extraer metadatos EXIF y pre-rellenar el formulario
    const exif = await extractExif(f)
    if (Object.keys(exif).length > 0) {
      setForm(prev => ({ ...prev, ...exif }))
    }
  }, [])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }, [handleFile])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file || submitting) return

    setSubmitting(true)
    setLocalError(null)

    try {
      // 1. Subir imagen (Storage / Cloudinary / data URL)
      const id = `photo-${Date.now()}`
      const uploaded = await upload(file, id)
      if (!uploaded) throw new Error('No se pudo subir la imagen')

      // 2. Guardar metadatos en DB / localStorage
      await addPhoto({
        ...form,
        id,
        url:   uploaded.url,
        thumb: uploaded.thumb,
      })

      showToast('¡Foto añadida al archivo!', 'success')
      close()
    } catch (err) {
      const msg = err?.message || 'Error desconocido al guardar'
      setLocalError(msg)
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  if (!uploadModalOpen) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[2100] flex items-end md:items-center justify-center"
      style={{
        opacity:              0,
        backgroundColor:      'rgba(0,0,0,0.72)',
        backdropFilter:       'blur(0px)',
        WebkitBackdropFilter: 'blur(0px)',
      }}
      onClick={(e) => e.target === overlayRef.current && close()}
    >
      <div
        ref={panelRef}
        className="bg-surface w-full md:max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
        style={{ opacity: 0, willChange: 'transform' }}
      >
        {/* Cabecera fija */}
        <div
          data-anim="header"
          className="flex items-center justify-between px-7 py-5 sticky top-0 bg-surface z-10"
          style={{ borderBottom: '1px solid var(--c-ink-faint)' }}
        >
          <span
            ref={titleRef}
            className="text-meta"
            style={{ color: 'var(--c-ink-dim)', display: 'inline-block' }}
          >
            Nuevo fotograma
          </span>
          <button
            onClick={close}
            className="text-meta transition-opacity hover:opacity-50"
            style={{ color: 'var(--c-ink-dim)' }}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-7 py-7 space-y-7">
          {/* Zona de arrastre */}
          <div
            data-anim="dropzone"
            className="relative transition-all overflow-hidden"
            style={{
              aspectRatio:  previewUrl ? 'auto' : '16/6',
              border:       `1px dashed ${dragging ? 'var(--c-ink)' : 'rgba(var(--c-ink-rgb),0.14)'}`,
            }}
            onClick={() => !previewUrl && fileInputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
          >
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Vista previa"
                  className="w-full max-h-64 object-contain grayscale"
                />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setPreviewUrl(null); setFile(null) }}
                  className="absolute top-3 right-3 text-meta transition-opacity hover:opacity-60"
                  style={{
                    backgroundColor: 'var(--c-ink)',
                    color: 'var(--c-surface)',
                    padding: '0.3rem 0.75rem',
                  }}
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <span style={{ fontSize: '1.5rem', fontWeight: 200, color: 'var(--c-ink-dim)' }}>+</span>
                <p className="text-meta" style={{ color: 'var(--c-ink-dim)' }}>
                  Arrastra la imagen aquí o haz clic
                </p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />

          {/* Barra de progreso */}
          {(uploading || submitting) && (
            <div className="relative h-px w-full" style={{ backgroundColor: 'rgba(var(--c-ink-rgb),0.10)' }}>
              <div
                className="absolute inset-y-0 left-0 transition-all duration-300"
                style={{ width: uploading ? `${progress}%` : '95%', backgroundColor: 'var(--c-ink)' }}
              />
            </div>
          )}

          {/* Campos en dos columnas */}
          <div data-anim="fields" className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Campo label="Fecha">
              <input type="date" value={form.date} onChange={set('date')} className={campo} />
            </Campo>
            <Campo label="Lugar">
              <input type="text" value={form.location} onChange={set('location')} className={campo} placeholder="Ciudad, País" />
            </Campo>
            <Campo label="Autor">
              <select value={form.author} onChange={set('author')} className={campo}>
                <option>Abahyomi</option>
                <option>Alexandra</option>
                <option>Ambos</option>
              </select>
            </Campo>
            <Campo label="Cámara">
              <input type="text" value={form.camera}   onChange={set('camera')}   className={campo} placeholder="ej. Leica M6" />
            </Campo>
            <Campo label="ISO">
              <input type="text" value={form.iso}      onChange={set('iso')}      className={campo} placeholder="ej. 400" />
            </Campo>
            <Campo label="Apertura">
              <input type="text" value={form.aperture} onChange={set('aperture')} className={campo} placeholder="ej. f/2.8" />
            </Campo>
            <Campo label="Velocidad">
              <input type="text" value={form.shutter}  onChange={set('shutter')}  className={campo} placeholder="ej. 1/250s" />
            </Campo>
          </div>

          <div data-anim="desc">
            <Campo label="Pensamiento">
              <textarea
                value={form.description}
                onChange={set('description')}
                rows={3}
                placeholder="¿Qué pensabas en ese instante?"
                className={`${campo} resize-none`}
              />
            </Campo>
          </div>

          {/* Error inline prominente */}
          {localError && (
            <div
              className="text-meta px-4 py-3"
              style={{ backgroundColor: 'rgba(255,80,80,0.12)', color: 'rgba(255,110,110,0.9)', letterSpacing: '0.12em' }}
            >
              ✕ &nbsp;{localError}
            </div>
          )}

          {/* Acciones */}
          <div
            data-anim="actions"
            className="flex items-center justify-between pt-5"
            style={{ borderTop: '1px solid var(--c-ink-faint)' }}
          >
            <button
              type="button"
              onClick={close}
              disabled={submitting}
              className="text-meta transition-opacity hover:opacity-50 disabled:opacity-30"
              style={{ color: 'var(--c-ink-dim)' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!file || submitting}
              className="text-meta transition-opacity disabled:opacity-25"
              style={{
                backgroundColor: 'var(--c-ink)',
                color:           'var(--c-surface)',
                padding:         '0.5rem 1.8rem',
                letterSpacing:   '0.20em',
                minWidth:        '10rem',
              }}
              onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.opacity = '0.72')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              {submitting
                ? (uploading ? `Subiendo ${progress}%` : 'Guardando…')
                : 'Añadir al archivo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const campo =
  'w-full bg-transparent text-sm font-light py-2 focus:outline-none transition-colors'
  + ' border-b border-[rgba(var(--c-ink-rgb),0.14)] focus:border-[rgba(var(--c-ink-rgb),0.45)]'
  + ' text-ink'

function Campo({ label, children }) {
  return (
    <div>
      <label className="text-meta block mb-1.5" style={{ color: 'var(--c-ink-dim)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}
