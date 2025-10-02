// src/components/ConteoResumen/ConteoResumen.jsx
import React, { useState } from 'react'
import './ConteoResumen.css'

const ConteoResumen = ({ 
  conteoData, 
  onExportCSV, 
  onSaveToHistory, 
  onBackToDashboard,
  onEditFranja 
}) => {
  const [showDetailedView, setShowDetailedView] = useState(false)

  // Formatear hora para mostrar (12h format)
  const formatTimeDisplay = (time24) => {
    const [hour, minute] = time24.split(':')
    const hourNum = parseInt(hour)
    const ampm = hourNum >= 12 ? 'PM' : 'AM'
    const hour12 = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum
    return `${hour12}:${minute} ${ampm}`
  }

  // Calcular estadísticas generales
  const calcularEstadisticas = () => {
    let totalGeneral = 0
    const totalesPorTipo = {
      autos: 0,
      buses: 0,
      camiones: 0,
      motos: 0,
      bicicletas: 0,
      peatones: 0
    }

    // Verificar que conteoData y franjas existan
    if (!conteoData || !conteoData.franjas) {
      console.warn('ConteoResumen: conteoData o franjas no están disponibles')
      return { totalGeneral, totalesPorTipo }
    }

    conteoData.franjas.forEach(franja => {
      franja.movimientos.forEach(movimiento => {
        Object.keys(totalesPorTipo).forEach(tipo => {
          const cantidad = movimiento.conteos[tipo] || 0
          totalesPorTipo[tipo] += cantidad
          totalGeneral += cantidad
        })
      })
    })

    return { totalGeneral, totalesPorTipo }
  }

  // Calcular hora de una franja específica
  const getFranjaTime = (franjaNum) => {
    const [startHour, startMin] = conteoData.config.horaInicio.split(':').map(Number)
    const startTotalMin = startHour * 60 + startMin
    
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

  // Encontrar la franja con más actividad
  const getFranjaMasActiva = () => {
    let maxTotal = 0
    let franjaMasActiva = null

    if (!conteoData || !conteoData.franjas) {
      return { franja: null, total: 0 }
    }

    conteoData.franjas.forEach(franja => {
      let totalFranja = 0
      franja.movimientos.forEach(movimiento => {
        Object.values(movimiento.conteos).forEach(cantidad => {
          totalFranja += cantidad || 0
        })
      })
      
      if (totalFranja > maxTotal) {
        maxTotal = totalFranja
        franjaMasActiva = franja
      }
    })

    return { franja: franjaMasActiva, total: maxTotal }
  }

  const estadisticas = calcularEstadisticas()
  const franjaMasActiva = getFranjaMasActiva()
  const duracionTotal = conteoData?.config?.duracionTotal || 0

  // Si no hay datos, mostrar mensaje
  if (!conteoData || !conteoData.franjas || conteoData.franjas.length === 0) {
    return (
      <div className="resumen-container">
        <div className="no-data-message">
          <h2>No hay datos de conteo disponibles</h2>
          <p>No se encontraron franjas guardadas para mostrar el resumen.</p>
          <button 
            onClick={onBackToDashboard}
            style={{
              background: 'linear-gradient(45deg, #26de81, #20bf6b)',
              border: 'none',
              color: 'white',
              padding: '12px 25px',
              borderRadius: '15px',
              cursor: 'pointer',
              fontWeight: '600',
              marginTop: '20px'
            }}
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="resumen-container">
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

      {/* Header de completado */}
      <div className="completion-header">
        <div className="completion-icon">🎉</div>
        <h1 className="completion-title">¡Conteo Completado!</h1>
        <p className="completion-subtitle">
          Has terminado exitosamente el análisis del video
        </p>
      </div>

      {/* Información del conteo */}
      <div className="conteo-info-card">
        <div className="info-row">
          <div className="info-item">
            <span className="info-label">📹 Video:</span>
            <span className="info-value">{conteoData.config.nombreVideo}</span>
          </div>
          <div className="info-item">
            <span className="info-label">📅 Fecha:</span>
            <span className="info-value">
              {new Date(conteoData.config.fecha).toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>
        <div className="info-row">
          <div className="info-item">
            <span className="info-label">⏰ Horario:</span>
            <span className="info-value">
              {formatTimeDisplay(conteoData.config.horaInicio)} - {formatTimeDisplay(conteoData.config.horaFin)}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">📊 Duración:</span>
            <span className="info-value">
              {duracionTotal.hours}h {duracionTotal.minutes}m ({conteoData.config.totalFranjas} franjas)
            </span>
          </div>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <span className="stat-value">{estadisticas.totalGeneral.toLocaleString()}</span>
            <span className="stat-label">Total Contado</span>
          </div>
        </div>
        
        <div className="stat-card franjas">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <span className="stat-value">{conteoData.franjas.length}</span>
            <span className="stat-label">Franjas Analizadas</span>
          </div>
        </div>
        
        <div className="stat-card movimientos">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <span className="stat-value">{conteoData.franjas[0]?.movimientos.length || 0}</span>
            <span className="stat-label">Movimientos</span>
          </div>
        </div>
        
        <div className="stat-card tipo">
          <div className="stat-icon">🚗</div>
          <div className="stat-content">
            <span className="stat-value">{conteoData.config.tipo === 'vehicles' ? 'Vehículos' : 'Peatones'}</span>
            <span className="stat-label">Tipo de Conteo</span>
          </div>
        </div>
      </div>

      {/* Resumen por tipo de vehículo */}
      <div className="vehicles-summary">
        <h3 className="summary-title">🚦 Resumen por Tipo</h3>
        <div className="vehicles-grid">
          {Object.entries(estadisticas.totalesPorTipo).map(([tipo, total]) => {
            const iconos = {
              autos: '🚗',
              buses: '🚌',
              camiones: '🚛',
              motos: '🏍️',
              bicicletas: '🚲',
              peatones: '🚶'
            }
            
            const nombres = {
              autos: 'Autos',
              buses: 'Buses',
              camiones: 'Camiones',
              motos: 'Motos',
              bicicletas: 'Bicicletas',
              peatones: 'Peatones'
            }

            return (
              <div key={tipo} className="vehicle-summary-item">
                <span className="vehicle-icon">{iconos[tipo]}</span>
                <span className="vehicle-name">{nombres[tipo]}</span>
                <span className="vehicle-count">{total.toLocaleString()}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Información adicional */}
      <div className="additional-info">
        <div className="info-card highlight">
          <h4>⭐ Franja Más Activa</h4>
          {franjaMasActiva.franja && (
            <div className="active-franja-info">
              <span className="franja-number">
                Franja #{franjaMasActiva.franja.franjaNum}
              </span>
              <span className="franja-time">
                {formatTimeDisplay(getFranjaTime(franjaMasActiva.franja.franjaNum).inicio)} - 
                {formatTimeDisplay(getFranjaTime(franjaMasActiva.franja.franjaNum).fin)}
              </span>
              <span className="franja-total">
                {franjaMasActiva.total.toLocaleString()} elementos contados
              </span>
            </div>
          )}
        </div>

        <div className="info-card">
          <h4>📈 Promedio por Franja</h4>
          <div className="average-info">
            <span className="average-value">
              {Math.round(estadisticas.totalGeneral / conteoData.franjas.length).toLocaleString()}
            </span>
            <span className="average-label">elementos por franja de 15 min</span>
          </div>
        </div>
      </div>

      {/* Vista detallada */}
      <div className="detailed-view-section">
        <button 
          className="toggle-detail-button"
          onClick={() => setShowDetailedView(!showDetailedView)}
        >
          {showDetailedView ? '📊 Ocultar Detalles' : '📊 Ver Detalles por Franja'}
        </button>
        
        {showDetailedView && (
          <div className="detailed-franjas">
            <h3 className="detailed-title">Desglose por Franjas</h3>
            <div className="franjas-detailed-grid">
              {conteoData.franjas.map((franja) => {
                const franjaTime = getFranjaTime(franja.franjaNum)
                const totalFranja = franja.movimientos.reduce((total, mov) => {
                  return total + Object.values(mov.conteos).reduce((sum, val) => sum + (val || 0), 0)
                }, 0)

                return (
                  <div key={franja.franjaNum} className="franja-detail-card">
                    <div className="franja-detail-header">
                      <span className="franja-detail-number">#{franja.franjaNum}</span>
                      <span className="franja-detail-time">
                        {formatTimeDisplay(franjaTime.inicio)} - {formatTimeDisplay(franjaTime.fin)}
                      </span>
                      <button 
                        className="edit-franja-button"
                        onClick={() => onEditFranja && onEditFranja(franja.franjaNum)}
                        title="Editar esta franja"
                      >
                        ✏️
                      </button>
                    </div>
                    <div className="franja-detail-total">
                      Total: <span className="detail-total-value">{totalFranja.toLocaleString()}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="actions-section">
        <div className="primary-actions">
          <button 
            className="action-button export"
            onClick={onExportCSV}
          >
            📥 Exportar CSV
          </button>
          
          <button 
            className="action-button save"
            onClick={onSaveToHistory}
          >
            💾 Guardar en Historial
          </button>
        </div>
        
        <div className="secondary-actions">
          <button 
            className="action-button secondary"
            onClick={onBackToDashboard}
          >
            🏠 Volver al Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConteoResumen