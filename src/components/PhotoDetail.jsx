import React, { useEffect, useRef, useState, useCallback } from 'react'
import { gsap } from 'gsap'
import { usePhotos } from '../context/PhotoContext'
import { usePhotoUpload } from '../hooks/usePhotoUpload'

export default function PhotoDetail() {
  const { selectedPhoto, setSelectedPhoto, updatePhoto, deletePhoto } = usePhotos()
  const { upload, uploading, progress } = usePhotoUpload()

  const [editing,  setEditing]  = useState(false)
  const [editForm, setEditForm] = useState({})
  const [imgPreview, setImgPreview] = useState(null) // blob URL para previsualizar nueva foto

  const overlayRef  = useRef(null)
  const imgRef      = useRef(null)
  const contentRef  = useRef(null)
  const metaRef     = useRef(null)
  const fileInputRef = useRef(null)

  // ── Animación de apertura ───────────────────────────────────
  useEffect(() => {
    if (!selectedPhoto) { setEditing(false); setImgPreview(null); return }
    setEditForm({ ...selectedPhoto })
    setImgPreview(null)
    document.body.style.overflow = 'hidden'

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.fromTo(overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.32 }
      )
      .fromTo(imgRef.current,
        { scale: 0.97, opacity: 0, filter: 'blur(10px)' },
        { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.72 },
        '-=0.1'
      )
      .fromTo(contentRef.current,
        { x: 20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.52 },
        '-=0.48'
      )
      .fromTo(
        metaRef.current?.children ? Array.from(metaRef.current.children) : [],
        { opacity: 0, y: 7 },
        { opacity: 1, y: 0, stagger: 0.05, duration: 0.38 },
        '-=0.32'
      )

    return () => { document.body.style.overflow = '' }
  }, [selectedPhoto?.id])

  // ── Cerrar con Escape ───────────────────────────────────────
  useEffect(() => {
    if (!selectedPhoto) return
    const onKey = (e) => { if (e.key === 'Escape' && !editing) close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedPhoto, editing])

  const close = useCallback(() => {
    gsap.to(overlayRef.current, {
      opacity: 0, duration: 0.25,
      onComplete: () => setSelectedPhoto(null),
    })
  }, [setSelectedPhoto])

  // ── Seleccionar nueva foto ──────────────────────────────────
  const handlePhotoSelect = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    // Preview local inmediato
    const blob = URL.createObjectURL(file)
    setImgPreview(blob)
    // Guardar el file en el form para subirlo al guardar
    setEditForm(f => ({ ...f, _pendingFile: file }))
    // Animar la transición de imagen
    gsap.fromTo(imgRef.current,
      { opacity: 0, scale: 0.97, filter: 'blur(6px)' },
      { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.55, ease: 'power2.out' }
    )
  }, [])

  // ── Guardar cambios ─────────────────────────────────────────
  const handleSave = useCallback(async () => {
    const { _pendingFile, ...formData } = editForm

    if (_pendingFile) {
      // Subir nueva imagen
      const uploaded = await upload(_pendingFile)
      if (!uploaded) return
      formData.url   = uploaded.url
      formData.thumb = uploaded.thumb
      if (uploaded.publicId) formData.publicId = uploaded.publicId
    }

    updatePhoto(selectedPhoto.id, formData)
    setSelectedPhoto(prev => ({ ...prev, ...formData }))
    setImgPreview(null)
    setEditing(false)
  }, [editForm, selectedPhoto, upload, updatePhoto, setSelectedPhoto])

  function handleDelete() {
    if (window.confirm('¿Eliminar este fotograma definitivamente?')) deletePhoto(selectedPhoto.id)
  }

  const set = (key) => (e) => setEditForm(f => ({ ...f, [key]: e.target.value }))
  const onImgLoad = useCallback(e => e.target.classList.add('loaded'), [])

  if (!selectedPhoto) return null

  const fecha = new Date(selectedPhoto.date).toLocaleDateString('es-ES', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })

  const currentImgSrc = imgPreview || selectedPhoto.url

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] bg-surface overflow-y-auto no-scrollbar"
      style={{ opacity: 0 }}
    >
      {/* ── Barra de controles ── */}
      <div
        className="sticky top-0 z-10 bg-surface flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid var(--c-ink-faint)' }}
      >
        <button
          onClick={close}
          className="text-meta flex items-center gap-2 transition-opacity hover:opacity-50"
          style={{ color: 'var(--c-ink-dim)' }}
        >
          <span style={{ fontSize: '0.85rem' }}>←</span>
          <span>Volver</span>
        </button>

        <div className="flex items-center gap-5">
          {!editing ? (
            <>
              <button
                onClick={() => setEditing(true)}
                className="text-meta transition-opacity"
                style={{ color: 'var(--c-ink-dim)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--c-ink)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--c-ink-dim)')}
              >
                Editar
              </button>
              <button
                onClick={handleDelete}
                className="text-meta transition-opacity"
                style={{ color: 'var(--c-ink-dim)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--c-ink)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--c-ink-dim)')}
              >
                Eliminar
              </button>
            </>
          ) : (
            <>
              {/* Barra de progreso de subida */}
              {uploading && (
                <div className="flex items-center gap-2">
                  <div className="w-20 h-px relative" style={{ backgroundColor: 'var(--c-ink-faint)' }}>
                    <div
                      className="absolute inset-y-0 left-0 transition-all duration-200"
                      style={{ width: `${progress}%`, backgroundColor: 'var(--c-ink)' }}
                    />
                  </div>
                  <span className="text-meta" style={{ color: 'var(--c-ink-dim)' }}>{progress}%</span>
                </div>
              )}
              <button
                onClick={handleSave}
                disabled={uploading}
                className="text-meta transition-opacity disabled:opacity-30"
                style={{
                  backgroundColor: 'var(--c-ink)',
                  color: 'var(--c-surface)',
                  padding: '0.38rem 1.1rem',
                  letterSpacing: '0.20em',
                }}
                onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.opacity = '0.72')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                {uploading ? 'Subiendo…' : 'Guardar'}
              </button>
              <button
                onClick={() => { setEditing(false); setImgPreview(null); setEditForm({ ...selectedPhoto }) }}
                className="text-meta transition-opacity hover:opacity-50"
                style={{ color: 'var(--c-ink-dim)' }}
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Layout principal ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[calc(100vh-53px)]">

        {/* Columna imagen */}
        <div className="md:col-span-7 relative flex items-center justify-center bg-black min-h-[55vw] md:min-h-0">
          <img
            ref={imgRef}
            src={currentImgSrc}
            alt={selectedPhoto.location}
            onLoad={onImgLoad}
            className="lazy-fade w-full h-full object-contain grayscale max-h-[85vh]"
            style={{ opacity: 0 }}
          />

          {/* Overlay de cambio de foto — visible solo en modo edición */}
          {editing && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 transition-opacity"
              style={{ backgroundColor: 'rgba(0,0,0,0.52)' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.68)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.52)')}
            >
              {/* Icono cámara SVG */}
              <svg
                width="32" height="32" viewBox="0 0 24 24" fill="none"
                stroke="rgba(255,255,255,0.85)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <span className="text-meta" style={{ color: 'rgba(255,255,255,0.7)', letterSpacing: '0.22em' }}>
                Cambiar foto
              </span>
              {imgPreview && (
                <span className="text-meta" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Nueva imagen seleccionada
                </span>
              )}
            </button>
          )}

          {/* Input file oculto — acepta cualquier imagen, activa la cámara en móvil */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoSelect}
          />
        </div>

        {/* Columna metadatos */}
        <div
          ref={contentRef}
          className="md:col-span-5 flex flex-col justify-between px-8 py-10 bg-surface"
          style={{ opacity: 0 }}
        >
          <div ref={metaRef} className="space-y-8">

            {/* Fecha / Lugar */}
            <div>
              {editing ? (
                <input
                  type="date"
                  value={editForm.date}
                  onChange={set('date')}
                  className={editCampo}
                />
              ) : (
                <p className="text-meta" style={{ color: 'var(--c-ink-dim)' }}>{fecha}</p>
              )}

              {editing ? (
                <input
                  type="text"
                  value={editForm.location}
                  onChange={set('location')}
                  className={`${editCampo} mt-3`}
                  placeholder="Lugar"
                />
              ) : (
                <h2
                  className="font-semibold leading-none mt-2 text-ink"
                  style={{ fontSize: 'clamp(1.5rem, 3.8vw, 3rem)', letterSpacing: '-0.025em' }}
                >
                  {selectedPhoto.location}
                </h2>
              )}
            </div>

            {/* Pensamiento */}
            <div>
              <p className="text-meta mb-3" style={{ color: 'var(--c-ink-dim)' }}>Pensamiento</p>
              {editing ? (
                <textarea
                  value={editForm.description}
                  onChange={set('description')}
                  rows={4}
                  className={`${editCampo} resize-none`}
                />
              ) : (
                <p className="font-light leading-relaxed text-ink" style={{ fontSize: '0.85rem', opacity: 0.72 }}>
                  {selectedPhoto.description}
                </p>
              )}
            </div>

            {/* Técnica */}
            <div>
              <p className="text-meta mb-4" style={{ color: 'var(--c-ink-dim)' }}>Técnica</p>
              <div className="space-y-3">
                {[
                  ['Cámara',    'camera'],
                  ['ISO',       'iso'],
                  ['Apertura',  'aperture'],
                  ['Velocidad', 'shutter'],
                  ['Autor',     'author'],
                ].map(([label, key]) => (
                  <div key={key} className="flex justify-between items-baseline">
                    <span className="text-meta" style={{ color: 'var(--c-ink-dim)' }}>{label}</span>
                    {editing ? (
                      key === 'author' ? (
                        <select
                          value={editForm[key] || ''}
                          onChange={set(key)}
                          className="text-meta bg-transparent text-ink focus:outline-none"
                        >
                          <option>Abahyomi</option>
                          <option>Alexandra</option>
                          <option>Ambos</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={editForm[key] || ''}
                          onChange={set(key)}
                          className="text-meta text-right bg-transparent text-ink focus:outline-none w-28"
                          style={{ borderBottom: '1px solid rgba(var(--c-ink-rgb),0.2)' }}
                        />
                      )
                    ) : (
                      <span className="text-meta text-ink" style={{ opacity: 0.55 }}>
                        {selectedPhoto[key] || '—'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pie */}
          <div className="mt-10">
            <p className="text-meta" style={{ color: 'var(--c-ink-dim)', opacity: 0.35 }}>
              PRICK / Archivo visual
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const editCampo =
  'w-full bg-transparent text-sm font-light py-1.5 focus:outline-none transition-colors text-ink'
  + ' border-b border-[rgba(var(--c-ink-rgb),0.15)] focus:border-[rgba(var(--c-ink-rgb),0.45)]'
