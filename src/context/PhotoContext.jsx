import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { MOCK_PHOTOS } from '../data/mockData'
import { isCloudinaryConfigured } from '../utils/cloudinary'

const PhotoContext = createContext(null)

const STORAGE_KEY = 'prick_photos_v2' // v2 fuerza reset del caché con fotos reales

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // corrupted data — ignore
  }
  return null
}

function saveToStorage(photos) {
  try {
    // Las data URLs (base64) son persistentes; blob:// no lo son — excluirlas
    const serializable = photos.filter((p) => p.url && !p.url.startsWith('blob:'))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable))
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      console.warn('[PRICK] localStorage lleno — considera conectar Cloudinary')
    }
  }
}

export function PhotoProvider({ children }) {
  const [photos, setPhotos] = useState(() => {
    const stored = loadFromStorage()
    // Use stored data if present; otherwise fall back to mock data
    return stored?.length ? stored : MOCK_PHOTOS
  })
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [usingCloudinary] = useState(isCloudinaryConfigured)

  // Persistir siempre — fotos locales usan data URLs que sobreviven recarga
  useEffect(() => {
    saveToStorage(photos)
  }, [photos])

  const addPhoto = useCallback((photo) => {
    const newPhoto = { ...photo, id: `photo-${Date.now()}` }
    setPhotos((prev) => [newPhoto, ...prev])
  }, [])

  const updatePhoto = useCallback((id, updates) => {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))
  }, [])

  const deletePhoto = useCallback((id) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id))
    setSelectedPhoto(null)
  }, [])

  return (
    <PhotoContext.Provider
      value={{
        photos,
        selectedPhoto,
        setSelectedPhoto,
        uploadModalOpen,
        setUploadModalOpen,
        addPhoto,
        updatePhoto,
        deletePhoto,
        usingCloudinary,
      }}
    >
      {children}
    </PhotoContext.Provider>
  )
}

export function usePhotos() {
  const ctx = useContext(PhotoContext)
  if (!ctx) throw new Error('usePhotos must be used within PhotoProvider')
  return ctx
}
