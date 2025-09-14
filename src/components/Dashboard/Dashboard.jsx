// src/components/Dashboard/Dashboard.jsx
import React from 'react'
import './Dashboard.css'

const Dashboard = ({ user, onLogout, onCreateNewCount, onViewHistory }) => {
  return (
    <div className="dashboard-container">
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

      {/* Header del usuario */}
      <div className="dashboard-header">
        <div className="user-welcome">
          <h1 className="dashboard-title">App Contar</h1>
          <p className="welcome-message">
            Bienvenido, <span className="user-name">{user.fullName || user.email.split('@')[0]}</span>
          </p>
          <p className="dashboard-subtitle">¿Qué deseas hacer hoy?</p>
        </div>
        
        <button className="logout-button" onClick={onLogout}>
          🚪 Cerrar Sesión
        </button>
      </div>

      {/* Opciones principales */}
      <div className="dashboard-options">
        <div 
          className="dashboard-card create-new"
          onClick={onCreateNewCount}
        >
          <div className="card-icon">
            <span className="icon-emoji">🎯</span>
          </div>
          <div className="card-content">
            <h3 className="card-title">Crear Nuevo Conteo</h3>
            <p className="card-description">
              Inicia un nuevo proceso de conteo de vehículos o peatones con configuración personalizada
            </p>
            <div className="card-features">
              <span className="feature">📹 Análisis por video</span>
              <span className="feature">⏱️ Franjas de 15 min</span>
              <span className="feature">📊 Múltiples movimientos</span>
            </div>
          </div>
          <div className="card-arrow">→</div>
        </div>

        <div 
          className="dashboard-card view-history"
          onClick={onViewHistory}
        >
          <div className="card-icon">
            <span className="icon-emoji">📚</span>
          </div>
          <div className="card-content">
            <h3 className="card-title">Conteos Anteriores</h3>
            <p className="card-description">
              Revisa, analiza y descarga los conteos que has realizado anteriormente
            </p>
            <div className="card-features">
              <span className="feature">📈 Historial completo</span>
              <span className="feature">💾 Exportar datos</span>
              <span className="feature">🔍 Buscar conteos</span>
            </div>
          </div>
          <div className="card-arrow">→</div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="dashboard-info">
        <div className="info-card">
          <div className="info-icon">ℹ️</div>
          <div className="info-content">
            <h4>¿Cómo funciona?</h4>
            <p>
              1. Configura tu video y horarios<br/>
              2. Selecciona tipo y movimientos<br/>
              3. Cuenta por franjas de 15 minutos<br/>
              4. Exporta tus resultados
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard