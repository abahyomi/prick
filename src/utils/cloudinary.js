const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export const isCloudinaryConfigured = () => Boolean(CLOUD_NAME && UPLOAD_PRESET)

// Comprime + convierte a data URL (base64 JPEG).
// Las data URLs persisten en localStorage indefinidamente, a diferencia de blob://
async function toDataURL(file, maxPx = 1080, quality = 0.88) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const blob = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(blob) // limpia el blob temporal
      let { naturalWidth: w, naturalHeight: h } = img

      if (w > maxPx || h > maxPx) {
        if (w > h) { h = Math.round(h * maxPx / w); w = maxPx }
        else       { w = Math.round(w * maxPx / h); h = maxPx }
      }

      const canvas = document.createElement('canvas')
      canvas.width  = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = blob
  })
}

export async function uploadToCloudinary(file, onProgress) {
  if (!isCloudinaryConfigured()) {
    // Fallback local: comprime y codifica como data URL (persiste en localStorage)
    onProgress?.(30)
    const dataUrl = await toDataURL(file)
    onProgress?.(100)
    return { url: dataUrl, thumb: dataUrl, publicId: `local-${Date.now()}` }
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', 'prick')

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`

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
    xhr.open('POST', endpoint)
    xhr.send(formData)
  })
}
