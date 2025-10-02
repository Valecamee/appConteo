// src/components/AdminDashboard/ProjectManagement/ProjectManagement.jsx
import React, { useState, useEffect } from 'react'
import { projectService } from '../../../services/projectService'
import './ProjectManagement.css'

const ProjectManagement = ({ user, onBack, onCreateProject, onEditProject, onViewProject }) => {
  // Estados para proyectos
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  // Estados para estadísticas
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    paused: 0
  })

  // Cargar proyectos al montar el componente
  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
      console.log('📋 Cargando proyectos desde Firebase...')
      
      // Obtener todos los proyectos del admin actual
      const allProjects = await projectService.getAllProjects({ 
        createdBy: user.uid 
      })

      // AGREGAR ESTE DEBUG:
      console.log('🔍 Proyectos recibidos:', allProjects)
      if (allProjects.length > 0) {
        console.log('🔍 Primer proyecto accesos:', allProjects[0].accesos)
        if (allProjects[0].accesos?.[0]) {
          console.log('🔍 Primer acceso movimientos:', allProjects[0].accesos[0].movimientos)
        }
      }
      setProjects(allProjects)
      calculateStats(allProjects)
      
      console.log(`✅ Cargados ${allProjects.length} proyectos`)
    } catch (error) {
      console.error('❌ Error cargando proyectos:', error)
      setProjects([]) // En caso de error, mostrar array vacío
      setStats({ total: 0, active: 0, completed: 0, paused: 0 })
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (projectsData) => {
    const stats = {
      total: projectsData.length,
      active: projectsData.filter(p => p.status === 'active').length,
      completed: projectsData.filter(p => p.status === 'completed').length,
      paused: projectsData.filter(p => p.status === 'paused').length
    }
    setStats(stats)
  }

  // Filtrar proyectos
  const filteredProjects = projects.filter(project => {
    const matchesSearch = (project.nombreVideo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.interseccion?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = activeFilter === 'all' || project.status === activeFilter
    
    return matchesSearch && matchesFilter
  })

  // Manejar eliminación de proyecto
  const handleDeleteProject = async (projectId) => {
    try {
      if (window.confirm('¿Estás seguro de eliminar este proyecto? Esta acción no se puede deshacer.')) {
        console.log('🗑️ Eliminando proyecto:', projectId)
        await projectService.deleteProject(projectId)
        
        // Recargar proyectos
        await loadProjects()
        console.log('✅ Proyecto eliminado exitosamente')
      }
    } catch (error) {
      console.error('❌ Error eliminando proyecto:', error)
      alert('Error al eliminar proyecto: ' + error.message)
    }
  }

  // Manejar cambio de estado
  const handleToggleStatus = async (projectId, newStatus) => {
    try {
      console.log('🔄 Cambiando estado del proyecto:', projectId, 'a', newStatus)
      await projectService.updateProject(projectId, { status: newStatus }, user.uid)
      
      // Recargar proyectos
      await loadProjects()
      console.log('✅ Estado actualizado exitosamente')
    } catch (error) {
      console.error('❌ Error actualizando estado:', error)
      alert('Error al actualizar estado: ' + error.message)
    }
  }

  // Formatear fecha - PROTEGIDO CONTRA Timestamps de Firebase
  const formatDate = (date) => {
    if (!date) return 'Sin fecha'
    
    // Si es un Timestamp de Firebase, convertirlo a Date
    const jsDate = date.toDate ? date.toDate() : new Date(date)
    
    return jsDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Obtener color del estado
  const getStatusColor = (status) => {
    const colors = {
      active: { bg: '38, 222, 129', color: '#26de81' },
      completed: { bg: '78, 205, 196', color: '#4ecdc4' },
      paused: { bg: '255, 211, 61', color: '#ffd93d' },
      cancelled: { bg: '255, 107, 107', color: '#ff6b6b' }
    }
    return colors[status] || colors.active
  }

  // Obtener texto del estado
  const getStatusText = (status) => {
    const texts = {
      active: 'Activo',
      completed: 'Completado',
      paused: 'Pausado',
      cancelled: 'Cancelado'
    }
    return texts[status] || 'Desconocido'
  }

  if (loading) {
    return (
      <div className="project-management-container">
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
            border: '3px solid rgba(255, 211, 61, 0.3)',
            borderTop: '3px solid #ffd93d',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: 'white', fontSize: '1.2rem' }}>Cargando proyectos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="project-management-container">
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
      <div className="project-header">
        <div className="header-left">
          <button className="back-button" onClick={onBack}>
            ← Volver
          </button>
          <div className="header-content">
            <h1>🎯 Gestión de Proyectos</h1>
            <p>Administra proyectos de conteo y asignaciones</p>
          </div>
        </div>
        
        <div className="header-actions">
          <input
            type="text"
            placeholder="🔍 Buscar proyectos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button 
            className="create-project-button"
            onClick={onCreateProject}
          >
            ➕ Crear Proyecto
          </button>
        </div>
      </div>

      {/* Controles y estadísticas */}
      <div className="project-controls">
        <div className="project-filters">
          <button 
            className={`filter-button ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            📋 Todos
          </button>
          <button 
            className={`filter-button ${activeFilter === 'active' ? 'active' : ''}`}
            onClick={() => setActiveFilter('active')}
          >
            🟢 Activos
          </button>
          <button 
            className={`filter-button ${activeFilter === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveFilter('completed')}
          >
            ✅ Completados
          </button>
          <button 
            className={`filter-button ${activeFilter === 'paused' ? 'active' : ''}`}
            onClick={() => setActiveFilter('paused')}
          >
            ⏸️ Pausados
          </button>
        </div>
        
        <div className="project-stats">
          <div className="stat-item">
            📊 Total: <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-item">
            🟢 Activos: <span className="stat-value">{stats.active}</span>
          </div>
          <div className="stat-item">
            ✅ Completados: <span className="stat-value">{stats.completed}</span>
          </div>
          <div className="stat-item">
            ⏸️ Pausados: <span className="stat-value">{stats.paused}</span>
          </div>
        </div>
      </div>

      {/* Grid de proyectos */}
      <div className="projects-grid">
        {filteredProjects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <h3 className="empty-title">
              {searchTerm || activeFilter !== 'all' ? 'No se encontraron proyectos' : 'No hay proyectos creados'}
            </h3>
            <p className="empty-description">
              {searchTerm || activeFilter !== 'all' 
                ? 'Intenta cambiar los filtros o el término de búsqueda'
                : 'Crea tu primer proyecto para comenzar a gestionar conteos de tráfico'
              }
            </p>
            {(!searchTerm && activeFilter === 'all') && (
              <button className="empty-action" onClick={onCreateProject}>
                ➕ Crear Primer Proyecto
              </button>
            )}
          </div>
        ) : (
          filteredProjects.map((project) => {
            const statusColor = getStatusColor(project.status)
            
            return (
              <div 
                key={project.id} 
                className={`project-card ${project.status}`}
                style={{
                  '--project-color': statusColor.color,
                  '--project-color-rgb': statusColor.bg
                }}
              >
                {/* Header de la card */}
                <div className="project-card-header">
                  <div className="project-title-section">
                    <h3 className="project-title">{project.nombreVideo || 'Sin título'}</h3>
                    <p className="project-description">{project.descripcion || 'Sin descripción'}</p>
                  </div>
                  <div 
                    className={`project-status ${project.status}`}
                    style={{
                      '--status-color': statusColor.color,
                      '--status-color-rgb': statusColor.bg
                    }}
                  >
                    {getStatusText(project.status)}
                  </div>
                </div>

                {/* Información del proyecto */}
                <div className="project-info">
                  <div className="info-item">
                    <div className="info-label">🚦 Intersección</div>
                    <div className="info-value">{project.interseccion?.nombre || 'Sin especificar'}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">📅 Fecha Aforo</div>
                    <div className="info-value">
                      {formatDate(project.fechaAforo)}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">⏰ Fecha Límite</div>
                    <div className="info-value">
                      {formatDate(project.fechaLimite)}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">📐 Accesos</div>
                    <div className="info-value highlight">
                      {project.totalEsquinas || 0}
                    </div>
                  </div>
                </div>

                {/* Movimientos configurados */}
                <div className="movimientos-info">
                  <div className="movimientos-header">Movimientos Configurados:</div>
                  <div className="movimientos-list">
                    {(() => {
                      // Obtener todos los movimientos de todas las esquinas
                      const todosMovimientos = project.interseccion?.accesos?.flatMap(acceso => 
                        acceso.movimientos?.map(mov => mov.nombre).filter(nombre => nombre) || []
                      ) || []
                      
                      if (todosMovimientos.length === 0) {
                        return <span className="no-movements">Sin movimientos configurados</span>
                      }
                      
                      return (
                        <>
                          {todosMovimientos.slice(0, 4).map((movimiento, index) => (
                            <span key={index} className="movimiento-tag">
                              {movimiento}
                            </span>
                          ))}
                          {todosMovimientos.length > 4 && (
                            <span className="movimientos-more">
                              +{todosMovimientos.length - 4} más
                            </span>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </div>

                {/* Progreso */}
                <div className="progress-section">
                  <div className="progress-header">
                    <span className="progress-label">Progreso del Proyecto</span>
                    <span className="progress-percentage">{project.porcentajeCompletado || 0}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${project.porcentajeCompletado || 0}%`,
                        '--project-color': statusColor.color
                      }}
                    />
                  </div>
                </div>

                {/* Usuarios asignados */}
                <div className="assigned-users">
                  <div className="users-header">Usuarios Asignados:</div>
                  <div className="users-list">
                    {project.usuariosAsignados?.length > 0 ? (
                      <>
                        {project.usuariosAsignados.slice(0, 3).map((userId, index) => (
                          <span key={userId} className="user-tag">
                            Usuario {index + 1}
                          </span>
                        ))}
                        {project.usuariosAsignados.length > 3 && (
                          <span className="users-more">
                            +{project.usuariosAsignados.length - 3} más
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="no-users">Sin asignar</span>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="project-actions">
                  <button 
                    className="action-button view"
                    onClick={() => onViewProject && onViewProject(project)}
                    title="Ver detalles del proyecto"
                  >
                    👁️ Ver
                  </button>
                  <button 
                    className="action-button edit"
                    onClick={() => onEditProject && onEditProject(project)}
                    title="Editar proyecto"
                  >
                    ✏️ Editar
                  </button>
                  <button 
                    className="action-button delete"
                    onClick={() => handleDeleteProject(project.id)}
                    title="Eliminar proyecto"
                  >
                    🗑️ Eliminar
                  </button>
                  
                  {project.status === 'active' && (
                    <button 
                      className="action-button pause"
                      onClick={() => handleToggleStatus(project.id, 'paused')}
                      title="Pausar proyecto"
                    >
                      ⏸️ Pausar
                    </button>
                  )}
                  
                  {project.status === 'paused' && (
                    <button 
                      className="action-button resume"
                      onClick={() => handleToggleStatus(project.id, 'active')}
                      title="Reanudar proyecto"
                    >
                      ▶️ Reanudar
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default ProjectManagement