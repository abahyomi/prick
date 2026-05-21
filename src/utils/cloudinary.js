const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export const isCloudinaryConfigured = () => Boolean(CLOUD_NAME && UPLOAD_PRESET)

// Upload a File object to Cloudinary via unsigned upload
export async function uploadToCloudinary(file, onProgress) {
  if (!isCloudinaryConfigured()) {
    // Return a local object URL as fallback in dev
    return {
      url: URL.createObjectURL(file),
      thumb: URL.createObjectURL(file),
      publicId: `local-${Date.now()}`,
    }
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', 'prick')

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText)
        // Build a grayscale thumb via Cloudinary transformation
        const baseUrl = data.secure_url
        const thumb = baseUrl.replace('/upload/', '/upload/w_600,e_grayscale,q_70/')
        const url = baseUrl.replace('/upload/', '/upload/w_1800,e_grayscale,q_85/')
        resolve({ url, thumb, publicId: data.public_id })
      } else {
        reject(new Error('Upload failed'))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Network error')))
    xhr.open('POST', endpoint)
    xhr.send(formData)
  })
}
