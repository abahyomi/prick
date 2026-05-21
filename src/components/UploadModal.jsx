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

  const overlayRef = useRef(null)
  const panelRef = useRef(null)
  const fileInputRef = useRef(null)

  // Animate in/out
  useEffect(() => {
    if (uploadModalOpen) {
      document.body.style.overflow = 'hidden'
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25 })
      gsap.fromTo(
        panelRef.current,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }
      )
    } else {
      document.body.style.overflow = ''
    }
  }, [uploadModalOpen])

  function close() {
    gsap.to(panelRef.current, {
      y: 30,
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
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
    const url = URL.createObjectURL(f)
    setPreviewUrl(url)
  }

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    handleFile(f)
  }, [])

  const onDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) return

    const uploaded = await upload(file)
    if (!uploaded) return

    addPhoto({
      ...form,
      url: uploaded.url,
      thumb: uploaded.thumb,
      publicId: uploaded.publicId,
    })
    close()
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  if (!uploadModalOpen) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70"
      style={{ opacity: 0 }}
      onClick={(e) => e.target === overlayRef.current && close()}
    >
      <div
        ref={panelRef}
        className="bg-white w-full md:max-w-3xl max-h-[95vh] overflow-y-auto no-scrollbar border-t md:border border-black"
        style={{ opacity: 0 }}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black sticky top-0 bg-white z-10">
          <span className="text-meta">New Frame</span>
          <button
            onClick={close}
            className="text-meta hover:opacity-50 transition-opacity"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {/* Drop zone */}
          <div
            className={`relative border ${dragging ? 'border-black bg-black/5' : 'border-black'} border-dashed cursor-pointer transition-colors`}
            style={{ aspectRatio: previewUrl ? 'auto' : '16/7' }}
            onClick={() => !previewUrl && fileInputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
          >
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full max-h-72 object-contain grayscale"
                />
                <button
                  type="button"
                  onClick={() => { setPreviewUrl(null); setFile(null) }}
                  className="absolute top-2 right-2 bg-black text-white text-meta px-3 py-1 hover:bg-white hover:text-black border border-black transition-colors"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
                <div className="text-4xl font-thin select-none">+</div>
                <p className="text-meta opacity-50 text-center">
                  Drop image here or click to select
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

          {/* Upload progress */}
          {uploading && (
            <div className="h-px w-full bg-black/10 relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-black transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Two-column metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Date" required>
              <input
                type="date"
                value={form.date}
                onChange={set('date')}
                required
                className={inputClass}
              />
            </Field>

            <Field label="Location" required>
              <input
                type="text"
                value={form.location}
                onChange={set('location')}
                placeholder="City, Country"
                required
                className={inputClass}
              />
            </Field>

            <Field label="Author">
              <select value={form.author} onChange={set('author')} className={inputClass}>
                <option>Abahyomi</option>
                <option>Alexandra</option>
                <option>Both</option>
              </select>
            </Field>

            <Field label="Camera">
              <input
                type="text"
                value={form.camera}
                onChange={set('camera')}
                placeholder="e.g. Leica M6"
                className={inputClass}
              />
            </Field>

            <Field label="ISO">
              <input
                type="text"
                value={form.iso}
                onChange={set('iso')}
                placeholder="e.g. 400"
                className={inputClass}
              />
            </Field>

            <Field label="Aperture">
              <input
                type="text"
                value={form.aperture}
                onChange={set('aperture')}
                placeholder="e.g. f/2.8"
                className={inputClass}
              />
            </Field>

            <Field label="Shutter Speed">
              <input
                type="text"
                value={form.shutter}
                onChange={set('shutter')}
                placeholder="e.g. 1/250s"
                className={inputClass}
              />
            </Field>
          </div>

          {/* Description — full width */}
          <Field label="Thought / Description" required>
            <textarea
              value={form.description}
              onChange={set('description')}
              required
              rows={3}
              placeholder="What were you thinking at this exact moment?"
              className={`${inputClass} resize-none`}
            />
          </Field>

          {error && (
            <p className="text-meta text-red-600">{error}</p>
          )}

          {/* Submit */}
          <div className="flex items-center justify-between pt-4 border-t border-black">
            <button
              type="button"
              onClick={close}
              className="text-meta hover:opacity-50 transition-opacity"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || uploading}
              className="text-meta bg-black text-white px-8 py-3 hover:bg-white hover:text-black border border-black transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
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
  'w-full border border-black px-3 py-2 text-sm font-light focus:outline-none focus:bg-black focus:text-white transition-colors duration-150 bg-white'

function Field({ label, children, required }) {
  return (
    <div>
      <label className="text-meta block mb-1 opacity-60">
        {label}
        {required && <span className="ml-1">*</span>}
      </label>
      {children}
    </div>
  )
}
