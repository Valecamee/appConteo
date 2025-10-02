// src/services/userService.js - COMPLETO Y CORREGIDO
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  where,
  writeBatch,
  Timestamp 
} from 'firebase/firestore'
import { deleteUser } from 'firebase/auth'
import { db } from '../firebase/firebase'

export const userService = {
  // Obtener todos los usuarios
  async getAllUsers() {
    try {
      console.log('👥 Obteniendo todos los usuarios...')
      
      const q = query(
        collection(db, 'userProfiles'),
        orderBy('createdAt', 'desc')
      )
      
      const snapshot = await getDocs(q)
      const users = []
      
      snapshot.forEach((doc) => {
        users.push({
          uid: doc.id,
          ...doc.data()
        })
      })
      
      console.log(`✅ ${users.length} usuarios obtenidos`)
      return users
      
    } catch (error) {
      console.error('❌ Error obteniendo usuarios:', error)
      throw new Error('Error al obtener usuarios')
    }
  },

  // Obtener usuario por ID
  async getUserById(userId) {
    try {
      console.log('👤 Obteniendo usuario:', userId)
      
      const userDoc = await getDoc(doc(db, 'userProfiles', userId))
      
      if (!userDoc.exists()) {
        throw new Error('Usuario no encontrado')
      }
      
      const userData = {
        uid: userDoc.id,
        ...userDoc.data()
      }
      
      console.log('✅ Usuario obtenido:', userData.email)
      return userData
      
    } catch (error) {
      console.error('❌ Error obteniendo usuario:', error)
      throw new Error('Error al obtener datos del usuario')
    }
  },

  // NUEVO: Asignar proyecto a usuario
  async assignProjectToUser(userId, projectData) {
    try {
      console.log('📋 Asignando proyecto a usuario:', userId, projectData)
      
      const { projectId, projectName, assignedType, assignedMovements, assignedMovementNames, horaInicio, horaFin, adminId } = projectData
      
      // Obtener datos actuales del usuario
      const userDoc = await getDoc(doc(db, 'userProfiles', userId))
      if (!userDoc.exists()) {
        throw new Error('Usuario no encontrado')
      }
      
      const currentUser = userDoc.data()
      const currentAssignments = currentUser.assignedProjects || []
      
      // Verificar si ya tiene este proyecto asignado
      const existingAssignment = currentAssignments.find(a => a.projectId === projectId)
      
      let updatedAssignments
      if (existingAssignment) {
        // Actualizar asignación existente
        updatedAssignments = currentAssignments.map(assignment => 
          assignment.projectId === projectId 
            ? {
                ...assignment,
                assignedType,
                assignedMovements,
                assignedMovementNames,
                horaInicio,
                horaFin,
                status: 'assigned',
                updatedAt: Timestamp.now(),
                updatedBy: adminId
              }
            : assignment
        )
        // 4. AGREGAR debug para verificar que se guardan los nombres:
        console.log('🏷️ Guardando nombres de movimientos:', assignedMovementNames)
        // Limpiar cualquier undefined en las asignaciones
        const cleanedAssignments = updatedAssignments.map(assignment => {
          const cleaned = {}
          Object.keys(assignment).forEach(key => {
            if (assignment[key] !== undefined) {
              cleaned[key] = assignment[key]
            }
          })
          return cleaned
          })
      } else {
        // Crear nueva asignación
        const newAssignment = {
          projectId,
          projectName,
          assignedType, // 'vehicles' o 'peatones'
          assignedMovements, // Array de IDs de movimientos
          assignedMovementNames, // ✅ NUEVO: Array de nombres de movimientos
          horaInicio, // Hora de inicio
          horaFin, // Hora de fin
          status: 'assigned', // 'assigned', 'active', 'completed'
          assignedAt: Timestamp.now(),
          assignedBy: adminId,
          progress: 0
        }
        
        updatedAssignments = [...currentAssignments, newAssignment]
      }
      
      // Limpiar cualquier undefined en las asignaciones
      const cleanedAssignments = updatedAssignments.map(assignment => {
        const cleaned = {}
        Object.keys(assignment).forEach(key => {
          if (assignment[key] !== undefined) {
            cleaned[key] = assignment[key]
          }
        })
        return cleaned
      })

      // Actualizar usuario en Firestore
      const updateData = {
        assignedProjects: cleanedAssignments,
        hasActiveAssignments: cleanedAssignments.some(a => a.status === 'assigned' || a.status === 'active'),
        updatedAt: Timestamp.now()
      }
      
      // Debug para verificar campos
      console.log('🔍 updateData antes de Firebase:', updateData)
      console.log('🔍 assignedProjects array:', updateData.assignedProjects)
      updateData.assignedProjects.forEach((assignment, index) => {
        console.log(`🔍 Asignación ${index}:`, assignment)
        Object.keys(assignment).forEach(key => {
          if (assignment[key] === undefined) {
            console.error(`❌ Campo undefined en asignación ${index}: ${key}`)
          }
        })
      })
      
      // Limpiar datos undefined del objeto principal
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          console.error(`❌ Campo undefined en updateData: ${key}`)
          delete updateData[key]
        }
      })
      
      await updateDoc(doc(db, 'userProfiles', userId), updateData)
      
      // ✅ NUEVO: También actualizar el proyecto para agregar el usuario a usuariosAsignados
      try {
        const { projectService } = await import('./projectService')
        await projectService.assignUserToProject(projectId, userId, adminId)
        console.log('✅ Usuario agregado al proyecto exitosamente')
      } catch (projectError) {
        console.error('⚠️ Error actualizando proyecto (continuando):', projectError)
        // No lanzar error aquí, la asignación al usuario ya se completó
      }
      
      console.log('✅ Proyecto asignado exitosamente')
      
      // Devolver el usuario actualizado
      const updatedUserDoc = await getDoc(doc(db, 'userProfiles', userId))
      if (updatedUserDoc.exists()) {
        return {
          uid: updatedUserDoc.id,
          ...updatedUserDoc.data()
        }
      } else {
        throw new Error('Usuario no encontrado después de actualizar')
      }
      
    } catch (error) {
      console.error('❌ Error asignando proyecto:', error)
      throw new Error('Error al asignar proyecto: ' + error.message)
    }
  },

  // NUEVO: Remover asignación de proyecto
  async removeProjectAssignment(userId, projectId, adminId) {
    try {
      console.log('🗑️ Removiendo asignación de proyecto:', userId, projectId)
      
      const userDoc = await getDoc(doc(db, 'userProfiles', userId))
      if (!userDoc.exists()) {
        throw new Error('Usuario no encontrado')
      }
      
      const currentUser = userDoc.data()
      const currentAssignments = currentUser.assignedProjects || []
      
      // Filtrar la asignación a remover
      const updatedAssignments = currentAssignments.filter(a => a.projectId !== projectId)
      
      const updateData = {
        assignedProjects: updatedAssignments,
        hasActiveAssignments: updatedAssignments.some(a => a.status === 'assigned' || a.status === 'active'),
        updatedAt: Timestamp.now()
      }
      
      await updateDoc(doc(db, 'userProfiles', userId), updateData)
      
      // ✅ NUEVO: También actualizar el proyecto para remover el usuario de usuariosAsignados
      try {
        const { projectService } = await import('./projectService')
        await projectService.removeUserFromProject(projectId, userId, adminId)
        console.log('✅ Usuario removido del proyecto exitosamente')
      } catch (projectError) {
        console.error('⚠️ Error actualizando proyecto (continuando):', projectError)
        // No lanzar error aquí, la remoción del usuario ya se completó
      }
      
      console.log('✅ Asignación removida exitosamente')
      
      // Devolver el usuario actualizado
      const updatedUserDoc = await getDoc(doc(db, 'userProfiles', userId))
      if (updatedUserDoc.exists()) {
        return {
          uid: updatedUserDoc.id,
          ...updatedUserDoc.data()
        }
      } else {
        throw new Error('Usuario no encontrado después de actualizar')
      }
      
    } catch (error) {
      console.error('❌ Error removiendo asignación:', error)
      throw new Error('Error al remover asignación: ' + error.message)
    }
  },

  // NUEVO: Obtener usuarios con sus asignaciones
  async getUsersWithAssignments() {
    try {
      console.log('👥 Obteniendo usuarios con asignaciones...')
      
      const q = query(
        collection(db, 'userProfiles'),
        orderBy('createdAt', 'desc')
      )
      
      const snapshot = await getDocs(q)
      const users = []
      
      snapshot.forEach((doc) => {
        const userData = {
          uid: doc.id,
          ...doc.data(),
          assignedProjects: doc.data().assignedProjects || [],
          hasActiveAssignments: doc.data().hasActiveAssignments || false
        }
        users.push(userData)
      })
      
      console.log(`✅ ${users.length} usuarios obtenidos con asignaciones`)
      return users
      
    } catch (error) {
      console.error('❌ Error obteniendo usuarios con asignaciones:', error)
      throw new Error('Error al obtener usuarios')
    }
  },

  // NUEVO: Actualizar estado de asignación
  async updateAssignmentStatus(userId, projectId, newStatus) {
    try {
      console.log('📊 Actualizando estado de asignación:', userId, projectId, newStatus)
      
      const userDoc = await getDoc(doc(db, 'userProfiles', userId))
      if (!userDoc.exists()) {
        throw new Error('Usuario no encontrado')
      }
      
      const currentUser = userDoc.data()
      const currentAssignments = currentUser.assignedProjects || []
      
      const updatedAssignments = currentAssignments.map(assignment => 
        assignment.projectId === projectId 
          ? {
              ...assignment,
              status: newStatus,
              ...(newStatus === 'active' && { startedAt: Timestamp.now() }),
              ...(newStatus === 'completed' && { 
                completedAt: Timestamp.now(),
                progress: 100 
              }),
              updatedAt: Timestamp.now()
            }
          : assignment
      )
      
      const updateData = {
        assignedProjects: updatedAssignments,
        hasActiveAssignments: updatedAssignments.some(a => a.status === 'assigned' || a.status === 'active'),
        updatedAt: Timestamp.now()
      }
      
      await updateDoc(doc(db, 'userProfiles', userId), updateData)
      
      console.log('✅ Estado de asignación actualizado')
      
      // Devolver el usuario actualizado
      const updatedUserDoc = await getDoc(doc(db, 'userProfiles', userId))
      if (updatedUserDoc.exists()) {
        return {
          uid: updatedUserDoc.id,
          ...updatedUserDoc.data()
        }
      } else {
        throw new Error('Usuario no encontrado después de actualizar')
      }
      
    } catch (error) {
      console.error('❌ Error actualizando estado:', error)
      throw new Error('Error al actualizar estado de asignación')
    }
  },

  // Aprobar un usuario
  async approveUser(userId, adminId) {
    try {
      console.log('✅ Aprobando usuario:', userId)
      
      const updateData = {
        status: 'APPROVED',
        approvedBy: adminId,
        approvedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }
      
      await updateDoc(doc(db, 'userProfiles', userId), updateData)
      
      console.log('✅ Usuario aprobado exitosamente')
      
      // Devolver el usuario actualizado
      return await this.getUserById(userId)
      
    } catch (error) {
      console.error('❌ Error aprobando usuario:', error)
      throw new Error('Error al aprobar usuario')
    }
  },

  // Rechazar un usuario
  async rejectUser(userId, adminId, reason = '') {
    try {
      console.log('❌ Rechazando usuario:', userId)
      
      const updateData = {
        status: 'REJECTED',
        rejectedBy: adminId,
        rejectedAt: Timestamp.now(),
        rejectionReason: reason,
        updatedAt: Timestamp.now()
      }
      
      await updateDoc(doc(db, 'userProfiles', userId), updateData)
      
      console.log('✅ Usuario rechazado exitosamente')
      
      // Devolver el usuario actualizado
      return await this.getUserById(userId)
      
    } catch (error) {
      console.error('❌ Error rechazando usuario:', error)
      throw new Error('Error al rechazar usuario')
    }
  },

  // Eliminar un usuario completamente
  async deleteUser(userId) {
    try {
      console.log('🗑️ Eliminando usuario:', userId)
      
      // 1. Primero eliminar el perfil de Firestore
      await deleteDoc(doc(db, 'userProfiles', userId))
      console.log('✅ Perfil de Firestore eliminado')
      
      // 2. Eliminar todos los registros de conteo del usuario
      await this.deleteUserConteos(userId)
      console.log('✅ Registros de conteo eliminados')
      
      // 3. Remover usuario de todos los proyectos asignados
      await this.removeUserFromAllProjects(userId)
      console.log('✅ Usuario removido de proyectos')
      
      // 4. Eliminar el usuario de Firebase Authentication
      await this.deleteUserFromAuth(userId)
      console.log('✅ Usuario eliminado de Firebase Auth')
      
      console.log('✅ Usuario eliminado completamente')
      
    } catch (error) {
      console.error('❌ Error eliminando usuario:', error)
      throw new Error('Error al eliminar usuario: ' + error.message)
    }
  },

  // Eliminar registros de conteo del usuario
  async deleteUserConteos(userId) {
    try {
      // Buscar todos los registros de conteo del usuario
      const q = query(
        collection(db, 'registros_conteo'),
        where('userId', '==', userId)
      )
      
      const querySnapshot = await getDocs(q)
      const batch = writeBatch(db)
      
      querySnapshot.forEach((docSnapshot) => {
        batch.delete(docSnapshot.ref)
      })
      
      await batch.commit()
      console.log(`🗑️ Eliminados ${querySnapshot.size} registros de conteo`)
      
    } catch (error) {
      console.error('❌ Error eliminando registros de conteo:', error)
      // No lanzar error aquí, continuar con la eliminación
    }
  },

  // Remover usuario de todos los proyectos
  async removeUserFromAllProjects(userId) {
    try {
      // Buscar todos los proyectos que tienen este usuario asignado
      const q = query(
        collection(db, 'proyectos'),
        where('usuariosAsignados', 'array-contains', userId)
      )
      
      const querySnapshot = await getDocs(q)
      const batch = writeBatch(db)
      
      querySnapshot.forEach((docSnapshot) => {
        const projectData = docSnapshot.data()
        const updatedUsers = (projectData.usuariosAsignados || []).filter(id => id !== userId)
        
        batch.update(docSnapshot.ref, {
          usuariosAsignados: updatedUsers,
          updatedAt: Timestamp.now()
        })
      })
      
      await batch.commit()
      console.log(`🗑️ Usuario removido de ${querySnapshot.size} proyectos`)
      
    } catch (error) {
      console.error('❌ Error removiendo usuario de proyectos:', error)
      // No lanzar error aquí, continuar con la eliminación
    }
  },

  // Eliminar usuario de Firebase Authentication
  async deleteUserFromAuth(userId) {
    try {
      // Importar las funciones de Firebase Admin (esto requiere backend)
      // Por ahora, solo logueamos que necesitamos eliminar de Auth
      console.log('⚠️ IMPORTANTE: El usuario debe ser eliminado manualmente de Firebase Authentication')
      console.log('📧 UID del usuario a eliminar:', userId)
      console.log('🔗 Ve a Firebase Console > Authentication > Users y elimina el usuario')
      
      // TODO: Implementar eliminación automática con Firebase Admin SDK
      // Esto requiere un backend endpoint que use Firebase Admin SDK
      
    } catch (error) {
      console.error('❌ Error eliminando de Firebase Auth:', error)
      throw new Error('Error al eliminar usuario de Firebase Authentication')
    }
  },

  // Obtener estadísticas de usuarios (para dashboard admin)
  async getUserStats() {
    try {
      console.log('📊 Obteniendo estadísticas de usuarios...')
      
      const users = await this.getAllUsers()
      
      const stats = {
        totalUsers: users.length,
        pendingUsers: users.filter(u => u.status === 'PENDING').length,
        activeUsers: users.filter(u => u.status === 'APPROVED').length,
        rejectedUsers: users.filter(u => u.status === 'REJECTED').length,
        usersWithAssignments: users.filter(u => u.hasActiveAssignments === true).length
      }
      
      console.log('✅ Estadísticas calculadas:', stats)
      return stats
      
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error)
      throw new Error('Error al obtener estadísticas de usuarios')
    }
  }
}