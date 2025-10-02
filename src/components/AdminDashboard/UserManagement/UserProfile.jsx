// src/components/AdminDashboard/UserManagement/UserProfile.jsx - VERSIÓN CORREGIDA
import React, { useState, useEffect } from 'react'
import './UserProfile.css'
import { userService } from '../../../services/userService'
import { projectService } from '../../../services/projectService'
import { conteoService } from '../../../services/conteoService'
import { franjaUtils } from '../../../utils/franjaUtils'

const UserProfile = ({ userId, onBack, onEdit, onDelete }) => {
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('assignments')
  const [projectsData, setProjectsData] = useState({}) // Para almacenar datos completos de proyectos
  const [assignmentsProgress, setAssignmentsProgress] = useState({}) // Para almacenar progreso de asignaciones

  useEffect(() => {
    loadUserProfile()
  }, [userId])

  const loadUserProfile = async () => {
    try {
      setLoading(true)
      console.log('🔍 Cargando perfil de usuario:', userId)
      
      const user = await userService.getUserById(userId)
      setUserData(user)
      
      // Cargar datos completos de los proyectos asignados
      await loadProjectsData(user.assignedProjects || [])
      
      // Cargar progreso de asignaciones
      await loadAssignmentsProgress(user.assignedProjects || [])
      
      console.log('✅ Perfil cargado:', user)
    } catch (error) {
      console.error('❌ Error cargando perfil:', error)
    } finally {
      setLoading(false)
    }
  }

  // Cargar datos completos de proyectos
  const loadProjectsData = async (assignments) => {
    try {
      const projectsMap = {}
      
      // Obtener todos los IDs únicos de proyectos
      const projectIds = [...new Set(assignments.map(a => a.projectId))]
      
      // Cargar datos completos de cada proyecto
      for (const projectId of projectIds) {
        try {
          const projectData = await projectService.getProjectById(projectId)
          projectsMap[projectId] = projectData
          console.log('📋 Proyecto cargado:', projectId, projectData.nombreVideo)
        } catch (error) {
          console.error('❌ Error cargando proyecto:', projectId, error)
        }
      }
      
      setProjectsData(projectsMap)
      console.log('✅ Datos de proyectos cargados:', Object.keys(projectsMap))
    } catch (error) {
      console.error('❌ Error cargando datos de proyectos:', error)
    }
  }

  // Cargar progreso de todas las asignaciones
  const loadAssignmentsProgress = async (assignments) => {
    try {
      const progressMap = {}
      
      for (const assignment of assignments) {
        const progress = await calculateAssignmentProgress(assignment)
        progressMap[`${assignment.projectId}-${assignment.assignedType}`] = progress
      }
      
      setAssignmentsProgress(progressMap)
      console.log('✅ Progreso de asignaciones cargado:', Object.keys(progressMap))
    } catch (error) {
      console.error('❌ Error cargando progreso de asignaciones:', error)
    }
  }

  // FUNCIÓN CORRECTA: Usar nombres guardados primero, luego buscar en proyecto
  const getMovementNames = (assignment) => {
    // ✅ PRIORIDAD 1: Si ya tenemos los nombres guardados, usarlos directamente
    if (assignment.assignedMovementNames && assignment.assignedMovementNames.length > 0) {
      console.log('✅ Usando nombres guardados:', assignment.assignedMovementNames)
      return assignment.assignedMovementNames
    }

    // ✅ PRIORIDAD 2: Si no hay nombres guardados, buscar en el proyecto
    if (!assignment.assignedMovements || assignment.assignedMovements.length === 0) {
      return []
    }

    const project = projectsData[assignment.projectId]
    if (!project || !project.interseccion?.accesos) {
      console.log('❌ No se encontraron datos del proyecto:', assignment.projectId)
      return assignment.assignedMovements // Fallback a IDs si no hay datos
    }

    console.log('🔍 Buscando movimientos para:', assignment.assignedMovements)
    console.log('📋 Datos del proyecto:', project.interseccion.accesos)

    // Los IDs asignados vienen en formato "esquinaId-movimientoId" (ej: "1-123456789")
    return assignment.assignedMovements.map(assignedId => {
      // Separar esquinaId y movimientoId del formato "1-123456789"
      const [esquinaId, movimientoId] = assignedId.split('-')
      
      // Buscar el acceso específico
      const acceso = project.interseccion.accesos.find(acc => acc.id.toString() === esquinaId)
      if (!acceso) {
        console.log('❌ Acceso no encontrado:', esquinaId)
        return assignedId
      }
      
      // Buscar el movimiento específico en ese acceso
      const movimiento = acceso.movimientos?.find(mov => mov.id.toString() === movimientoId)
      if (!movimiento) {
        console.log('❌ Movimiento no encontrado:', movimientoId, 'en acceso:', acceso.nombre)
        return assignedId
      }
      
      // Retornar SOLO el nombre del movimiento (sin el acceso)
      console.log('✅ Movimiento encontrado:', movimiento.nombre)
      return movimiento.nombre
    }).filter(nombre => nombre) // Filtrar nombres vacíos
  }

  // Calcular progreso de una asignación
  const calculateAssignmentProgress = async (assignment) => {
    try {
      const totalFranjas = franjaUtils.calculateTotalFranjas(assignment.horaInicio, assignment.horaFin)
      const conteoId = `${assignment.projectId}-${userId}-${assignment.assignedType}`
      
      // Obtener registros existentes
      const existingRecords = await conteoService.obtenerConteoCompleto(userId, conteoId)
      const franjasCompletadas = existingRecords.length > 0 
        ? new Set(existingRecords.map(r => r.franja)).size 
        : 0
      
      const progressPercentage = totalFranjas > 0 ? (franjasCompletadas / totalFranjas) * 100 : 0
      
      return {
        totalFranjas,
        franjasCompletadas,
        progressPercentage: Math.round(progressPercentage),
        isCompleted: progressPercentage >= 100
      }
    } catch (error) {
      console.error('Error calculando progreso:', error)
      return {
        totalFranjas: 0,
        franjasCompletadas: 0,
        progressPercentage: 0,
        isCompleted: false
      }
    }
  }

  // Descargar CSV de una asignación completada
  const handleDownloadCSV = async (assignment) => {
    try {
      const conteoId = `${assignment.projectId}-${userId}-${assignment.assignedType}`
      const registrosCompletos = await conteoService.obtenerConteoCompleto(userId, conteoId)
      
      if (registrosCompletos.length === 0) {
        alert('No hay datos de conteo para descargar')
        return
      }
      
      // Obtener datos del proyecto para extraer nombres de movimientos
      const projectData = projectsData[assignment.projectId]
      
      // Generar CSV con datos del proyecto
      const csvContent = conteoService.generarCSV(registrosCompletos, {}, projectData)
      
      // Descargar archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${assignment.projectName}_${assignment.assignedType}_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    } catch (error) {
      console.error('Error descargando CSV:', error)
      alert('Error al descargar el archivo CSV')
    }
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    const jsDate = date.toDate ? date.toDate() : new Date(date)
    return jsDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusInfo = (status) => {
    switch (status) {
      case 'PENDING':
        return { text: '⏳ Esperando Aprobación', color: '#feca57' }
      case 'APPROVED':
        return { text: '✅ Usuario Activo', color: '#26de81' }
      case 'REJECTED':
        return { text: '❌ Solicitud Rechazada', color: '#ff6b6b' }
      default:
        return { text: status, color: '#74b9ff' }
    }
  }

  const getInitials = (name) => {
    if (!name) return '??'
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  // Componente para mostrar asignaciones - VERSIÓN COMPACTA
  const ProjectAssignments = () => {
    const assignments = userData.assignedProjects || []
    
    if (assignments.length === 0) {
      return (
        <div className="assignments-empty">
          <div className="empty-icon">📋</div>
          <h3>Sin Proyectos Asignados</h3>
          <p>Este usuario no tiene proyectos asignados actualmente.</p>
        </div>
      )
    }

    return (
      <div className="assignments-grid">
        {assignments.map((assignment, index) => {
          const movementNames = getMovementNames(assignment)
          const projectData = projectsData[assignment.projectId]
          
          return (
            <div key={`${assignment.projectId}-${index}`} className="assignment-card-compact">
              {/* Header compacto */}
              <div className="assignment-header">
                <div className="assignment-title">
                  {assignment.projectName || `Proyecto ${assignment.projectId}`}
                </div>
                <div className={`status-badge ${assignment.status || 'assigned'}`}>
                  {assignment.status === 'assigned' && '📋'}
                  {assignment.status === 'active' && '🔄'}
                  {assignment.status === 'completed' && '✅'}
                  {!assignment.status && '📋'}
                </div>
              </div>

              {/* Información básica */}
              <div className="assignment-info-compact">
                {projectData?.interseccion?.nombre && (
                  <div className="info-compact">
                    <span className="info-icon">📍</span>
                    <span className="info-text">{projectData.interseccion.nombre}</span>
                  </div>
                )}
                
                <div className="info-compact">
                  <span className="info-icon">{assignment.assignedType === 'vehicles' ? '🚗' : '🚶'}</span>
                  <span className="info-text">
                    {assignment.assignedType === 'vehicles' ? 'Vehículos' : 'Peatones'}
                  </span>
                </div>

                {assignment.horaInicio && assignment.horaFin && (
                  <div className="info-compact">
                    <span className="info-icon">🕒</span>
                    <span className="info-text">
                      {assignment.horaInicio} - {assignment.horaFin}
                    </span>
                  </div>
                )}
              </div>

              {/* Movimientos - USANDO LA LÓGICA CORRECTA */}
              {movementNames.length > 0 && (
                <div className="movements-compact">
                  <div className="movements-header-compact">
                    <span className="movements-label">Movimientos ({movementNames.length})</span>
                  </div>
                  <div className="movements-list-compact">
                    {movementNames.slice(0, 3).map((movementName, idx) => (
                      <span key={idx} className="movement-tag-compact">
                        {movementName}
                      </span>
                    ))}
                    {movementNames.length > 3 && (
                      <span className="movement-tag-more-compact">
                        +{movementNames.length - 3} más
                      </span>
                    )}
                  </div>
                  
                  {/* Lista completa expandible si hay muchos */}
                  {movementNames.length > 3 && (
                    <details className="movements-details">
                      <summary className="movements-expand">Ver todos los movimientos</summary>
                      <div className="movements-full-compact">
                        {movementNames.map((name, idx) => (
                          <div key={idx} className="movement-full-item">
                            <span className="movement-number">{idx + 1}.</span>
                            <span className="movement-name">{name}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}

              {/* Barra de progreso */}
              {(() => {
                const progressKey = `${assignment.projectId}-${assignment.assignedType}`
                const progress = assignmentsProgress[progressKey]
                
                if (!progress) return null
                
                return (
                  <div className="assignment-progress">
                    <div className="progress-header">
                      <span className="progress-label">Progreso del Conteo</span>
                      <span className="progress-percentage">{progress.progressPercentage}%</span>
                    </div>
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar-fill"
                        style={{ width: `${progress.progressPercentage}%` }}
                      ></div>
                    </div>
                    <div className="progress-details">
                      <span className="progress-text">
                        {progress.franjasCompletadas} de {progress.totalFranjas} franjas completadas
                      </span>
                    </div>
                  </div>
                )
              })()}

              {/* Botón de descarga CSV (solo si está completado) */}
              {(() => {
                const progressKey = `${assignment.projectId}-${assignment.assignedType}`
                const progress = assignmentsProgress[progressKey]
                
                if (!progress || !progress.isCompleted) return null
                
                return (
                  <div className="assignment-actions">
                    <button 
                      className="download-csv-button"
                      onClick={() => handleDownloadCSV(assignment)}
                      style={{
                        background: 'linear-gradient(45deg, #26de81, #20bf6b)',
                        border: 'none',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      📥 Descargar CSV
                    </button>
                  </div>
                )
              })()}
            </div>
          )
        })}
      </div>
    )
  }

  // Componente para mostrar detalles del usuario
  const UserDetails = () => {
    const statusInfo = getStatusInfo(userData.accountStatus)
    
    return (
      <div className="details-grid-compact">
        <div className="detail-card-compact">
          <h3>📧 Información de Contacto</h3>
          <div className="detail-items">
            <div className="detail-item">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{userData.email}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Fecha de registro:</span>
              <span className="detail-value">{formatDate(userData.createdAt)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Última actualización:</span>
              <span className="detail-value">{formatDate(userData.updatedAt)}</span>
            </div>
          </div>
        </div>

        <div className="detail-card-compact">
          <h3>📊 Estado de la Cuenta</h3>
          <div className="detail-items">
            <div className="detail-item">
              <span className="detail-label">Estado:</span>
              <span className="detail-value" style={{ color: statusInfo.color }}>
                {statusInfo.text}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Proyectos asignados:</span>
              <span className="detail-value">
                {userData.assignedProjects?.length || 0} proyecto(s)
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Tiene asignaciones activas:</span>
              <span className="detail-value">
                {userData.hasActiveAssignments ? '✅ Sí' : '❌ No'}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="user-profile-container">
        <div className="loading-state-compact">
          <div className="loading-icon">⏳</div>
          <h3>Cargando perfil...</h3>
          <p>Obteniendo información del usuario y proyectos</p>
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="user-profile-container">
        <div className="error-state-compact">
          <div className="error-icon">❌</div>
          <h3>Usuario no encontrado</h3>
          <p>No se pudo cargar la información del usuario</p>
          <button onClick={onBack} className="back-button">
            ← Volver
          </button>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusInfo(userData.accountStatus)
  const initials = getInitials(userData.fullName)

  return (
    <div className="user-profile-container">
      {/* Header del perfil - ESTILO ADMINDHBOARD */}
      <div className="profile-header">
        <div className="profile-nav">
          <button className="back-button" onClick={onBack}>
            ← Volver
          </button>
          <h1 className="profile-title">👤 Perfil de Usuario</h1>
        </div>
        
        <div className="profile-actions">
          <button className="action-btn edit" onClick={() => onEdit(userData)}>
            ✏️ Editar
          </button>
          <button className="action-btn delete" onClick={() => onDelete(userData.uid)}>
            🗑️ Eliminar
          </button>
        </div>
      </div>

      {/* Información del usuario */}
      <div className="user-info-card">
        <div className="user-avatar-section">
          <div className="user-avatar">
            <div className="avatar-circle">
              {initials}
            </div>
            <div className={`status-indicator ${userData.accountStatus?.toLowerCase()}`}></div>
          </div>
        </div>
        
        <div className="user-details-section">
          <h2 className="user-name">{userData.fullName || 'Nombre no disponible'}</h2>
          <p className="user-email">{userData.email}</p>
          <div className="user-status" style={{ color: statusInfo.color }}>
            {statusInfo.text}
          </div>
        </div>
      </div>

      {/* Navegación por tabs */}
      <div className="profile-tabs">
        <button 
          className={`tab ${activeTab === 'assignments' ? 'active' : ''}`}
          onClick={() => setActiveTab('assignments')}
        >
          📋 Asignaciones
        </button>
        <button 
          className={`tab ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          👤 Detalles
        </button>
      </div>

      {/* Contenido de los tabs */}
      <div className="profile-content">
        {activeTab === 'assignments' && <ProjectAssignments />}
        {activeTab === 'details' && <UserDetails />}
      </div>
    </div>
  )
}

export default UserProfile