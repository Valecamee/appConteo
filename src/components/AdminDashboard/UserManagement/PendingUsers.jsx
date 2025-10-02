// src/components/AdminDashboard/UserManagement/PendingUsers.jsx
import React, { useState, useEffect } from 'react'
import './PendingUsers.css'

const PendingUsers = ({ onBack, onApprove, onReject, onViewProfile }) => {
  const [pendingUsers, setPendingUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [selectedUsers, setSelectedUsers] = useState([])

  // Datos mock de usuarios pendientes
  const mockPendingUsers = [
    {
      uid: 'pending1',
      fullName: 'Carlos Rodríguez Méndez',
      email: 'carlos.rodriguez@email.com',
      createdAt: new Date('2024-01-22'),
      requestReason: 'Trabajo en empresa de análisis de tráfico',
      experience: 'Nuevo en conteo vehicular',
      location: 'Medellín, Antioquia',
      phone: '+57 300 456 7890',
      waitingDays: 2
    },
    {
      uid: 'pending2',
      fullName: 'Ana María López',
      email: 'ana.lopez@email.com',
      createdAt: new Date('2024-01-21'),
      requestReason: 'Estudiante de ingeniería civil, tesis sobre movilidad',
      experience: '1 año de experiencia en estudios de tráfico',
      location: 'Bogotá, Cundinamarca',
      phone: '+57 310 789 1234',
      waitingDays: 3
    },
    {
      uid: 'pending3',
      fullName: 'Miguel Torres Silva',
      email: 'miguel.torres@email.com',
      createdAt: new Date('2024-01-20'),
      requestReason: 'Consultor independiente en movilidad urbana',
      experience: '5 años en análisis de tráfico',
      location: 'Cali, Valle del Cauca',
      phone: '+57 320 555 6789',
      waitingDays: 4
    },
    {
      uid: 'pending4',
      fullName: 'Laura Pérez Gómez',
      email: 'laura.perez@email.com',
      createdAt: new Date('2024-01-19'),
      requestReason: 'Trabajo en secretaría de movilidad municipal',
      experience: '2 años en conteos manuales',
      location: 'Barranquilla, Atlántico',
      phone: '+57 301 234 5678',
      waitingDays: 5
    },
    {
      uid: 'pending5',
      fullName: 'David Hernández Cruz',
      email: 'david.hernandez@email.com',
      createdAt: new Date('2024-01-18'),
      requestReason: 'Estudiante de maestría en transporte',
      experience: 'Experiencia académica en simulación',
      location: 'Bucaramanga, Santander',
      phone: '+57 315 876 5432',
      waitingDays: 6
    }
  ]

  useEffect(() => {
    loadPendingUsers()
  }, [])

  const loadPendingUsers = () => {
    setLoading(true)
    setTimeout(() => {
      setPendingUsers(mockPendingUsers)
      setLoading(false)
    }, 1000)
  }

  // Filtrar y ordenar usuarios
  const getFilteredUsers = () => {
    let filtered = pendingUsers

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Ordenar
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        break
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        break
      case 'name':
        filtered.sort((a, b) => a.fullName.localeCompare(b.fullName))
        break
      case 'waiting':
        filtered.sort((a, b) => b.waitingDays - a.waitingDays)
        break
      default:
        break
    }

    return filtered
  }

  // Manejar selección de usuarios
  const handleUserSelect = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    const filtered = getFilteredUsers()
    if (selectedUsers.length === filtered.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filtered.map(user => user.uid))
    }
  }

  // Acciones en lote
  const handleBulkApprove = () => {
    if (selectedUsers.length === 0) return
    
    const confirmed = window.confirm(
      `¿Estás seguro de aprobar ${selectedUsers.length} usuario(s) seleccionado(s)?`
    )
    
    if (confirmed) {
      selectedUsers.forEach(userId => {
        const user = pendingUsers.find(u => u.uid === userId)
        if (user && onApprove) {
          onApprove(userId)
        }
      })
      
      // Remover usuarios aprobados de la lista
      setPendingUsers(prev => prev.filter(user => !selectedUsers.includes(user.uid)))
      setSelectedUsers([])
      
      console.log('Usuarios aprobados en lote:', selectedUsers)
    }
  }

  const handleBulkReject = () => {
    if (selectedUsers.length === 0) return
    
    const reason = window.prompt('Motivo del rechazo en lote (opcional):')
    if (reason !== null) {
      selectedUsers.forEach(userId => {
        const user = pendingUsers.find(u => u.uid === userId)
        if (user && onReject) {
          onReject(userId, reason)
        }
      })
      
      // Remover usuarios rechazados de la lista
      setPendingUsers(prev => prev.filter(user => !selectedUsers.includes(user.uid)))
      setSelectedUsers([])
      
      console.log('Usuarios rechazados en lote:', selectedUsers, 'Motivo:', reason)
    }
  }

  // Acciones individuales
  const handleApproveUser = (userId) => {
    if (window.confirm('¿Estás seguro de aprobar este usuario?')) {
      setPendingUsers(prev => prev.filter(user => user.uid !== userId))
      if (onApprove) onApprove(userId)
      console.log('Usuario aprobado:', userId)
    }
  }

  const handleRejectUser = (userId) => {
    const reason = window.prompt('Motivo del rechazo (opcional):')
    if (reason !== null) {
      setPendingUsers(prev => prev.filter(user => user.uid !== userId))
      if (onReject) onReject(userId, reason)
      console.log('Usuario rechazado:', userId, 'Motivo:', reason)
    }
  }

  const handleViewUser = (userId) => {
    if (onViewProfile) onViewProfile(userId)
    console.log('Ver perfil de usuario pendiente:', userId)
  }

  // Obtener iniciales
  const getInitials = (name) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  // Formatear fecha
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const filteredUsers = getFilteredUsers()

  if (loading) {
    return (
      <div className="pending-users-container">
        <div className="empty-pending">
          <div className="empty-pending-icon">⏳</div>
          <h3 className="empty-pending-title">Cargando solicitudes...</h3>
          <p className="empty-pending-description">Obteniendo usuarios pendientes de aprobación</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pending-users-container">
      {/* Partículas flotantes */}
      <div className="floating-particle"></div>
      <div className="floating-particle"></div>
      <div className="floating-particle"></div>

      {/* Header especializado */}
      <div className="pending-header">
        <div className="header-left">
          <button className="back-button" onClick={onBack}>
            ← Volver
          </button>
          <div className="header-content">
            <h1>⏳ Solicitudes Pendientes</h1>
            <p>Gestiona las solicitudes de acceso al sistema</p>
          </div>
        </div>
        
        <div className="pending-count">
          <span>🔔</span>
          <span>{filteredUsers.length} pendiente(s)</span>
        </div>
      </div>

      {/* Controles y filtros */}
      <div className="pending-controls">
        <div className="controls-left">
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, email o ubicación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="newest">🕒 Más recientes</option>
            <option value="oldest">📅 Más antiguos</option>
            <option value="name">🔤 Por nombre</option>
            <option value="waiting">⏰ Más tiempo esperando</option>
          </select>
        </div>

        <div className="controls-right">
          <button 
            className="bulk-action-btn approve-all"
            onClick={handleBulkApprove}
            disabled={selectedUsers.length === 0}
          >
            ✅ Aprobar Seleccionados ({selectedUsers.length})
          </button>
          
          <button 
            className="bulk-action-btn reject-all"
            onClick={handleBulkReject}
            disabled={selectedUsers.length === 0}
          >
            ❌ Rechazar Seleccionados ({selectedUsers.length})
          </button>
          
          <button 
            className="bulk-action-btn approve-all"
            onClick={handleSelectAll}
          >
            {selectedUsers.length === filteredUsers.length ? '❌ Deseleccionar Todo' : '✅ Seleccionar Todo'}
          </button>
        </div>
      </div>

      {/* Grid de usuarios pendientes */}
      {filteredUsers.length === 0 ? (
        <div className="empty-pending">
          <div className="empty-pending-icon">🎉</div>
          <h3 className="empty-pending-title">
            {searchTerm ? 'Sin resultados' : '¡Todas las solicitudes procesadas!'}
          </h3>
          <p className="empty-pending-description">
            {searchTerm 
              ? `No se encontraron usuarios que coincidan con "${searchTerm}"`
              : 'No hay usuarios pendientes de aprobación en este momento'
            }
          </p>
        </div>
      ) : (
        <div className="pending-grid">
          {filteredUsers.map((user) => (
            <div key={user.uid} className="pending-user-card">
              {/* Checkbox de selección */}
              <input
                type="checkbox"
                className="card-checkbox"
                checked={selectedUsers.includes(user.uid)}
                onChange={() => handleUserSelect(user.uid)}
              />

              {/* Header de la card */}
              <div className="pending-card-header">
                <div className="pending-user-info">
                  <h3 className="pending-user-name">{user.fullName}</h3>
                  <p className="pending-user-email">{user.email}</p>
                  <span className="pending-badge">
                    ⏳ Esperando {user.waitingDays} día(s)
                  </span>
                </div>
                
                <div className="pending-avatar">
                  {getInitials(user.fullName)}
                </div>
              </div>

              {/* Detalles del usuario */}
              <div className="pending-details">
                <div className="detail-row">
                  <span className="detail-label">📅 Solicitud:</span>
                  <span className="detail-value">{formatDate(user.createdAt)}</span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">📍 Ubicación:</span>
                  <span className="detail-value">{user.location}</span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">📞 Teléfono:</span>
                  <span className="detail-value">{user.phone}</span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">💼 Experiencia:</span>
                  <span className="detail-value">{user.experience}</span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">⏰ Tiempo esperando:</span>
                  <span className="detail-value waiting-time">{user.waitingDays} día(s)</span>
                </div>
              </div>

              {/* Motivo de solicitud */}
              <div className="pending-details">
                <div className="detail-row">
                  <span className="detail-label">💬 Motivo:</span>
                </div>
                <div style={{ 
                  marginTop: '8px', 
                  padding: '10px', 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  color: 'rgba(255, 255, 255, 0.8)',
                  lineHeight: '1.4'
                }}>
                  {user.requestReason}
                </div>
              </div>

              {/* Acciones */}
              <div className="pending-actions">
                <button 
                  className="pending-action-btn approve"
                  onClick={() => handleApproveUser(user.uid)}
                >
                  ✅ Aprobar
                </button>
                
                <button 
                  className="pending-action-btn reject"
                  onClick={() => handleRejectUser(user.uid)}
                >
                  ❌ Rechazar
                </button>
                
                <button 
                  className="pending-action-btn view"
                  onClick={() => handleViewUser(user.uid)}
                >
                  👁️ Ver Perfil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PendingUsers