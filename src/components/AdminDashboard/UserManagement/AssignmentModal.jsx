// src/components/AdminDashboard/UserManagement/AssignmentModal.jsx - COMPLETO CORREGIDO
import React, { useState, useEffect } from 'react'
import './AssignmentModal.css'
import { projectService } from '../../../services/projectService'
import { franjaUtils } from '../../../utils/franjaUtils'

const AssignmentModal = ({ 
  user, 
  onAssign, 
  onClose, 
  isOpen 
}) => {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [selectedType, setSelectedType] = useState('vehicles')
  const [selectedMovements, setSelectedMovements] = useState([])
  
  // NUEVO: Estados para horarios
  const [horaInicio, setHoraInicio] = useState('07:00')
  const [horaFin, setHoraFin] = useState('18:00')
  const [timeErrors, setTimeErrors] = useState({})
  
  const [availableFranjas, setAvailableFranjas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Cargar proyectos disponibles
  useEffect(() => {
    if (isOpen) {
      loadProjects()
    }
  }, [isOpen])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const allProjects = await projectService.getAllProjects()
      console.log('🔍 Todos los proyectos cargados:', allProjects)
      
      // Filtrar solo proyectos activos
      const activeProjects = allProjects.filter(p => p.status === 'active')
      console.log('🔍 Proyectos activos:', activeProjects)
      
      // Debug: verificar estructura de accesos/esquinas
      activeProjects.forEach(project => {
        console.log(`🔍 Proyecto "${project.nombreVideo}":`, {
          interseccion: project.interseccion,
          accesos: project.interseccion?.accesos,
          esquinas: project.interseccion?.esquinas,
          totalAccesos: project.interseccion?.accesos?.length,
          totalEsquinas: project.interseccion?.esquinas?.length
        })
      })
      
      setProjects(activeProjects)
    } catch (error) {
      console.error('Error cargando proyectos:', error)
      setError('Error al cargar proyectos')
    } finally {
      setLoading(false)
    }
  }

  // Cuando se selecciona un proyecto, resetear configuraciones
  useEffect(() => {
    if (selectedProject) {
      console.log('🔍 Proyecto seleccionado:', selectedProject)
      console.log('🔍 Accesos del proyecto:', selectedProject.interseccion?.accesos)
      console.log('🔍 Esquinas del proyecto:', selectedProject.interseccion?.esquinas)
      
      // Reset selections
      setSelectedMovements([])
      setTimeErrors({})
      // Calcular franjas con horarios por defecto
      calculateAvailableFranjas(horaInicio, horaFin)
    }
  }, [selectedProject])

  // NUEVO: Recalcular franjas cuando cambien los horarios
  useEffect(() => {
    if (selectedProject && horaInicio && horaFin) {
      calculateAvailableFranjas(horaInicio, horaFin)
    }
  }, [horaInicio, horaFin])

  const calculateAvailableFranjas = (startTime, endTime) => {
    // Validar horarios
    const validation = franjaUtils.validateTimeRange(startTime, endTime)
    
    if (!validation.isValid) {
      setTimeErrors({ general: validation.errors[0] })
      setAvailableFranjas([])
      return
    }

    setTimeErrors({})
    
    // Generar lista de franjas
    const franjas = franjaUtils.generateFranjasList(startTime, endTime)
    setAvailableFranjas(franjas)
  }

  const handleMovementToggle = (movementId) => {
    console.log('🔄 Toggle movimiento:', movementId)
    setSelectedMovements(prev => {
      const newSelection = prev.includes(movementId)
        ? prev.filter(id => id !== movementId)
        : [...prev, movementId]
      console.log('🔄 Nueva selección:', newSelection)
      return newSelection
    })
  }

  // ✅ NUEVA FUNCIÓN: Obtener nombres de movimientos basado en IDs seleccionados
  const getMovementNames = (movementIds) => {
    // Compatibilidad con ambas estructuras: accesos y esquinas
    const accesos = selectedProject?.interseccion?.accesos || selectedProject?.interseccion?.esquinas
    if (!accesos || !movementIds.length) {
      return []
    }

    const names = []
    
    // Buscar cada movimiento por su ID en el tipo correcto
    accesos.forEach(acceso => {
      const movimientos = selectedType === 'vehicles' 
        ? (acceso.movimientosVehiculos || [])
        : (acceso.movimientosPeatones || [])
      
      movimientos.forEach(movimiento => {
        if (movementIds.includes(movimiento.id)) {
          // ✅ SOLO el nombre del movimiento (sin el acceso)
          names.push(movimiento.nombre)
        }
      })
    })

    console.log('📝 Nombres generados para IDs:', movementIds, '-> Nombres:', names)
    return names
  }

  // ✅ FUNCIÓN CORREGIDA: Incluir nombres de movimientos
  const handleAssign = async () => {
    if (!selectedProject || selectedMovements.length === 0 || !horaInicio || !horaFin) {
      setError('Por favor completa todos los campos')
      return
    }

    // Validar horarios una vez más
    const validation = franjaUtils.validateTimeRange(horaInicio, horaFin)
    if (!validation.isValid) {
      setError('Los horarios seleccionados no son válidos')
      return
    }

    try {
      setLoading(true)
      
      // ✅ OBTENER LOS NOMBRES DE LOS MOVIMIENTOS
      const assignedMovementNames = getMovementNames(selectedMovements)
      
      const assignmentData = {
        projectId: selectedProject.id,
        projectName: selectedProject.nombreVideo,
        assignedType: selectedType,
        assignedMovements: selectedMovements, // IDs de movimientos
        assignedMovementNames, // ✅ NUEVO: Nombres de movimientos
        horaInicio,
        horaFin,
      }

      // DEBUG - Verificar que todo esté correcto
      console.log('🔍 assignmentData completo:', assignmentData)
      console.log('🏷️ Nombres que se van a guardar:', assignedMovementNames)
      console.log('🔍 Verificando campos undefined:')
      Object.keys(assignmentData).forEach(key => {
        if (assignmentData[key] === undefined) {
          console.error(`❌ Campo undefined: ${key}`)
        } else {
          console.log(`✅ ${key}:`, assignmentData[key])
        }
      })

      await onAssign(user.uid, assignmentData)
      
      // Limpiar y cerrar
      resetForm()
      onClose()
      
    } catch (error) {
      console.error('Error asignando proyecto:', error)
      setError('Error al asignar proyecto')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedProject(null)
    setSelectedType('vehicles')
    setSelectedMovements([])
    setAvailableFranjas([])
    setHoraInicio('07:00')
    setHoraFin('18:00')
    setTimeErrors({})
    setError('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="assignment-modal">
        <div className="modal-header">
          <h2>📋 Asignar Proyecto</h2>
          <span className="user-info">a {user?.fullName || user?.email}</span>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          {/* Selección de Proyecto */}
          <div className="form-group">
            <label>🎯 Seleccionar Proyecto</label>
            <select
              value={selectedProject?.id || ''}
              onChange={(e) => {
                const project = projects.find(p => p.id === e.target.value)
                setSelectedProject(project)
              }}
              className="project-select"
            >
              <option value="">Selecciona un proyecto...</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.nombreVideo} - {project.interseccion?.nombre || 'Sin nombre'}
                </option>
              ))}
            </select>
          </div>

          {/* NUEVO: Configuración de Horarios */}
          {selectedProject && (
            <div className="form-group">
              <label>🕒 Horario de Trabajo</label>
              <div className="time-inputs">
                <div className="time-input-group">
                  <label htmlFor="hora-inicio">Hora Inicio:</label>
                  <input
                    id="hora-inicio"
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="time-input"
                  />
                </div>
                <div className="time-input-group">
                  <label htmlFor="hora-fin">Hora Fin:</label>
                  <input
                    id="hora-fin"
                    type="time"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    className="time-input"
                  />
                </div>
              </div>
              
              {timeErrors.general && (
                <div className="time-error">⚠️ {timeErrors.general}</div>
              )}
              
              {availableFranjas.length > 0 && (
                <div className="franjas-info">
                  📊 Se generarán {availableFranjas.length} franjas de 15 minutos
                  <small>({availableFranjas[0]?.franjaInicio} - {availableFranjas[availableFranjas.length - 1]?.franjaFin})</small>
                </div>
              )}
            </div>
          )}

          {/* Tipo de Conteo */}
          {selectedProject && (
            <div className="form-group">
              <label>🚦 Tipo de Conteo</label>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    value="vehicles"
                    checked={selectedType === 'vehicles'}
                    onChange={(e) => setSelectedType(e.target.value)}
                  />
                  <span>Vehículos</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    value="peatones"
                    checked={selectedType === 'peatones'}
                    onChange={(e) => setSelectedType(e.target.value)}
                  />
                  <span>Peatones</span>
                </label>
              </div>
            </div>
          )}

          {/* Selección de Movimientos */}
          {selectedProject && (selectedProject.interseccion?.accesos || selectedProject.interseccion?.esquinas) && (
            <div className="form-group">
              <label>🔄 Movimientos a Contar</label>
              <div className="movements-grid">
                {/* Mostrar movimientos según el tipo seleccionado */}
                {(selectedProject.interseccion?.accesos || selectedProject.interseccion?.esquinas || []).flatMap(acceso => {
                  const movimientos = selectedType === 'vehicles' 
                    ? (acceso.movimientosVehiculos || [])
                    : (acceso.movimientosPeatones || [])
                  
                  return movimientos.map(movimiento => (
                    <label key={movimiento.id} className="movement-option">
                      <input
                        type="checkbox"
                        checked={selectedMovements.includes(movimiento.id)}
                        onChange={() => handleMovementToggle(movimiento.id)}
                      />
                      <span>{acceso.nombre}: {movimiento.nombre}</span>
                    </label>
                  ))
                })}
              </div>
              
              {/* Mostrar preview de los movimientos seleccionados */}
              {selectedMovements.length > 0 && (
                <div className="selected-movements-preview">
                  <span className="preview-label">✅ Movimientos seleccionados ({selectedMovements.length}):</span>
                  <div className="preview-list">
                    {getMovementNames(selectedMovements).map((name, index) => (
                      <span key={index} className="movement-tag">{name}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button 
            className="cancel-button" 
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button 
            className="assign-button" 
            onClick={handleAssign}
            disabled={loading || !selectedProject || selectedMovements.length === 0 || !horaInicio || !horaFin}
          >
            {loading ? '⏳ Asignando...' : '✅ Asignar Proyecto'}
          </button>
          
          {/* Debug info */}
          <div style={{fontSize: '12px', color: '#666', marginTop: '10px'}}>
            Debug: loading={loading.toString()}, selectedProject={!!selectedProject}, 
            selectedMovements={selectedMovements.length}, horaInicio={horaInicio}, horaFin={horaFin}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AssignmentModal