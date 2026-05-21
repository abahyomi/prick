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
    // Don't persist blob URLs — they're ephemeral
    const serializable = photos.filter((p) => !p.url.startsWith('blob:'))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable))
  } catch {
    // storage full or unavailable — silent fail
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

  // Persist to localStorage whenever photos change (fallback for dev)
  useEffect(() => {
    if (!usingCloudinary) {
      saveToStorage(photos)
    }
  }, [photos, usingCloudinary])

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
