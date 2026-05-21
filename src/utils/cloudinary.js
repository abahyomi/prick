import { compressToBlob } from './supabase'

const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export const isCloudinaryConfigured = () => Boolean(CLOUD_NAME && UPLOAD_PRESET)

// Fallback sin backend: comprime y devuelve data URL (persiste en localStorage)
async function toDataURL(file) {
  const blob = await compressToBlob(file)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = e => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function uploadToCloudinary(file, onProgress) {
  if (!isCloudinaryConfigured()) {
    onProgress?.(30)
    const dataUrl = await toDataURL(file)
    onProgress?.(100)
    return { url: dataUrl, thumb: dataUrl, publicId: `local-${Date.now()}` }
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', 'prick')

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress)
        onProgress(Math.round((e.loaded / e.total) * 100))
    })
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const d = JSON.parse(xhr.responseText)
        const thumb = d.secure_url.replace('/upload/', '/upload/w_1080,e_grayscale,q_75/')
        const url   = d.secure_url.replace('/upload/', '/upload/w_1080,e_grayscale,q_85/')
        resolve({ url, thumb, publicId: d.public_id })
      } else {
        reject(new Error('Upload failed'))
      }
    })
    xhr.addEventListener('error', () => reject(new Error('Network error')))
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`)
    xhr.send(formData)
  })
}
