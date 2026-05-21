import React from 'react'
import { PhotoProvider } from './context/PhotoContext'
import Header from './components/Header'
import Gallery from './components/Gallery'
import UploadModal from './components/UploadModal'
import PhotoDetail from './components/PhotoDetail'

export default function App() {
  return (
    <PhotoProvider>
      <div className="min-h-screen bg-white text-black">
        <Header />
        <main>
          <Gallery />
        </main>
        <UploadModal />
        <PhotoDetail />
      </div>
    </PhotoProvider>
  )
}
