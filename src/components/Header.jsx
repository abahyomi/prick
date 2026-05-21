import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { usePhotos } from '../context/PhotoContext'

export default function Header({ ready, dark, onToggleDark }) {
  const { setUploadModalOpen, photos } = usePhotos()
  const titleRef = useRef(null)
  const metaRef  = useRef(null)
  const navRef   = useRef(null)

  useEffect(() => {
    if (!ready) return

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    tl.fromTo(navRef.current,
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: 0.5 }
      )
      .fromTo(titleRef.current,
        { yPercent: 110, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 1.05 },
        '-=0.1'
      )
      .fromTo(metaRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.6 },
        '-=0.3'
      )
  }, [ready])

  return (
    <header className="w-full">
      {/* Nav strip — no border */}
      <div
        ref={navRef}
        className="flex items-center justify-between px-8 pt-6 pb-2"
        style={{ opacity: 0 }}
      >
        <span className="text-meta opacity-30">
          Vol. I &nbsp;—&nbsp; {new Date().getFullYear()}
        </span>

        <div className="flex items-center gap-6">
          <span className="text-meta opacity-30">{photos.length} frames</span>

          <button
            onClick={onToggleDark}
            aria-label="Toggle dark mode"
            className="text-meta opacity-50 hover:opacity-100 transition-opacity select-none"
          >
            <span className="theme-icon" />
          </button>

          <button
            onClick={() => setUploadModalOpen(true)}
            className="text-meta bg-ink text-surface px-4 py-2 hover:opacity-70 transition-opacity"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Massive title */}
      <div className="px-8 pt-6 pb-4 overflow-hidden">
        <h1
          ref={titleRef}
          className="font-black leading-none select-none text-ink"
          style={{
            fontSize: 'clamp(5rem, 18vw, 18rem)',
            letterSpacing: '-0.04em',
            opacity: 0,
          }}
        >
          PRICK
        </h1>
      </div>

      {/* Subtitle */}
      <div
        ref={metaRef}
        className="flex flex-wrap items-end justify-between gap-4 px-8 pb-8"
        style={{ opacity: 0 }}
      >
        <div>
          <p
            className="font-black uppercase leading-tight text-ink"
            style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.4rem)', letterSpacing: '0.15em' }}
          >
            Abahyomi &amp; Alexandra
          </p>
          <p className="text-meta mt-1 opacity-40">A Visual Diary &mdash; Ongoing</p>
        </div>
        <p className="text-meta text-right opacity-30 max-w-xs">
          Memory rendered as image.
          <br />
          Every frame is a fact.
        </p>
      </div>
    </header>
  )
}
