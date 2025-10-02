// src/services/authService.js - SOLUCIÓN SIN PROBLEMAS DE PERMISOS
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth'
import { doc, setDoc, getDoc, collection, getDocs, query, where } from 'firebase/firestore'
import { auth, db } from '../firebase/firebase'

export const authService = {
  // Login con email y contraseña
  async login(email, password) {
    try {
      console.log('🔐 Intentando login con email:', email)
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // Obtener datos adicionales del usuario desde Firestore
      const userDoc = await getDoc(doc(db, 'userProfiles', user.uid))
      
      if (userDoc.exists()) {
        const userData = {
          uid: user.uid,
          email: user.email,
          ...userDoc.data()
        }
        
        // Verificar si el usuario está aprobado (excepto admin)
        if (userData.role !== 'ADMIN' && userData.status !== 'APPROVED') {
          if (userData.status === 'REJECTED') {
            throw new Error(`Tu cuenta fue rechazada. Razón: ${userData.rejectionReason || 'No especificada'}`)
          } else {
            throw new Error('Tu cuenta está pendiente de aprobación por el administrador')
          }
        }
        
        return userData
      } else {
        throw new Error('Usuario no encontrado en la base de datos')
      }
    } catch (error) {
      console.error('Error en login:', error)
      
      if (error.message.includes('pendiente de aprobación')) {
        throw error
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error('Email o contraseña incorrectos')
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Demasiados intentos fallidos. Intenta más tarde')
      } else {
        throw new Error('Error al iniciar sesión: ' + error.message)
      }
    }
  },

  // Registrar nuevo usuario (siempre como USER pendiente)
  async register(userData) {
    try {
      const { email, fullName, password } = userData
      
      console.log('📝 Registrando usuario con email:', email)
      
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // Guardar datos adicionales en Firestore
      const userProfile = {
        email: user.email,
        fullName,
        role: 'USER', // Siempre USER por defecto
        status: 'PENDING', // Siempre pendiente por defecto
        createdAt: new Date(),
        updatedAt: new Date(),
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null
      }
      
      await setDoc(doc(db, 'userProfiles', user.uid), userProfile)
      
      console.log('✅ Usuario registrado exitosamente (pendiente de aprobación)')
      
      return {
        uid: user.uid,
        ...userProfile
      }
    } catch (error) {
      console.error('Error en registro:', error)
      
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Este email ya está en uso')
      } else if (error.code === 'auth/weak-password') {
        throw new Error('La contraseña debe tener al menos 6 caracteres')
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Email inválido')
      } else {
        throw new Error('Error al registrar usuario: ' + error.message)
      }
    }
  },

  // Crear el primer administrador (función especial)
  async createFirstAdmin(adminData) {
    try {
      const { email, fullName, password, adminKey } = adminData
      
      // Verificar clave de administrador
      if (adminKey !== 'ADMIN_SETUP_2024') {
        throw new Error('Clave de administrador incorrecta')
      }
      
      console.log('🛡️ Creando primer administrador:', email)
      
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // Guardar como administrador
      const adminProfile = {
        email: user.email,
        fullName,
        role: 'ADMIN',
        status: 'APPROVED',
        createdAt: new Date(),
        updatedAt: new Date(),
        approvedBy: 'SYSTEM',
        approvedAt: new Date(),
        isFirstAdmin: true
      }
      
      await setDoc(doc(db, 'userProfiles', user.uid), adminProfile)
      
      console.log('✅ Primer administrador creado exitosamente')
      
      return {
        uid: user.uid,
        ...adminProfile
      }
    } catch (error) {
      console.error('Error creando administrador:', error)
      throw new Error('Error al crear administrador: ' + error.message)
    }
  },

  // Cerrar sesión
  async logout() {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      throw new Error('Error al cerrar sesión')
    }
  },

  // Observar cambios en el estado de autenticación
  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'userProfiles', user.uid))
          if (userDoc.exists()) {
            const userData = {
              uid: user.uid,
              email: user.email,
              ...userDoc.data()
            }
            
            // Verificar estado del usuario
            if (userData.role !== 'ADMIN' && userData.status !== 'APPROVED') {
              // Usuario pendiente o rechazado, mostrar mensaje apropiado
              callback({
                ...userData,
                isPending: userData.status === 'PENDING',
                isRejected: userData.status === 'REJECTED'
              })
            } else {
              callback(userData)
            }
          } else {
            callback(null)
          }
        } catch (error) {
          console.error('Error obteniendo datos del usuario:', error)
          callback(null)
        }
      } else {
        callback(null)
      }
    })
  },

  // ✅ NUEVA FUNCIÓN: Verificar si existe algún administrador
  async checkIfAdminExists() {
    try {
      console.log('🔍 Verificando si existe algún administrador...')
      
      // 🎯 SOLUCIÓN: Usar localStorage para cachear el resultado
      const cachedResult = localStorage.getItem('hasAdmin')
      const cacheTime = localStorage.getItem('hasAdminCacheTime')
      
      // Verificar cache (válido por 5 minutos)
      if (cachedResult && cacheTime) {
        const timeDiff = Date.now() - parseInt(cacheTime)
        if (timeDiff < 5 * 60 * 1000) { // 5 minutos
          console.log('🎯 Usando resultado cacheado:', cachedResult === 'true')
          return cachedResult === 'true'
        }
      }
      
      // 🔥 ESTRATEGIA MEJORADA: Intentar consultar la colección de usuarios
      try {
        const usersRef = collection(db, 'userProfiles')
        const q = query(usersRef, where('role', '==', 'ADMIN'))
        const querySnapshot = await getDocs(q)
        
        const hasAdmin = !querySnapshot.empty
        console.log('✅ Verificación de admin completada:', hasAdmin)
        
        // Cachear el resultado
        localStorage.setItem('hasAdmin', hasAdmin.toString())
        localStorage.setItem('hasAdminCacheTime', Date.now().toString())
        
        return hasAdmin
        
      } catch (firestoreError) {
        console.log('⚠️ Error consultando Firestore, usando cache o fallback')
        
        // Si hay cache válido, usarlo
        if (cachedResult) {
          console.log('🎯 Usando cache como fallback:', cachedResult === 'true')
          return cachedResult === 'true'
        }
        
        // Si no hay cache, asumir que SÍ hay admin para evitar loops
        console.log('🔄 Sin cache y error de Firestore - asumiendo que SÍ hay admin')
        localStorage.setItem('hasAdmin', 'true')
        localStorage.setItem('hasAdminCacheTime', Date.now().toString())
        return true
      }
      
    } catch (error) {
      console.error('Error verificando administradores:', error)
      
      // 🎯 EN CASO DE ERROR: Verificar cache primero
      const cachedResult = localStorage.getItem('hasAdmin')
      if (cachedResult) {
        console.log('🎯 Usando cache en caso de error:', cachedResult === 'true')
        return cachedResult === 'true'
      }
      
      // Si no hay cache, asumir que SÍ hay admin para evitar loops
      console.log('🔄 Sin cache y error general - asumiendo que SÍ hay admin')
      return true
    }
  },

  // ✅ NUEVA FUNCIÓN: Marcar que hay admin después de crear el primero
  markAdminExists() {
    localStorage.setItem('hasAdmin', 'true')
    localStorage.setItem('hasAdminCacheTime', Date.now().toString())
    console.log('✅ Admin marcado como existente en cache')
  },

  // ✅ NUEVA FUNCIÓN: Forzar verificación de admin (limpiar cache)
  async forceCheckAdmin() {
    localStorage.removeItem('hasAdmin')
    localStorage.removeItem('hasAdminCacheTime')
    console.log('🗑️ Cache de admin limpiado, forzando nueva verificación')
    return await this.checkIfAdminExists()
  },

  // ✅ NUEVA FUNCIÓN: Limpiar cache de admin
  clearAdminCache() {
    localStorage.removeItem('hasAdmin')
    localStorage.removeItem('hasAdminCacheTime')
    console.log('🗑️ Cache de admin eliminado')
  },

  // Obtener usuario actual
  getCurrentUser() {
    return auth.currentUser
  }
}