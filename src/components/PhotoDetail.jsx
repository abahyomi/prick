import React, { useEffect, useRef, useState, useCallback } from 'react'
import { gsap } from 'gsap'
import { usePhotos } from '../context/PhotoContext'

export default function PhotoDetail() {
  const { selectedPhoto, setSelectedPhoto, updatePhoto, deletePhoto } = usePhotos()
  const [editing,  setEditing]  = useState(false)
  const [editForm, setEditForm] = useState({})

  const overlayRef = useRef(null)
  const imgRef     = useRef(null)
  const contentRef = useRef(null)
  const metaRef    = useRef(null)

  // Animar apertura
  useEffect(() => {
    if (!selectedPhoto) { setEditing(false); return }
    setEditForm({ ...selectedPhoto })
    document.body.style.overflow = 'hidden'

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.fromTo(overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.32 }
      )
      .fromTo(imgRef.current,
        { scale: 0.97, opacity: 0, filter: 'blur(10px)' },
        { scale: 1,    opacity: 1, filter: 'blur(0px)',  duration: 0.75 },
        '-=0.1'
      )
      .fromTo(contentRef.current,
        { x: 20, opacity: 0 },
        { x: 0,  opacity: 1, duration: 0.55 },
        '-=0.5'
      )
      .fromTo(
        metaRef.current?.children ? Array.from(metaRef.current.children) : [],
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, stagger: 0.055, duration: 0.4 },
        '-=0.35'
      )

    return () => { document.body.style.overflow = '' }
  }, [selectedPhoto?.id])

  // Cerrar con Escape
  useEffect(() => {
    if (!selectedPhoto) return
    const onKey = (e) => { if (e.key === 'Escape' && !editing) close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedPhoto, editing])

  const close = useCallback(() => {
    gsap.to(overlayRef.current, {
      opacity: 0, duration: 0.28,
      onComplete: () => setSelectedPhoto(null),
    })
  }, [setSelectedPhoto])

  function handleDelete() {
    if (window.confirm('¿Eliminar este fotograma definitivamente?')) {
      deletePhoto(selectedPhoto.id)
    }
  }

  function handleSave() {
    updatePhoto(selectedPhoto.id, editForm)
    setSelectedPhoto({ ...selectedPhoto, ...editForm })
    setEditing(false)
  }

  const set = (key) => (e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))
  const onImgLoad = useCallback(e => e.target.classList.add('loaded'), [])

  if (!selectedPhoto) return null

  const fecha = new Date(selectedPhoto.date).toLocaleDateString('es-ES', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] bg-surface overflow-y-auto no-scrollbar"
      style={{ opacity: 0 }}
    >
      {/* Barra superior */}
      <div
        className="sticky top-0 z-10 bg-surface flex items-center justify-between px-7 py-4"
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

        <div className="flex items-center gap-6">
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
              <button
                onClick={handleSave}
                className="text-meta transition-opacity"
                style={{
                  backgroundColor: 'var(--c-ink)',
                  color:           'var(--c-surface)',
                  padding:         '0.38rem 1.1rem',
                  letterSpacing:   '0.20em',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.72')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                Guardar
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-meta transition-opacity"
                style={{ color: 'var(--c-ink-dim)' }}
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Layout principal */}
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[calc(100vh-53px)]">
        {/* Columna imagen — siempre negra */}
        <div className="md:col-span-7 flex items-center justify-center bg-black min-h-[55vw] md:min-h-0">
          <img
            ref={imgRef}
            src={selectedPhoto.url}
            alt={selectedPhoto.location}
            onLoad={onImgLoad}
            className="lazy-fade w-full h-full object-contain grayscale max-h-[85vh]"
            style={{ opacity: 0 }}
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
              <p className="text-meta mb-3" style={{ color: 'var(--c-ink-dim)' }}>
                Pensamiento
              </p>
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
              <p className="text-meta mb-4" style={{ color: 'var(--c-ink-dim)' }}>
                Técnica
              </p>
              <div className="space-y-3">
                {[
                  ['Cámara',    'camera'],
                  ['ISO',       'iso'],
                  ['Apertura',  'aperture'],
                  ['Velocidad', 'shutter'],
                  ['Autor',     'author'],
                ].map(([label, key]) => (
                  <div key={key} className="flex justify-between items-baseline">
                    <span className="text-meta" style={{ color: 'var(--c-ink-dim)' }}>
                      {label}
                    </span>
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
