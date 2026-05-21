import React, { useEffect, useRef, useState, useCallback } from 'react'
import { gsap } from 'gsap'
import { usePhotos } from '../context/PhotoContext'
import { usePhotoUpload } from '../hooks/usePhotoUpload'
import { useToast } from '../context/ToastContext'
import CropEditor, { dataUrlToFile } from './CropEditor'

// ── Hint de swipe (primera visita en móvil) ────────────────
function SwipeHint({ onDone }) {
  const arrowRef = useRef(null)
  useEffect(() => {
    const tl = gsap.timeline({ repeat: 2, onComplete: onDone })
    tl.fromTo(arrowRef.current,
      { x: 20, opacity: 0 },
      { x: -20, opacity: 0.9, duration: 0.7, ease: 'power1.inOut' }
    ).to(arrowRef.current, { opacity: 0, duration: 0.2 })
    return () => tl.kill()
  }, [])
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 5 }}>
      <div ref={arrowRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: 0 }}>
        <span style={{ fontSize: '1.6rem', color: 'rgba(255,255,255,0.8)' }}>←</span>
        <p className="text-meta" style={{ color: 'rgba(255,255,255,0.55)' }}>Desliza</p>
      </div>
    </div>
  )
}

export default function PhotoDetail() {
  const { photos, selectedPhoto, setSelectedPhoto, updatePhoto, deletePhoto } = usePhotos()
  const { upload, uploading, progress } = usePhotoUpload()
  const { showToast } = useToast()

  const [editing,       setEditing]      = useState(false)
  const [editForm,      setEditForm]     = useState({})
  const [imgPreview,    setImgPreview]   = useState(null)
  const [showMediaMenu, setShowMediaMenu] = useState(false)
  const [showCrop,      setShowCrop]     = useState(false)
  const [showHint,      setShowHint]     = useState(false)

  const overlayRef     = useRef(null)
  const imgRef         = useRef(null)
  const contentRef     = useRef(null)
  const metaRef        = useRef(null)
  const fileInputRef   = useRef(null)
  const cameraInputRef = useRef(null)
  const touchXRef      = useRef(null)

  // Índice y navegación entre fotos
  const currentIdx = photos.findIndex(p => p.id === selectedPhoto?.id)
  const prevPhoto  = currentIdx > 0               ? photos[currentIdx - 1] : null
  const nextPhoto  = currentIdx < photos.length - 1 ? photos[currentIdx + 1] : null

  // Swipe horizontal para navegar
  const handleTouchStart = useCallback((e) => {
    touchXRef.current = e.touches[0].clientX
  }, [])

  const handleTouchEnd = useCallback((e) => {
    if (touchXRef.current === null || editing || showCrop) return
    const delta = touchXRef.current - e.changedTouches[0].clientX
    touchXRef.current = null
    if (Math.abs(delta) < 48) return

    // Marcar hint como visto
    if (showHint) {
      setShowHint(false)
      localStorage.setItem('prick_swipe_hint', '1')
    }

    const dir  = delta > 0 ? 1 : -1
    const next = delta > 0 ? nextPhoto : prevPhoto
    if (!next) return

    gsap.fromTo(overlayRef.current,
      { x: dir * 40, opacity: 0.6 },
      { x: 0, opacity: 1, duration: 0.28, ease: 'power2.out' }
    )
    setSelectedPhoto(next)
  }, [editing, showCrop, showHint, nextPhoto, prevPhoto, setSelectedPhoto])

  // ── Animación de apertura ───────────────────────────────────
  // Mostrar swipe hint solo en móvil y primera visita
  useEffect(() => {
    if (!selectedPhoto) return
    const isMobile = navigator.maxTouchPoints > 0
    const seen     = localStorage.getItem('prick_swipe_hint')
    if (isMobile && !seen && photos.length > 1) setShowHint(true)
  }, [selectedPhoto?.id])

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
    e.target.value = '' // reset para poder re-seleccionar el mismo archivo
    const blob = URL.createObjectURL(file)
    setImgPreview(blob)
    setEditForm(f => ({ ...f, _pendingFile: file }))
    gsap.fromTo(imgRef.current,
      { opacity: 0, scale: 0.97, filter: 'blur(6px)' },
      { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.55, ease: 'power2.out' }
    )
  }, [])

  // ── Abrir selector: en móvil muestra menú, en desktop abre picker ──
  const handleChangePhotoClick = useCallback(() => {
    const isMobile = navigator.maxTouchPoints > 0
    if (isMobile) {
      setShowMediaMenu(true)
    } else {
      fileInputRef.current?.click()
    }
  }, [])

  // ── Guardar cambios ─────────────────────────────────────────
  const handleSave = useCallback(async () => {
    const { _pendingFile, ...formData } = editForm
    try {
      if (_pendingFile) {
        const uploaded = await upload(_pendingFile, selectedPhoto.id)
        if (!uploaded) throw new Error('Error al subir la imagen')
        formData.url   = uploaded.url
        formData.thumb = uploaded.thumb
      }
      await updatePhoto(selectedPhoto.id, formData)
      setSelectedPhoto(prev => ({ ...prev, ...formData }))
      setImgPreview(null)
      setEditing(false)
      showToast('Cambios guardados', 'success')
    } catch (err) {
      showToast(err.message || 'Error al guardar', 'error')
    }
  }, [editForm, selectedPhoto, upload, updatePhoto, setSelectedPhoto, showToast])

  function handleDelete() {
    if (window.confirm('¿Eliminar este fotograma definitivamente?')) {
      deletePhoto(selectedPhoto.id)
      showToast('Fotograma eliminado', 'info')
    }
  }

  const set = (key) => (e) => setEditForm(f => ({ ...f, [key]: e.target.value }))
  const onImgLoad = useCallback(e => e.target.classList.add('loaded'), [])

  if (!selectedPhoto) return null

  const fecha = new Date(selectedPhoto.date).toLocaleDateString('es-ES', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
  const fechaHora = selectedPhoto.time ? `${fecha} · ${selectedPhoto.time}` : fecha

  const currentImgSrc = imgPreview || selectedPhoto.url

  return (
    <>
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[2200] bg-surface overflow-y-auto no-scrollbar"
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

        {/* Columna imagen — soporta swipe horizontal */}
        <div
          className="md:col-span-7 relative flex items-center justify-center bg-black min-h-[55vw] md:min-h-0"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Flechas de navegación (desktop) */}
          {prevPhoto && !editing && (
            <button
              onClick={() => setSelectedPhoto(prevPhoto)}
              aria-label="Foto anterior"
              style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                zIndex: 5, color: 'rgba(255,255,255,0.55)', fontSize: '1.4rem',
                width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
              className="hidden md:flex"
            >‹</button>
          )}
          {nextPhoto && !editing && (
            <button
              onClick={() => setSelectedPhoto(nextPhoto)}
              aria-label="Foto siguiente"
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                zIndex: 5, color: 'rgba(255,255,255,0.55)', fontSize: '1.4rem',
                width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
              className="hidden md:flex"
            >›</button>
          )}

          {/* Contador de posición */}
          {photos.length > 1 && !editing && (
            <div style={{
              position: 'absolute', top: 12, right: 12, zIndex: 5,
            }}>
              <p className="text-meta" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {currentIdx + 1} / {photos.length}
              </p>
            </div>
          )}

          <img
            ref={imgRef}
            src={currentImgSrc}
            alt={selectedPhoto.location}
            onLoad={onImgLoad}
            className="lazy-fade w-full h-full object-contain grayscale max-h-[85vh]"
            style={{ opacity: 0 }}
          />

          {/* Swipe hint (primera visita móvil) */}
          {showHint && !editing && (
            <SwipeHint onDone={() => {
              setShowHint(false)
              localStorage.setItem('prick_swipe_hint', '1')
            }} />
          )}

          {/* Overlay de edición — dos botones: Cambiar y Reencuadrar */}
          {editing && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-5"
              style={{ backgroundColor: 'rgba(0,0,0,0.52)' }}
            >
              {/* Cambiar foto */}
              <button
                onClick={handleChangePhotoClick}
                className="flex flex-col items-center gap-2 transition-opacity hover:opacity-60"
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                  stroke="rgba(255,255,255,0.82)" strokeWidth="1.2"
                  strokeLinecap="round" strokeLinejoin="round"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                <span className="text-meta" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  {imgPreview ? 'Cambiar selección' : 'Cambiar foto'}
                </span>
              </button>

              {/* Separador */}
              <div style={{ width: '1px', height: 24, backgroundColor: 'rgba(255,255,255,0.18)' }} />

              {/* Reencuadrar */}
              <button
                onClick={() => setShowCrop(true)}
                className="flex flex-col items-center gap-2 transition-opacity hover:opacity-60"
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                  stroke="rgba(255,255,255,0.82)" strokeWidth="1.2"
                  strokeLinecap="round" strokeLinejoin="round"
                >
                  <polyline points="15 3 21 3 21 9"/>
                  <polyline points="9 21 3 21 3 15"/>
                  <line x1="21" y1="3" x2="14" y2="10"/>
                  <line x1="3" y1="21" x2="10" y2="14"/>
                </svg>
                <span className="text-meta" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  Reencuadrar
                </span>
              </button>
            </div>
          )}

          {/* Input galería — sin capture */}
          <input ref={fileInputRef} type="file" accept="image/*"
            className="hidden" onChange={handlePhotoSelect} />
          {/* Input cámara — capture trasero */}
          <input ref={cameraInputRef} type="file" accept="image/*"
            capture="environment" className="hidden" onChange={handlePhotoSelect} />

          {/* Menú de selección en móvil */}
          {showMediaMenu && (
            <div
              className="fixed inset-0 z-[2300] flex items-end"
              style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
              onClick={() => setShowMediaMenu(false)}
            >
              <div
                className="w-full bg-surface pb-8"
                onClick={e => e.stopPropagation()}
              >
                {[
                  {
                    label: 'Cámara',
                    sub:   'Hacer foto ahora',
                    action: () => { setShowMediaMenu(false); cameraInputRef.current?.click() },
                  },
                  {
                    label: 'Galería',
                    sub:   'Elegir de la biblioteca',
                    action: () => { setShowMediaMenu(false); fileInputRef.current?.click() },
                  },
                ].map(opt => (
                  <button
                    key={opt.label}
                    onClick={opt.action}
                    className="w-full flex flex-col items-start px-8 py-4 transition-opacity"
                    style={{ borderBottom: '1px solid var(--c-ink-faint)' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.6')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    <span className="font-medium text-ink" style={{ fontSize: '1rem' }}>
                      {opt.label}
                    </span>
                    <span className="text-meta mt-0.5" style={{ color: 'var(--c-ink-dim)' }}>
                      {opt.sub}
                    </span>
                  </button>
                ))}
                <button
                  onClick={() => setShowMediaMenu(false)}
                  className="w-full px-8 py-4 text-meta text-left transition-opacity hover:opacity-50"
                  style={{ color: 'var(--c-ink-dim)' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
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
                <p className="text-meta" style={{ color: 'var(--c-ink-dim)' }}>{fechaHora}</p>
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

    {/* Editor de recorte — pantalla completa encima de todo */}
    {showCrop && (
      <CropEditor
        src={imgPreview || selectedPhoto.url}
        onCancel={() => setShowCrop(false)}
        onSave={dataUrl => {
          const file = dataUrlToFile(dataUrl)
          setImgPreview(dataUrl)
          setEditForm(f => ({ ...f, _pendingFile: file }))
          setShowCrop(false)
          if (imgRef.current) {
            gsap.fromTo(imgRef.current,
              { opacity: 0, scale: 0.97, filter: 'blur(6px)' },
              { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.5, ease: 'power2.out' }
            )
          }
        }}
      />
    )}
    </>
  )
}

const editCampo =
  'w-full bg-transparent text-sm font-light py-1.5 focus:outline-none transition-colors text-ink'
  + ' border-b border-[rgba(var(--c-ink-rgb),0.15)] focus:border-[rgba(var(--c-ink-rgb),0.45)]'
