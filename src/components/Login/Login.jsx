// src/components/Login/Login.jsx
import React, { useState } from 'react'
import { authService } from '../../services/authService'
import './Login.css'

const Login = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true) // true = login, false = registro
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    password: '',
    confirmPassword: ''
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
    
    if (isLogin) {
      // Lógica de LOGIN
      if (!formData.email.trim()) {
        setError('Por favor ingresa tu email')
        return
      }
      
      if (!formData.password) {
        setError('Por favor ingresa tu contraseña')
        return
      }

      setLoading(true)
      setError('')

      try {
        const user = await authService.login(formData.email.trim(), formData.password)
        console.log('Login exitoso:', user)
        onLoginSuccess(user)
      } catch (error) {
        console.error('Error en login:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    } else {
      // Lógica de REGISTRO
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

      setLoading(true)
      setError('')

      try {
        const userData = {
          email: formData.email.trim(),
          fullName: formData.fullName.trim(),
          password: formData.password
        }
        
        const user = await authService.register(userData)
        console.log('Registro exitoso:', user)
        onLoginSuccess(user)
      } catch (error) {
        console.error('Error en registro:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setFormData({
      email: '',
      fullName: '',
      password: '',
      confirmPassword: ''
    })
    setError('')
  }

  return (
    <div className="login-container">
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

      <div className="login-card">
        <h1 className="login-title">App Contar</h1>
        <p className="login-subtitle">
          {isLogin ? 'Acceso al Sistema' : 'Crear Nueva Cuenta'}
        </p>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Correo Electrónico
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Ingresa tu correo electrónico"
              className="form-input"
              disabled={loading}
              autoComplete="email"
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="fullName" className="form-label">
                Nombre Completo
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Ingresa tu nombre completo"
                className="form-input"
                disabled={loading}
                autoComplete="name"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Ingresa tu contraseña"
              className="form-input"
              disabled={loading}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirmar Contraseña
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
          )}

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading && <span className="loading-spinner"></span>}
            {loading 
              ? (isLogin ? 'Ingresando...' : 'Registrando...') 
              : (isLogin ? 'Ingresar' : 'Registrarse')
            }
          </button>
        </form>

        <div className="toggle-mode">
          <p className="toggle-text">
            {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
          </p>
          <button 
            type="button"
            className="toggle-button"
            onClick={toggleMode}
            disabled={loading}
          >
            {isLogin ? 'Registrarse' : 'Iniciar Sesión'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login