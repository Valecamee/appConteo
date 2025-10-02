// src/services/storageService.js - Servicio para manejar Firebase Storage
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage'
import { storage } from '../firebase/firebase'
import { auth } from '../firebase/firebase'

export const storageService = {
  // Subir imagen de esquina
  async uploadCornerImage(projectId, cornerId, imageFile) {
    try {
      console.log('📤 Subiendo imagen para proyecto:', projectId, 'esquina:', cornerId)
      console.log('📁 Archivo:', imageFile.name, 'Tamaño:', imageFile.size, 'Tipo:', imageFile.type)
      
      // Verificar autenticación
      if (!auth.currentUser) {
        throw new Error('Usuario no autenticado. Debes estar logueado para subir imágenes.')
      }
      
      console.log('👤 Usuario autenticado:', auth.currentUser.uid)
      
      // Validar archivo antes de subir
      this.validateImageFile(imageFile)
      
      // Crear referencia única para la imagen
      const fileName = `projects/${projectId}/corners/${cornerId}/image_${Date.now()}.jpg`
      console.log('📂 Ruta de archivo:', fileName)
      
      const imageRef = ref(storage, fileName)
      console.log('🔗 Referencia creada:', imageRef.fullPath)
      
      // Subir la imagen
      console.log('⏳ Iniciando subida...')
      const snapshot = await uploadBytes(imageRef, imageFile)
      console.log('✅ Imagen subida:', snapshot.metadata.name)
      console.log('📊 Metadatos:', snapshot.metadata)
      
      // Obtener URL de descarga
      const downloadURL = await getDownloadURL(snapshot.ref)
      console.log('🔗 URL de descarga:', downloadURL)
      
      return {
        success: true,
        url: downloadURL,
        fileName: fileName
      }
      
    } catch (error) {
      console.error('❌ Error subiendo imagen:', error)
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      })
      
      // Manejar errores específicos
      if (error.code === 'storage/unauthorized') {
        throw new Error('No tienes permisos para subir archivos. Verifica tu autenticación.')
      } else if (error.code === 'storage/canceled') {
        throw new Error('La subida fue cancelada.')
      } else if (error.code === 'storage/unknown') {
        throw new Error('Error desconocido. Verifica tu conexión a internet.')
      } else {
        throw new Error('Error al subir la imagen: ' + error.message)
      }
    }
  },

  // Eliminar imagen de esquina
  async deleteCornerImage(imageUrl) {
    try {
      if (!imageUrl) return { success: true }
      
      console.log('🗑️ Eliminando imagen:', imageUrl)
      
      // Extraer el path de la URL
      const url = new URL(imageUrl)
      const pathMatch = url.pathname.match(/\/o\/(.+)\?/)
      
      if (pathMatch) {
        const imagePath = decodeURIComponent(pathMatch[1])
        const imageRef = ref(storage, imagePath)
        await deleteObject(imageRef)
        console.log('✅ Imagen eliminada')
      }
      
      return { success: true }
      
    } catch (error) {
      console.error('❌ Error eliminando imagen:', error)
      // No lanzar error si la imagen no existe
      return { success: true }
    }
  },

  // Validar archivo de imagen
  validateImageFile(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const maxSize = 5 * 1024 * 1024 // 5MB
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Tipo de archivo no válido. Solo se permiten JPG, PNG y WebP.')
    }
    
    if (file.size > maxSize) {
      throw new Error('El archivo es demasiado grande. Máximo 5MB.')
    }
    
    return true
  }
}
