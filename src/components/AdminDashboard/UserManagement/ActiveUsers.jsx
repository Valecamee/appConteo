// src/components/AdminDashboard/UserManagement/ActiveUsers.jsx
import React, { useState, useEffect } from 'react'
import './ActiveUsers.css'

const ActiveUsers = ({ onBack, onAssignProject, onViewProfile, onSendMessage }) => {
  const [activeUsers, setActiveUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('performance')
  const [filterBy, setFilterBy] = useState('all')

  // Datos mock de usuarios activos con métricas
  const mockActiveUsers = [
    {
      uid: 'active1',
      fullName: 'Ana María González',
      email: 'ana.gonzalez@email.com',
      lastActive: new Date('2024-01-24T15:30:00'),
      isOnline: true,
      efficiency: 96,
      productivity: 88,
      tasksCompleted: 45,
      projectsActive: 2,
      rating: 4.8,
      level: 7,
      experience: 'Experta',
      totalHours: 320,
      streak: 12,
      badges: ['online', 'expert'],
      projects: [
        { id: 1, name: 'Centro Comercial - Conteo', progress: 85, status: 'active' },
        { id: 2, name: 'Av. Principal - Análisis', progress: 60, status: 'active' }
      ],
      location: 'Medellín, Antioquia'
    },
    {
      uid: 'active2',
      fullName: 'Carlos Rodríguez Silva',
      email: 'carlos.rodriguez@email.com',
      lastActive: new Date('2024-01-24T14:45:00'),
      isOnline: true,
      efficiency: 92,
      productivity: 85,
      tasksCompleted: 38,
      projectsActive: 3,
      rating: 4.6,
      level: 5,
      experience: 'Avanzado',
      totalHours: 280,
      streak: 8,
      badges: ['online', 'productive'],
      projects: [
        { id: 3, name: 'Terminal Norte - Buses', progress: 75, status: 'active' },
        { id: 4, name: 'Intersección Centro', progress: 40, status: 'active' },
        { id: 5, name: 'Zona Peatonal', progress: 90, status: 'active' }
      ],
      location: 'Bogotá, Cundinamarca'
    },
    {
      uid: 'active3',
      fullName: 'Laura Pérez Martínez',
      email: 'laura.perez@email.com',
      lastActive: new Date('2024-01-24T13:20:00'),
      isOnline: false,
      efficiency: 89,
      productivity: 82,
      tasksCompleted: 32,
      projectsActive: 1,
      rating: 4.5,
      level: 4,
      experience: 'Intermedio',
      totalHours: 195,
      streak: 5,
      badges: ['productive'],
      projects: [
        { id: 6, name: 'Av. Poblado - Tarde', progress: 55, status: 'active' }
      ],
      location: 'Cali, Valle del Cauca'
    },
    {
      uid: 'active4',
      fullName: 'Miguel Torres López',
      email: 'miguel.torres@email.com',
      lastActive: new Date('2024-01-24T16:10:00'),
      isOnline: true,
      efficiency: 94,
      productivity: 90,
      tasksCompleted: 52,
      projectsActive: 2,
      rating: 4.9,
      level: 8,
      experience: 'Experto',
      totalHours: 410,
      streak: 15,
      badges: ['online', 'expert'],
      projects: [
        { id: 7, name: 'Autopista Sur - Análisis', progress: 95, status: 'active' },
        { id: 8, name: 'Plaza Principal', progress: 30, status: 'active' }
      ],
      location: 'Barranquilla, Atlántico'
    },
    {
      uid: 'active5',
      fullName: 'Diana Silva Romero',
      email: 'diana.silva@email.com',
      lastActive: new Date('2024-01-24T11:50:00'),
      isOnline: false,
      efficiency: 87,
      productivity: 79,
      tasksCompleted: 28,
      projectsActive: 1,
      rating: 4.3,
      level: 3,
      experience: 'Principiante',
      totalHours: 145,
      streak: 3,
      badges: [],
      projects: [
        { id: 9, name: 'Zona Universitaria', progress: 25, status: 'active' }
      ],
      location: 'Bucaramanga, Santander'
    }
  ]

  useEffect(() => {
    loadActiveUsers()
  }, [])

  const loadActiveUsers = () => {
    setLoading(true)
    setTimeout(() => {
      setActiveUsers(mockActiveUsers)
      setLoading(false)
    }, 1000)
  }

  // Calcular métricas generales
  const getGeneralMetrics = () => {
    const onlineUsers = activeUsers.filter(u => u.isOnline).length
    const avgEfficiency = Math.round(activeUsers.reduce((sum, u) => sum + u.efficiency, 0) / activeUsers.length)
    const avgProductivity = Math.round(activeUsers.reduce((sum, u) => sum + u.productivity, 0) / activeUsers.length)
    const totalProjects = activeUsers.reduce((sum, u) => sum + u.projectsActive, 0)
    
    return {
      onlineUsers,
      avgEfficiency: avgEfficiency || 0,
      avgProductivity: avgProductivity || 0,
      totalProjects,
      totalUsers: activeUsers.length
    }
  }

  // Filtrar y ordenar usuarios
  const getFilteredUsers = () => {
    let filtered = activeUsers

    // Filtrar por estado
    switch (filterBy) {
      case 'online':
        filtered = filtered.filter(user => user.isOnline)
        break
      case 'offline':
        filtered = filtered.filter(user => !user.isOnline)
        break
      case 'high-performers':
        filtered = filtered.filter(user => user.efficiency >= 90)
        break
      case 'experts':
        filtered = filtered.filter(user => user.badges.includes('expert'))
        break
      default:
        break
    }

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
      case 'performance':
        filtered.sort((a, b) => b.efficiency - a.efficiency)
        break
      case 'productivity':
        filtered.sort((a, b) => b.productivity - a.productivity)
        break
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating)
        break
      case 'tasks':
        filtered.sort((a, b) => b.tasksCompleted - a.tasksCompleted)
        break
      case 'name':
        filtered.sort((a, b) => a.fullName.localeCompare(b.fullName))
        break
      case 'level':
        filtered.sort((a, b) => b.level - a.level)
        break
      default:
        break
    }

    return filtered
  }

  // Acciones
  const handleAssignProject = (userId) => {
    const user = activeUsers.find(u => u.uid === userId)
    if (onAssignProject) onAssignProject(userId)
    console.log('Asignar proyecto a:', user?.fullName)
  }

  const handleViewProfile = (userId) => {
    if (onViewProfile) onViewProfile(userId)
    console.log('Ver perfil de usuario activo:', userId)
  }

  const handleSendMessage = (userId) => {
    const user = activeUsers.find(u => u.uid === userId)
    if (onSendMessage) onSendMessage(userId)
    console.log('Enviar mensaje a:', user?.fullName)
  }

  const handleBulkAssign = () => {
    console.log('Asignar proyecto en lote a usuarios seleccionados')
    alert('Funcionalidad de asignación en lote - En desarrollo')
  }

  const handleExportData = () => {
    console.log('Exportar datos de usuarios activos')
    alert('Exportando datos de rendimiento...')
  }

  // Utilidades
  const getInitials = (name) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatLastActive = (date) => {
    const now = new Date()
    const diffMinutes = Math.floor((now - new Date(date)) / (1000 * 60))
    
    if (diffMinutes < 5) return 'Ahora'
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`
    if (diffMinutes < 1440) return `Hace ${Math.floor(diffMinutes / 60)} h`
    return `Hace ${Math.floor(diffMinutes / 1440)} días`
  }

  const getBadgeIcon = (badge) => {
    switch (badge) {
      case 'online': return '🟢'
      case 'expert': return '🏆'
      case 'productive': return '⚡'
      default: return '🎯'
    }
  }

  const getBadgeLabel = (badge) => {
    switch (badge) {
      case 'online': return 'En línea'
      case 'expert': return 'Experto'
      case 'productive': return 'Productivo'
      default: return badge
    }
  }

  const metrics = getGeneralMetrics()
  const filteredUsers = getFilteredUsers()

  if (loading) {
    return (
      <div className="active-users-container">
        <div className="empty-active">
          <div className="empty-active-icon">⏳</div>
          <h3 className="empty-active-title">Cargando usuarios activos...</h3>
          <p className="empty-active-description">Obteniendo métricas de rendimiento</p>
        </div>
      </div>
    )
  }

  return (
    <div className="active-users-container">
      {/* Partículas flotantes */}
      <div className="floating-particle"></div>
      <div className="floating-particle"></div>
      <div className="floating-particle"></div>

      {/* Header especializado */}
      <div className="active-header">
        <div className="header-left">
          <button className="back-button" onClick={onBack}>
            ← Volver
          </button>
          <div className="header-content">
            <h1>✅ Usuarios Activos</h1>
            <p>Monitorea el rendimiento y productividad del equipo</p>
          </div>
        </div>
        
        <div className="active-count">
          <span>👥</span>
          <span>{filteredUsers.length} activo(s)</span>
        </div>
      </div>

      {/* Métricas de rendimiento */}
      <div className="performance-metrics">
        <div className="metric-card efficiency">
          <div className="metric-icon">📊</div>
          <div className="metric-value">{metrics.avgEfficiency}%</div>
          <div className="metric-label">Eficiencia Promedio</div>
        </div>
        
        <div className="metric-card productivity">
          <div className="metric-icon">⚡</div>
          <div className="metric-value">{metrics.avgProductivity}%</div>
          <div className="metric-label">Productividad</div>
        </div>
        
        <div className="metric-card online">
          <div className="metric-icon">🟢</div>
          <div className="metric-value">{metrics.onlineUsers}</div>
          <div className="metric-label">En Línea</div>
        </div>
        
        <div className="metric-card projects">
          <div className="metric-icon">📋</div>
          <div className="metric-value">{metrics.totalProjects}</div>
          <div className="metric-label">Proyectos Activos</div>
        </div>
        
        <div className="metric-card average">
          <div className="metric-icon">👤</div>
          <div className="metric-value">{metrics.totalUsers}</div>
          <div className="metric-label">Total Activos</div>
        </div>
      </div>

      {/* Controles y filtros */}
      <div className="active-controls">
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
            <option value="performance">📊 Por eficiencia</option>
            <option value="productivity">⚡ Por productividad</option>
            <option value="rating">⭐ Por calificación</option>
            <option value="tasks">✅ Por tareas completadas</option>
            <option value="level">🏆 Por nivel</option>
            <option value="name">🔤 Por nombre</option>
          </select>
          
          <select 
            value={filterBy} 
            onChange={(e) => setFilterBy(e.target.value)}
            className="filter-select"
          >
            <option value="all">👥 Todos</option>
            <option value="online">🟢 En línea</option>
            <option value="offline">⚫ Desconectados</option>
            <option value="high-performers">🏆 Alto rendimiento (90%+)</option>
            <option value="experts">👑 Expertos</option>
          </select>
        </div>

        <div className="controls-right">
          <button className="action-btn assign" onClick={handleBulkAssign}>
            📋 Asignar Proyecto
          </button>
          
          <button className="action-btn export" onClick={handleExportData}>
            📊 Exportar Datos
          </button>
        </div>
      </div>

      {/* Grid de usuarios activos */}
      {filteredUsers.length === 0 ? (
        <div className="empty-active">
          <div className="empty-active-icon">🔍</div>
          <h3 className="empty-active-title">
            {searchTerm ? 'Sin resultados' : 'No hay usuarios activos'}
          </h3>
          <p className="empty-active-description">
            {searchTerm 
              ? `No se encontraron usuarios que coincidan con "${searchTerm}"`
              : 'No hay usuarios activos que coincidan con los filtros seleccionados'
            }
          </p>
        </div>
      ) : (
        <div className="active-grid">
          {filteredUsers.map((user) => (
            <div key={user.uid} className="active-user-card">
              {/* Header de la card */}
              <div className="active-card-header">
                <div className="active-user-info">
                  <h3 className="active-user-name">{user.fullName}</h3>
                  <p className="active-user-email">{user.email}</p>
                  
                  <div className="active-badges">
                    {user.badges.map((badge, index) => (
                      <span key={index} className={`active-badge ${badge}`}>
                        {getBadgeIcon(badge)} {getBadgeLabel(badge)}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="active-avatar">
                  {getInitials(user.fullName)}
                  {user.isOnline && <div className="online-indicator"></div>}
                </div>
              </div>

              {/* Métricas de rendimiento */}
              <div className="user-performance">
                <div className="performance-item">
                  <div className="performance-value">{user.efficiency}%</div>
                  <div className="performance-label">Eficiencia</div>
                </div>
                <div className="performance-item">
                  <div className="performance-value">{user.productivity}%</div>
                  <div className="performance-label">Productividad</div>
                </div>
                <div className="performance-item">
                  <div className="performance-value">{user.level}</div>
                  <div className="performance-label">Nivel</div>
                </div>
                <div className="performance-item">
                  <div className="performance-value">{user.rating}</div>
                  <div className="performance-label">Rating</div>
                </div>
              </div>

              {/* Proyectos activos */}
              <div className="active-projects">
                <div className="projects-header">
                  <span className="projects-title">📋 Proyectos Activos</span>
                  <span className="projects-count">{user.projectsActive} proyecto(s)</span>
                </div>
                
                <div className="project-list">
                  {user.projects.slice(0, 2).map((project) => (
                    <div key={project.id} className="project-item">
                      <div className="project-name">{project.name}</div>
                      <div className="project-progress">
                        <span>{project.progress}%</span>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <span className="progress-text">Progreso</span>
                      </div>
                    </div>
                  ))}
                  
                  {user.projects.length > 2 && (
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: 'rgba(255, 255, 255, 0.7)', 
                      textAlign: 'center',
                      padding: '5px'
                    }}>
                      +{user.projects.length - 2} proyecto(s) más
                    </div>
                  )}
                </div>
              </div>

              {/* Información adicional */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontSize: '0.8rem', 
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '15px',
                padding: '8px 0',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <span>📍 {user.location}</span>
                <span>🕒 {formatLastActive(user.lastActive)}</span>
              </div>

              {/* Acciones */}
              <div className="active-actions">
                <button 
                  className="active-action-btn assign"
                  onClick={() => handleAssignProject(user.uid)}
                >
                  📋 Asignar
                </button>
                
                <button 
                  className="active-action-btn view"
                  onClick={() => handleViewProfile(user.uid)}
                >
                  👁️ Ver Perfil
                </button>
                
                <button 
                  className="active-action-btn message"
                  onClick={() => handleSendMessage(user.uid)}
                >
                  💬 Mensaje
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ActiveUsers