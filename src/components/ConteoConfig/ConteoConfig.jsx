// src/components/ConteoConfig/ConteoConfig.jsx
import React, { useState } from 'react'
import './ConteoConfig.css'

const ConteoConfig = ({ user, onBack, onContinue }) => {
  const [formData, setFormData] = useState({
    nombreVideo: '',
    fecha: '',
    horaInicio: '',
    horaFin: ''
  })
  
  const [errors, setErrors] = useState({})
  
  // Generar opciones de hora cada 15 minutos
  const generateTimeOptions = () => {
    const options = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        const displayString = formatTimeDisplay(timeString)
        options.push({ value: timeString, display: displayString })
      }
    }
    return options
  }

  // Formatear hora para mostrar (12h format)
  const formatTimeDisplay = (time24) => {
    const [hour, minute] = time24.split(':')
    const hourNum = parseInt(hour)
    const ampm = hourNum >= 12 ? 'PM' : 'AM'
    const hour12 = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum
    return `${hour12}:${minute} ${ampm}`
  }

  // Calcular duración y franjas
  const calculateDuration = () => {
    if (!formData.horaInicio || !formData.horaFin) return null
    
    const [startHour, startMin] = formData.horaInicio.split(':').map(Number)
    const [endHour, endMin] = formData.horaFin.split(':').map(Number)
    
    const startTotalMin = startHour * 60 + startMin
    const endTotalMin = endHour * 60 + endMin
    
    if (endTotalMin <= startTotalMin) return null
    
    const durationMin = endTotalMin - startTotalMin
    const franjas = Math.floor(durationMin / 15)
    
    return {
      durationMin,
      franjas,
      hours: Math.floor(durationMin / 60),
      minutes: durationMin % 60
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Limpiar error del campo modificado
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.nombreVideo.trim()) {
      newErrors.nombreVideo = 'El nombre del video es requerido'
    }
    
    if (!formData.fecha) {
      newErrors.fecha = 'La fecha es requerida'
    }
    
    if (!formData.horaInicio) {
      newErrors.horaInicio = 'La hora de inicio es requerida'
    }
    
    if (!formData.horaFin) {
      newErrors.horaFin = 'La hora de fin es requerida'
    }
    
    if (formData.horaInicio && formData.horaFin) {
      const duration = calculateDuration()
      if (!duration) {
        newErrors.horaFin = 'La hora de fin debe ser posterior a la de inicio'
      } else if (duration.durationMin < 15) {
        newErrors.horaFin = 'La duración mínima debe ser de 15 minutos'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (validateForm()) {
      const duration = calculateDuration()
      const config = {
        ...formData,
        nombreVideo: formData.nombreVideo.trim(),
        totalFranjas: duration.franjas,
        duracionTotal: duration
      }
      
      onContinue(config)
    }
  }

  const timeOptions = generateTimeOptions()
  const duration = calculateDuration()

  return (
    <div className="config-container">
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

      {/* Botón de volver */}
      <button className="back-button" onClick={onBack}>
        ← Volver al Dashboard
      </button>

      {/* Header */}
      <div className="config-header">
        <h1 className="config-title">Configurar Nuevo Conteo</h1>
        <p className="config-subtitle">
          Completa la información básica para iniciar el proceso de conteo
        </p>
        <p className="user-info">
          Usuario: <span className="user-name">{user.fullName || user.email.split('@')[0]}</span>
        </p>
      </div>

      {/* Formulario */}
      <div className="config-form-container">
        <form onSubmit={handleSubmit} className="config-form">
          {/* Nombre del Video */}
          <div className="form-group">
            <label htmlFor="nombreVideo" className="form-label">
              📹 Nombre del Video
            </label>
            <input
              type="text"
              id="nombreVideo"
              name="nombreVideo"
              value={formData.nombreVideo}
              onChange={handleChange}
              placeholder="Ej: Video_Interseccion_Centro_Mañana"
              className={`form-input ${errors.nombreVideo ? 'error' : ''}`}
            />
            {errors.nombreVideo && (
              <span className="error-message">{errors.nombreVideo}</span>
            )}
          </div>

          {/* Fecha */}
          <div className="form-group">
            <label htmlFor="fecha" className="form-label">
              📅 Fecha del Conteo
            </label>
            <input
              type="date"
              id="fecha"
              name="fecha"
              value={formData.fecha}
              onChange={handleChange}
              className={`form-input ${errors.fecha ? 'error' : ''}`}
            />
            {errors.fecha && (
              <span className="error-message">{errors.fecha}</span>
            )}
          </div>

          {/* Franja horaria */}
          <div className="time-range-group">
            <h3 className="time-group-title">⏰ Franja Horaria</h3>
            
            <div className="time-inputs">
              <div className="form-group">
                <label htmlFor="horaInicio" className="form-label">
                  Hora de Inicio
                </label>
                <select
                  id="horaInicio"
                  name="horaInicio"
                  value={formData.horaInicio}
                  onChange={handleChange}
                  className={`form-select ${errors.horaInicio ? 'error' : ''}`}
                >
                  <option value="">Seleccionar hora</option>
                  {timeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.display}
                    </option>
                  ))}
                </select>
                {errors.horaInicio && (
                  <span className="error-message">{errors.horaInicio}</span>
                )}
              </div>

              <div className="time-separator">hasta</div>

              <div className="form-group">
                <label htmlFor="horaFin" className="form-label">
                  Hora de Fin
                </label>
                <select
                  id="horaFin"
                  name="horaFin"
                  value={formData.horaFin}
                  onChange={handleChange}
                  className={`form-select ${errors.horaFin ? 'error' : ''}`}
                >
                  <option value="">Seleccionar hora</option>
                  {timeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.display}
                    </option>
                  ))}
                </select>
                {errors.horaFin && (
                  <span className="error-message">{errors.horaFin}</span>
                )}
              </div>
            </div>
          </div>

          {/* Información de duración */}
          {duration && (
            <div className="duration-info">
              <div className="duration-card">
                <h4>📊 Resumen del Conteo</h4>
                <div className="duration-details">
                  <div className="duration-item">
                    <span className="duration-label">Duración Total:</span>
                    <span className="duration-value">
                      {duration.hours}h {duration.minutes}m
                    </span>
                  </div>
                  <div className="duration-item">
                    <span className="duration-label">Total de Franjas:</span>
                    <span className="duration-value highlight">
                      {duration.franjas} franjas de 15 min
                    </span>
                  </div>
                  <div className="duration-item">
                    <span className="duration-label">Horario:</span>
                    <span className="duration-value">
                      {formatTimeDisplay(formData.horaInicio)} - {formatTimeDisplay(formData.horaFin)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botón de continuar */}
          <div className="form-actions">
            <button 
              type="submit" 
              className="continue-button"
              disabled={!duration || duration.franjas === 0}
            >
              ✨ Continuar Configuración
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ConteoConfig