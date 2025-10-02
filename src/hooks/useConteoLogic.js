import { useConteo } from './useConteo'
import { useAuth } from './useAuth'
import { useNavigation } from './useNavigation'
import { franjaUtils } from '../utils/franjaUtils'

export const useConteoLogic = () => {
  const conteoContext = useConteo()
  const { user } = useAuth()
  const { navigateTo } = useNavigation()

  // Configurar conteo
  const handleConfigComplete = (config) => {
    const conteoId = `${user.uid}_${config.nombreVideo}_${config.fecha}_${Date.now()}`
    
    conteoContext.setConteoConfig({
      ...config,
      conteoId
    })
    navigateTo('selection')
  }

  // Seleccionar tipo de conteo
  const handleSelectionChoice = (type) => {
    conteoContext.setSelectedType(type)
    navigateTo('movements')
  }

  // Seleccionar movimientos
  const handleMovementChoice = (type, movements) => {
    conteoContext.setSelectedType(type)
    conteoContext.setSelectedMovements(movements)
    navigateTo('counting')
    conteoContext.initializeFranjaConteos(movements, type)
  }

  // Iniciar conteo desde asignación
  const handleStartCountingFromAssignment = (conteoConfig, selectedMovements, selectedType, movementNames = []) => {
    console.log('🎯 Iniciando conteo con movimientos:', selectedMovements)
    console.log('🏷️ Nombres de movimientos:', movementNames)
    
    conteoContext.setConteoConfig(conteoConfig)
    conteoContext.setSelectedType(selectedType)
    conteoContext.setSelectedMovements(selectedMovements)
    
    // ✅ Agregar mapeo de IDs a nombres si están disponibles
    if (movementNames.length > 0 && movementNames.length === selectedMovements.length) {
      const movementMap = {}
      selectedMovements.forEach((id, index) => {
        movementMap[id] = movementNames[index]
      })
      conteoContext.setMovementNamesMap(movementMap)
      console.log('🗺️ Mapeo de movimientos creado:', movementMap)
    }
    
    const totalFranjas = franjaUtils.calculateTotalFranjas(
      conteoConfig.horaInicio, 
      conteoConfig.horaFin
    )
    
    const siguienteFranja = conteoConfig.franjasCompletadas + 1
    
    if (siguienteFranja <= totalFranjas) {
      conteoContext.setFranjaActual(siguienteFranja)
      
      const completadas = []
      for (let i = 1; i < siguienteFranja; i++) {
        completadas.push(i)
      }
      conteoContext.setFranjasCompletadas(completadas)
      
      conteoContext.initializeFranjaConteos(selectedMovements, selectedType)
      navigateTo('counting')
    } else {
      alert('✅ Este conteo ya está completado')
    }
  }

  // Guardar franja y avanzar
  const handleSaveFranjaAndContinue = async () => {
    try {
      await conteoContext.handleSaveFranja(user)
      
      if (conteoContext.franjaActual < conteoContext.conteoConfig.totalFranjas) {
        conteoContext.setFranjaActual(prev => prev + 1)
        conteoContext.initializeFranjaConteos(conteoContext.selectedMovements, conteoContext.selectedType)
      } else {
        navigateTo('resumen')
      }
    } catch (error) {
      console.error('Error guardando franja:', error)
      alert('Error al guardar la franja en la base de datos. Inténtalo de nuevo.')
    }
  }

  return {
    handleConfigComplete,
    handleSelectionChoice,
    handleMovementChoice,
    handleStartCountingFromAssignment,
    handleSaveFranjaAndContinue
  }
}
