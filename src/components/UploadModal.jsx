import React, { useRef, useState, useEffect, useCallback } from 'react'
import { gsap } from 'gsap'
import { usePhotos } from '../context/PhotoContext'
import { usePhotoUpload } from '../hooks/usePhotoUpload'

const EMPTY_FORM = {
  date:        new Date().toISOString().split('T')[0],
  location:    '',
  description: '',
  author:      'Abahyomi',
  camera:      '',
  iso:         '',
  aperture:    '',
  shutter:     '',
}

export default function UploadModal() {
  const { uploadModalOpen, setUploadModalOpen, addPhoto } = usePhotos()
  const { upload, uploading, progress, error } = usePhotoUpload()

  const [form,       setForm]       = useState(EMPTY_FORM)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [file,       setFile]       = useState(null)
  const [dragging,   setDragging]   = useState(false)

  const overlayRef   = useRef(null)
  const panelRef     = useRef(null)
  const fileInputRef = useRef(null)

  // Abrir / cerrar con animación
  useEffect(() => {
    if (!uploadModalOpen) { document.body.style.overflow = ''; return }
    document.body.style.overflow = 'hidden'
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.28 })
    gsap.fromTo(panelRef.current,
      { y: 56, opacity: 0 },
      { y: 0,  opacity: 1, duration: 0.48, ease: 'power3.out' }
    )
  }, [uploadModalOpen])

  // Cerrar con Escape
  useEffect(() => {
    if (!uploadModalOpen) return
    const onKey = (e) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [uploadModalOpen])

  function close() {
    gsap.to(panelRef.current, {
      y: 40, opacity: 0, duration: 0.3, ease: 'power2.in',
      onComplete: () => {
        setUploadModalOpen(false)
        setForm(EMPTY_FORM)
        setPreviewUrl(null)
        setFile(null)
      },
    })
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.25 })
  }

  const handleFile = useCallback((f) => {
    if (!f || !f.type.startsWith('image/')) return
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
  }, [])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }, [handleFile])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) return
    const uploaded = await upload(file)
    if (!uploaded) return
    addPhoto({ ...form, url: uploaded.url, thumb: uploaded.thumb, publicId: uploaded.publicId })
    close()
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  if (!uploadModalOpen) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center"
      style={{ opacity: 0, backgroundColor: 'rgba(0,0,0,0.92)' }}
      onClick={(e) => e.target === overlayRef.current && close()}
    >
      <div
        ref={panelRef}
        className="bg-surface w-full md:max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
        style={{ opacity: 0 }}
      >
        {/* Cabecera fija */}
        <div
          className="flex items-center justify-between px-7 py-5 sticky top-0 bg-surface z-10"
          style={{ borderBottom: '1px solid var(--c-ink-faint)' }}
        >
          <span className="text-meta" style={{ color: 'var(--c-ink-dim)' }}>
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
          {uploading && (
            <div className="relative h-px w-full" style={{ backgroundColor: 'rgba(var(--c-ink-rgb),0.10)' }}>
              <div
                className="absolute inset-y-0 left-0 transition-all duration-200"
                style={{ width: `${progress}%`, backgroundColor: 'var(--c-ink)' }}
              />
            </div>
          )}

          {/* Campos en dos columnas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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

          <Campo label="Pensamiento">
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={3}
              placeholder="¿Qué pensabas en ese instante?"
              className={`${campo} resize-none`}
            />
          </Campo>

          {error && (
            <p className="text-meta" style={{ color: '#e55' }}>{error}</p>
          )}

          {/* Acciones */}
          <div
            className="flex items-center justify-between pt-5"
            style={{ borderTop: '1px solid var(--c-ink-faint)' }}
          >
            <button
              type="button"
              onClick={close}
              className="text-meta transition-opacity hover:opacity-50"
              style={{ color: 'var(--c-ink-dim)' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!file || uploading}
              className="text-meta transition-opacity disabled:opacity-25"
              style={{
                backgroundColor: 'var(--c-ink)',
                color:           'var(--c-surface)',
                padding:         '0.5rem 1.8rem',
                letterSpacing:   '0.20em',
              }}
              onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.opacity = '0.72')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              {uploading ? `Subiendo ${progress}%` : 'Añadir al archivo'}
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
