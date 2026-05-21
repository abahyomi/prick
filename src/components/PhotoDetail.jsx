import React, { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { usePhotos } from '../context/PhotoContext'

export default function PhotoDetail() {
  const { selectedPhoto, setSelectedPhoto, updatePhoto, deletePhoto } = usePhotos()
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})

  const overlayRef = useRef(null)
  const imgRef     = useRef(null)
  const contentRef = useRef(null)
  const metaRef    = useRef(null)

  useEffect(() => {
    if (!selectedPhoto) { setEditing(false); return }
    setEditForm({ ...selectedPhoto })
    document.body.style.overflow = 'hidden'

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.32 })
      .fromTo(imgRef.current,
        { scale: 0.97, opacity: 0, filter: 'blur(8px)' },
        { scale: 1,    opacity: 1, filter: 'blur(0px)', duration: 0.75 },
        '-=0.1'
      )
      .fromTo(contentRef.current,
        { x: 18, opacity: 0 },
        { x: 0,  opacity: 1, duration: 0.55 },
        '-=0.45'
      )
      .fromTo(
        metaRef.current?.children ? Array.from(metaRef.current.children) : [],
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, stagger: 0.06, duration: 0.4 },
        '-=0.3'
      )

    return () => { document.body.style.overflow = '' }
  }, [selectedPhoto?.id])

  function close() {
    gsap.to(overlayRef.current, {
      opacity: 0, duration: 0.25,
      onComplete: () => setSelectedPhoto(null),
    })
  }

  function handleDelete() {
    if (window.confirm('¿Eliminar este fotograma definitivamente?')) deletePhoto(selectedPhoto.id)
  }

  function handleSave() {
    updatePhoto(selectedPhoto.id, editForm)
    setSelectedPhoto({ ...selectedPhoto, ...editForm })
    setEditing(false)
  }

  const set = (key) => (e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))

  if (!selectedPhoto) return null

  const fecha = new Date(selectedPhoto.date).toLocaleDateString('es-ES', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-surface overflow-y-auto no-scrollbar"
      style={{ opacity: 0 }}
    >
      {/* Barra de controles */}
      <div className="sticky top-0 z-10 bg-surface flex items-center justify-between px-7 py-4">
        <button
          onClick={close}
          className="text-meta hover:opacity-40 transition-opacity flex items-center gap-2"
          style={{ color: 'var(--c-ink-dim)' }}
        >
          <span style={{ fontSize: '0.9rem' }}>←</span>
          <span>Volver</span>
        </button>
        <div className="flex items-center gap-5">
          {!editing ? (
            <>
              <button
                onClick={() => setEditing(true)}
                className="text-meta hover:opacity-50 transition-opacity"
                style={{ color: 'var(--c-ink-dim)' }}
              >
                Editar
              </button>
              <button
                onClick={handleDelete}
                className="text-meta hover:opacity-50 transition-opacity"
                style={{ color: 'var(--c-ink-dim)' }}
              >
                Eliminar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="text-meta bg-ink text-surface px-5 py-2 hover:opacity-70 transition-opacity"
              >
                Guardar
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-meta hover:opacity-40 transition-opacity"
                style={{ color: 'var(--c-ink-dim)' }}
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Foto + texto */}
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[calc(100vh-56px)]">
        {/* Columna imagen */}
        <div className="md:col-span-7 flex items-center justify-center bg-black min-h-[50vh]">
          <img
            ref={imgRef}
            src={selectedPhoto.url}
            alt={selectedPhoto.location}
            className="w-full h-full object-contain grayscale max-h-[80vh] md:max-h-screen"
            style={{ opacity: 0 }}
          />
        </div>

        {/* Columna contenido */}
        <div
          ref={contentRef}
          className="md:col-span-5 px-8 py-10 flex flex-col justify-between bg-surface"
          style={{ opacity: 0 }}
        >
          <div ref={metaRef} className="space-y-8">
            {/* Fecha y lugar */}
            <div>
              {editing ? (
                <input type="date" value={editForm.date} onChange={set('date')} className={editCampo} />
              ) : (
                <p className="text-meta" style={{ color: 'var(--c-ink-dim)' }}>{fecha}</p>
              )}
              {editing ? (
                <input type="text" value={editForm.location} onChange={set('location')} className={`${editCampo} mt-2`} placeholder="Lugar" />
              ) : (
                <h2
                  className="font-semibold leading-none mt-2 text-ink"
                  style={{ fontSize: 'clamp(1.6rem, 4vw, 3.2rem)', letterSpacing: '-0.02em' }}
                >
                  {selectedPhoto.location}
                </h2>
              )}
            </div>

            {/* Pensamiento */}
            <div>
              <p className="text-meta mb-2" style={{ color: 'var(--c-ink-dim)' }}>Pensamiento</p>
              {editing ? (
                <textarea value={editForm.description} onChange={set('description')} rows={4} className={`${editCampo} resize-none`} />
              ) : (
                <p className="font-light text-sm leading-relaxed text-ink" style={{ opacity: 0.75 }}>
                  {selectedPhoto.description}
                </p>
              )}
            </div>

            {/* Técnica */}
            <div>
              <p className="text-meta mb-3" style={{ color: 'var(--c-ink-dim)' }}>Técnica</p>
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
                        <select value={editForm[key] || ''} onChange={set(key)} className="text-meta bg-transparent text-ink focus:outline-none">
                          <option>Abahyomi</option>
                          <option>Alexandra</option>
                          <option>Ambos</option>
                        </select>
                      ) : (
                        <input type="text" value={editForm[key] || ''} onChange={set(key)} className="text-meta text-right bg-transparent text-ink focus:outline-none w-28 border-b border-ink/20" />
                      )
                    ) : (
                      <span className="text-meta text-ink" style={{ opacity: 0.6 }}>{selectedPhoto[key] || '—'}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10">
            <p className="text-meta" style={{ color: 'var(--c-ink-dim)', opacity: 0.35 }}>PRICK / Archivo visual</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const editCampo =
  'w-full bg-transparent text-ink text-sm font-light py-1 focus:outline-none border-b border-ink/15 focus:border-ink/40 transition-colors'
