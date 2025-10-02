// src/components/AdminDashboard/ProjectManagement/CreateProject.jsx
import React, { useState } from 'react'
import { projectService } from '../../../services/projectService'
import './CreateProject.css'

const CreateProject = ({ user, onBack, onSave }) => {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    nombreVideo: '',
    descripcion: '',
    interseccionNombre: '',
    fechaAforo: '',
    fechaLimite: '',
    totalEsquinas: 4,
    accesos: []
  })

  // Estado para controlar qué tipo de movimientos se están editando
  const [editingMovementType, setEditingMovementType] = useState('vehiculos') // 'vehiculos' o 'peatones'

  // Inicializar accesos cuando cambie totalEsquinas
  React.useEffect(() => {
    const nuevosAccesos = []
    for (let i = 0; i < formData.totalEsquinas; i++) {
      // Mantener datos existentes si ya existen
      const accesoExistente = formData.accesos[i]
      nuevosAccesos.push({
        id: i + 1,
        nombre: accesoExistente?.nombre || `Acceso ${i + 1}`,
        movimientosVehiculos: accesoExistente?.movimientosVehiculos || [],
        movimientosPeatones: accesoExistente?.movimientosPeatones || []
      })
    }
    
    setFormData(prev => ({
      ...prev,
      accesos: nuevosAccesos
    }))
  }, [formData.totalEsquinas])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Limpiar error del campo modificado
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const handleEsquinaNombreChange = (esquinaId, nuevoNombre) => {
    setFormData(prev => ({
      ...prev,
      accesos: prev.accesos.map(acceso => 
        acceso.id === esquinaId 
          ? { ...acceso, nombre: nuevoNombre }
          : acceso
      )
    }))
  }

  const handleAgregarMovimiento = (esquinaId) => {
    const nuevoMovimiento = {
      id: '', // El ID será el nombre que asigne el usuario
      nombre: ''
    }
    
    const campoMovimientos = editingMovementType === 'vehiculos' ? 'movimientosVehiculos' : 'movimientosPeatones'
    
    setFormData(prev => ({
      ...prev,
      accesos: prev.accesos.map(acceso => 
        acceso.id === esquinaId 
          ? { ...acceso, [campoMovimientos]: [...(acceso[campoMovimientos] || []), nuevoMovimiento] }
          : acceso
      )
    }))
  }

  const handleEliminarMovimiento = (esquinaId, movimientoId) => {
    const campoMovimientos = editingMovementType === 'vehiculos' ? 'movimientosVehiculos' : 'movimientosPeatones'
    
    setFormData(prev => ({
      ...prev,
      accesos: prev.accesos.map(acceso => 
        acceso.id === esquinaId 
          ? { ...acceso, [campoMovimientos]: (acceso[campoMovimientos] || []).filter(m => m.id !== movimientoId) }
          : acceso
      )
    }))
  }

  const handleMovimientoChange = (esquinaId, movimientoId, campo, valor) => {
    const campoMovimientos = editingMovementType === 'vehiculos' ? 'movimientosVehiculos' : 'movimientosPeatones'
    
    setFormData(prev => ({
      ...prev,
      accesos: prev.accesos.map(acceso => 
        acceso.id === esquinaId 
          ? {
              ...acceso,
              [campoMovimientos]: (acceso[campoMovimientos] || []).map(movimiento =>
                movimiento.id === movimientoId
                  ? { 
                      ...movimiento, 
                      [campo]: valor,
                      // Si está cambiando el nombre, actualizar también el ID
                      ...(campo === 'nombre' ? { id: valor } : {})
                    }
                  : movimiento
              )
            }
          : acceso
      )
    }))
  }

  const validateForm = () => {
    const newErrors = {}
    
    // Validar información básica
    if (!formData.nombreVideo.trim()) {
      newErrors.nombreVideo = 'El nombre del video es requerido'
    }
    
    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es requerida'
    }
    
    // Validar intersección
    if (!formData.interseccionNombre.trim()) {
      newErrors.interseccionNombre = 'El nombre de la intersección es requerido'
    }
    
    // Validar fechas
    if (!formData.fechaAforo) {
      newErrors.fechaAforo = 'La fecha del aforo es requerida'
    }
    
    if (!formData.fechaLimite) {
      newErrors.fechaLimite = 'La fecha límite es requerida'
    }
    
    if (formData.fechaAforo && formData.fechaLimite) {
      if (new Date(formData.fechaLimite) <= new Date(formData.fechaAforo)) {
        newErrors.fechaLimite = 'La fecha límite debe ser posterior a la fecha del aforo'
      }
    }
    
    // Validar accesos y movimientos
    let hayMovimientosVehiculos = false
    let hayMovimientosPeatones = false
    
    formData.accesos.forEach((acceso, index) => {
      if (!acceso.nombre.trim()) {
        newErrors[`esquina_${acceso.id}`] = `El nombre del acceso ${index + 1} es requerido`
      }
      
      // Validar movimientos de vehículos
      if (acceso.movimientosVehiculos) {
        acceso.movimientosVehiculos.forEach(movimiento => {
          if (movimiento.nombre.trim()) {
            hayMovimientosVehiculos = true
          }
        })
      }
      
      // Validar movimientos de peatones
      if (acceso.movimientosPeatones) {
        acceso.movimientosPeatones.forEach(movimiento => {
          if (movimiento.nombre.trim()) {
            hayMovimientosPeatones = true
          }
        })
      }
    })
    
    if (!hayMovimientosVehiculos && !hayMovimientosPeatones) {
      newErrors.movimientos = 'Debes agregar al menos un movimiento (vehículos o peatones) en algún acceso'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    
    try {
      console.log('🚀 Creando proyecto...')
      
      // Filtrar movimientos vacíos de ambos tipos
      const accesosLimpios = formData.accesos.map(acceso => ({
        ...acceso,
        movimientosVehiculos: (acceso.movimientosVehiculos || []).filter(m => m.nombre.trim()),
        movimientosPeatones: (acceso.movimientosPeatones || []).filter(m => m.nombre.trim())
      }))
      
      const projectData = {
        ...formData,
        accesos: accesosLimpios
      }
      console.log('📋 FormData antes de guardar:', JSON.stringify(formData, null, 2))
      console.log('📋 ProjectData que se enviará:', JSON.stringify(projectData, null, 2))
      const nuevoProyecto = await projectService.createProject(projectData, user.uid)
      
      console.log('✅ Proyecto creado exitosamente')
      onSave && onSave(nuevoProyecto)
      
    } catch (error) {
      console.error('❌ Error creando proyecto:', error)
      alert('Error al crear el proyecto: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getAccesoColor = (index) => {
    const colores = [
      { color: '#4ecdc4', rgb: '78, 205, 196' },   // Verde agua
      { color: '#ff6b6b', rgb: '255, 107, 107' },  // Rojo
      { color: '#45b7d1', rgb: '69, 183, 209' },   // Azul
      { color: '#96ceb4', rgb: '150, 206, 180' },  // Verde claro
      { color: '#feca57', rgb: '254, 202, 87' },   // Amarillo
      { color: '#ff9ff3', rgb: '255, 159, 243' },  // Rosa
      { color: '#a29bfe', rgb: '162, 155, 254' },  // Morado
      { color: '#fd79a8', rgb: '253, 121, 168' },  // Rosa fuerte
      { color: '#fdcb6e', rgb: '253, 203, 110' },  // Naranja
      { color: '#6c5ce7', rgb: '108, 92, 231' },   // Índigo
    ]
    return colores[index % colores.length]
  }

  return (
    <div className="create-project-container">
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
      <div className="create-project-header">
        <button className="back-button" onClick={onBack}>
          ← Volver
        </button>
        <div className="header-content">
          <h1>➕ Crear Nuevo Proyecto</h1>
          <p>Configura un proyecto de conteo personalizado</p>
        </div>
      </div>

      {/* Formulario */}
      <div className="project-form-container">
        <form onSubmit={handleSubmit} className="project-form">
          
          {/* Información Básica */}
          <div className="form-section">
            <h3 className="section-title basic">📋 Información Básica</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  🎬 Nombre del Video
                </label>
                <input
                  type="text"
                  value={formData.nombreVideo}
                  onChange={(e) => handleInputChange('nombreVideo', e.target.value)}
                  placeholder="Ej: Video_Interseccion_Centro_Enero2024"
                  className={`form-input ${errors.nombreVideo ? 'error' : ''}`}
                />
                {errors.nombreVideo && (
                  <span className="error-message">{errors.nombreVideo}</span>
                )}
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  🚦 Nombre de la Intersección
                </label>
                <input
                  type="text"
                  value={formData.interseccionNombre}
                  onChange={(e) => handleInputChange('interseccionNombre', e.target.value)}
                  placeholder="Ej: Intersección Calle 10 con Carrera 15"
                  className={`form-input ${errors.interseccionNombre ? 'error' : ''}`}
                />
                {errors.interseccionNombre && (
                  <span className="error-message">{errors.interseccionNombre}</span>
                )}
              </div>
            </div>
            
            <div className="form-row single">
              <div className="form-group">
                <label className="form-label">
                  📄 Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => handleInputChange('descripcion', e.target.value)}
                  placeholder="Describe los detalles del proyecto de conteo..."
                  className={`form-textarea ${errors.descripcion ? 'error' : ''}`}
                />
                {errors.descripcion && (
                  <span className="error-message">{errors.descripcion}</span>
                )}
              </div>
            </div>
          </div>

          {/* Periodo del Proyecto */}
          <div className="form-section">
            <h3 className="section-title dates">📅 Periodo del Proyecto</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  📹 Fecha del Aforo
                </label>
                <input
                  type="date"
                  value={formData.fechaAforo}
                  onChange={(e) => handleInputChange('fechaAforo', e.target.value)}
                  className={`form-input ${errors.fechaAforo ? 'error' : ''}`}
                />
                {errors.fechaAforo && (
                  <span className="error-message">{errors.fechaAforo}</span>
                )}
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  ⏰ Fecha Límite de Entrega
                </label>
                <input
                  type="date"
                  value={formData.fechaLimite}
                  onChange={(e) => handleInputChange('fechaLimite', e.target.value)}
                  className={`form-input ${errors.fechaLimite ? 'error' : ''}`}
                />
                {errors.fechaLimite && (
                  <span className="error-message">{errors.fechaLimite}</span>
                )}
              </div>
            </div>
          </div>

          {/* Configuración de Conteo */}
          <div className="form-section">
            <h3 className="section-title movements">📐 Configuración de Accesos</h3>
            
            <div className="form-row single">
              <div className="form-group">
                <label className="form-label">
                  📐 Cantidad de Accesos
                </label>
                <select
                  value={formData.totalEsquinas}
                  onChange={(e) => handleInputChange('totalEsquinas', parseInt(e.target.value))}
                  className="form-select"
                >
                  <option value={3}>3 Accesos</option>
                  <option value={4}>4 Accesos</option>
                  <option value={5}>5 Accesos</option>
                  <option value={6}>6 Accesos</option>
                  <option value={7}>7 Accesos</option>
                  <option value={8}>8 Accesos</option>
                  <option value={9}>9 Accesos</option>
                  <option value={10}>10 Accesos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Movimientos por Acceso */}
          <div className="form-section">
            <h3 className="section-title movements">🔄 Movimientos a Contar</h3>
            
            {/* Selector de tipo de movimiento */}
            <div className="movement-type-selector">
              <label>Selecciona el tipo de movimientos a configurar:</label>
              <div className="type-buttons">
                <button
                  type="button"
                  className={`type-button ${editingMovementType === 'vehiculos' ? 'active' : ''}`}
                  onClick={() => setEditingMovementType('vehiculos')}
                >
                  🚗 Vehículos Motorizados
                </button>
                <button
                  type="button"
                  className={`type-button ${editingMovementType === 'peatones' ? 'active' : ''}`}
                  onClick={() => setEditingMovementType('peatones')}
                >
                  🚶 Peatones
                </button>
              </div>
            </div>
            
            {errors.movimientos && (
              <div className="error-message global-error">
                {errors.movimientos}
              </div>
            )}
            
            <div className="esquinas-grid">
              {formData.accesos.map((acceso, index) => {
                const colorAcceso = getAccesoColor(index)
                
                return (
                  <div 
                    key={acceso.id} 
                    className="esquina-card"
                    style={{ '--esquina-color': colorAcceso.color }}
                  >
                    <div className="esquina-header">
                      <div className="esquina-icon">
                        📍
                      </div>
                      <div className="esquina-info">
                        <input
                          type="text"
                          value={acceso.nombre}
                          onChange={(e) => handleEsquinaNombreChange(acceso.id, e.target.value)}
                          placeholder={`Acceso ${index + 1}`}
                          className={`esquina-nombre-input ${errors[`esquina_${acceso.id}`] ? 'error' : ''}`}
                        />
                        {errors[`esquina_${acceso.id}`] && (
                          <span className="error-message">{errors[`esquina_${acceso.id}`]}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="add-movement-btn"
                        onClick={() => handleAgregarMovimiento(acceso.id)}
                      >
                        ➕ Agregar Movimiento
                      </button>
                    </div>
                    
                    <div className="movimientos-list">
                      {(() => {
                        const movimientos = editingMovementType === 'vehiculos' 
                          ? (acceso.movimientosVehiculos || [])
                          : (acceso.movimientosPeatones || [])
                        
                        return movimientos.length === 0 ? (
                          <div className="no-movements">
                            <span className="no-movements-icon">🚫</span>
                            <span className="no-movements-text">
                              No hay movimientos de {editingMovementType === 'vehiculos' ? 'vehículos' : 'peatones'} agregados
                            </span>
                          </div>
                        ) : (
                          movimientos.map((movimiento) => (
                            <div key={movimiento.id} className="movimiento-item">
                              <div className="movimiento-inputs">
                                <input
                                  type="text"
                                  value={movimiento.nombre}
                                  onChange={(e) => handleMovimientoChange(acceso.id, movimiento.id, 'nombre', e.target.value)}
                                  placeholder={`Nombre del movimiento de ${editingMovementType === 'vehiculos' ? 'vehículos' : 'peatones'} (ej: Recto Norte-Sur)`}
                                  className="movimiento-input nombre"
                                />
                              </div>
                              <button
                                type="button"
                                className="delete-movement-btn"
                                onClick={() => handleEliminarMovimiento(acceso.id, movimiento.id)}
                              >
                                🗑️
                              </button>
                            </div>
                          ))
                        )
                      })()}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="form-actions">
            <button
              type="button"
              className="action-button cancel"
              onClick={onBack}
              disabled={loading}
            >
              ❌ Cancelar
            </button>
            
            <button
              type="submit"
              className="action-button save"
              disabled={loading}
            >
              {loading && <span className="loading-spinner"></span>}
              {loading ? 'Creando Proyecto...' : '🚀 Crear Proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateProject