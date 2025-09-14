import React from 'react'
import './Header.css'

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="main-title">
          App Contar
        </h1>
        <p className="subtitle">Contador de Vehículos - Estilo Videojuego</p>
        <div className="header-decoration">
          <div className="decoration-line"></div>
          <div className="decoration-dot"></div>
          <div className="decoration-line"></div>
        </div>
      </div>
    </header>
  )
}

export default Header 