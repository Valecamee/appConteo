import React from 'react'
import './Header.css'

const Header = ({ user, onLogout }) => {
  return (
    <header className="header">
      <div className="header-content">
        {user && (
          <div className="user-info">
            <span className="welcome-text">Bienvenido, {user.fullName || user.username}</span>
            <button className="logout-button" onClick={onLogout}>
              🚪 Cerrar Sesión
            </button>
          </div>
        )}
        
        <h1 className="main-title">
          App Contar
        </h1>
        
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