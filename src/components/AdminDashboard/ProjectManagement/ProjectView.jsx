import React, { useState, useEffect } from 'react'
import { userService } from '../../../services/userService'
import { conteoService } from '../../../services/conteoService'
import './ProjectView.css'

const ProjectView = ({ project, onBack, onDownloadCSV }) => {
  const [assignedUsers, setAssignedUsers] = useState([])
  const [userStats, setUserStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadProjectData()
  }, [project])

  const loadProjectData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔍 ProjectView: Cargando datos del proyecto:', project)
      console.log('🔍 ProjectView: usuariosAsignados:', project?.usuariosAsignados)
      console.log('🔍 ProjectView: Estructura completa del proyecto:', JSON.stringify(project, null, 2))

      // Si no hay usuarios asignados, intentar sincronizar
      if (!project?.usuariosAsignados?.length) {
        console.log('⚠️ ProjectView: No hay usuarios asignados al proyecto, intentando sincronizar...')
        
        try {
          const { projectService } = await import('../../../services/projectService')
          const syncedUserIds = await projectService.syncProjectUsers(project.id)
          
          if (syncedUserIds.length > 0) {
            console.log(`✅ Sincronizados ${syncedUserIds.length} usuarios`)
            // Recargar los datos con los usuarios sincronizados
            const updatedProject = { ...project, usuariosAsignados: syncedUserIds }
            await loadUsersData(updatedProject)
            return
          } else {
            console.log('⚠️ No se encontraron usuarios asignados después de sincronizar')
            setAssignedUsers([])
            setLoading(false)
            return
          }
        } catch (syncError) {
          console.error('❌ Error sincronizando usuarios:', syncError)
          setAssignedUsers([])
          setLoading(false)
          return
        }
      }

      await loadUsersData(project)
    } catch (error) {
      console.error('Error cargando datos del proyecto:', error)
      setError('Error al cargar los datos del proyecto')
    } finally {
      setLoading(false)
    }
  }

  const loadUsersData = async (project) => {
    try {
      console.log(`📋 ProjectView: Cargando ${project.usuariosAsignados.length} usuarios asignados`)

      // Obtener datos de usuarios asignados
      const usersData = await Promise.all(
        project.usuariosAsignados.map(async (userId) => {
          try {
            const userData = await userService.getUserById(userId)
            return userData
          } catch (error) {
            console.error(`Error obteniendo usuario ${userId}:`, error)
            return null
          }
        })
      )

      // Filtrar usuarios válidos
      const validUsers = usersData.filter(user => user !== null)
      setAssignedUsers(validUsers)

             // Obtener estadísticas de conteo para cada usuario
             const statsPromises = validUsers.map(async (user) => {
               try {
                 const userConteos = await conteoService.obtenerResumenConteos(user.uid)
                 const projectConteos = userConteos.filter(conteo =>
                   conteo.nombreVideo === project.nombreVideo
                 )

                 return {
                   userId: user.uid,
                   totalFranjas: projectConteos.length,
                   totalMovimientos: projectConteos.reduce((sum, conteo) => sum + (conteo.totalMovimiento || 0), 0),
                   lastActivity: projectConteos.length > 0 ? projectConteos[0].timestamp : null
                 }
               } catch (error) {
                 console.error(`Error obteniendo estadísticas para ${user.uid}:`, error)
                 return {
                   userId: user.uid,
                   totalFranjas: 0,
                   totalMovimientos: 0,
                   lastActivity: null
                 }
               }
             })

      const stats = await Promise.all(statsPromises)
      const statsMap = {}
      stats.forEach(stat => {
        statsMap[stat.userId] = stat
      })
      setUserStats(statsMap)

    } catch (error) {
      console.error('Error cargando datos de usuarios:', error)
      setError('Error al cargar los datos de usuarios')
    }
  }

  const handleDownloadCSV = async () => {
    try {
      if (onDownloadCSV) {
        await onDownloadCSV(project)
      }
    } catch (error) {
      console.error('Error descargando CSV:', error)
      alert('Error al descargar el CSV: ' + error.message)
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Nunca'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleString('es-ES')
  }

  const getAssignmentInfo = (user) => {
    const assignment = user.assignedProjects?.find(a => a.projectId === project.id)
    if (!assignment) return null

    return {
      tipo: assignment.assignedType,
      movimientos: assignment.assignedMovementNames || [],
      horaInicio: assignment.horaInicio,
      horaFin: assignment.horaFin,
      status: assignment.status
    }
  }

  if (loading) {
    return (
      <div className="project-view-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando datos del proyecto...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="project-view-container">
        <div className="error-message">
          <h3>❌ Error</h3>
          <p>{error}</p>
          <button onClick={loadProjectData} className="retry-button">
            🔄 Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="project-view-container">
      <div className="project-header">
        <button onClick={onBack} className="back-button">
          ← Volver a Proyectos
        </button>
        <h1>📊 Vista del Proyecto</h1>
        <button onClick={handleDownloadCSV} className="download-csv-button">
          📥 Descargar CSV del Proyecto
        </button>
      </div>

      <div className="project-info">
        <h2>{project.nombreVideo || 'Sin título'}</h2>
        <div className="project-details">
          <p><strong>Descripción:</strong> {project.descripcion || 'Sin descripción'}</p>
          <p><strong>Intersección:</strong> {project.interseccion?.nombre || 'Sin especificar'}</p>
          <p><strong>Estado:</strong> 
            <span className={`status-badge status-${project.status || 'unknown'}`}>
              {project.status || 'Sin estado'}
            </span>
          </p>
          <p><strong>Progreso:</strong> {project.porcentajeCompletado || 0}%</p>
          <p><strong>Total de Accesos:</strong> {project.totalEsquinas || 0}</p>
        </div>
      </div>

      <div className="assigned-users-section">
        <h3>👥 Usuarios Asignados ({assignedUsers.length})</h3>
        
        {assignedUsers.length === 0 ? (
          <div className="no-users">
            <p>No hay usuarios asignados a este proyecto</p>
          </div>
        ) : (
          <div className="users-grid">
            {assignedUsers.map((user) => {
              const assignment = getAssignmentInfo(user)
              const stats = userStats[user.uid] || {}
              
              return (
                <div key={user.uid} className="user-card">
                  <div className="user-header">
                    <h4>{user.fullName || user.email}</h4>
                    <span className={`user-status status-${user.status?.toLowerCase() || 'unknown'}`}>
                      {user.status || 'Sin estado'}
                    </span>
                  </div>
                  
                  <div className="user-details">
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Rol:</strong> {user.role || 'USER'}</p>
                    
                    {assignment && (
                      <div className="assignment-info">
                        <h5>📋 Asignación:</h5>
                        <p><strong>Tipo:</strong> {assignment.tipo === 'vehicles' ? 'Vehículos' : 'Peatones'}</p>
                        <p><strong>Movimientos:</strong> {assignment.movimientos.join(', ') || 'Sin movimientos'}</p>
                        <p><strong>Horario:</strong> {assignment.horaInicio} - {assignment.horaFin}</p>
                        <p><strong>Estado:</strong> 
                          <span className={`assignment-status status-${assignment.status}`}>
                            {assignment.status === 'assigned' ? 'Asignado' : 
                             assignment.status === 'active' ? 'Activo' : 
                             assignment.status === 'completed' ? 'Completado' : assignment.status}
                          </span>
                        </p>
                      </div>
                    )}
                    
                    <div className="user-stats">
                      <h5>📊 Estadísticas:</h5>
                      <p><strong>Franjas completadas:</strong> {stats.totalFranjas || 0}</p>
                      <p><strong>Total de movimientos:</strong> {stats.totalMovimientos || 0}</p>
                      <p><strong>Última actividad:</strong> {formatDate(stats.lastActivity)}</p>
                    </div>
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

export default ProjectView
