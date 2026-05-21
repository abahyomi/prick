import { useState, useCallback } from 'react'
import { uploadToCloudinary } from '../utils/cloudinary'

export function usePhotoUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)

  const upload = useCallback(async (file) => {
    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      const result = await uploadToCloudinary(file, setProgress)
      return result
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setUploading(false)
    }
  }, [])

  return { upload, uploading, progress, error }
}
