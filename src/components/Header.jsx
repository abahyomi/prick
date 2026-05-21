import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { usePhotos } from '../context/PhotoContext'

export default function Header({ ready, dark, onToggleDark }) {
  const { setUploadModalOpen, photos } = usePhotos()
  const titleRef = useRef(null)
  const metaRef  = useRef(null)
  const lineRef  = useRef(null)
  const navRef   = useRef(null)

  // Only animate after Loader completes
  useEffect(() => {
    if (!ready) return

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    tl.fromTo(
      titleRef.current,
      { yPercent: 110, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 1.1 }
    )
      .fromTo(
        lineRef.current,
        { scaleX: 0, transformOrigin: 'left center' },
        { scaleX: 1, duration: 0.7 },
        '-=0.3'
      )
      .fromTo(
        metaRef.current,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.6 },
        '-=0.2'
      )
      .fromTo(
        navRef.current,
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.5 },
        '-=0.4'
      )
  }, [ready])

  return (
    <header className="w-full border-b border-ink">
      {/* Top nav strip */}
      <div
        ref={navRef}
        className="flex items-center justify-between px-6 pt-5 pb-3"
        style={{ opacity: 0 }}
      >
        <span className="text-meta text-ink">
          Vol. I &nbsp;—&nbsp; {new Date().getFullYear()}
        </span>

        <div className="flex items-center gap-5">
          <span className="text-meta text-ink">{photos.length} frames</span>

          {/* Dark mode toggle */}
          <button
            onClick={onToggleDark}
            aria-label="Toggle dark mode"
            className="text-meta text-ink hover:opacity-50 transition-opacity select-none"
            title={dark ? 'Switch to light' : 'Switch to dark'}
          >
            <span className="theme-icon" />
          </button>

          <button
            onClick={() => setUploadModalOpen(true)}
            className="text-meta bg-ink text-surface px-4 py-2 hover:bg-surface hover:text-ink border border-ink transition-colors duration-200"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Divider */}
      <div ref={lineRef} className="h-px w-full bg-ink" style={{ scaleX: 0 }} />

      {/* Main title */}
      <div className="px-6 pt-8 pb-6 overflow-hidden">
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

      {/* Meta subtitle */}
      <div
        ref={metaRef}
        className="flex flex-wrap items-end justify-between gap-4 px-6 pb-6"
        style={{ opacity: 0 }}
      >
        <div>
          <p
            className="font-black uppercase leading-tight text-ink"
            style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.5rem)', letterSpacing: '0.15em' }}
          >
            Abahyomi &amp; Alexandra
          </p>
          <p className="text-meta mt-1 opacity-60">A Visual Diary &mdash; Ongoing</p>
        </div>
        <p className="text-meta text-right opacity-60 max-w-xs">
          Memory rendered as image.
          <br />
          Every frame is a fact.
        </p>
      </div>
    </header>
  )
}
