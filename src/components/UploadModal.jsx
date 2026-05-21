import React, { useRef, useState, useEffect, useCallback } from 'react'
import { gsap } from 'gsap'
import { usePhotos } from '../context/PhotoContext'
import { usePhotoUpload } from '../hooks/usePhotoUpload'

const EMPTY_FORM = {
  date: new Date().toISOString().split('T')[0],
  location: '',
  description: '',
  author: 'Abahyomi',
  camera: '',
  iso: '',
  aperture: '',
  shutter: '',
}

export default function UploadModal() {
  const { uploadModalOpen, setUploadModalOpen, addPhoto } = usePhotos()
  const { upload, uploading, progress, error } = usePhotoUpload()

  const [form, setForm] = useState(EMPTY_FORM)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)

  const overlayRef   = useRef(null)
  const panelRef     = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (uploadModalOpen) {
      document.body.style.overflow = 'hidden'
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.28 })
      gsap.fromTo(panelRef.current, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out' })
    } else {
      document.body.style.overflow = ''
    }
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

  function handleFile(f) {
    if (!f || !f.type.startsWith('image/')) return
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
  }

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }, [])

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
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      style={{ opacity: 0, backgroundColor: 'rgba(0,0,0,0.88)' }}
      onClick={(e) => e.target === overlayRef.current && close()}
    >
      <div
        ref={panelRef}
        className="bg-surface w-full md:max-w-2xl max-h-[92vh] overflow-y-auto no-scrollbar"
        style={{ opacity: 0 }}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between px-7 py-5 sticky top-0 bg-surface z-10">
          <span className="text-meta" style={{ color: 'var(--c-ink-dim)' }}>Nuevo fotograma</span>
          <button onClick={close} className="text-meta hover:opacity-50 transition-opacity text-ink" aria-label="Cerrar">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-7 pb-8 space-y-7">
          {/* Zona de arrastre */}
          <div
            className="relative cursor-pointer transition-all"
            style={{
              aspectRatio: previewUrl ? 'auto' : '16/7',
              border: `1px dashed ${dragging ? 'var(--c-ink)' : 'rgba(214,214,214,0.15)'}`,
            }}
            onClick={() => !previewUrl && fileInputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
          >
            {previewUrl ? (
              <div className="relative">
                <img src={previewUrl} alt="Vista previa" className="w-full max-h-72 object-contain grayscale" />
                <button
                  type="button"
                  onClick={() => { setPreviewUrl(null); setFile(null) }}
                  className="absolute top-3 right-3 text-meta bg-ink text-surface px-3 py-1 hover:opacity-70 transition-opacity"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
                <span className="text-ink" style={{ fontSize: '1.8rem', fontWeight: 200 }}>+</span>
                <p className="text-meta" style={{ color: 'var(--c-ink-dim)' }}>Arrastra la imagen aquí o haz clic</p>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />

          {/* Progreso */}
          {uploading && (
            <div className="h-px w-full relative overflow-hidden" style={{ backgroundColor: 'rgba(214,214,214,0.1)' }}>
              <div className="absolute inset-y-0 left-0 bg-ink transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
          )}

          {/* Campos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Campo label="Fecha" required>
              <input type="date" value={form.date} onChange={set('date')} required className={campo} />
            </Campo>
            <Campo label="Lugar" required>
              <input type="text" value={form.location} onChange={set('location')} placeholder="Ciudad, País" required className={campo} />
            </Campo>
            <Campo label="Autor">
              <select value={form.author} onChange={set('author')} className={campo}>
                <option>Abahyomi</option>
                <option>Alexandra</option>
                <option>Ambos</option>
              </select>
            </Campo>
            <Campo label="Cámara">
              <input type="text" value={form.camera} onChange={set('camera')} placeholder="ej. Leica M6" className={campo} />
            </Campo>
            <Campo label="ISO">
              <input type="text" value={form.iso} onChange={set('iso')} placeholder="ej. 400" className={campo} />
            </Campo>
            <Campo label="Apertura">
              <input type="text" value={form.aperture} onChange={set('aperture')} placeholder="ej. f/2.8" className={campo} />
            </Campo>
            <Campo label="Velocidad">
              <input type="text" value={form.shutter} onChange={set('shutter')} placeholder="ej. 1/250s" className={campo} />
            </Campo>
          </div>

          <Campo label="Pensamiento" required>
            <textarea
              value={form.description}
              onChange={set('description')}
              required
              rows={3}
              placeholder="¿Qué pensabas en ese momento exacto?"
              className={`${campo} resize-none`}
            />
          </Campo>

          {error && <p className="text-meta text-red-400">{error}</p>}

          <div className="flex items-center justify-between pt-2">
            <button type="button" onClick={close} className="text-meta hover:opacity-50 transition-opacity" style={{ color: 'var(--c-ink-dim)' }}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!file || uploading}
              className="text-meta bg-ink text-surface px-7 py-3 hover:opacity-70 transition-opacity disabled:opacity-25"
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
  'w-full bg-transparent text-ink text-sm font-light py-2 focus:outline-none transition-colors border-b border-ink/10 focus:border-ink/40'

function Campo({ label, children, required }) {
  return (
    <div>
      <label className="text-meta block mb-1" style={{ color: 'var(--c-ink-dim)' }}>
        {label}{required && <span className="ml-1" style={{ opacity: 0.5 }}>*</span>}
      </label>
      {children}
    </div>
  )
}
