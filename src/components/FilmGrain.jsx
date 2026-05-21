import { useRef, useEffect } from 'react'

// Film grain that reads against both darks AND lights:
//   overlay blend = screen-like on dark pixels + multiply-like on light pixels
//
// Full device-pixel-ratio resolution so each noise dot = exactly 1 screen pixel.
// crypto.getRandomValues() for hardware-speed bulk entropy (~60× faster than Math.random).

const CHUNK = 65536 // max bytes per crypto.getRandomValues call

export default function FilmGrain() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d', { alpha: false })
    let   rafId
    let   tick  = 0
    let   gray  = null // reuse typed array across frames

    function resize() {
      const dpr    = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width  = Math.ceil(window.innerWidth  * dpr)
      canvas.height = Math.ceil(window.innerHeight * dpr)
      gray = new Uint8Array(canvas.width * canvas.height)
    }

    function draw() {
      tick++
      // 12 fps — skip 4 of every 5 animation frames
      if (tick % 5 !== 0) {
        rafId = requestAnimationFrame(draw)
        return
      }

      const { width, height } = canvas

      // Fill luminance buffer with hardware entropy
      for (let off = 0; off < gray.length; off += CHUNK) {
        crypto.getRandomValues(gray.subarray(off, Math.min(off + CHUNK, gray.length)))
      }

      // Write grayscale noise into ImageData
      const imageData = ctx.createImageData(width, height)
      const buf = imageData.data // Uint8ClampedArray

      for (let i = 0, j = 0; i < buf.length; i += 4, j++) {
        buf[i] = buf[i + 1] = buf[i + 2] = gray[j]
        buf[i + 3] = 255
      }

      ctx.putImageData(imageData, 0, 0)
      rafId = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize, { passive: true })
    draw()

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position:      'fixed',
        inset:         0,
        width:         '100%',
        height:        '100%',
        pointerEvents: 'none',
        zIndex:        9998,
        opacity:       0.055,
        // overlay = screen on darks + multiply on lights → grain everywhere
        mixBlendMode:  'overlay',
      }}
    />
  )
}
