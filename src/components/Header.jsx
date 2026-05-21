import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { usePhotos } from '../context/PhotoContext'

export default function Header() {
  const { setUploadModalOpen, photos } = usePhotos()
  const titleRef = useRef(null)
  const metaRef = useRef(null)
  const lineRef = useRef(null)
  const navRef = useRef(null)

  // GSAP intro stagger — triggered once on mount
  useEffect(() => {
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
  }, [])

  return (
    <header className="w-full border-b border-black">
      {/* Top nav strip */}
      <div
        ref={navRef}
        className="flex items-center justify-between px-6 pt-5 pb-3 opacity-0"
        style={{ opacity: 0 }}
      >
        <span className="text-meta text-black">
          Vol. I &nbsp;—&nbsp; {new Date().getFullYear()}
        </span>
        <div className="flex items-center gap-6">
          <span className="text-meta text-black">{photos.length} frames</span>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="text-meta bg-black text-white px-4 py-2 hover:bg-white hover:text-black border border-black transition-colors duration-200"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Divider */}
      <div ref={lineRef} className="h-px w-full bg-black" style={{ scaleX: 0 }} />

      {/* Main title block */}
      <div className="px-6 pt-8 pb-6 overflow-hidden">
        <h1
          ref={titleRef}
          className="font-black leading-none tracking-tightest select-none"
          style={{
            fontSize: 'clamp(5rem, 18vw, 18rem)',
            letterSpacing: '-0.04em',
            opacity: 0,
          }}
        >
          PRICK
        </h1>
      </div>

      {/* Meta subtitle strip */}
      <div
        ref={metaRef}
        className="flex flex-wrap items-end justify-between gap-4 px-6 pb-6"
        style={{ opacity: 0 }}
      >
        <div>
          <p
            className="font-black uppercase leading-tight"
            style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.5rem)', letterSpacing: '0.15em' }}
          >
            Abahyomi &amp; Alexandra
          </p>
          <p className="text-meta mt-1 opacity-60">A Visual Diary &mdash; Ongoing</p>
        </div>
        <p className="text-meta text-right opacity-60 max-w-xs">
          Memory rendered as image.&nbsp;
          <br />
          Every frame is a fact.
        </p>
      </div>
    </header>
  )
}
