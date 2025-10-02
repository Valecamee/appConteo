// src/components/AdminDashboard/UserManagement/UserManagement.jsx - ACTUALIZADO
import React, { useState, useEffect } from 'react'
import './UserManagement.css'
import AssignmentModal from './AssignmentModal'
import { userService } from '../../../services/userService'

const UserManagement = ({ user, onBack, onNavigateToProfile }) => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  
  // Estados para el modal de asignación
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [selectedUserForAssignment, setSelectedUserForAssignment] = useState(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      console.log('🔄 Cargando usuarios con asignaciones...')
      
      // Usar el nuevo método que incluye asignaciones
      const usersData = await userService.getUsersWithAssignments()
      setUsers(usersData)
      
      console.log('✅ Usuarios cargados exitosamente:', usersData.length)
    } catch (error) {
      console.error('❌ Error cargando usuarios:', error)
      alert('Error cargando usuarios: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar usuarios
  const getFilteredUsers = () => {
    let filtered = users

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(u => 
        u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por tab
    switch (activeTab) {
      case 'pending':
        return filtered.filter(u => u.status === 'PENDING')
      case 'active':
        return filtered.filter(u => u.status === 'APPROVED')
      case 'assigned':
        return filtered.filter(u => u.hasActiveAssignments === true)
      default:
        return filtered
    }
  }

  // Estadísticas
  const getStats = () => {
    const totalUsers = users.length
    const pendingUsers = users.filter(u => u.status === 'PENDING').length
    const activeUsers = users.filter(u => u.status === 'APPROVED').length
    const usersWithAssignments = users.filter(u => u.hasActiveAssignments === true).length
    
    return {
      total: totalUsers,
      pending: pendingUsers,
      active: activeUsers,
      assigned: usersWithAssignments,
      totalProjects: usersWithAssignments // Para mantener compatibilidad
    }
  }

  // Handlers existentes
  const handleApproveUser = async (userId) => {
    try {
      if (window.confirm('¿Estás seguro de que quieres aprobar este usuario?')) {
        console.log('✅ Aprobando usuario:', userId)
        await userService.approveUser(userId, user.uid)
        
        // Recargar usuarios
        await loadUsers()
        console.log('Usuario aprobado exitosamente')
      }
    } catch (error) {
      console.error('❌ Error aprobando usuario:', error)
      alert('Error al aprobar usuario: ' + error.message)
    }
  }

  const handleRejectUser = async (userId) => {
    try {
      const reason = window.prompt('Motivo del rechazo (opcional):')
      if (reason !== null) { // null = cancelado
        console.log('❌ Rechazando usuario:', userId)
        await userService.rejectUser(userId, user.uid, reason || 'Sin motivo especificado')
        
        // Recargar usuarios
        await loadUsers()
        console.log('Usuario rechazado exitosamente')
      }
    } catch (error) {
      console.error('❌ Error rechazando usuario:', error)
      alert('Error al rechazar usuario: ' + error.message)
    }
  }

  const handleViewProfile = (userId) => {
  console.log('Ver perfil de usuario:', userId)
  onNavigateToProfile(userId)
  }

  // NUEVO: Handler para abrir modal de asignación
  const handleAssignProject = (userId) => {
    const userData = users.find(u => u.uid === userId)
    setSelectedUserForAssignment(userData)
    setShowAssignmentModal(true)
  }

  // NUEVO: Handler para asignar proyecto
  const handleCreateAssignment = async (userId, assignmentData) => {
    try {
      console.log('📋 Creando asignación:', userId, assignmentData)
      await userService.assignProjectToUser(userId, {
        ...assignmentData,
        adminId: user.uid
      })
      
      // Recargar usuarios para mostrar la nueva asignación
      await loadUsers()
      
      alert('✅ Proyecto asignado exitosamente!')
      
    } catch (error) {
      console.error('❌ Error asignando proyecto:', error)
      alert('Error al asignar proyecto: ' + error.message)
    }
  }

  // NUEVO: Handler para remover asignación
  const handleRemoveAssignment = async (userId, projectId) => {
    try {
      if (window.confirm('¿Estás seguro de que quieres remover esta asignación?')) {
        await userService.removeProjectAssignment(userId, projectId, user.uid)
        await loadUsers()
        alert('✅ Asignación removida exitosamente!')
      }
    } catch (error) {
      console.error('❌ Error removiendo asignación:', error)
      alert('Error al remover asignación: ' + error.message)
    }
  }

  const handleRefresh = () => {
    loadUsers()
  }

  // Formatear fecha
  const formatDate = (date) => {
    if (!date) return 'N/A'
    const jsDate = date.toDate ? date.toDate() : new Date(date)
    return jsDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Obtener iniciales para avatar
  const getInitials = (name) => {
    if (!name) return '??'
    return name.split(' ').map(word => word[0]).join('').toUpperCase()
  }

  // NUEVO: Componente para mostrar asignaciones
  const ProjectAssignments = ({ assignments }) => {
    if (!assignments || assignments.length === 0) {
      return (
        <div className="no-assignments">
          <span className="no-assignments-text">Sin proyectos asignados</span>
        </div>
      )
    }

    return (
      <div className="project-assignments">
        <div className="assignments-header">
          <span className="assignments-count">
            📋 {assignments.length} proyecto{assignments.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="assignments-list">
          {assignments.map((assignment, index) => (
            <div key={assignment.projectId} className={`assignment-item ${assignment.status}`}>
              <div className="assignment-info">
                <span className="project-name">{assignment.projectName}</span>
                <span className="assignment-details">
                  Franja #{assignment.franjaNumber} • {assignment.assignedType === 'vehicles' ? 'Vehículos' : 'Peatones'}
                </span>
                {assignment.assignedMovements && (
                  <span className="movements-count">
                    {assignment.assignedMovements.length} movimiento{assignment.assignedMovements.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="assignment-actions">
                <span className={`status-badge ${assignment.status}`}>
                  {assignment.status === 'assigned' && '📋 Asignado'}
                  {assignment.status === 'active' && '🔄 Activo'}
                  {assignment.status === 'completed' && '✅ Completado'}
                </span>
                <button 
                  className="remove-assignment-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveAssignment(assignment.userId || selectedUserForAssignment?.uid, assignment.projectId)
                  }}
                  title="Remover asignación"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const stats = getStats()
  const filteredUsers = getFilteredUsers()

  if (loading) {
    return (
      <div className="user-management-container">
        <div className="loading-state">
          <div className="loading-icon">⏳</div>
          <h3>Cargando usuarios...</h3>
          <p>Obteniendo información de asignaciones</p>
        </div>
      </div>
    )
  }

  return (
    <div className="user-management-container">
      {/* Partículas flotantes */}
      <div className="floating-particle"></div>
      <div className="floating-particle"></div>
      <div className="floating-particle"></div>
      <div className="floating-particle"></div>
      <div className="floating-particle"></div>

      {/* Header */}
      <div className="user-header">
        <div className="header-left">
          <button className="back-button" onClick={onBack}>
            ← Volver
          </button>
          <div className="header-content">
            <h1>👥 Gestión de Usuarios</h1>
            <p>Administra solicitudes, usuarios y asignaciones de proyectos</p>
          </div>
        </div>
        
        <div className="header-actions">
          <input
            type="text"
            placeholder="🔍 Buscar usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button className="refresh-button" onClick={handleRefresh}>
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* Dashboard de estadísticas */}
      <div className="stats-dashboard">
        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">Pendientes</div>
        </div>
        
        <div className="stat-card active">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{stats.active}</div>
          <div className="stat-label">Activos</div>
        </div>
        
        <div className="stat-card projects">
          <div className="stat-icon">📋</div>
          <div className="stat-value">{stats.assigned}</div>
          <div className="stat-label">Con Proyectos</div>
        </div>
        
        <div className="stat-card total">
          <div className="stat-icon">👤</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Usuarios</div>
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="user-tabs">
        <button 
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          👥 Todos ({stats.total})
        </button>
        
        <button 
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          ⏳ Pendientes ({stats.pending})
        </button>
        
        <button 
          className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          ✅ Activos ({stats.active})
        </button>

        <button 
          className={`tab-button ${activeTab === 'assigned' ? 'active' : ''}`}
          onClick={() => setActiveTab('assigned')}
        >
          📋 Con Proyectos ({stats.assigned})
        </button>
      </div>

      {/* Lista de usuarios */}
      <div className="users-grid">
        {filteredUsers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <h3 className="empty-title">No hay usuarios</h3>
            <p className="empty-description">
              {searchTerm 
                ? `No se encontraron usuarios que coincidan con "${searchTerm}"`
                : 'No hay usuarios disponibles en esta categoría'
              }
            </p>
          </div>
        ) : (
          filteredUsers.map(userData => (
            <div key={userData.uid} className={`user-card ${userData.status?.toLowerCase() || 'unknown'}`}>
              {/* Avatar y info básica */}
              <div className="user-header">
                <div className="user-avatar">
                  <span className="avatar-text">
                    {getInitials(userData.fullName)}
                  </span>
                </div>
                <div className="user-basic-info">
                  <h3 className="user-name">{userData.fullName || 'Sin nombre'}</h3>
                  <p className="user-email">{userData.email}</p>
                  <span className={`user-status ${userData.status?.toLowerCase() || 'unknown'}`}>
                    {userData.status === 'PENDING' && '⏳ Pendiente'}
                    {userData.status === 'APPROVED' && '✅ Aprobado'}
                    {userData.status === 'REJECTED' && '❌ Rechazado'}
                    {!userData.status && '❓ Sin estado'}
                  </span>
                </div>
              </div>

              {/* Detalles del usuario */}
              <div className="user-details">
                <div className="detail-row">
                  <span className="detail-label">Registrado:</span>
                  <span className="detail-value">{formatDate(userData.createdAt)}</span>
                </div>
                
                {userData.role && (
                  <div className="detail-row">
                    <span className="detail-label">Rol:</span>
                    <span className="detail-value">{userData.role}</span>
                  </div>
                )}
                
                <div className="detail-row">
                  <span className="detail-label">Proyectos:</span>
                  <span className="detail-value projects-assigned">
                    {userData.assignedProjects?.length || 0}
                  </span>
                </div>
              </div>

              {/* Mostrar asignaciones de proyectos */}
              <ProjectAssignments 
                assignments={userData.assignedProjects?.map(a => ({...a, userId: userData.uid}))} 
              />

              {/* Acciones */}
              <div className="user-actions">
                {userData.status === 'PENDING' && (
                  <>
                    <button 
                      className="action-button approve"
                      onClick={() => handleApproveUser(userData.uid)}
                    >
                      ✅ Aprobar
                    </button>
                    <button 
                      className="action-button reject"
                      onClick={() => handleRejectUser(userData.uid)}
                    >
                      ❌ Rechazar
                    </button>
                  </>
                )}
                
                {userData.status === 'APPROVED' && (
                  <button 
                    className="action-button assign"
                    onClick={() => handleAssignProject(userData.uid)}
                  >
                    📋 Asignar Proyecto
                  </button>
                )}
                
                <button 
                  className="action-button view"
                  onClick={() => handleViewProfile(userData.uid)}
                >
                  👁️ Ver Perfil
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de asignación */}
      <AssignmentModal
        user={selectedUserForAssignment}
        isOpen={showAssignmentModal}
        onAssign={handleCreateAssignment}
        onClose={() => {
          setShowAssignmentModal(false)
          setSelectedUserForAssignment(null)
        }}
      />
    </div>
  )
}

export default UserManagement