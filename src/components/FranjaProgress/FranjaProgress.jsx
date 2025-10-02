// src/components/FranjaProgress/FranjaProgress.jsx
import React from 'react'
import './FranjaProgress.css'

const FranjaProgress = ({ 
  franjaActual, 
  totalFranjas, 
  horaInicio, 
  horaFin, 
  nombreVideo,
  fecha,
  onNavigateToFranja,
  franjasCompletadas = [],
  isFranjaCompletada,
  getProgresoTotal
}) => {
  // Formatear hora para mostrar (12h format)
  const formatTimeDisplay = (time24) => {
    const [hour, minute] = time24.split(':')
    const hourNum = parseInt(hour)
    const ampm = hourNum >= 12 ? 'PM' : 'AM'
    const hour12 = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum
    return `${hour12}:${minute} ${ampm}`
  }

  // Calcular hora actual de la franja
  const getFranjaTime = (franjaNum) => {
    const [startHour, startMin] = horaInicio.split(':').map(Number)
    const startTotalMin = startHour * 60 + startMin
    
    // Inicio de la franja actual
    const franjaStartMin = startTotalMin + ((franjaNum - 1) * 15)
    const franjaEndMin = franjaStartMin + 15
    
    const startHour24 = Math.floor(franjaStartMin / 60)
    const startMin24 = franjaStartMin % 60
    const endHour24 = Math.floor(franjaEndMin / 60)
    const endMin24 = franjaEndMin % 60
    
    const inicio = `${startHour24.toString().padStart(2, '0')}:${startMin24.toString().padStart(2, '0')}`
    const fin = `${endHour24.toString().padStart(2, '0')}:${endMin24.toString().padStart(2, '0')}`
    
    return { inicio, fin }
  }

  const currentTime = getFranjaTime(franjaActual)
  const progressPercentage = ((franjaActual - 1) / totalFranjas) * 100

  return (
    <div className="franja-progress-container">
      {/* Información del video */}
      <div className="video-info">
        <div className="video-details">
          <h3 className="video-name">📹 {nombreVideo}</h3>
          <p className="video-date">📅 {(() => {
            try {
              // Si fecha es una string en formato YYYY-MM-DD, convertirla
              if (typeof fecha === 'string' && fecha.includes('-')) {
                const date = new Date(fecha + 'T00:00:00')
                if (!isNaN(date.getTime())) {
                  return date.toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })
                }
              }
              // Si es un objeto Date válido
              if (fecha instanceof Date && !isNaN(fecha.getTime())) {
                return fecha.toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })
              }
              // Fallback: mostrar la fecha como string
              return fecha || 'Fecha no disponible'
            } catch (error) {
              console.error('Error formateando fecha:', error)
              return fecha || 'Fecha no disponible'
            }
          })()}</p>
        </div>
        <div className="total-range">
          <span className="range-time">
            {formatTimeDisplay(horaInicio)} - {formatTimeDisplay(horaFin)}
          </span>
        </div>
      </div>


      {/* Franja actual */}
      <div className="current-franja">
        <div className="franja-header">
          <div className="franja-number">
            <span className="franja-label">Franja</span>
            <span className="franja-current">{franjaActual}</span>
            <span className="franja-separator">de</span>
            <span className="franja-total">{totalFranjas}</span>
          </div>
          <div className="franja-time">
            <span className="time-range">
              {formatTimeDisplay(currentTime.inicio)} - {formatTimeDisplay(currentTime.fin)}
            </span>
            <span className="time-duration">15 min</span>
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="progress-section">
        <div className="progress-header">
          <span className="progress-label">Progreso General</span>
          <span className="progress-percentage">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill"
            style={{ width: `${progressPercentage}%` }}
          >
            <div className="progress-bar-shine"></div>
          </div>
          <div className="progress-markers">
            {Array.from({ length: Math.min(totalFranjas, 20) }, (_, i) => {
              const franjaNum = Math.floor((i / 19) * (totalFranjas - 1)) + 1
              return (
                <div 
                  key={i}
                  className={`progress-marker ${franjaNum <= franjaActual ? 'completed' : ''}`}
                  style={{ left: `${(i / 19) * 100}%` }}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* Navegación de franjas */}
      <div className="franja-navigation">
        <div className="nav-header">
          <span className="nav-title">🕐 Navegación por Franjas</span>
          <span className="nav-subtitle">Click para navegar libremente entre franjas</span>
        </div>
        
        <div className="franjas-grid">
          {Array.from({ length: totalFranjas }, (_, i) => {
            const franjaNum = i + 1
            const franjaTime = getFranjaTime(franjaNum)
            const isCompleted = isFranjaCompletada ? isFranjaCompletada(franjaNum) : franjasCompletadas.includes(franjaNum)
            const isCurrent = franjaNum === franjaActual
            // ✅ PERMITIR NAVEGACIÓN LIBRE - El usuario puede ir a cualquier franja
            const isAccessible = true
            
            return (
              <button
                key={franjaNum}
                className={`franja-button ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''} ${!isAccessible ? 'disabled' : ''}`}
                onClick={() => isAccessible && onNavigateToFranja && onNavigateToFranja(franjaNum)}
                disabled={!isAccessible}
                title={`Franja ${franjaNum}: ${formatTimeDisplay(franjaTime.inicio)} - ${formatTimeDisplay(franjaTime.fin)}`}
              >
                <span className="franja-button-number">{franjaNum}</span>
                <span className="franja-button-time">
                  {formatTimeDisplay(franjaTime.inicio)}
                </span>
                {isCompleted && (
                  <span className="franja-button-check">✓</span>
                )}
                {isCurrent && (
                  <span className="franja-button-current">📍</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Estadísticas */}
      <div className="progress-stats">
        <div className="stat-item">
          <span className="stat-value">{franjasCompletadas.length}</span>
          <span className="stat-label">Completadas</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{totalFranjas - franjasCompletadas.length}</span>
          <span className="stat-label">Restantes</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{Math.round((franjasCompletadas.length / totalFranjas) * 100)}%</span>
          <span className="stat-label">Progreso</span>
        </div>
      </div>
    </div>
  )
}

export default FranjaProgress