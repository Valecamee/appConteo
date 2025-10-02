// src/components/Dashboard/Dashboard.jsx - VERSIÓN FINAL CORREGIDA (SIN FIREBASE)
import React, { useState, useEffect } from 'react'
import { userService } from '../../services/userService'
import { conteoService } from '../../services/conteoService'
import { franjaUtils } from '../../utils/franjaUtils'
import './Dashboard.css'

const Dashboard = ({ user, onLogout, onStartCounting }) => {
  const [assignments, setAssignments] = useState([])
  const [assignmentsProgress, setAssignmentsProgress] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadUserAssignments()
  }, [user])

  // Cargar asignaciones del usuario
  const loadUserAssignments = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Cargando asignaciones para usuario:', user.uid)
      
      // Obtener datos actualizados del usuario
      const userData = await userService.getUserById(user.uid)
      const userAssignments = userData.assignedProjects || []
      
      console.log('📋 Asignaciones encontradas:', userAssignments.length)
      console.log('📋 Datos de asignaciones:', userAssignments)
      
      if (userAssignments.length === 0) {
        setAssignments([])
        setAssignmentsProgress({})
        console.log('ℹ️ Usuario no tiene asignaciones')
        return
      }

      // Calcular progreso para cada asignación
      const progressData = {}
      
      for (const assignment of userAssignments) {
        try {
          console.log('📊 Calculando progreso para:', assignment.projectId)
          const progress = await calculateAssignmentProgress(assignment)
          progressData[assignment.projectId] = progress
          console.log('✅ Progreso calculado:', progress)
        } catch (error) {
          console.error('❌ Error calculando progreso:', assignment.projectId, error)
          progressData[assignment.projectId] = {
            totalFranjas: 0,
            franjasCompletadas: 0,
            progressPercentage: 0
          }
        }
      }
      
      setAssignments(userAssignments)
      setAssignmentsProgress(progressData)
      
      console.log('✅ Asignaciones cargadas exitosamente')
      
    } catch (error) {
      console.error('❌ Error cargando asignaciones:', error)
      setError('Error al cargar tus asignaciones: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Calcular progreso de una asignación específica
  const calculateAssignmentProgress = async (assignment) => {
    try {
      if (!assignment.horaInicio || !assignment.horaFin) {
        console.log('⚠️ Asignación sin horarios definidos')
        return {
          totalFranjas: 0,
          franjasCompletadas: 0,
          progressPercentage: 0
        }
      }

      // Calcular franjas totales basado en el horario
      const totalFranjas = franjaUtils.calculateTotalFranjas(assignment.horaInicio, assignment.horaFin)
      console.log('🕒 Total franjas calculadas:', totalFranjas, 'para horario:', assignment.horaInicio, '-', assignment.horaFin)

      // Generar ID de conteo para verificar registros existentes
      const conteoId = `${assignment.projectId}-${user.uid}-${assignment.assignedType}`
      console.log('🆔 ConteoId generado:', conteoId)
      console.log('🔍 Debug - assignment.projectId:', assignment.projectId)
      console.log('🔍 Debug - user.uid:', user.uid)
      console.log('🔍 Debug - assignment.assignedType:', assignment.assignedType)

      // Obtener registros existentes del usuario para este proyecto
      const existingRecords = await conteoService.obtenerConteoCompleto(user.uid, conteoId)
      console.log('📄 Registros existentes encontrados:', existingRecords.length)
      console.log('📄 Registros existentes:', existingRecords)

      // Contar franjas únicas completadas
      const franjasCompletadas = existingRecords.length > 0 
        ? new Set(existingRecords.map(r => r.franja)).size 
        : 0
      
      const progressPercentage = totalFranjas > 0 ? (franjasCompletadas / totalFranjas) * 100 : 0
      
      console.log('📈 Progreso:', franjasCompletadas, '/', totalFranjas, '=', Math.round(progressPercentage) + '%')
      
      // 🔍 DEBUG: Mostrar franjas completadas
      const franjasCompletadasList = existingRecords.length > 0 
        ? Array.from(new Set(existingRecords.map(r => r.franja))).sort((a, b) => a - b)
        : []
      console.log('🔍 Franjas completadas:', franjasCompletadasList)
      console.log('🔍 Franjas faltantes:', Array.from({length: totalFranjas}, (_, i) => i + 1).filter(f => !franjasCompletadasList.includes(f)))
      
      return {
        totalFranjas,
        franjasCompletadas,
        progressPercentage: Math.round(progressPercentage),
        franjasCompletadasList
      }
      
    } catch (error) {
      console.error('❌ Error calculando progreso:', error)
      return {
        totalFranjas: 0,
        franjasCompletadas: 0,
        progressPercentage: 0
      }
    }
  }

  // ✅ FUNCIÓN FINAL CORREGIDA: Solo usar nombres guardados (SIN FIREBASE)
  const getAssignedMovementNames = (assignment) => {
    console.log('🔍 Debug assignment completo:', assignment)
    
    // ✅ PRIMERA PRIORIDAD: Usar nombres guardados si están disponibles
    if (assignment.assignedMovementNames && assignment.assignedMovementNames.length > 0) {
      console.log('✅ Usando nombres guardados:', assignment.assignedMovementNames)
      return assignment.assignedMovementNames
    }
    
    // ⚠️ FALLBACK: Mostrar IDs de forma más amigable (SIN ACCESO A FIREBASE)
    if (assignment.assignedMovements && assignment.assignedMovements.length > 0) {
      console.log('⚠️ No hay nombres guardados, creando nombres amigables para:', assignment.assignedMovements)
      
      const friendlyNames = assignment.assignedMovements.map(movementId => {
        // Intentar extraer información del ID si tiene formato esquina-movimiento
        if (movementId.includes('-')) {
          const [esquinaId, movimientoId] = movementId.split('-')
          // Mostrar solo los últimos 6 dígitos para que sea más legible
          const shortId = movimientoId.slice(-6)
          return `Esquina ${esquinaId}: ${shortId}`
        }
        return `Movimiento ${movementId}`
      })
      
      console.log('✅ Nombres amigables generados:', friendlyNames)
      return friendlyNames
    }
    
    console.log('⚠️ No hay movimientos asignados')
    return []
  }

  // Manejar inicio/continuación de conteo
  const handleStartCounting = (assignment) => {
    const progress = assignmentsProgress[assignment.projectId]
    
    console.log('🎯 Iniciando conteo para asignación:', assignment.projectName)
    console.log('📊 Progreso actual:', progress)
    
    // Obtener nombres de movimientos para el conteo
    const movementNames = getAssignedMovementNames(assignment)
    
    // Preparar configuración para el sistema de conteo existente
    const conteoConfig = {
      // Datos básicos
      nombreVideo: assignment.projectName,
      interseccionNombre: assignment.intersectionName || 'Intersección',
      fecha: new Date().toLocaleDateString('es-ES'),
      
      // Horarios de la asignación
      horaInicio: assignment.horaInicio,
      horaFin: assignment.horaFin,
      
      // Datos adicionales para el sistema
      projectId: assignment.projectId,
      assignmentType: assignment.assignedType,
      assignedMovements: assignment.assignedMovements,
      assignedMovementNames: movementNames, // ✅ Agregar nombres de movimientos
      totalFranjas: progress?.totalFranjas || 0,
      franjasCompletadas: progress?.franjasCompletadas || 0
    }
    
    console.log('⚙️ Configuración del conteo:', conteoConfig)
    console.log('🏷️ Nombres de movimientos:', movementNames)
    
    // Llamar a la función del App.jsx para iniciar el conteo
    if (onStartCounting) {
      onStartCounting(conteoConfig, assignment.assignedMovements, assignment.assignedType, movementNames)
    } else {
      console.error('❌ onStartCounting no está definido')
    }
  }

  // Formatear fecha
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch (error) {
      return 'N/A'
    }
  }

  // Determinar estado del botón según el progreso
  const getButtonState = (progress) => {
    if (!progress || progress.totalFranjas === 0) {
      return { text: '🎯 Empezar Conteo', className: 'start', disabled: false }
    } else if (progress.progressPercentage === 100) {
      return { text: '✅ Completado', className: 'completed', disabled: true }
    } else {
      return { text: '🔄 Continuar Conteo', className: 'continue', disabled: false }
    }
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <div className="loading-icon">⏳</div>
          <h3>Cargando asignaciones...</h3>
          <p>Verificando proyectos asignados y progreso</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-state">
          <div className="error-icon">❌</div>
          <h3>Error al cargar</h3>
          <p>{error}</p>
          <button className="retry-button" onClick={loadUserAssignments}>
            🔄 Intentar de nuevo
          </button>
        </div>
      </div>
    )
  }

  // Renderizado principal
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
          <p className="dashboard-subtitle">
            {assignments.length === 0 
              ? 'No tienes proyectos asignados actualmente'
              : `Tienes ${assignments.length} proyecto${assignments.length !== 1 ? 's' : ''} asignado${assignments.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>
        
        <button className="logout-button" onClick={onLogout}>
          🚪 Cerrar Sesión
        </button>
      </div>

      {/* Asignaciones del usuario */}
      <div className="assignments-section">
        {assignments.length === 0 ? (
          // Sin asignaciones
          <div className="no-assignments">
            <div className="no-assignments-icon">📋</div>
            <h3>Sin Asignaciones</h3>
            <p>No tienes proyectos asignados actualmente.</p>
            <p>Contacta a tu administrador para recibir asignaciones de conteo.</p>
          </div>
        ) : (
          // Grid de asignaciones
          <div className="assignments-grid">
            {assignments.map((assignment, index) => {
              const progress = assignmentsProgress[assignment.projectId]
              const movementNames = getAssignedMovementNames(assignment) // ✅ NO ASYNC, SIN FIREBASE
              const buttonState = getButtonState(progress)
              
              console.log('🎨 Renderizando asignación:', assignment.projectName)
              console.log('🔄 Nombres de movimientos para mostrar:', movementNames)
              
              return (
                <div key={`${assignment.projectId}-${index}`} className="assignment-card">
                  {/* Header de la asignación */}
                  <div className="assignment-header">
                    <div className="assignment-title">
                      {assignment.projectName || `Proyecto ${assignment.projectId}`}
                    </div>
                    <div className={`assignment-status ${assignment.status || 'assigned'}`}>
                      {assignment.status === 'assigned' && '📋 Asignado'}
                      {assignment.status === 'active' && '🔄 Activo'}
                      {assignment.status === 'completed' && '✅ Completado'}
                      {!assignment.status && '📋 Asignado'}
                    </div>
                  </div>

                  {/* Información del proyecto */}
                  <div className="project-info">
                    <div className="info-item">
                      <span className="info-icon">
                        {assignment.assignedType === 'vehicles' ? '🚗' : '🚶'}
                      </span>
                      <span className="info-text">
                        {assignment.assignedType === 'vehicles' ? 'Vehículos' : 'Peatones'}
                      </span>
                    </div>

                    {assignment.horaInicio && assignment.horaFin && (
                      <div className="info-item">
                        <span className="info-icon">🕒</span>
                        <span className="info-text">
                          {assignment.horaInicio} - {assignment.horaFin}
                        </span>
                      </div>
                    )}

                    {assignment.assignedAt && (
                      <div className="info-item">
                        <span className="info-icon">📅</span>
                        <span className="info-text">
                          Asignado: {formatDate(assignment.assignedAt)}
                        </span>
                      </div>
                    )}

                    {assignment.assignedBy && (
                      <div className="info-item">
                        <span className="info-icon">👤</span>
                        <span className="info-text">
                          Por: Admin
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ✅ SECCIÓN DE MOVIMIENTOS: Simplificada, SIN acceso a Firebase */}
                  {movementNames.length > 0 && (
                    <div className="movements-section">
                      <div className="movements-header">
                        <span className="movements-label">
                          🔄 Movimientos ({movementNames.length})
                        </span>
                      </div>
                      <div className="movements-list">
                        {movementNames.slice(0, 2).map((name, idx) => (
                          <span key={idx} className="movement-tag">
                            {name} {/* ← Para nuevas asignaciones: nombres reales | Para existentes: IDs amigables */}
                          </span>
                        ))}
                        {movementNames.length > 2 && (
                          <span className="movement-more">
                            +{movementNames.length - 2} más
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Barra de progreso */}
                  {progress && progress.totalFranjas > 0 && (
                    <div className="progress-section">
                      <div className="progress-header">
                        <span className="progress-label">Progreso</span>
                        <span className="progress-text">
                          {progress.franjasCompletadas}/{progress.totalFranjas} franjas
                        </span>
                      </div>
                      
                      {/* 🔍 DEBUG: Mostrar franjas faltantes si no está completo */}
                      {progress.progressPercentage < 100 && (
                        <div className="progress-debug">
                          <span className="debug-text">
                            Franjas faltantes: {Array.from({length: progress.totalFranjas}, (_, i) => i + 1)
                              .filter(f => !progress.franjasCompletadasList?.includes(f))
                              .join(', ')}
                          </span>
                        </div>
                      )}
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${progress.progressPercentage}%` }}
                        ></div>
                      </div>
                      <div className="progress-percentage">
                        {progress.progressPercentage}% completado
                      </div>
                    </div>
                  )}

                  {/* Botón de acción */}
                  <div className="assignment-actions">
                    <button
                      className={`action-button ${buttonState.className}`}
                      onClick={() => handleStartCounting(assignment)}
                      disabled={buttonState.disabled}
                    >
                      {buttonState.text}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard