import React, { useState } from 'react'
import { PhotoProvider } from './context/PhotoContext'
import Header from './components/Header'
import Gallery from './components/Gallery'
import UploadModal from './components/UploadModal'
import PhotoDetail from './components/PhotoDetail'
import Loader from './components/Loader'
import { useDarkMode } from './hooks/useDarkMode'

export default function App() {
  const [dark, setDark] = useDarkMode()
  const [ready, setReady] = useState(false)

  return (
    <PhotoProvider>
      {/* Full-screen intro — sits above everything */}
      {!ready && <Loader onComplete={() => setReady(true)} />}

      <div className="min-h-screen bg-surface text-ink">
        <Header ready={ready} dark={dark} onToggleDark={() => setDark((d) => !d)} />
        <main>
          <Gallery />
        </main>
        <UploadModal />
        <PhotoDetail />
      </div>
    </PhotoProvider>
  )
}
