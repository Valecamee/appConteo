// src/components/AdminDashboard/ProjectManagement/ProjectCard.jsx
import React from 'react'

const ProjectCard = ({ project, onView, onEdit }) => {
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

  // Formatear fecha
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const statusColor = getStatusColor(project.status)

  return (
    <div 
      className={`project-card ${project.status}`}
      style={{
        '--project-color': statusColor.color,
        '--project-color-rgb': statusColor.bg
      }}
    >
      {/* Header de la card */}
      <div className="project-card-header">
        <div className="project-title-section">
          <h3 className="project-title">{project.name}</h3>
          <p className="project-description">{project.description}</p>
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
          <div className="info-label">📍 Intersección</div>
          <div className="info-value">{project.intersection.name}</div>
        </div>
        <div className="info-item">
          <div className="info-label">📅 Período</div>
          <div className="info-value">
            {formatDate(project.dateRange.startDate)} - {formatDate(project.dateRange.endDate)}
          </div>
        </div>
        <div className="info-item">
          <div className="info-label">👥 Usuarios</div>
          <div className="info-value highlight">
            {project.assignedUsers.length}
          </div>
        </div>
        <div className="info-item">
          <div className="info-label">📋 Asignaciones</div>
          <div className="info-value">
            {project.completedAssignments}/{project.totalAssignments}
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="progress-section">
        <div className="progress-header">
          <span className="progress-label">Progreso del Proyecto</span>
          <span className="progress-percentage">{project.progress}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ 
              width: `${project.progress}%`,
              '--project-color': statusColor.color,
              '--project-color-rgb': statusColor.bg
            }}
          />
        </div>
      </div>

      {/* Usuarios asignados */}
      <div className="assigned-users">
        <div className="users-header">Usuarios Asignados:</div>
        <div className="users-list">
          {project.assignedUsers.slice(0, 3).map((user) => (
            <span key={user.id} className="user-tag">
              {user.name}
            </span>
          ))}
          {project.assignedUsers.length > 3 && (
            <span className="users-more">
              +{project.assignedUsers.length - 3} más
            </span>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="project-actions">
        <button 
          className="action-button view"
          onClick={() => onView && onView(project)}
          title="Ver detalles del proyecto"
        >
          👁️ Ver
        </button>
        <button 
          className="action-button edit"
          onClick={() => onEdit && onEdit(project)}
          title="Editar proyecto"
        >
          ✏️ Editar
        </button>
      </div>
    </div>
  )
}

export default ProjectCard