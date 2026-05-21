import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { MOCK_PHOTOS } from '../data/mockData'
import {
  isSupabaseConfigured,
  dbFetch, dbInsert, dbUpdate, dbDelete,
  seedIfEmpty, subscribeToPhotos,
} from '../utils/supabase'

const PhotoContext = createContext(null)

const CACHE_KEY = 'prick_photos_v3'

// ── localStorage como caché rápido ───────────────────────
function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function writeCache(photos) {
  try {
    // Solo serializar fotos con URL real (excluye blob://)
    const rows = photos.filter(p => p.url && !p.url.startsWith('blob:'))
    localStorage.setItem(CACHE_KEY, JSON.stringify(rows))
  } catch (e) {
    if (e.name === 'QuotaExceededError')
      console.warn('[PRICK] localStorage lleno — configura Supabase para almacenamiento ilimitado')
  }
}

// ── Provider ──────────────────────────────────────────────
export function PhotoProvider({ children }) {
  const usingSupabase = isSupabaseConfigured()

  // Render inmediato con caché local o mock data
  const [photos, setPhotos] = useState(() => {
    const cached = readCache()
    return cached?.length ? cached : MOCK_PHOTOS
  })
  const [selectedPhoto,    setSelectedPhoto]   = useState(null)
  const [uploadModalOpen,  setUploadModalOpen] = useState(false)

  // ── Supabase: carga inicial + real-time ────────────────
  useEffect(() => {
    if (!usingSupabase) return

    // Sembrar fotos reales si la tabla está vacía, luego cargar
    seedIfEmpty(MOCK_PHOTOS)
      .then(() => dbFetch())
      .then(rows => { if (rows.length) setPhotos(rows) })
      .catch(console.error)

    // Real-time: cualquier cambio en DB se propaga a TODOS los dispositivos
    return subscribeToPhotos(() => {
      dbFetch()
        .then(rows => { if (rows.length) setPhotos(rows) })
        .catch(console.error)
    })
  }, [usingSupabase])

  // ── Persistir caché local ─────────────────────────────
  useEffect(() => {
    writeCache(photos)
  }, [photos])

  // ── CRUD ─────────────────────────────────────────────
  const addPhoto = useCallback(async (photo) => {
    const id = photo.id || `photo-${Date.now()}`
    const newPhoto = { ...photo, id }
    delete newPhoto._pendingFile

    if (usingSupabase) {
      const saved = await dbInsert(newPhoto)
      // El real-time ya actualizará el estado en todos los dispositivos,
      // pero actualizamos localmente de inmediato para respuesta instantánea
      setPhotos(prev => {
        if (prev.some(p => p.id === saved.id)) return prev
        return [saved, ...prev]
      })
    } else {
      setPhotos(prev => [newPhoto, ...prev])
    }
  }, [usingSupabase])

  const updatePhoto = useCallback(async (id, updates) => {
    const clean = { ...updates }
    delete clean._pendingFile

    if (usingSupabase) await dbUpdate(id, clean)
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, ...clean } : p))
  }, [usingSupabase])

  const deletePhoto = useCallback(async (id) => {
    if (usingSupabase) await dbDelete(id)
    setPhotos(prev => prev.filter(p => p.id !== id))
    setSelectedPhoto(null)
  }, [usingSupabase])

  return (
    <PhotoContext.Provider value={{
      photos, selectedPhoto, setSelectedPhoto,
      uploadModalOpen, setUploadModalOpen,
      addPhoto, updatePhoto, deletePhoto,
      usingSupabase,
    }}>
      {children}
    </PhotoContext.Provider>
  )
}

export function usePhotos() {
  const ctx = useContext(PhotoContext)
  if (!ctx) throw new Error('usePhotos must be used within PhotoProvider')
  return ctx
}
