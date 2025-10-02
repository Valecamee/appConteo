// src/components/AdminSetup/AdminSetup.jsx
import React, { useState } from 'react'
import './AdminSetup.css'

const AdminSetup = ({ onAdminCreated }) => {
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    adminKey: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validaciones
    if (!formData.email.trim()) {
      setError('Por favor ingresa un email')
      return
    }
    
    if (!formData.fullName.trim()) {
      setError('Por favor ingresa tu nombre completo')
      return
    }
    
    if (!formData.password) {
      setError('Por favor ingresa una contraseña')
      return
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (!formData.adminKey) {
      setError('Por favor ingresa la clave de administrador')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { authService } = await import('../../services/authService')
      
      const adminUser = await authService.createFirstAdmin(formData)
      console.log('Administrador creado exitosamente:', adminUser)
      onAdminCreated(adminUser)
    } catch (error) {
      console.error('Error creando administrador:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-setup-container">
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

      <div className="admin-setup-card">
        <div className="setup-header">
          <h1 className="setup-title">🛡️ CONFIGURACIÓN INICIAL</h1>
          <p className="setup-subtitle">
            Crear Primer Administrador
          </p>
          <p className="setup-description">
            No se ha detectado ningún administrador en el sistema. 
            Crea el primer administrador para gestionar la aplicación.
          </p>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="setup-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              📧 Correo Electrónico del Admin
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@empresa.com"
              className="form-input"
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="fullName" className="form-label">
              👤 Nombre Completo
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Administrador Principal"
              className="form-input"
              disabled={loading}
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              🔒 Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Contraseña segura"
              className="form-input"
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              🔒 Confirmar Contraseña
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirma tu contraseña"
              className="form-input"
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="adminKey" className="form-label">
              🗝️ Clave de Administrador
            </label>
            <input
              type="password"
              id="adminKey"
              name="adminKey"
              value={formData.adminKey}
              onChange={handleChange}
              placeholder="Clave especial de administrador"
              className="form-input"
              disabled={loading}
            />
            <small className="form-hint">
              💡 Usa: <code>ADMIN_SETUP_2024</code>
            </small>
          </div>

          <button 
            type="submit" 
            className="setup-button"
            disabled={loading}
          >
            {loading && <span className="loading-spinner"></span>}
            {loading 
              ? 'Creando Administrador...' 
              : '🚀 Crear Administrador'
            }
          </button>
        </form>

        <div className="setup-footer">
          <p className="footer-text">
            ⚠️ Este administrador tendrá control total sobre el sistema
          </p>
        </div>
      </div>
    </div>
  )
}

export default AdminSetup