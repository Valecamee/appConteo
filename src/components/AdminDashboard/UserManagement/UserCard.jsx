// src/components/AdminDashboard/UserManagement/UserCard.jsx
import React, { useState } from 'react'
import './UserCard.css'

const UserCard = ({ 
  userData, 
  onApprove, 
  onReject, 
  onViewProfile, 
  onAssignProject,
  onEdit,
  showActions = true,
  compact = false 
}) => {
  const [isLoading, setIsLoading] = useState(false)

  // Formatear fecha
  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Formatear fecha relativa (hace X días)
  const formatRelativeDate = (date) => {
    if (!date) return 'N/A'
    const now = new Date()
    const targetDate = new Date(date)
    const diffTime = Math.abs(now - targetDate)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Ayer'
    if (diffDays < 7) return `Hace ${diffDays} días`
    if (diffDays < 30) return `Hace ${Math.ceil(diffDays / 7)} semana(s)`
    return formatDate(date)
  }

  // Obtener iniciales para avatar
  const getInitials = (name) => {
    if (!name) return '??'
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  // Calcular días desde registro
  const getDaysSinceRegistration = () => {
    if (!userData.createdAt) return 0
    const now = new Date()
    const createdDate = new Date(userData.createdAt)
    const diffTime = Math.abs(now - createdDate)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Determinar tags del usuario
  const getUserTags = () => {
    const tags = []
    const daysSinceRegistration = getDaysSinceRegistration()
    
    if (daysSinceRegistration <= 7) {
      tags.push({ label: 'Nuevo', type: 'new' })
    }
    
    if (userData.projectsAssigned > 3) {
      tags.push({ label: 'Experimentado', type: 'experienced' })
    }
    
    if (userData.role === 'ADMIN') {
      tags.push({ label: 'Premium', type: 'premium' })
    }
    
    return tags
  }

  // Manejar acciones con loading
  const handleAction = async (action, ...args) => {
    setIsLoading(true)
    try {
      await action(...args)
    } catch (error) {
      console.error('Error en acción:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Configurar texto de estado
  const getStatusText = () => {
    switch (userData.status) {
      case 'PENDING':
        return { text: '⏳ Esperando Aprobación', icon: '⏳' }
      case 'ACTIVE':
        return { text: '✅ Usuario Activo', icon: '✅' }
      case 'REJECTED':
        return { text: '❌ Solicitud Rechazada', icon: '❌' }
      case 'INACTIVE':
        return { text: '💤 Usuario Inactivo', icon: '💤' }
      default:
        return { text: userData.status, icon: '❓' }
    }
  }

  const statusInfo = getStatusText()
  const userTags = getUserTags()
  const daysSinceRegistration = getDaysSinceRegistration()

  return (
    <div className={`user-card-detailed ${userData.status.toLowerCase()} ${compact ? 'compact' : ''}`}>
      {/* Header principal */}
      <div className="user-card-header-detailed">
        <div className="user-main-info">
          <h3 className="user-name-detailed">{userData.fullName}</h3>
          <p className="user-email-detailed">{userData.email}</p>
          <div className="user-role-badge user">
            👤 {userData.role}
          </div>
        </div>
        
        <div className="user-avatar-detailed">
          <div className="avatar-circle">
            {getInitials(userData.fullName)}
            <div className={`status-indicator ${userData.status.toLowerCase()}`}></div>
          </div>
        </div>
      </div>

      {/* Estado actual */}
      <div className={`user-status-detailed ${userData.status.toLowerCase()}`}>
        <span>{statusInfo.icon}</span>
        <span>{statusInfo.text}</span>
      </div>

      {/* Tags del usuario */}
      {userTags.length > 0 && (
        <div className="user-tags">
          {userTags.map((tag, index) => (
            <span key={index} className={`user-tag ${tag.type}`}>
              {tag.label}
            </span>
          ))}
        </div>
      )}

      {/* Métricas principales */}
      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-value">{userData.projectsAssigned || 0}</div>
          <div className="metric-label">Proyectos</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{daysSinceRegistration}</div>
          <div className="metric-label">Días</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{userData.completedTasks || 0}</div>
          <div className="metric-label">Tareas</div>
        </div>
      </div>

      {/* Información detallada */}
      <div className="user-detailed-info">
        <div className="info-section">
          <h4 className="info-section-title">📅 Fechas Importantes</h4>
          <div className="info-grid">
            <div className="info-item-detailed">
              <span className="info-label-detailed">📝 Registro:</span>
              <span className="info-value-detailed">{formatDate(userData.createdAt)}</span>
            </div>
            
            {userData.status === 'ACTIVE' && userData.approvedAt && (
              <div className="info-item-detailed">
                <span className="info-label-detailed">✅ Aprobado:</span>
                <span className="info-value-detailed">{formatDate(userData.approvedAt)}</span>
              </div>
            )}
            
            {userData.status === 'REJECTED' && userData.rejectedAt && (
              <div className="info-item-detailed">
                <span className="info-label-detailed">❌ Rechazado:</span>
                <span className="info-value-detailed">{formatDate(userData.rejectedAt)}</span>
              </div>
            )}
            
            {userData.lastActive && (
              <div className="info-item-detailed">
                <span className="info-label-detailed">🕒 Última vez:</span>
                <span className="info-value-detailed">{formatRelativeDate(userData.lastActive)}</span>
              </div>
            )}
          </div>
        </div>

        {userData.status === 'REJECTED' && userData.rejectionReason && (
          <div className="info-section">
            <h4 className="info-section-title">💬 Motivo de Rechazo</h4>
            <div className="info-item-detailed">
              <span className="info-value-detailed" style={{ width: '100%', textAlign: 'left' }}>
                {userData.rejectionReason}
              </span>
            </div>
          </div>
        )}

        <div className="info-section">
          <h4 className="info-section-title">📊 Estadísticas</h4>
          <div className="info-grid">
            <div className="info-item-detailed">
              <span className="info-label-detailed">🎯 Eficiencia:</span>
              <span className="info-value-detailed highlight">
                {userData.efficiency || 'N/A'}%
              </span>
            </div>
            <div className="info-item-detailed">
              <span className="info-label-detailed">⭐ Calificación:</span>
              <span className="info-value-detailed highlight">
                {userData.rating || 'N/A'}/5
              </span>
            </div>
            <div className="info-item-detailed">
              <span className="info-label-detailed">🏆 Logros:</span>
              <span className="info-value-detailed">{userData.achievements || 0}</span>
            </div>
            <div className="info-item-detailed">
              <span className="info-label-detailed">📈 Nivel:</span>
              <span className="info-value-detailed highlight">
                {userData.level || 1}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones */}
      {showActions && (
        <div className="user-actions-detailed">
          {userData.status === 'PENDING' && (
            <>
              <button 
                className="action-btn-detailed primary"
                onClick={() => handleAction(onApprove, userData.uid)}
                disabled={isLoading}
              >
                ✅ Aprobar
              </button>
              <button 
                className="action-btn-detailed danger"
                onClick={() => handleAction(onReject, userData.uid)}
                disabled={isLoading}
              >
                ❌ Rechazar
              </button>
            </>
          )}
          
          {userData.status === 'ACTIVE' && (
            <>
              <button 
                className="action-btn-detailed warning"
                onClick={() => handleAction(onAssignProject, userData.uid)}
                disabled={isLoading}
              >
                📋 Asignar Proyecto
              </button>
              <button 
                className="action-btn-detailed secondary"
                onClick={() => handleAction(onEdit, userData.uid)}
                disabled={isLoading}
              >
                ✏️ Editar
              </button>
            </>
          )}
          
          {userData.status === 'REJECTED' && (
            <button 
              className="action-btn-detailed warning"
              onClick={() => handleAction(onApprove, userData.uid)}
              disabled={isLoading}
            >
              🔄 Reconsiderar
            </button>
          )}
          
          <button 
            className="action-btn-detailed secondary"
            onClick={() => handleAction(onViewProfile, userData.uid)}
            disabled={isLoading}
          >
            👁️ Ver Perfil
          </button>
        </div>
      )}

      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '20px',
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{ 
            color: 'white', 
            fontSize: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            ⏳ Procesando...
          </div>
        </div>
      )}
    </div>
  )
}

export default UserCard