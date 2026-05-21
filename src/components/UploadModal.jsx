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

  const overlayRef  = useRef(null)
  const panelRef    = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (uploadModalOpen) {
      document.body.style.overflow = 'hidden'
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25 })
      gsap.fromTo(panelRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' })
    } else {
      document.body.style.overflow = ''
    }
  }, [uploadModalOpen])

  function close() {
    gsap.to(panelRef.current, {
      y: 30, opacity: 0, duration: 0.3, ease: 'power2.in',
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
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-ink/70"
      style={{ opacity: 0 }}
      onClick={(e) => e.target === overlayRef.current && close()}
    >
      <div
        ref={panelRef}
        className="bg-surface w-full md:max-w-3xl max-h-[95vh] overflow-y-auto no-scrollbar"
        style={{ opacity: 0 }}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 sticky top-0 bg-surface z-10">
          <span className="text-meta text-ink opacity-50">New Frame</span>
          <button onClick={close} className="text-meta text-ink hover:opacity-50 transition-opacity" aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {/* Drop zone */}
          <div
            className={`relative border ${dragging ? 'border-ink bg-ink/5' : 'border-ink'} border-dashed cursor-pointer transition-colors`}
            style={{ aspectRatio: previewUrl ? 'auto' : '16/7' }}
            onClick={() => !previewUrl && fileInputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
          >
            {previewUrl ? (
              <div className="relative">
                <img src={previewUrl} alt="Preview" className="w-full max-h-72 object-contain grayscale" />
                <button
                  type="button"
                  onClick={() => { setPreviewUrl(null); setFile(null) }}
                  className="absolute top-2 right-2 bg-ink text-surface text-meta px-3 py-1 hover:bg-surface hover:text-ink border border-ink transition-colors"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
                <div className="text-4xl font-thin select-none text-ink">+</div>
                <p className="text-meta opacity-50 text-center">Drop image here or click to select</p>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />

          {/* Upload progress */}
          {uploading && (
            <div className="h-px w-full bg-ink/10 relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-ink transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
          )}

          {/* Two-column metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Date" required>
              <input type="date" value={form.date} onChange={set('date')} required className={inputClass} />
            </Field>
            <Field label="Location" required>
              <input type="text" value={form.location} onChange={set('location')} placeholder="City, Country" required className={inputClass} />
            </Field>
            <Field label="Author">
              <select value={form.author} onChange={set('author')} className={inputClass}>
                <option>Abahyomi</option>
                <option>Alexandra</option>
                <option>Both</option>
              </select>
            </Field>
            <Field label="Camera">
              <input type="text" value={form.camera} onChange={set('camera')} placeholder="e.g. Leica M6" className={inputClass} />
            </Field>
            <Field label="ISO">
              <input type="text" value={form.iso} onChange={set('iso')} placeholder="e.g. 400" className={inputClass} />
            </Field>
            <Field label="Aperture">
              <input type="text" value={form.aperture} onChange={set('aperture')} placeholder="e.g. f/2.8" className={inputClass} />
            </Field>
            <Field label="Shutter Speed">
              <input type="text" value={form.shutter} onChange={set('shutter')} placeholder="e.g. 1/250s" className={inputClass} />
            </Field>
          </div>

          <Field label="Thought / Description" required>
            <textarea value={form.description} onChange={set('description')} required rows={3} placeholder="What were you thinking at this exact moment?" className={`${inputClass} resize-none`} />
          </Field>

          {error && <p className="text-meta text-red-500">{error}</p>}

          <div className="flex items-center justify-between pt-6">
            <button type="button" onClick={close} className="text-meta text-ink hover:opacity-50 transition-opacity">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || uploading}
              className="text-meta bg-ink text-surface px-8 py-3 hover:bg-surface hover:text-ink border border-ink transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {uploading ? `Uploading ${progress}%` : 'Add to Archive'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const inputClass =
  'w-full border-b border-ink/20 px-0 py-2 text-sm font-light text-ink bg-transparent focus:outline-none focus:border-ink/60 transition-colors duration-150'

function Field({ label, children, required }) {
  return (
    <div>
      <label className="text-meta block mb-1 opacity-60 text-ink">
        {label}{required && <span className="ml-1">*</span>}
      </label>
      {children}
    </div>
  )
}
