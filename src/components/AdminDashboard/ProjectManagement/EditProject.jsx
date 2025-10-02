// src/components/AdminDashboard/ProjectManagement/EditProject.jsx
import React, { useState, useEffect } from 'react'
import { projectService } from '../../../services/projectService'
import './CreateProject.css' // Reutilizamos los mismos estilos

const EditProject = ({ user, project, onBack, onSave }) => {
  const [loading, setLoading] = useState(false)
  const [loadingProject, setLoadingProject] = useState(true)
  const [errors, setErrors] = useState({})
  const [uploadingImages, setUploadingImages] = useState({}) // Estado para tracking de uploads
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    nombreVideo: '',
    descripcion: '',
    interseccionNombre: '',
    fechaAforo: '',
    fechaLimite: '',
    totalEsquinas: 4,
    accesos: [],
    status: 'active'
  })

  // Estado original para detectar cambios
  const [originalData, setOriginalData] = useState(null)

  // Cargar datos del proyecto al montar el componente
  useEffect(() => {
    if (project) {
      loadProjectData()
    }
  }, [project])

  const loadProjectData = async () => {
    try {
      setLoadingProject(true)
      console.log('📋 Cargando datos del proyecto para editar...')
      
      // Si tenemos el proyecto completo, usarlo, sino cargarlo de Firebase
      let projectData = project
      if (!project.accesos) {
        projectData = await projectService.getProjectById(project.id)
      }
      
      // Formatear fechas para inputs tipo date
      const fechaAforo = projectData.fechaAforo ? 
        (projectData.fechaAforo.toDate ? 
          projectData.fechaAforo.toDate().toISOString().split('T')[0] : 
          new Date(projectData.fechaAforo).toISOString().split('T')[0]
        ) : ''
        
      const fechaLimite = projectData.fechaLimite ? 
        (projectData.fechaLimite.toDate ? 
          projectData.fechaLimite.toDate().toISOString().split('T')[0] : 
          new Date(projectData.fechaLimite).toISOString().split('T')[0]
        ) : ''

      const loadedData = {
        nombreVideo: projectData.nombreVideo || '',
        descripcion: projectData.descripcion || '',
        interseccionNombre: projectData.interseccion?.nombre || '',
        fechaAforo,
        fechaLimite,
        totalEsquinas: projectData.totalEsquinas || 4,
        accesos: projectData.interseccion?.accesos || [],
        status: projectData.status || 'active'
      }
      
      setFormData(loadedData)
      setOriginalData(loadedData)
      
      console.log('✅ Datos del proyecto cargados')
    } catch (error) {
      console.error('❌ Error cargando datos del proyecto:', error)
    } finally {
      setLoadingProject(false)
    }
  }

  // Inicializar accesos cuando cambie totalEsquinas
  React.useEffect(() => {
    if (originalData) { // Solo si ya se cargaron los datos originales
      const nuevosAccesos = []
      for (let i = 0; i < formData.totalEsquinas; i++) {
        // Mantener datos existentes si ya existen
        const accesoExistente = formData.accesos[i]
        nuevosAccesos.push({
          id: i + 1,
          nombre: accesoExistente?.nombre || `Acceso ${i + 1}`,
          movimientos: accesoExistente?.movimientos || []
        })
      }
      
      setFormData(prev => ({
        ...prev,
        accesos: nuevosAccesos
      }))
    }
  }, [formData.totalEsquinas, originalData])

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
      id: Date.now(), // ID único temporal
      nombre: ''
    }
    
    setFormData(prev => ({
      ...prev,
      accesos: prev.accesos.map(acceso => 
        acceso.id === esquinaId 
          ? { ...acceso, movimientos: [...acceso.movimientos, nuevoMovimiento] }
          : acceso
      )
    }))
  }

  const handleEliminarMovimiento = (esquinaId, movimientoId) => {
    setFormData(prev => ({
      ...prev,
      accesos: prev.accesos.map(acceso => 
        acceso.id === esquinaId 
          ? { ...acceso, movimientos: acceso.movimientos.filter(m => m.id !== movimientoId) }
          : acceso
      )
    }))
  }

  // Función para manejar la subida de imágenes de accesos
  const handleImageUpload = async (esquinaId, file) => {
    if (!file) return

    try {
      setUploadingImages(prev => ({ ...prev, [esquinaId]: true }))

      console.log('📤 Subiendo imagen para esquina:', esquinaId)
      
      // Subir imagen usando el servicio
      const result = await projectService.uploadCornerImage(project.id, esquinaId, file)
      
      // Actualizar el estado local con la nueva URL
      setFormData(prev => ({
        ...prev,
        accesos: prev.accesos.map(acceso => 
          acceso.id === esquinaId 
            ? { ...acceso, imagenUrl: result.url, imagenFileName: result.fileName }
            : acceso
        )
      }))

      console.log('✅ Imagen subida exitosamente')
      
    } catch (error) {
      console.error('❌ Error subiendo imagen:', error)
      alert('Error al subir la imagen: ' + error.message)
    } finally {
      setUploadingImages(prev => ({ ...prev, [esquinaId]: false }))
    }
  }

  // Función para eliminar imagen de esquina
  const handleDeleteImage = async (esquinaId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta imagen?')) return

    try {
      setUploadingImages(prev => ({ ...prev, [esquinaId]: true }))

      console.log('🗑️ Eliminando imagen de esquina:', esquinaId)
      
      // Eliminar imagen usando el servicio
      await projectService.deleteCornerImage(project.id, esquinaId)
      
      // Actualizar el estado local removiendo la imagen
      setFormData(prev => ({
        ...prev,
        accesos: prev.accesos.map(acceso => 
          acceso.id === esquinaId 
            ? { ...acceso, imagenUrl: undefined, imagenFileName: undefined }
            : acceso
        )
      }))

      console.log('✅ Imagen eliminada exitosamente')
      
    } catch (error) {
      console.error('❌ Error eliminando imagen:', error)
      alert('Error al eliminar la imagen: ' + error.message)
    } finally {
      setUploadingImages(prev => ({ ...prev, [esquinaId]: false }))
    }
  }

  const handleMovimientoChange = (esquinaId, movimientoId, campo, valor) => {
    setFormData(prev => ({
      ...prev,
      accesos: prev.accesos.map(acceso => 
        acceso.id === esquinaId 
          ? {
              ...acceso,
              movimientos: acceso.movimientos.map(movimiento =>
                movimiento.id === movimientoId
                  ? { ...movimiento, [campo]: valor }
                  : movimiento
              )
            }
          : esquina
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
    let hayMovimientos = false
    formData.accesos.forEach((acceso, index) => {
      if (!acceso.nombre.trim()) {
        newErrors[`esquina_${acceso.id}`] = `El nombre del acceso ${index + 1} es requerido`
      }
      
      acceso.movimientos.forEach(movimiento => {
        if (movimiento.nombre.trim()) {
          hayMovimientos = true
        }
      })
    })
    
    if (!hayMovimientos) {
      newErrors.movimientos = 'Debes agregar al menos un movimiento en algún acceso'
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
      console.log('💾 Actualizando proyecto...')
      
      // Filtrar movimientos vacíos
      const accesosLimpios = formData.accesos.map(acceso => ({
        ...acceso,
        movimientos: acceso.movimientos.filter(m => m.nombre.trim())
      }))
      
      const updateData = {
        nombreVideo: formData.nombreVideo,
        descripcion: formData.descripcion,
        interseccion: {
          nombre: formData.interseccionNombre,
          accesos: accesosLimpios
        },
        fechaAforo: formData.fechaAforo,
        fechaLimite: formData.fechaLimite,
        totalEsquinas: formData.totalEsquinas,
        accesos: accesosLimpios,
        status: formData.status
      }
      
      const proyectoActualizado = await projectService.updateProject(project.id, updateData, user.uid)
      
      console.log('✅ Proyecto actualizado exitosamente')
      onSave && onSave(proyectoActualizado)
      
    } catch (error) {
      console.error('❌ Error actualizando proyecto:', error)
      alert('Error al actualizar el proyecto: ' + error.message)
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

  // Detectar cambios
  const hasChanges = () => {
    if (!originalData) return false
    return JSON.stringify(formData) !== JSON.stringify(originalData)
  }

  if (loadingProject) {
    return (
      <div className="create-project-container">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid rgba(69, 183, 209, 0.3)',
            borderTop: '3px solid #45b7d1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: 'white', fontSize: '1.2rem' }}>Cargando datos del proyecto...</p>
        </div>
      </div>
    )
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
          <h1>✏️ Editar Proyecto</h1>
          <p>Modifica la configuración del proyecto</p>
          {hasChanges() && (
            <small style={{ color: '#feca57', fontWeight: 'bold' }}>
              ⚠️ Hay cambios sin guardar
            </small>
          )}
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

          {/* Estado del Proyecto */}
          <div className="form-section">
            <h3 className="section-title movements">⚡ Estado del Proyecto</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  📊 Estado Actual
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="form-select"
                >
                  <option value="active">🟢 Activo</option>
                  <option value="paused">⏸️ Pausado</option>
                  <option value="completed">✅ Completado</option>
                  <option value="cancelled">❌ Cancelado</option>
                </select>
              </div>
              
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

                    {/* Sección de imagen de esquina */}
                    <div className="esquina-image-section">
                      <div className="image-section-header">
                        <span className="image-section-title">📸 Imagen de Referencia</span>
                        <span className="image-section-subtitle">Para que el contador se ubique</span>
                      </div>
                      
                      <div className="image-upload-area">
                        {acceso.imagenUrl ? (
                          <div className="image-preview">
                            <img 
                              src={acceso.imagenUrl} 
                              alt={`Imagen de ${acceso.nombre}`}
                              className="preview-image"
                            />
                            <div className="image-actions">
                              <label className="change-image-btn">
                                🔄 Cambiar
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files[0]
                                    if (file) handleImageUpload(acceso.id, file)
                                  }}
                                  style={{ display: 'none' }}
                                  disabled={uploadingImages[acceso.id]}
                                />
                              </label>
                              <button
                                type="button"
                                className="delete-image-btn"
                                onClick={() => handleDeleteImage(acceso.id)}
                                disabled={uploadingImages[acceso.id]}
                              >
                                🗑️ Eliminar
                              </button>
                            </div>
                            {uploadingImages[acceso.id] && (
                              <div className="uploading-overlay">
                                <div className="uploading-spinner">⏳</div>
                                <span>Procesando...</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="no-image">
                            <div className="no-image-icon">📷</div>
                            <label className="upload-image-btn">
                              {uploadingImages[acceso.id] ? (
                                <>
                                  <div className="uploading-spinner">⏳</div>
                                  <span>Subiendo...</span>
                                </>
                              ) : (
                                <>
                                  📤 Subir Imagen
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files[0]
                                      if (file) handleImageUpload(acceso.id, file)
                                    }}
                                    style={{ display: 'none' }}
                                  />
                                </>
                              )}
                            </label>
                            <div className="upload-hint">
                              JPG, PNG o WebP • Máximo 5MB
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="movimientos-list">
                      {acceso.movimientos.length === 0 ? (
                        <div className="no-movements">
                          <span className="no-movements-icon">🚫</span>
                          <span className="no-movements-text">No hay movimientos agregados</span>
                        </div>
                      ) : (
                        acceso.movimientos.map((movimiento) => (
                          <div key={movimiento.id} className="movimiento-item">
                            <div className="movimiento-inputs">
                              <input
                                type="text"
                                value={movimiento.nombre}
                                onChange={(e) => handleMovimientoChange(acceso.id, movimiento.id, 'nombre', e.target.value)}
                                placeholder="Nombre del movimiento (ej: 1-2, Recto Norte-Sur)"
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
                      )}
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
              disabled={loading || !hasChanges()}
            >
              {loading && <span className="loading-spinner"></span>}
              {loading ? 'Guardando Cambios...' : 
               hasChanges() ? '💾 Guardar Cambios' : '✅ Sin Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditProject