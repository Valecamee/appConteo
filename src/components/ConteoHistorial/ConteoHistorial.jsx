// src/components/ConteoHistorial/ConteoHistorial.jsx
import React, { useState, useEffect } from 'react'
import { ArrowLeft, Download, Trash2, Calendar, Clock, List, BarChart3 } from 'lucide-react'
import { conteoService } from '../../services/conteoService'
import './ConteoHistorial.css'

const ConteoHistorial = ({ user, onBack }) => {
  const [conteos, setConteos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Cargar conteos al montar el componente
  useEffect(() => {
    cargarConteos()
  }, [user])

  const cargarConteos = async () => {
    try {
      setLoading(true)
      setError(null)
      const conteosData = await conteoService.obtenerResumenConteos(user.uid)
      setConteos(conteosData)
    } catch (error) {
      console.error('Error cargando conteos:', error)
      setError('Error al cargar el historial de conteos')
    } finally {
      setLoading(false)
    }
  }

  const handleDescargarCSV = async (conteo) => {
    try {
      console.log('Descargando CSV para:', conteo.conteoId)
      
      // Obtener datos completos del conteo
      const registrosCompletos = await conteoService.obtenerConteoCompleto(user.uid, conteo.conteoId)
      
      // Generar CSV
      const csvContent = conteoService.generarCSV(registrosCompletos, {}, null)
      
      // Descargar archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${conteo.nombreVideo}_${conteo.fecha}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    } catch (error) {
      console.error('Error descargando CSV:', error)
      alert('Error al descargar el archivo CSV')
    }
  }

  const handleEliminarConteo = async (conteo) => {
    const confirmacion = window.confirm(
      `¿Estás seguro de que quieres eliminar el conteo "${conteo.nombreVideo}"? Esta acción no se puede deshacer.`
    )
    
    if (confirmacion) {
      try {
        await conteoService.eliminarConteo(user.uid, conteo.conteoId)
        
        // Actualizar la lista local
        setConteos(prev => prev.filter(c => c.conteoId !== conteo.conteoId))
        
        console.log('Conteo eliminado exitosamente')
        
      } catch (error) {
        console.error('Error eliminando conteo:', error)
        alert('Error al eliminar el conteo')
      }
    }
  }

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    })
  }

  const formatearHora = (hora) => {
    const [hour, minute] = hora.split(':')
    const hourNum = parseInt(hour)
    const ampm = hourNum >= 12 ? 'PM' : 'AM'
    const hour12 = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum
    return `${hour12}:${minute} ${ampm}`
  }

  if (loading) {
    return (
      <div className="historial-container">
        <div className="loading-state">
          <BarChart3 className="loading-icon" />
          <p>Cargando historial...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="historial-container">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={20} />
          Volver
        </button>
        <div className="error-state">
          <p className="error-message">{error}</p>
          <button className="retry-button" onClick={cargarConteos}>
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="historial-container">
      {/* Header */}
      <div className="historial-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={20} />
          Volver
        </button>
        
        <div className="header-content">
          <h1 className="page-title">Historial de Conteos</h1>
          <p className="page-subtitle">
            {conteos.length} conteo{conteos.length !== 1 ? 's' : ''} realizado{conteos.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Grid de conteos */}
      {conteos.length === 0 ? (
        <div className="empty-state">
          <BarChart3 className="empty-icon" />
          <h3 className="empty-title">No hay conteos realizados</h3>
          <p className="empty-description">
            Los conteos que realices aparecerán aquí para poder descargar y gestionar.
          </p>
        </div>
      ) : (
        <div className="conteos-grid">
          {conteos.map((conteo) => (
            <div key={conteo.conteoId} className="conteo-card">
              {/* Header de la tarjeta */}
              <div className="card-header">
                <div className="card-title-section">
                  <h3 className="card-title">{conteo.nombreVideo}</h3>
                  <span className="card-type">{conteo.tipo}</span>
                </div>
              </div>

              {/* Información del conteo */}
              <div className="card-info">
                <div className="info-item">
                  <Calendar size={16} />
                  <span>{formatearFecha(conteo.fecha)}</span>
                </div>
                
                <div className="info-item">
                  <Clock size={16} />
                  <span>
                    {formatearHora(conteo.horaInicio)} - {formatearHora(conteo.horaFin)}
                  </span>
                </div>
                
                <div className="info-item">
                  <List size={16} />
                  <span>{conteo.totalMovimientos} movimientos</span>
                </div>
                
                <div className="info-item">
                  <BarChart3 size={16} />
                  <span>{conteo.totalElementos.toLocaleString()} elementos</span>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="card-actions">
                <button 
                  className="action-button download"
                  onClick={() => handleDescargarCSV(conteo)}
                  title="Descargar CSV"
                >
                  <Download size={18} />
                  Descargar
                </button>
                
                <button 
                  className="action-button delete"
                  onClick={() => handleEliminarConteo(conteo)}
                  title="Eliminar conteo"
                >
                  <Trash2 size={18} />
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ConteoHistorial