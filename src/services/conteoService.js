// src/services/conteoService.js
import { 
  collection, 
  writeBatch, 
  doc,
  Timestamp,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc
} from 'firebase/firestore'
import { db } from '../firebase/firebase'

export const conteoService = {
  // Guardar una franja completa como registros individuales
  async guardarFranja(franjaData) {
    try {
      console.log('💾 Guardando franja en Firebase:', franjaData.franja)
      
      // Primero verificar si ya existen registros para esta franja
      const q = query(
        collection(db, 'registros_conteo'),
        where('userId', '==', franjaData.userId),
        where('conteoId', '==', franjaData.conteoId),
        where('franja', '==', franjaData.franja)
      )
      
      const existingSnapshot = await getDocs(q)
      const batch = writeBatch(db)
      
      // Crear mapa de registros existentes por movimiento
      const registrosExistentes = new Map()
      existingSnapshot.forEach((doc) => {
        registrosExistentes.set(doc.data().movimiento, doc)
      })
      
      console.log(`📝 Encontrados ${registrosExistentes.size} registros existentes para la franja ${franjaData.franja}`)
      
      // Procesar cada movimiento
      franjaData.movimientos.forEach(movimiento => {
        const registroData = {
          // Identificación del usuario
          userId: franjaData.userId,
          userName: franjaData.userName,
          
          // Configuración del conteo  
          nombreVideo: franjaData.nombreVideo,
          fecha: franjaData.fecha,
          tipo: franjaData.tipo,
          
          // Datos de la franja
          franja: franjaData.franja,
          horaInicio: franjaData.horaInicio,
          horaFin: franjaData.horaFin,
          
          // Datos del movimiento específico
          movimiento: movimiento.movimientoId,
          carros: movimiento.conteos.carros || 0,
          buses: movimiento.conteos.buses || 0,
          camiones: movimiento.conteos.camiones || 0,
          motos: movimiento.conteos.motos || 0,
          bicicletas: movimiento.conteos.bicicletas || 0,
          peatones: movimiento.conteos.peatones || 0,
          
          // Total del movimiento
          totalMovimiento: Object.values(movimiento.conteos).reduce((sum, val) => sum + (val || 0), 0),
          
          // Metadatos
          timestamp: Timestamp.now(),
          conteoId: franjaData.conteoId
        }
        
        // Si existe el registro, actualizarlo; si no, crearlo
        const registroExistente = registrosExistentes.get(movimiento.movimientoId)
        
        if (registroExistente) {
          // ACTUALIZAR registro existente
          console.log(`🔄 Actualizando registro existente para movimiento ${movimiento.movimientoId}`)
          batch.update(registroExistente.ref, registroData)
        } else {
          // CREAR nuevo registro
          console.log(`➕ Creando nuevo registro para movimiento ${movimiento.movimientoId}`)
          const nuevoDocRef = doc(collection(db, 'registros_conteo'))
          batch.set(nuevoDocRef, registroData)
        }
      })

      // Ejecutar todas las operaciones en lote
      await batch.commit()
      
      console.log('✅ Franja guardada/actualizada exitosamente en Firebase')
      return { success: true }
      
    } catch (error) {
      console.error('❌ Error guardando franja:', error)
      throw new Error('Error al guardar en Firebase: ' + error.message)
    }
  },

  // Obtener resumen de conteos del usuario (para tarjetas)
  async obtenerResumenConteos(userId) {
    try {
      console.log('Obteniendo resumen de conteos para:', userId)
      
      // Consulta simple sin orderBy para evitar necesidad de índice
      const q = query(
        collection(db, 'registros_conteo'),
        where('userId', '==', userId)
      )
      
      const querySnapshot = await getDocs(q)
      const registros = []
      
      querySnapshot.forEach((doc) => {
        registros.push({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate()
        })
      })
      
      // Ordenar en memoria después de obtener los datos
      registros.sort((a, b) => b.timestamp - a.timestamp)
      
      // Agrupar por conteoId para crear resumen
      const conteosAgrupados = this.agruparPorConteo(registros)
      
      console.log('Conteos obtenidos:', conteosAgrupados.length)
      return conteosAgrupados
      
    } catch (error) {
      console.error('Error obteniendo conteos:', error)
      throw new Error('Error al obtener conteos: ' + error.message)
    }
  },

  // Obtener datos completos de un conteo específico para CSV
  async obtenerConteoCompleto(userId, conteoId) {
    try {
      console.log('Obteniendo conteo completo:', conteoId)
      
      // Consulta simple sin orderBy para evitar necesidad de índice
      const q = query(
        collection(db, 'registros_conteo'),
        where('userId', '==', userId),
        where('conteoId', '==', conteoId)
      )
      
      const querySnapshot = await getDocs(q)
      const registros = []
      
      querySnapshot.forEach((doc) => {
        registros.push({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate()
        })
      })
      
      // Ordenar en memoria después de obtener los datos
      registros.sort((a, b) => {
        // Primero por franja, luego por movimiento
        if (a.franja !== b.franja) {
          return a.franja - b.franja
        }
        return a.movimiento.localeCompare(b.movimiento)
      })
      
      console.log('Registros del conteo:', registros.length)
      return registros
      
    } catch (error) {
      console.error('Error obteniendo conteo completo:', error)
      throw new Error('Error al obtener conteo: ' + error.message)
    }
  },

  // Eliminar un conteo completo
  async eliminarConteo(userId, conteoId) {
    try {
      console.log('Eliminando conteo:', conteoId)
      
      // Obtener todos los registros del conteo
      const q = query(
        collection(db, 'registros_conteo'),
        where('userId', '==', userId),
        where('conteoId', '==', conteoId)
      )
      
      const querySnapshot = await getDocs(q)
      const batch = writeBatch(db)
      
      // Agregar todas las eliminaciones al batch
      querySnapshot.forEach((documento) => {
        batch.delete(documento.ref)
      })
      
      // Ejecutar eliminación en lote
      await batch.commit()
      
      console.log('Conteo eliminado exitosamente')
      return { success: true, eliminados: querySnapshot.size }
      
    } catch (error) {
      console.error('Error eliminando conteo:', error)
      throw new Error('Error al eliminar conteo: ' + error.message)
    }
  },

  // Agrupar registros por conteoId para crear resumen
  agruparPorConteo(registros) {
    const grupos = {}
    
    registros.forEach(registro => {
      const conteoId = registro.conteoId
      
      if (!grupos[conteoId]) {
        grupos[conteoId] = {
          conteoId,
          nombreVideo: registro.nombreVideo,
          fecha: registro.fecha,
          tipo: registro.tipo,
          userName: registro.userName,
          timestamp: registro.timestamp,
          movimientos: new Set(),
          totalFranjas: 0,
          horaInicio: null,
          horaFin: null,
          totalElementos: 0
        }
      }
      
      const grupo = grupos[conteoId]
      grupo.movimientos.add(registro.movimiento)
      grupo.totalFranjas = Math.max(grupo.totalFranjas, registro.franja)
      grupo.totalElementos += registro.totalMovimiento
      
      // Calcular rango horario
      if (!grupo.horaInicio || registro.horaInicio < grupo.horaInicio) {
        grupo.horaInicio = registro.horaInicio
      }
      if (!grupo.horaFin || registro.horaFin > grupo.horaFin) {
        grupo.horaFin = registro.horaFin
      }
    })
    
    // Convertir Set de movimientos a array y ordenar por timestamp
    return Object.values(grupos).map(grupo => ({
      ...grupo,
      movimientos: Array.from(grupo.movimientos).sort(),
      totalMovimientos: grupo.movimientos.size
    })).sort((a, b) => b.timestamp - a.timestamp)
  },

  // Generar CSV de un conteo específico
  generarCSV(registros) {
    const headers = [
      'Nombre del Video', 'Fecha', 'Usuario', 'Tipo', 'Franja', 'Hora Inicio', 'Hora Fin',
      'Movimiento', 'Carros', 'Buses', 'Camiones', 'Motos', 'Bicicletas', 'Peatones', 'Total Movimiento'
    ]

    const csvRows = [headers.join(',')]

    registros.forEach(registro => {
      const row = [
        registro.nombreVideo,
        registro.fecha,
        registro.userName,
        registro.tipo,
        registro.franja,
        registro.horaInicio,
        registro.horaFin,
        registro.movimiento,
        registro.carros,
        registro.buses,
        registro.camiones,
        registro.motos,
        registro.bicicletas,
        registro.peatones,
        registro.totalMovimiento
      ]
      csvRows.push(row.join(','))
    })

    return csvRows.join('\n')
  }
}