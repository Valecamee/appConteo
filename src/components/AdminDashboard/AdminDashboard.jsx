// src/components/AdminDashboard/AdminDashboard.jsx
import React, { useState, useEffect } from 'react'
import './AdminDashboard.css'
import { userService } from '../../services/userService'
import { projectService } from '../../services/projectService'

const AdminDashboard = ({ user, onLogout, onNavigateToProjects, onNavigateToUsers }) => {
  // Estados para estadísticas (estos vendrían de la base de datos)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 8, // Este lo dejamos así por ahora
    activeUsers: 0,
    pendingRequests: 0
  })

  // Estado para notificaciones
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'pending',
      text: '3 nuevas solicitudes de registro pendientes',
      time: 'Hace 5 minutos',
      icon: '⏳'
    },
    {
      id: 2,
      type: 'completed',
      text: 'Proyecto "Centro Ciudad" completado al 85%',
      time: 'Hace 1 hora',
      icon: '🎯'
    },
    {
      id: 3,
      type: 'alert',
      text: 'Usuario "María López" necesita nueva asignación',
      time: 'Hace 2 horas',
      icon: '⚠️'
    },
    {
      id: 4,
      type: 'completed',
      text: '12 conteos completados hoy',
      time: 'Hace 3 horas',
      icon: '✅'
    }
  ])

  // Simular carga de datos (esto se conectaría con Firebase)
  useEffect(() => {
    // Aquí cargarías las estadísticas reales desde Firebase
    loadStats()
    loadNotifications()
  }, [])

  const loadStats = async () => {
    try {
    console.log('📊 Cargando estadísticas reales...')
    
    // Cargar estadísticas de usuarios
    const userStats = await userService.getUserStats()
    
    // Cargar estadísticas de proyectos
    const projectStats = await projectService.getProjectStats(user.uid)
    
    setStats(prev => ({
      totalUsers: userStats.totalUsers,
      totalProjects: projectStats.totalProjects,
      activeUsers: userStats.activeUsers,
      pendingRequests: userStats.pendingUsers
    }))
    
    console.log('✅ Estadísticas cargadas')
    } catch (error) {
      console.error('❌ Error cargando estadísticas:', error)
    }
  }

  const loadNotifications = async () => {
    // TODO: Conectar con Firebase para obtener notificaciones reales
    // const realNotifications = await adminService.getNotifications()
    // setNotifications(realNotifications)
  }

  const handleNotificationsClick = () => {
    // TODO: Implementar panel de notificaciones expandido
    console.log('Mostrar todas las notificaciones')
  }

  return (
    <div className="admin-dashboard-container">
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

      {/* Header del Admin */}
      <div className="admin-header">
        <div className="admin-welcome">
          <h1 className="admin-title">🔥 ADMIN CONTROL CENTER</h1>
          <p className="admin-subtitle">
            Bienvenido, <span className="admin-name">{user.fullName || user.email.split('@')[0]}</span>
          </p>
          <p className="admin-role">
            🛡️ <span>Administrador Principal</span>
          </p>
        </div>
        
        <div className="admin-actions">
          <button 
            className="notifications-button"
            onClick={handleNotificationsClick}
            title="Ver notificaciones"
          >
            🔔
            {stats.pendingRequests > 0 && (
              <span className="notification-badge">{stats.pendingRequests}</span>
            )}
          </button>
          
          <button className="logout-button" onClick={onLogout}>
            🚪 Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="quick-stats">
        <div className="stat-card users">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{stats.totalUsers}</div>
          <div className="stat-label">Usuarios Totales</div>
        </div>
        
        <div className="stat-card projects">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">{stats.totalProjects}</div>
          <div className="stat-label">Proyectos Activos</div>
        </div>
        
        <div className="stat-card active">
          <div className="stat-icon">🟢</div>
          <div className="stat-value">{stats.activeUsers}</div>
          <div className="stat-label">Usuarios Activos</div>
        </div>
        
        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-value">{stats.pendingRequests}</div>
          <div className="stat-label">Solicitudes Pendientes</div>
        </div>
      </div>

      {/* Secciones Principales */}
      <div className="main-sections">
        {/* Sección Proyectos */}
        <div 
          className="section-card projects"
          onClick={onNavigateToProjects}
        >
          <div className="section-icon">🎯</div>
          <h3 className="section-title">Gestión de Proyectos</h3>
          <p className="section-description">
            Crear, editar y gestionar proyectos de conteo. Asignar intersecciones, 
            configurar movimientos y supervisar el progreso.
          </p>
          <span className="section-badge">Proyectos</span>
        </div>

        {/* Sección Usuarios */}
        <div 
          className="section-card users"
          onClick={onNavigateToUsers}
        >
          <div className="section-icon">👥</div>
          <h3 className="section-title">Gestión de Usuarios</h3>
          <p className="section-description">
            Aprobar solicitudes, gestionar usuarios activos, 
            ver historiales de conteo y asignar proyectos.
          </p>
          <span className="section-badge">Usuarios</span>
        </div>
      </div>

      {/* Panel de Notificaciones Recientes */}
      <div className="notifications-panel">
        <h3 className="panel-title">
          🔔 Notificaciones Recientes
        </h3>
        
        {notifications.slice(0, 4).map((notification) => (
          <div 
            key={notification.id} 
            className={`notification-item ${notification.type}`}
          >
            <div className="notification-icon">
              {notification.icon}
            </div>
            <div className="notification-content">
              <div className="notification-text">{notification.text}</div>
              <div className="notification-time">{notification.time}</div>
            </div>
          </div>
        ))}
        
        {notifications.length > 4 && (
          <button 
            className="view-all-notifications"
            onClick={handleNotificationsClick}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '15px',
              cursor: 'pointer',
              width: '100%',
              marginTop: '15px',
              transition: 'all 0.3s ease'
            }}
          >
            Ver todas las notificaciones ({notifications.length - 4} más)
          </button>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard