import React, { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { usePhotos } from '../context/PhotoContext'

export default function PhotoDetail() {
  const { selectedPhoto, setSelectedPhoto, updatePhoto, deletePhoto } = usePhotos()
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})

  const overlayRef = useRef(null)
  const imgRef = useRef(null)
  const contentRef = useRef(null)
  const metaRef = useRef(null)

  // Animate in whenever a photo is selected
  useEffect(() => {
    if (!selectedPhoto) {
      setEditing(false)
      return
    }
    setEditForm({ ...selectedPhoto })
    document.body.style.overflow = 'hidden'

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 })
      .fromTo(imgRef.current, { scale: 0.96, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7 }, '-=0.1')
      .fromTo(contentRef.current, { x: 20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.55 }, '-=0.4')
      .fromTo(
        metaRef.current?.children ? Array.from(metaRef.current.children) : [],
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, stagger: 0.07, duration: 0.4 },
        '-=0.3'
      )

    return () => { document.body.style.overflow = '' }
  }, [selectedPhoto?.id])

  function close() {
    gsap.to(overlayRef.current, {
      opacity: 0,
      duration: 0.25,
      onComplete: () => setSelectedPhoto(null),
    })
  }

  function handleDelete() {
    if (window.confirm('Remove this frame permanently?')) {
      deletePhoto(selectedPhoto.id)
    }
  }

  function handleSave() {
    updatePhoto(selectedPhoto.id, editForm)
    setSelectedPhoto({ ...selectedPhoto, ...editForm })
    setEditing(false)
  }

  const set = (key) => (e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))

  if (!selectedPhoto) return null

  const formatted = new Date(selectedPhoto.date).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-white overflow-y-auto no-scrollbar"
      style={{ opacity: 0 }}
    >
      {/* Close + controls bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-black flex items-center justify-between px-6 py-4">
        <button
          onClick={close}
          className="text-meta hover:opacity-40 transition-opacity flex items-center gap-2"
        >
          <span style={{ fontSize: '1rem', lineHeight: 1 }}>←</span>
          <span>Back</span>
        </button>
        <div className="flex items-center gap-4">
          {!editing ? (
            <>
              <button
                onClick={() => setEditing(true)}
                className="text-meta border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors duration-200"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="text-meta hover:opacity-40 transition-opacity"
              >
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="text-meta bg-black text-white px-4 py-2 hover:bg-white hover:text-black border border-black transition-colors duration-200"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-meta hover:opacity-40 transition-opacity"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main layout: image + editorial text */}
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[calc(100vh-60px)]">
        {/* Image column */}
        <div className="md:col-span-7 border-b md:border-b-0 md:border-r border-black flex items-center justify-center bg-black">
          <img
            ref={imgRef}
            src={selectedPhoto.url}
            alt={selectedPhoto.description}
            className="w-full h-full object-contain grayscale max-h-[80vh] md:max-h-screen"
            style={{ opacity: 0 }}
          />
        </div>

        {/* Content column */}
        <div
          ref={contentRef}
          className="md:col-span-5 px-8 py-10 flex flex-col justify-between"
          style={{ opacity: 0 }}
        >
          <div ref={metaRef} className="space-y-8">
            {/* Date & location */}
            <div>
              {editing ? (
                <input
                  type="date"
                  value={editForm.date}
                  onChange={set('date')}
                  className={editInputClass}
                />
              ) : (
                <p className="text-meta opacity-50">{formatted}</p>
              )}
              {editing ? (
                <input
                  type="text"
                  value={editForm.location}
                  onChange={set('location')}
                  className={`${editInputClass} mt-2`}
                  placeholder="Location"
                />
              ) : (
                <h2
                  className="font-black leading-none mt-1"
                  style={{ fontSize: 'clamp(1.8rem, 4vw, 3.5rem)', letterSpacing: '-0.03em' }}
                >
                  {selectedPhoto.location}
                </h2>
              )}
            </div>

            {/* Description */}
            <div>
              <p className="text-meta opacity-40 mb-2">Thought</p>
              {editing ? (
                <textarea
                  value={editForm.description}
                  onChange={set('description')}
                  rows={4}
                  className={`${editInputClass} resize-none`}
                />
              ) : (
                <p className="font-light text-base leading-relaxed">{selectedPhoto.description}</p>
              )}
            </div>

            {/* Technical metadata table */}
            <div>
              <p className="text-meta opacity-40 mb-3">Technical</p>
              <div className="space-y-0">
                {[
                  ['Camera', 'camera'],
                  ['ISO', 'iso'],
                  ['Aperture', 'aperture'],
                  ['Shutter', 'shutter'],
                  ['Author', 'author'],
                ].map(([label, key]) => (
                  <div key={key} className="flex justify-between items-baseline py-2 border-b border-black/10">
                    <span className="text-meta opacity-40">{label}</span>
                    {editing ? (
                      key === 'author' ? (
                        <select
                          value={editForm[key] || ''}
                          onChange={set(key)}
                          className="text-meta border-b border-black focus:outline-none bg-transparent"
                        >
                          <option>Abahyomi</option>
                          <option>Alexandra</option>
                          <option>Both</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={editForm[key] || ''}
                          onChange={set(key)}
                          className="text-meta text-right border-b border-black focus:outline-none bg-transparent w-28"
                        />
                      )
                    ) : (
                      <span className="text-meta">{selectedPhoto[key] || '—'}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom: photo index indicator */}
          <div className="mt-10 pt-4 border-t border-black">
            <p className="text-meta opacity-30">PRICK / Visual Archive</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const editInputClass =
  'w-full border-b border-black focus:outline-none bg-transparent text-sm font-light py-1'
