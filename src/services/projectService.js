// src/services/projectService.js - ARCHIVO COMPLETO CORREGIDO
import { 
  collection, 
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getCountFromServer,
  Timestamp
} from 'firebase/firestore'
import { db } from '../firebase/firebase'
import { storageService } from './storageService'

export const projectService = {
  // Crear un nuevo proyecto
  async createProject(projectData, adminId) {
    try {
      console.log('📋 Creando nuevo proyecto:', projectData.nombreVideo)
      
      const newProject = {
        // Información básica
        nombreVideo: projectData.nombreVideo,
        descripcion: projectData.descripcion,
        interseccion: {
          nombre: projectData.interseccionNombre,
          accesos: projectData.accesos // Array de accesos con sus movimientos
        },
        
        // Fechas del proyecto
        fechaAforo: projectData.fechaAforo, // Fecha cuando se realizó el aforo
        fechaLimite: projectData.fechaLimite, // Fecha límite para completar conteos
        
        // Configuración de conteo
        totalEsquinas: projectData.totalEsquinas,
        accesos: projectData.accesos, // Agregar accesos al nivel raíz también
        
        // Metadatos
        createdBy: adminId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: 'active', // active, completed, paused, cancelled
        
        // Asignaciones
        usuariosAsignados: [], // Array de UIDs de usuarios
        conteoCompletado: false,
        porcentajeCompletado: 0
      }
      
      const docRef = await addDoc(collection(db, 'proyectos'), newProject)
      
      console.log('✅ Proyecto creado con ID:', docRef.id)
      
      return {
        id: docRef.id,
        ...newProject
      }
      
    } catch (error) {
      console.error('❌ Error creando proyecto:', error)
      throw new Error('Error al crear el proyecto: ' + error.message)
    }
  },

  // Obtener todos los proyectos (con filtros opcionales)
  async getAllProjects(filters = {}) {
    try {
      console.log('📋 Obteniendo proyectos con filtros:', filters)
      
      let q = collection(db, 'proyectos')
      
      // Aplicar filtros si existen
      const conditions = []
      
      if (filters.createdBy) {
        conditions.push(where('createdBy', '==', filters.createdBy))
      }
      
      if (filters.status) {
        conditions.push(where('status', '==', filters.status))
      }
      
      // Construir query con condiciones
      if (conditions.length > 0) {
        q = query(q, ...conditions, orderBy('createdAt', 'desc'))
      } else {
        q = query(q, orderBy('createdAt', 'desc'))
      }
      
      const snapshot = await getDocs(q)
      const projects = []
      
      snapshot.forEach((doc) => {
        projects.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      console.log(`✅ ${projects.length} proyectos obtenidos`)
      return projects
      
    } catch (error) {
      console.error('❌ Error obteniendo proyectos:', error)
      throw new Error('Error al obtener proyectos: ' + error.message)
    }
  },

  // Obtener un proyecto específico por ID
  async getProjectById(projectId) {
    try {
      console.log('🔍 Obteniendo proyecto por ID:', projectId)
      
      const docRef = doc(db, 'proyectos', projectId)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) {
        throw new Error('Proyecto no encontrado')
      }
      
      const projectData = {
        id: docSnap.id,
        ...docSnap.data()
      }
      
      console.log('✅ Proyecto obtenido:', projectData.nombreVideo)
      return projectData
      
    } catch (error) {
      console.error('❌ Error obteniendo proyecto:', error)
      throw new Error('Error al obtener el proyecto: ' + error.message)
    }
  },

  // Actualizar un proyecto
  async updateProject(projectId, updateData, adminId) {
    try {
      console.log('📝 Actualizando proyecto:', projectId)
      
      const docRef = doc(db, 'proyectos', projectId)
      
      // Agregar metadatos de actualización
      const updatedData = {
        ...updateData,
        updatedAt: Timestamp.now(),
        updatedBy: adminId
      }
      
      // Limpiar campos undefined
      Object.keys(updatedData).forEach(key => {
        if (updatedData[key] === undefined) {
          delete updatedData[key]
        }
      })
      
      await updateDoc(docRef, updatedData)
      
      console.log('✅ Proyecto actualizado exitosamente')
      
      // Devolver el proyecto actualizado
      const updatedProject = await this.getProjectById(projectId)
      return updatedProject
      
    } catch (error) {
      console.error('❌ Error actualizando proyecto:', error)
      throw new Error('Error al actualizar el proyecto: ' + error.message)
    }
  },

  // Eliminar un proyecto
  async deleteProject(projectId) {
    try {
      console.log('🗑️ Eliminando proyecto:', projectId)
      
      const docRef = doc(db, 'proyectos', projectId)
      await deleteDoc(docRef)
      
      console.log('✅ Proyecto eliminado exitosamente')
      return true
      
    } catch (error) {
      console.error('❌ Error eliminando proyecto:', error)
      throw new Error('Error al eliminar el proyecto: ' + error.message)
    }
  },

  // Obtener proyectos asignados a un usuario específico
  async getProjectsByUser(userId) {
    try {
      console.log('👤 Obteniendo proyectos asignados al usuario:', userId)
      
      const q = query(
        collection(db, 'proyectos'),
        where('usuariosAsignados', 'array-contains', userId),
        orderBy('createdAt', 'desc')
      )
      
      const snapshot = await getDocs(q)
      const projects = []
      
      snapshot.forEach((doc) => {
        projects.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      console.log(`✅ ${projects.length} proyectos asignados encontrados`)
      return projects
      
    } catch (error) {
      console.error('❌ Error obteniendo proyectos del usuario:', error)
      throw new Error('Error al obtener proyectos del usuario: ' + error.message)
    }
  },

  // Asignar usuario a un proyecto
  async assignUserToProject(projectId, userId, adminId) {
    try {
      console.log('👥 Asignando usuario al proyecto:', { projectId, userId })
      
      const docRef = doc(db, 'proyectos', projectId)
      const projectDoc = await getDoc(docRef)
      
      if (!projectDoc.exists()) {
        throw new Error('Proyecto no encontrado')
      }
      
      const currentData = projectDoc.data()
      const currentUsers = currentData.usuariosAsignados || []
      
      // Verificar si el usuario ya está asignado
      if (currentUsers.includes(userId)) {
        console.log('⚠️ Usuario ya está asignado a este proyecto')
        return currentData
      }
      
      // Agregar usuario a la lista
      const updatedUsers = [...currentUsers, userId]
      
      await updateDoc(docRef, {
        usuariosAsignados: updatedUsers,
        updatedAt: Timestamp.now(),
        updatedBy: adminId
      })
      
      console.log('✅ Usuario asignado exitosamente')
      
      // Devolver el proyecto actualizado
      return await this.getProjectById(projectId)
      
    } catch (error) {
      console.error('❌ Error asignando usuario:', error)
      throw new Error('Error al asignar usuario: ' + error.message)
    }
  },

  // Remover usuario de un proyecto
  async removeUserFromProject(projectId, userId, adminId) {
    try {
      console.log('👥 Removiendo usuario del proyecto:', { projectId, userId })
      
      const docRef = doc(db, 'proyectos', projectId)
      const projectDoc = await getDoc(docRef)
      
      if (!projectDoc.exists()) {
        throw new Error('Proyecto no encontrado')
      }
      
      const currentData = projectDoc.data()
      const currentUsers = currentData.usuariosAsignados || []
      
      // Remover usuario de la lista
      const updatedUsers = currentUsers.filter(id => id !== userId)
      
      await updateDoc(docRef, {
        usuariosAsignados: updatedUsers,
        updatedAt: Timestamp.now(),
        updatedBy: adminId
      })
      
      console.log('✅ Usuario removido exitosamente')
      
      // Devolver el proyecto actualizado
      return await this.getProjectById(projectId)
      
    } catch (error) {
      console.error('❌ Error removiendo usuario:', error)
      throw new Error('Error al remover usuario: ' + error.message)
    }
  },

  // Actualizar progreso de un proyecto
  async updateProjectProgress(projectId, progressData, adminId) {
    try {
      console.log('📊 Actualizando progreso del proyecto:', projectId)
      
      const updateData = {
        porcentajeCompletado: progressData.percentage || 0,
        conteoCompletado: progressData.completed || false,
        updatedAt: Timestamp.now(),
        updatedBy: adminId
      }
      
      // Si el proyecto está completado, actualizar status
      if (progressData.completed) {
        updateData.status = 'completed'
      }
      
      await updateDoc(doc(db, 'proyectos', projectId), updateData)
      
      console.log('✅ Progreso actualizado exitosamente')
      
      return await this.getProjectById(projectId)
      
    } catch (error) {
      console.error('❌ Error actualizando progreso:', error)
      throw new Error('Error al actualizar progreso: ' + error.message)
    }
  },

  // Cambiar estado de un proyecto
  async updateProjectStatus(projectId, newStatus, adminId) {
    try {
      console.log('🔄 Cambiando estado del proyecto:', { projectId, newStatus })
      
      const validStatuses = ['active', 'completed', 'paused', 'cancelled']
      if (!validStatuses.includes(newStatus)) {
        throw new Error('Estado inválido: ' + newStatus)
      }
      
      await updateDoc(doc(db, 'proyectos', projectId), {
        status: newStatus,
        updatedAt: Timestamp.now(),
        updatedBy: adminId
      })
      
      console.log('✅ Estado actualizado exitosamente')
      
      return await this.getProjectById(projectId)
      
    } catch (error) {
      console.error('❌ Error cambiando estado:', error)
      throw new Error('Error al cambiar estado: ' + error.message)
    }
  },

  // Obtener estadísticas de proyectos
  async getProjectStats(adminId = null) {
    try {
      console.log('📊 Obteniendo estadísticas de proyectos')
      
      let q = collection(db, 'proyectos')
      
      // Si se especifica un admin, filtrar por sus proyectos
      if (adminId) {
        q = query(q, where('createdBy', '==', adminId))
      }
      
      const snapshot = await getDocs(q)
      const projects = []
      
      snapshot.forEach((doc) => {
        projects.push(doc.data())
      })
      
      // Calcular estadísticas
      const stats = {
        total: projects.length,
        active: projects.filter(p => p.status === 'active').length,
        completed: projects.filter(p => p.status === 'completed').length,
        paused: projects.filter(p => p.status === 'paused').length,
        cancelled: projects.filter(p => p.status === 'cancelled').length,
        totalUsers: [...new Set(projects.flatMap(p => p.usuariosAsignados || []))].length,
        avgProgress: projects.length > 0 
          ? projects.reduce((sum, p) => sum + (p.porcentajeCompletado || 0), 0) / projects.length
          : 0
      }
      
      console.log('✅ Estadísticas calculadas:', stats)
      return stats
      
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error)
      throw new Error('Error al obtener estadísticas: ' + error.message)
    }
  },

  // Buscar proyectos por texto
  async searchProjects(searchTerm, adminId = null) {
    try {
      console.log('🔍 Buscando proyectos:', searchTerm)
      
      // Obtener todos los proyectos del admin (o todos si no se especifica)
      const allProjects = await this.getAllProjects({ 
        createdBy: adminId 
      })
      
      // Filtrar por término de búsqueda
      const filteredProjects = allProjects.filter(project => {
        const searchLower = searchTerm.toLowerCase()
        return (
          (project.nombreVideo || '').toLowerCase().includes(searchLower) ||
          (project.descripcion || '').toLowerCase().includes(searchLower) ||
          (project.interseccion?.nombre || '').toLowerCase().includes(searchLower)
        )
      })
      
      console.log(`✅ ${filteredProjects.length} proyectos encontrados`)
      return filteredProjects
      
    } catch (error) {
      console.error('❌ Error buscando proyectos:', error)
      throw new Error('Error al buscar proyectos: ' + error.message)
    }
  },

  // Obtener proyectos recientes
  async getRecentProjects(limit = 5, adminId = null) {
    try {
      console.log('📅 Obteniendo proyectos recientes')
      
      let q = collection(db, 'proyectos')
      
      if (adminId) {
        q = query(
          q,
          where('createdBy', '==', adminId),
          orderBy('createdAt', 'desc'),
          limit(limit)
        )
      } else {
        q = query(
          q,
          orderBy('createdAt', 'desc'),
          limit(limit)
        )
      }
      
      const snapshot = await getDocs(q)
      const projects = []
      
      snapshot.forEach((doc) => {
        projects.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      console.log(`✅ ${projects.length} proyectos recientes obtenidos`)
      return projects
      
    } catch (error) {
      console.error('❌ Error obteniendo proyectos recientes:', error)
      throw new Error('Error al obtener proyectos recientes: ' + error.message)
    }
  },

  // Subir imagen de esquina
  async uploadCornerImage(projectId, cornerId, imageFile) {
    try {
      console.log('📤 Subiendo imagen para esquina:', cornerId, 'del proyecto:', projectId)
      
      // Validar archivo
      storageService.validateImageFile(imageFile)
      
      // Subir imagen
      const result = await storageService.uploadCornerImage(projectId, cornerId, imageFile)
      
      // Actualizar el proyecto con la nueva URL de imagen
      const projectRef = doc(db, 'proyectos', projectId)
      const projectDoc = await getDoc(projectRef)
      
      if (projectDoc.exists()) {
        const projectData = projectDoc.data()
        const accesosActualizados = projectData.accesos.map(acceso => {
          if (acceso.id === cornerId) {
            return {
              ...acceso,
              imagenUrl: result.url,
              imagenFileName: result.fileName
            }
          }
          return acceso
        })
        
        await updateDoc(projectRef, {
          accesos: accesosActualizados,
          updatedAt: Timestamp.now()
        })
        
        console.log('✅ Imagen de esquina actualizada en el proyecto')
      }
      
      return result
      
    } catch (error) {
      console.error('❌ Error subiendo imagen de esquina:', error)
      throw error
    }
  },

  // Eliminar imagen de esquina
  async deleteCornerImage(projectId, cornerId) {
    try {
      console.log('🗑️ Eliminando imagen de esquina:', cornerId, 'del proyecto:', projectId)
      
      // Obtener el proyecto para encontrar la URL de la imagen
      const projectDoc = await getDoc(doc(db, 'proyectos', projectId))
      
      if (projectDoc.exists()) {
        const projectData = projectDoc.data()
        const acceso = projectData.accesos.find(e => e.id === cornerId)
        
        if (acceso?.imagenUrl) {
          // Eliminar imagen del storage
          await storageService.deleteCornerImage(acceso.imagenUrl)
          
          // Actualizar el proyecto removiendo la imagen
          const accesosActualizados = projectData.accesos.map(e => {
            if (e.id === cornerId) {
              const { imagenUrl, imagenFileName, ...accesoSinImagen } = e
              return accesoSinImagen
            }
            return e
          })
          
          await updateDoc(doc(db, 'proyectos', projectId), {
            accesos: accesosActualizados,
            updatedAt: Timestamp.now()
          })
          
          console.log('✅ Imagen de esquina eliminada')
        }
      }
      
      return { success: true }
      
    } catch (error) {
      console.error('❌ Error eliminando imagen de esquina:', error)
      throw error
    }
  },

  // NUEVA FUNCIÓN: Sincronizar usuarios asignados desde userProfiles
  async syncProjectUsers(projectId) {
    try {
      console.log('🔄 Sincronizando usuarios del proyecto:', projectId)
      
      // Obtener el proyecto
      const projectDoc = await getDoc(doc(db, 'proyectos', projectId))
      if (!projectDoc.exists()) {
        throw new Error('Proyecto no encontrado')
      }
      
      const projectData = projectDoc.data()
      const projectName = projectData.nombreVideo
      
      // Buscar todos los usuarios que tienen este proyecto asignado
      const q = query(
        collection(db, 'userProfiles'),
        where('assignedProjects', 'array-contains-any', [
          { projectName: projectName },
          { projectId: projectId }
        ])
      )
      
      const usersSnapshot = await getDocs(q)
      const assignedUserIds = []
      
      usersSnapshot.forEach((userDoc) => {
        const userData = userDoc.data()
        const hasProjectAssignment = userData.assignedProjects?.some(assignment => 
          assignment.projectId === projectId || assignment.projectName === projectName
        )
        
        if (hasProjectAssignment) {
          assignedUserIds.push(userDoc.id)
        }
      })
      
      // Actualizar el proyecto con los usuarios encontrados
      await updateDoc(doc(db, 'proyectos', projectId), {
        usuariosAsignados: assignedUserIds,
        updatedAt: Timestamp.now()
      })
      
      console.log(`✅ Sincronizados ${assignedUserIds.length} usuarios para el proyecto`)
      return assignedUserIds
      
    } catch (error) {
      console.error('❌ Error sincronizando usuarios del proyecto:', error)
      throw new Error('Error al sincronizar usuarios: ' + error.message)
    }
  }
}