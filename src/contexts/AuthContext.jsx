import React, { createContext, useState, useEffect, useContext } from 'react'
import { authService } from '../services/authService'
import { NavigationContext } from './NavigationContext'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [adminExists, setAdminExists] = useState(null)
  
  // Obtener la función de navegación del NavigationContext
  const navigationContext = useContext(NavigationContext)
  const navigateTo = navigationContext?.navigateTo

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (currentUser) => {
      console.log('🔄 AuthContext: Usuario detectado:', currentUser)
      setUser(currentUser)
      
      if (currentUser) {
        console.log('👤 AuthContext: Usuario autenticado, rol:', currentUser.role)
        if (currentUser.role === 'ADMIN') {
          setAdminExists(true)
          authService.markAdminExists()
          console.log('🛡️ AuthContext: Navegando a admin-dashboard')
          if (navigateTo) navigateTo('admin-dashboard')
        } else if (currentUser.isPending) {
          console.log('⏳ AuthContext: Navegando a pending-approval')
          if (navigateTo) navigateTo('pending-approval')
        } else if (currentUser.isRejected) {
          console.log('❌ AuthContext: Usuario rechazado, manteniendo en login')
          // No navegar, mantener en login para mostrar error
        } else {
          console.log('✅ AuthContext: Navegando a dashboard')
          if (navigateTo) navigateTo('dashboard')
        }
      } else {
        console.log('🚪 AuthContext: Usuario no autenticado')
        // Usuario no autenticado, verificar si existe admin
        try {
          const hasAdmin = await authService.checkIfAdminExists()
          setAdminExists(hasAdmin)
          
          if (!hasAdmin) {
            console.log('🔧 AuthContext: Navegando a admin-setup')
            if (navigateTo) navigateTo('admin-setup')
          } else {
            console.log('🔑 AuthContext: Navegando a login')
            if (navigateTo) navigateTo('login')
          }
        } catch (error) {
          console.error('Error verificando admin:', error)
          // En caso de error, asumir que hay admin para evitar loops
          setAdminExists(true)
          if (navigateTo) navigateTo('login')
        }
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, []) // Remover navigateTo de las dependencias

  const handleLoginSuccess = (userData) => {
    console.log('🎯 AuthContext: handleLoginSuccess llamado con:', userData)
    setUser(userData)
    
    // Navegar según el rol del usuario
    if (userData.role === 'ADMIN') {
      console.log('🛡️ AuthContext: handleLoginSuccess - Navegando a admin-dashboard')
      if (navigateTo) navigateTo('admin-dashboard')
    } else if (userData.isPending) {
      console.log('⏳ AuthContext: handleLoginSuccess - Navegando a pending-approval')
      if (navigateTo) navigateTo('pending-approval')
    } else if (userData.isRejected) {
      console.log('❌ AuthContext: handleLoginSuccess - Usuario rechazado, manteniendo en login')
      // No navegar, mantener en login para mostrar error
    } else {
      console.log('✅ AuthContext: handleLoginSuccess - Navegando a dashboard')
      if (navigateTo) navigateTo('dashboard')
    }
  }

  const handleLogout = async () => {
    try {
      await authService.logout()
      setUser(null)
      if (navigateTo) navigateTo('login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  const handleAdminCreated = (adminUser) => {
    setUser(adminUser)
    setAdminExists(true)
    authService.markAdminExists()
    if (navigateTo) navigateTo('admin-dashboard')
  }

  const clearAdminCache = () => {
    authService.clearAdminCache()
    window.location.reload()
  }

  const forceCheckAdmin = async () => {
    try {
      const hasAdmin = await authService.forceCheckAdmin()
      setAdminExists(hasAdmin)
      return hasAdmin
    } catch (error) {
      console.error('Error forzando verificación de admin:', error)
      return true // Asumir que hay admin en caso de error
    }
  }

  const value = {
    user,
    loading,
    adminExists,
    handleLoginSuccess,
    handleLogout,
    handleAdminCreated,
    clearAdminCache,
    forceCheckAdmin
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
