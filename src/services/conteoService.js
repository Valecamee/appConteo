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
          autos: movimiento.conteos.autos || 0,
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
      console.log('🔍 Obteniendo conteo completo:', conteoId)
      console.log('👤 UserId:', userId)
      
      // Consulta simple sin orderBy para evitar necesidad de índice
      const q = query(
        collection(db, 'registros_conteo'),
        where('userId', '==', userId),
        where('conteoId', '==', conteoId)
      )
      
      console.log('🔍 Consulta creada, ejecutando...')
      
      const querySnapshot = await getDocs(q)
      const registros = []
      
      console.log('📊 QuerySnapshot size:', querySnapshot.size)
      console.log('📊 QuerySnapshot empty:', querySnapshot.empty)
      
      querySnapshot.forEach((doc) => {
        console.log('📄 Documento encontrado:', doc.id, doc.data())
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
      
      console.log('📊 Registros del conteo:', registros.length)
      console.log('📊 Registros encontrados:', registros)
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
  generarCSV(registros, movementNamesMap = {}, projectData = null) {
    // Determinar el tipo de conteo basado en el primer registro
    const tipoConteo = registros.length > 0 ? registros[0].tipo : 'Vehículos'
    const esVehiculos = tipoConteo === 'Vehículos'
    
    // Headers base
    const headersBase = [
      'Nombre del Video', 'Fecha', 'Usuario', 'Tipo', 'Franja', 'Hora Inicio', 'Hora Fin', 'Movimiento'
    ]
    
    // Headers dinámicos según el tipo
    const headersVehiculos = ['Autos', 'Buses', 'Camiones', 'Motos', 'Bicicletas']
    const headersPeatones = ['Peatones']
    
    const headers = esVehiculos 
      ? [...headersBase, ...headersVehiculos, 'Total Movimiento']
      : [...headersBase, ...headersPeatones, 'Total Movimiento']

    const csvRows = [headers.join(',')]

    // Función para obtener el nombre del movimiento
    const getMovementName = (movementId) => {
      // Si ya tenemos el nombre en el map, usarlo
      if (movementNamesMap[movementId]) {
        return movementNamesMap[movementId]
      }
      
      // Si tenemos datos del proyecto, extraer el nombre
      if (projectData && projectData.interseccion?.accesos) {
        const [esquinaId, movimientoId] = movementId.split('-')
        const acceso = projectData.interseccion.accesos.find(acc => acc.id.toString() === esquinaId)
        if (acceso) {
          const movimiento = acceso.movimientos?.find(mov => mov.id.toString() === movimientoId)
          if (movimiento) {
            return movimiento.nombre
          }
        }
      }
      
      // Fallback: usar el ID original
      return movementId
    }

    registros.forEach(registro => {
      // Obtener el nombre del movimiento (ej: "q" en lugar de "1-1758574280844")
      const movimientoNombre = getMovementName(registro.movimiento)
      
      // Row base
      const rowBase = [
        registro.nombreVideo,
        registro.fecha,
        registro.userName,
        registro.tipo,
        registro.franja,
        registro.horaInicio,
        registro.horaFin,
        movimientoNombre
      ]
      
      // Row dinámico según el tipo
      const rowVehiculos = [
        registro.autos || 0, // Mantener 'autos' en los datos, pero mostrar como 'Autos' en header
        registro.buses || 0,
        registro.camiones || 0,
        registro.motos || 0,
        registro.bicicletas || 0
      ]
      
      const rowPeatones = [
        registro.peatones || 0
      ]
      
      const row = esVehiculos 
        ? [...rowBase, ...rowVehiculos, registro.totalMovimiento]
        : [...rowBase, ...rowPeatones, registro.totalMovimiento]
        
      csvRows.push(row.join(','))
    })

    return csvRows.join('\n')
  },

  // Obtener todos los registros individuales de un usuario (para CSV)
  async obtenerRegistrosUsuario(userId) {
    try {
      console.log('📊 Obteniendo registros individuales para:', userId)
      
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
      
      // Ordenar por timestamp
      registros.sort((a, b) => {
        const timeA = a.timestamp?.getTime ? a.timestamp.getTime() : new Date(a.timestamp).getTime()
        const timeB = b.timestamp?.getTime ? b.timestamp.getTime() : new Date(b.timestamp).getTime()
        return timeA - timeB
      })
      
      console.log(`📊 Registros obtenidos para ${userId}:`, registros.length)
      return registros
      
    } catch (error) {
      console.error('Error obteniendo registros del usuario:', error)
      throw new Error('Error al obtener registros: ' + error.message)
    }
  },

  // NUEVA FUNCIÓN: Descargar CSV consolidado de un proyecto
  async downloadProjectCSV(project) {
    try {
      console.log('📥 Generando CSV consolidado del proyecto:', project.nombreVideo)
      console.log('👥 Usuarios asignados:', project.usuariosAsignados)

      if (!project?.usuariosAsignados?.length) {
        throw new Error('No hay usuarios asignados a este proyecto')
      }

      // Obtener todos los registros de conteo del proyecto
      const allRegistros = []
      
      for (const userId of project.usuariosAsignados) {
        try {
          console.log(`🔍 Obteniendo registros para usuario: ${userId}`)
          const userRegistros = await this.obtenerRegistrosUsuario(userId)
          console.log(`📊 Registros totales del usuario ${userId}:`, userRegistros.length)
          
          const projectRegistros = userRegistros.filter(registro =>
            registro.nombreVideo === project.nombreVideo
          )
          console.log(`📋 Registros del proyecto para ${userId}:`, projectRegistros.length)
          console.log('📋 Ejemplo de registro:', projectRegistros[0])
          
          allRegistros.push(...projectRegistros)
        } catch (error) {
          console.error(`Error obteniendo registros del usuario ${userId}:`, error)
        }
      }

      if (allRegistros.length === 0) {
        throw new Error('No hay datos de conteo para este proyecto')
      }

      // Ordenar por timestamp
      allRegistros.sort((a, b) => {
        const timeA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp)
        const timeB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp)
        return timeA - timeB
      })

      // --- NUEVA LÓGICA PARA GENERAR DOS CSVs ---
      const registrosVehiculos = allRegistros.filter(r => r.tipo === 'Vehículos' || r.tipo === 'vehicles')
      const registrosPeatones = allRegistros.filter(r => r.tipo === 'Peatones' || r.tipo === 'pedestrians')

      console.log('📊 Análisis de registros:')
      console.log('🚗 Registros de vehículos:', registrosVehiculos.length)
      console.log('🚶 Registros de peatones:', registrosPeatones.length)

      if (registrosVehiculos.length > 0) {
        console.log('🚗 Generando CSV para Vehículos...')
        const csvContentVehiculos = this.generateProjectCSV(registrosVehiculos, project, true) // true para vehículos
        this.downloadCSVFile(csvContentVehiculos, `proyecto_${project.nombreVideo}_vehiculos_${new Date().toISOString().split('T')[0]}.csv`)
      }

      if (registrosPeatones.length > 0) {
        console.log('🚶 Generando CSV para Peatones...')
        const csvContentPeatones = this.generateProjectCSV(registrosPeatones, project, false) // false para peatones
        this.downloadCSVFile(csvContentPeatones, `proyecto_${project.nombreVideo}_peatones_${new Date().toISOString().split('T')[0]}.csv`)
      }

      if (registrosVehiculos.length === 0 && registrosPeatones.length === 0) {
        throw new Error('No hay datos de conteo válidos para generar CSVs.')
      }
      
      console.log('✅ CSVs del proyecto descargados exitosamente')
      return { success: true }
      
    } catch (error) {
      console.error('❌ Error descargando CSV del proyecto:', error)
      throw new Error('Error al descargar CSV del proyecto: ' + error.message)
    }
  },

  // Función auxiliar para descargar el archivo CSV
  downloadCSVFile(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  },

  // NUEVA FUNCIÓN: Generar contenido CSV para proyecto
  generateProjectCSV(registros, project, isVehiculos) {
    if (!registros || registros.length === 0) {
      return 'No hay datos disponibles'
    }

    console.log('🔍 Generando CSV:')
    console.log('📊 Total registros:', registros.length)
    console.log('🎯 Tipo:', isVehiculos ? 'Vehículos' : 'Peatones')
    console.log('📋 Ejemplo de registro:', registros[0])
    console.log('📋 Configuración del proyecto:', project)
    
    // Headers base
    const headersBase = [
      'Proyecto',
      'Fecha',
      'Usuario',
      'Tipo',
      'Franja',
      'Hora Inicio',
      'Hora Fin',
      'Movimiento'
    ]
    
    // Headers dinámicos según el tipo
    const headersVehiculos = [
      'Autos',
      'Buses', 
      'Camiones',
      'Motos',
      'Bicicletas',
      'Total Movimiento'
    ]
    
    const headersPeatones = [
      'Peatones',
      'Total Movimiento'
    ]
    
    const headers = isVehiculos
      ? [...headersBase, ...headersVehiculos]
      : [...headersBase, ...headersPeatones]
    
    const csvRows = [headers.join(',')]
    
    // Función para obtener nombre del movimiento
    // Ahora el ID es directamente el nombre que el usuario asignó
    const getMovementName = (movementId) => {
      if (!movementId) return 'Sin movimiento'
      
      console.log('🔍 Procesando movementId:', movementId, 'tipo:', typeof movementId)
      
      // Si el movementId ya es el nombre (ej: "d", "t", "q", "w")
      if (typeof movementId === 'string' && movementId.length <= 10) {
        console.log('✅ Nombre de movimiento detectado:', movementId)
        return movementId
      }
      
      // Si viene en formato "esquinaId-movementId", extraer solo el movementId
      if (typeof movementId === 'string' && movementId.includes('-')) {
        const parts = movementId.split('-')
        if (parts.length >= 2) {
          const movementName = parts[1]
          console.log('✅ Nombre extraído de ID compuesto:', movementName)
          return movementName
        }
      }
      
      console.log('⚠️ Usando ID tal como está:', movementId)
      return movementId
    }

    registros.forEach((registro, index) => {
      // Debug para los primeros registros
      if (index < 3) {
        console.log(`🔍 Registro ${index + 1}:`, {
          tipo: registro.tipo,
          autos: registro.autos,
          buses: registro.buses,
          camiones: registro.camiones,
          motos: registro.motos,
          bicicletas: registro.bicicletas,
          peatones: registro.peatones,
          totalMovimiento: registro.totalMovimiento,
          movimiento: registro.movimiento
        })
      }
      
      // Obtener el nombre del movimiento
      const movimientoNombre = getMovementName(registro.movimiento)
      
      // Row base
      const rowBase = [
        `"${registro.nombreVideo || project.nombreVideo}"`,
        `"${registro.fecha || ''}"`,
        `"${registro.userName || ''}"`,
        `"${registro.tipo || ''}"`,
        `"${registro.franja || ''}"`,
        `"${registro.horaInicio || ''}"`,
        `"${registro.horaFin || ''}"`,
        `"${movimientoNombre}"`
      ]
      
      // Row dinámico según el tipo
      const rowVehiculos = [
        registro.autos || 0,
        registro.buses || 0,
        registro.camiones || 0,
        registro.motos || 0,
        registro.bicicletas || 0,
        registro.totalMovimiento || 0
      ]
      
      const rowPeatones = [
        registro.peatones || 0,
        registro.totalMovimiento || 0
      ]
      
      const row = isVehiculos
        ? [...rowBase, ...rowVehiculos]
        : [...rowBase, ...rowPeatones]
        
      csvRows.push(row.join(','))
    })

    return csvRows.join('\n')
  }
}