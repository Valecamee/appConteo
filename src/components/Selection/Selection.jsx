// src/components/Selection/Selection.jsx
import React from 'react'
import './Selection.css'

const Selection = ({ user, onLogout, onSelect }) => {
  const handleOptionSelect = (option) => {
    console.log('Opción seleccionada:', option)
    onSelect(option)
  }

  return (
    <div className="selection-container">
      {/* Partículas flotantes */}
      <div className="floating-particle"></div>
      <div className="floating-particle"></div>
      <div className="floating-particle"></div>
      <div className="floating-particle"></div>
      <div className="floating-particle"></div>
      <div className="floating-particle"></div>
      <div className="floating-particle"></div>
      <div className="floating-particle"></div>
      <div className="floating-particle"></div>

      {/* Header */}
      <div className="selection-header">
        <h1 className="selection-title">App Contar</h1>
        <p className="selection-subtitle">Selecciona el tipo de conteo</p>
        <p className="selection-description">
          Bienvenido, {user.fullName || user.email.split('@')[0]}
        </p>
      </div>

      {/* Opciones de selección */}
      <div className="selection-options">
        <div 
          className="selection-card vehicles"
          onClick={() => handleOptionSelect('vehicles')}
        >
          <div className="selection-image-container">
            <img 
              src="/images/motorized.jpeg" 
              alt="Motorizados y Bicicletas"
              className="selection-image"
              onError={(e) => {
                // Si la imagen no carga, mostrar emoji como fallback
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'block'
              }}
            />
            <div className="selection-icon fallback" style={{ display: 'none' }}>🚗</div>
          </div>
          <h3 className="selection-card-title">Motorizados y Bicicletas</h3>
          <p className="selection-card-description">
            Conteo de vehículos motorizados, buses, camiones, motos y bicicletas
          </p>
          <span className="selection-badge">Vehículos</span>
        </div>

        <div 
          className="selection-card pedestrians"
          onClick={() => handleOptionSelect('pedestrians')}
        >
          <div className="selection-image-container">
            <img 
              src="/images/pedestrians.jpeg" 
              alt="Peatones"
              className="selection-image"
              onError={(e) => {
                // Si la imagen no carga, mostrar emoji como fallback
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'block'
              }}
            />
            <div className="selection-icon fallback" style={{ display: 'none' }}>🚶</div>
          </div>
          <h3 className="selection-card-title">Peatones</h3>
          <p className="selection-card-description">
            Conteo de personas que transitan a pie por la zona
          </p>
          <span className="selection-badge">Peatones</span>
        </div>
      </div>

      {/* Botón de logout - AHORA AL FINAL */}
      <button className="back-button" onClick={onLogout}>
        🚪 Cerrar Sesión
      </button>
    </div>
  )
}

export default Selection