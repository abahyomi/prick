import { createClient } from '@supabase/supabase-js'

const URL_   = import.meta.env.VITE_SUPABASE_URL
const KEY    = import.meta.env.VITE_SUPABASE_ANON_KEY
const BUCKET = import.meta.env.VITE_SUPABASE_BUCKET || 'prick-photos'

export const isSupabaseConfigured = () => Boolean(URL_ && KEY)

export const supabase = isSupabaseConfigured()
  ? createClient(URL_, KEY)
  : null

// ── Compresión antes de subir ──────────────────────────────
export async function compressToBlob(file, maxPx = 1080, quality = 0.88) {
  return new Promise((resolve, reject) => {
    // Timeout de 30s por si el navegador cuelga al decodificar la imagen
    const timer = setTimeout(() => reject(new Error('Tiempo de compresión agotado (30s)')), 30_000)
    const done  = (val) => { clearTimeout(timer); resolve(val) }
    const fail  = (msg) => { clearTimeout(timer); reject(new Error(msg)) }

    const img    = new Image()
    const tmpUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(tmpUrl)
      try {
        let w = img.naturalWidth, h = img.naturalHeight
        if (!w || !h) return fail('Imagen sin dimensiones — formato no soportado')
        if (w > maxPx || h > maxPx) {
          if (w > h) { h = Math.round(h * maxPx / w); w = maxPx }
          else       { w = Math.round(w * maxPx / h); h = maxPx }
        }
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        canvas.toBlob(
          b => b ? done(b) : fail('canvas.toBlob devolvió null — memoria insuficiente'),
          'image/jpeg', quality
        )
      } catch (e) { fail(e.message) }
    }
    img.onerror = () => {
      URL.revokeObjectURL(tmpUrl)
      fail('No se pudo cargar la imagen — formato no compatible')
    }
    img.src = tmpUrl
  })
}

// ── Subir imagen al bucket ─────────────────────────────────
export async function uploadImage(file, id, onProgress) {
  onProgress?.(20)
  const blob = await compressToBlob(file)
  onProgress?.(60)

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(`${id}.jpg`, blob, { contentType: 'image/jpeg', upsert: true })

  if (error) throw error
  onProgress?.(100)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(`${id}.jpg`)
  return data.publicUrl
}

// ── CRUD fotos ─────────────────────────────────────────────
const FIELDS = 'id,url,thumb,date,location,description,author,camera,iso,aperture,shutter,lat,lng'

export async function dbFetch() {
  const { data, error } = await supabase
    .from('photos')
    .select(FIELDS)
    .order('date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function dbInsert(photo) {
  const { _pendingFile, ...row } = photo
  const { data, error } = await supabase
    .from('photos').insert(row).select(FIELDS).single()
  if (error) throw error
  return data
}

export async function dbUpdate(id, updates) {
  const { _pendingFile, ...row } = updates
  const { error } = await supabase
    .from('photos').update(row).eq('id', id)
  if (error) throw error
}

export async function dbDelete(id) {
  const { error } = await supabase
    .from('photos').delete().eq('id', id)
  if (error) throw error
}

// ── Seed fotos reales al primer uso ───────────────────────
export async function seedIfEmpty(mockPhotos) {
  try {
    const { count, error } = await supabase
      .from('photos').select('*', { count: 'exact', head: true })
    if (error) { console.warn('[seed] count error:', error.message); return }
    if ((count ?? 0) === 0) {
      const rows = mockPhotos.map(({ _pendingFile, ...p }) => p)
      const { error: insertErr } = await supabase.from('photos').insert(rows)
      if (insertErr) console.warn('[seed] insert error:', insertErr.message)
    }
  } catch (e) { console.warn('[seed]', e) }
}

// ── Real-time: notifica a todos los dispositivos ───────────
export function subscribeToPhotos(onChange) {
  const ch = supabase
    .channel('prick-photos-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'photos' }, onChange)
    .subscribe()
  return () => supabase.removeChannel(ch)
}
