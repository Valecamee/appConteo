// src/services/authService.js
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/firebase'

export const authService = {
  // Login con email y contraseña
  async login(email, password) {
    try {
      console.log('🔍 Intentando login con email:', email)
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // Obtener datos adicionales del usuario desde Firestore
      const userDoc = await getDoc(doc(db, 'userProfiles', user.uid))
      
      if (userDoc.exists()) {
        return {
          uid: user.uid,
          email: user.email,
          ...userDoc.data()
        }
      } else {
        // Si no hay perfil en Firestore, crear uno básico
        const basicProfile = {
          email: user.email,
          fullName: user.email.split('@')[0], // Usar parte antes del @
          createdAt: new Date()
        }
        
        await setDoc(doc(db, 'userProfiles', user.uid), basicProfile)
        
        return {
          uid: user.uid,
          email: user.email,
          ...basicProfile
        }
      }
    } catch (error) {
      console.error('Error en login:', error)
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error('Email o contraseña incorrectos')
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Demasiados intentos fallidos. Intenta más tarde')
      } else {
        throw new Error('Error al iniciar sesión: ' + error.message)
      }
    }
  },

  // Registrar nuevo usuario
  async register(userData) {
    try {
      const { email, fullName, password } = userData
      
      console.log('🔍 Registrando usuario con email:', email)
      
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // Guardar datos adicionales en Firestore
      const userProfile = {
        email: user.email,
        fullName,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      await setDoc(doc(db, 'userProfiles', user.uid), userProfile)
      
      console.log('✅ Usuario registrado exitosamente')
      
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
            callback({
              uid: user.uid,
              email: user.email,
              ...userDoc.data()
            })
          } else {
            callback({
              uid: user.uid,
              email: user.email,
              fullName: user.email.split('@')[0]
            })
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

  // Obtener usuario actual
  getCurrentUser() {
    return auth.currentUser
  }
}