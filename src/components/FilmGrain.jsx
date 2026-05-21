import { useRef, useEffect } from 'react'

// Animated canvas film grain — runs at ~20fps for performance
export default function FilmGrain() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    let rafId
    let tick = 0

    function resize() {
      // Half-resolution canvas, CSS stretches it — cheaper than full-res
      canvas.width  = Math.ceil(window.innerWidth  / 1.5)
      canvas.height = Math.ceil(window.innerHeight / 1.5)
    }

    function draw() {
      tick++
      // ~20 fps: skip 2 out of every 3 animation frames
      if (tick % 3 !== 0) {
        rafId = requestAnimationFrame(draw)
        return
      }

      const { width, height } = canvas
      const imageData = ctx.createImageData(width, height)
      const data = imageData.data
      const len  = data.length

      for (let i = 0; i < len; i += 4) {
        const v = (Math.random() * 255) | 0
        data[i]     = v
        data[i + 1] = v
        data[i + 2] = v
        data[i + 3] = 255
      }

      ctx.putImageData(imageData, 0, 0)
      rafId = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
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
        opacity:       0.038,
        mixBlendMode:  'screen',
      }}
    />
  )
}
