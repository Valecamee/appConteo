import React, { createContext, useState } from 'react'
import { conteoService } from '../services/conteoService'
import { franjaUtils } from '../utils/franjaUtils'

export const ConteoContext = createContext()

export const ConteoProvider = ({ children }) => {
  // Estados de configuración del conteo
  const [conteoConfig, setConteoConfig] = useState(null)
  const [selectedType, setSelectedType] = useState(null)
  const [selectedMovements, setSelectedMovements] = useState([])
  const [movementNamesMap, setMovementNamesMap] = useState({}) // ✅ Mapeo de IDs a nombres

  // Estados del conteo por franjas
  const [franjaActual, setFranjaActual] = useState(1)
  const [franjasCompletadas, setFranjasCompletadas] = useState([])
  const [conteoActual, setConteoActual] = useState({})
  const [franjasSaved, setFranjasSaved] = useState([])

  // Historial de conteos
  const [historialConteos, setHistorialConteos] = useState([])

  // Inicializar conteos para una franja
  const initializeFranjaConteos = (movements, type = selectedType) => {
    const initialCounts = {}
    movements.forEach(movement => {
      if (type === 'vehicles') {
        // Para vehículos: todos excepto peatones
        initialCounts[movement] = {
          autos: 0,
          buses: 0,
          camiones: 0,
          motos: 0,
          bicicletas: 0
        }
      } else {
        // Para peatones: solo peatones
        initialCounts[movement] = {
          peatones: 0
        }
      }
    })
    setConteoActual(initialCounts)
  }

  // Incrementar contador
  const handleIncrement = (movementId, vehicleType) => {
    setConteoActual(prev => ({
      ...prev,
      [movementId]: {
        ...prev[movementId],
        [vehicleType]: (prev[movementId]?.[vehicleType] || 0) + 1
      }
    }))
  }

  // Resetear conteos de la franja actual
  const handleResetFranja = () => {
    initializeFranjaConteos(selectedMovements)
  }

  // Calcular total de la franja actual
  const getTotalFranjaActual = () => {
    return Object.values(conteoActual).reduce((total, movementCounts) => {
      return total + Object.values(movementCounts).reduce((sum, count) => sum + (count || 0), 0)
    }, 0)
  }

  // Guardar franja actual
  const handleSaveFranja = async (user) => {
    try {
      const [startHour, startMin] = conteoConfig.horaInicio.split(':').map(Number)
      const startTotalMin = startHour * 60 + startMin
      const franjaStartMin = startTotalMin + ((franjaActual - 1) * 15)
      const franjaEndMin = franjaStartMin + 15
      
      const franjaInicio = `${Math.floor(franjaStartMin / 60).toString().padStart(2, '0')}:${(franjaStartMin % 60).toString().padStart(2, '0')}`
      const franjaFin = `${Math.floor(franjaEndMin / 60).toString().padStart(2, '0')}:${(franjaEndMin % 60).toString().padStart(2, '0')}`

      const franjaData = {
        userId: user.uid,
        userName: user.fullName || user.email.split('@')[0],
        nombreVideo: conteoConfig.nombreVideo,
        fecha: conteoConfig.fecha,
        tipo: selectedType === 'vehicles' ? 'Vehículos' : 'Peatones',
        franja: franjaActual,
        horaInicio: franjaInicio,
        horaFin: franjaFin,
        conteoId: (() => {
          const generatedId = conteoConfig.conteoId || `${conteoConfig.projectId}-${user.uid}-${selectedType}`
          console.log('🔍 Debug conteoId generation:')
          console.log('  - conteoConfig.conteoId:', conteoConfig.conteoId)
          console.log('  - conteoConfig.projectId:', conteoConfig.projectId)
          console.log('  - user.uid:', user.uid)
          console.log('  - selectedType:', selectedType)
          console.log('  - Generated conteoId:', generatedId)
          return generatedId
        })(),
        movimientos: selectedMovements.map(movId => ({
          movimientoId: movId,
          conteos: { ...conteoActual[movId] }
        }))
      }

      await conteoService.guardarFranja(franjaData)
      
      const franjaDataLocal = {
        franjaNum: franjaActual,
        movimientos: selectedMovements.map(movId => ({
          movimientoId: movId,
          conteos: { ...conteoActual[movId] }
        }))
      }

      setFranjasSaved(prev => {
        const updated = prev.filter(f => f.franjaNum !== franjaActual)
        return [...updated, franjaDataLocal].sort((a, b) => a.franjaNum - b.franjaNum)
      })

      if (!franjasCompletadas.includes(franjaActual)) {
        setFranjasCompletadas(prev => [...prev, franjaActual].sort((a, b) => a - b))
      }

      return { success: true }
    } catch (error) {
      console.error('Error guardando franja:', error)
      throw error
    }
  }

  // Función para obtener la imagen según el movimiento y tipo
  const getMovementImage = (movementId, type) => {
    const getDirection = (id) => {
      // Extraer el ID base si tiene timestamp
      const baseId = id.includes('-') && !id.includes('(') && !id.includes(')') 
        ? id.split('-')[0] 
        : id
      
      if (['9(1)', '1', '5', '10(1)'].includes(baseId)) return 'norte'
      if (['10(3)', '7', '3', '9(3)'].includes(baseId)) return 'oeste'
      if (['10(2)', '6', '2', '9(2)'].includes(baseId)) return 'sur'
      if (['10(4)', '8', '4', '9(4)'].includes(baseId)) return 'este'
      if (['1-1', '1-2', '1-3'].includes(baseId)) return 'norte'
      if (['3-1', '3-2', '3-3'].includes(baseId)) return 'oeste'
      if (['2-1', '2-2', '2-3'].includes(baseId)) return 'sur'
      if (['4-1', '4-2', '4-3'].includes(baseId)) return 'este'
      return 'norte'
    }

    const direction = getDirection(movementId)
    return type === 'vehicles' ? `/images/${direction}.png` : `/images/R${direction}.png`
  }

  // Función para obtener el nombre del movimiento
  const getMovementName = (movementId) => {
    // ✅ PRIORIDAD 1: Usar nombres del mapeo de Firebase si están disponibles
    if (movementNamesMap[movementId]) {
      return movementNamesMap[movementId]
    }
    
    // ✅ PRIORIDAD 2: Fallback a nombres hardcodeados para movimientos antiguos
    const baseId = movementId.includes('-') && !movementId.includes('(') && !movementId.includes(')') 
      ? movementId.split('-')[0] 
      : movementId
    
    const movementNames = {
      '1': 'Norte Derecha',
      '2': 'Sur Derecha', 
      '3': 'Oeste Derecha',
      '4': 'Este Derecha',
      '5': 'Norte Izquierda',
      '6': 'Sur Izquierda',
      '7': 'Oeste Izquierda',
      '8': 'Este Izquierda',
      '9(1)': 'Norte Recto',
      '9(2)': 'Sur Recto',
      '9(3)': 'Oeste Recto',
      '9(4)': 'Este Recto',
      '10(1)': 'Norte U-Turn',
      '10(2)': 'Sur U-Turn',
      '10(3)': 'Oeste U-Turn',
      '10(4)': 'Este U-Turn',
      '1-1': 'Norte Derecha',
      '1-2': 'Norte Recto',
      '1-3': 'Norte Izquierda',
      '2-1': 'Sur Derecha',
      '2-2': 'Sur Recto',
      '2-3': 'Sur Izquierda',
      '3-1': 'Oeste Derecha',
      '3-2': 'Oeste Recto',
      '3-3': 'Oeste Izquierda',
      '4-1': 'Este Derecha',
      '4-2': 'Este Recto',
      '4-3': 'Este Izquierda'
    }
    
    return movementNames[baseId] || movementNames[movementId] || baseId
  }

  // Navegar a una franja específica
  const navigateToFranja = async (franjaNum, user) => {
    try {
      console.log(`🔄 Navegando a franja ${franjaNum}`)
      
      // Si hay conteos en la franja actual, guardarlos primero
      if (getTotalFranjaActual() > 0) {
        console.log('💾 Guardando conteos de la franja actual antes de navegar')
        await handleSaveFranja(user)
      }
      
      // Cargar conteos de la franja destino si existen
      const franjaSaved = franjasSaved.find(f => f.franjaNum === franjaNum)
      if (franjaSaved) {
        console.log(`📂 Cargando conteos existentes de franja ${franjaNum}`)
        const conteosToLoad = {}
        franjaSaved.movimientos.forEach(mov => {
          conteosToLoad[mov.movimientoId] = { ...mov.conteos }
        })
        setConteoActual(conteosToLoad)
      } else {
        console.log(`🆕 Inicializando conteos vacíos para franja ${franjaNum}`)
        initializeFranjaConteos(selectedMovements)
      }
      
      setFranjaActual(franjaNum)
      console.log(`✅ Navegación a franja ${franjaNum} completada`)
      
    } catch (error) {
      console.error('❌ Error navegando a franja:', error)
      throw error
    }
  }

  // Cargar conteos de una franja específica
  const loadFranjaConteos = (franjaNum) => {
    const franjaSaved = franjasSaved.find(f => f.franjaNum === franjaNum)
    if (franjaSaved) {
      const conteosToLoad = {}
      franjaSaved.movimientos.forEach(mov => {
        conteosToLoad[mov.movimientoId] = { ...mov.conteos }
      })
      setConteoActual(conteosToLoad)
    } else {
      initializeFranjaConteos(selectedMovements)
    }
  }

  // Verificar si una franja está completada
  const isFranjaCompletada = (franjaNum) => {
    return franjasCompletadas.includes(franjaNum)
  }

  // Obtener el progreso total
  const getProgresoTotal = () => {
    const totalFranjas = conteoConfig ? franjaUtils.calculateTotalFranjas(conteoConfig.horaInicio, conteoConfig.horaFin) : 0
    const franjasCompletadasCount = franjasCompletadas.length
    const progressPercentage = totalFranjas > 0 ? (franjasCompletadasCount / totalFranjas) * 100 : 0
    
    return {
      totalFranjas,
      franjasCompletadas: franjasCompletadasCount,
      progressPercentage: Math.round(progressPercentage),
      isCompleto: progressPercentage >= 100
    }
  }

  // Finalizar conteo completo
  const finalizarConteo = async (user) => {
    try {
      console.log('🏁 Finalizando conteo completo')
      
      // Guardar la franja actual si tiene conteos
      if (getTotalFranjaActual() > 0) {
        console.log('💾 Guardando franja actual antes de finalizar')
        await handleSaveFranja(user)
      }
      
      // Marcar el conteo como completado
      const progreso = getProgresoTotal()
      console.log('📊 Progreso final:', progreso)
      
      if (progreso.isCompleto) {
        console.log('✅ Conteo completado exitosamente')
        return { success: true, message: 'Conteo completado exitosamente' }
      } else {
        console.log('⚠️ Conteo no está completo:', progreso)
        return { success: false, message: `Faltan ${progreso.totalFranjas - progreso.franjasCompletadas} franjas por completar` }
      }
      
    } catch (error) {
      console.error('❌ Error finalizando conteo:', error)
      throw error
    }
  }

  // Resetear todos los estados
  const resetAllStates = () => {
    setConteoConfig(null)
    setSelectedType(null)
    setSelectedMovements([])
    setMovementNamesMap({}) // ✅ Limpiar mapeo de nombres
    setFranjaActual(1)
    setFranjasCompletadas([])
    setConteoActual({})
    setFranjasSaved([])
  }

  const value = {
    // Estados
    conteoConfig,
    setConteoConfig,
    selectedType,
    setSelectedType,
    selectedMovements,
    setSelectedMovements,
    movementNamesMap,
    setMovementNamesMap,
    franjaActual,
    setFranjaActual,
    franjasCompletadas,
    setFranjasCompletadas,
    conteoActual,
    setConteoActual,
    franjasSaved,
    setFranjasSaved,
    historialConteos,
    setHistorialConteos,
    
    // Funciones
    initializeFranjaConteos,
    handleIncrement,
    handleResetFranja,
    getTotalFranjaActual,
    handleSaveFranja,
    getMovementImage,
    getMovementName,
    navigateToFranja,
    loadFranjaConteos,
    isFranjaCompletada,
    getProgresoTotal,
    finalizarConteo,
    resetAllStates
  }

  return (
    <ConteoContext.Provider value={value}>
      {children}
    </ConteoContext.Provider>
  )
}
