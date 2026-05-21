import { useState, useCallback } from 'react'
import { isSupabaseConfigured, uploadImage } from '../utils/supabase'
import { uploadToCloudinary }                from '../utils/cloudinary'

export function usePhotoUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [error,     setError]     = useState(null)

  const upload = useCallback(async (file, id) => {
    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      if (isSupabaseConfigured()) {
        // Supabase Storage — imagen visible en todos los dispositivos
        const url = await uploadImage(file, id || `photo-${Date.now()}`, setProgress)
        return { url, thumb: url }
      }
      // Cloudinary o data URL como fallback
      return await uploadToCloudinary(file, setProgress)
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setUploading(false)
    }
  }, [])

  return { upload, uploading, progress, error }
}
