import React from 'react'
import { usePhotos } from '../context/PhotoContext'

// Invisible en pantalla — solo aparece con @media print
export default function PrintView() {
  const { photos } = usePhotos()

  const fmt = (d, t) => {
    const date = new Date(d).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'long', year: 'numeric',
    })
    return t ? `${date} · ${t}` : date
  }

  return (
    <div className="print-layout" aria-hidden="true">
      {/* Cabecera */}
      <div className="print-header">
        <p className="print-title">PRICK</p>
        <p className="print-subtitle">Abahyomi &amp; Alexandra — Diario de fotografías</p>
      </div>

      {/* Grid de fotos */}
      <div className="print-grid">
        {photos.map(photo => (
          <div key={photo.id} className="print-photo">
            <img
              src={photo.url}
              alt={photo.location}
              loading="eager"
            />
            <div className="print-caption">
              <span>{photo.location}</span>
              <span>{fmt(photo.date, photo.time)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pie de página */}
      <div className="print-footer">
        <span>alexabah.com</span>
        <span>Impreso el {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
      </div>
    </div>
  )
}
