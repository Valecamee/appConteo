import React, { useState, useEffect } from 'react'
import './App.css'
import VehicleCounter from './components/VehicleCounter'
import Header from './components/Header'
import Login from './components/Login/Login'
import Dashboard from './components/Dashboard/Dashboard'
import ConteoConfig from './components/ConteoConfig/ConteoConfig'
import Selection from './components/Selection/Selection'
import MovementSelection from './components/MovementSelection/MovementSelection'
import FranjaProgress from './components/FranjaProgress/FranjaProgress'
import ConteoResumen from './components/ConteoResumen/ConteoResumen'
import ConteoHistorial from './components/ConteoHistorial/ConteoHistorial'
import { authService } from './services/authService'
import { conteoService } from './services/conteoService'

function App() {
  // Estados de autenticación
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Estados de navegación - NUEVO FLUJO
  const [currentScreen, setCurrentScreen] = useState('login')
  // Posibles pantallas: 'login', 'dashboard', 'config', 'selection', 'movements', 'counting', 'resumen', 'historial'

  // Estados de configuración del conteo
  const [conteoConfig, setConteoConfig] = useState(null)
  const [selectedType, setSelectedType] = useState(null)
  const [selectedMovements, setSelectedMovements] = useState([])

  // Estados del conteo por franjas - NUEVO SISTEMA
  const [franjaActual, setFranjaActual] = useState(1)
  const [franjasCompletadas, setFranjasCompletadas] = useState([])
  const [conteoActual, setConteoActual] = useState({}) // Conteos de la franja actual
  const [franjasSaved, setFranjasSaved] = useState([]) // Todas las franjas guardadas

  // Historial de conteos completados
  const [historialConteos, setHistorialConteos] = useState([])

  // Verificar estado de autenticación al cargar la app
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((currentUser) => {
      setUser(currentUser)
      setLoading(false)
      
      if (currentUser) {
        setCurrentScreen('dashboard')
      } else {
        setCurrentScreen('login')
      }
    })

    return () => unsubscribe()
  }, [])

  // Función para manejar login exitoso
  const handleLoginSuccess = (userData) => {
    setUser(userData)
    setCurrentScreen('dashboard')
    console.log('Usuario logueado:', userData)
  }

  // Función para cerrar sesión
  const handleLogout = async () => {
    try {
      await authService.logout()
      setUser(null)
      setCurrentScreen('login')
      resetAllStates()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  // Resetear todos los estados
  const resetAllStates = () => {
    setConteoConfig(null)
    setSelectedType(null)
    setSelectedMovements([])
    setFranjaActual(1)
    setFranjasCompletadas([])
    setConteoActual({})
    setFranjasSaved([])
  }

  // ======= NAVEGACIÓN ENTRE PANTALLAS =======

  // Dashboard -> Crear nuevo conteo
  const handleCreateNewCount = () => {
    resetAllStates()
    setCurrentScreen('config')
  }

  // Dashboard -> Ver historial
  const handleViewHistory = () => {
    setCurrentScreen('historial')
  }

  // Config -> Selection
  const handleConfigComplete = (config) => {
  // Generar ID único para todo el conteo
  const conteoId = `${user.uid}_${config.nombreVideo}_${config.fecha}_${Date.now()}`
  
  setConteoConfig({
    ...config,
    conteoId // Agregar el ID único
  })
  setCurrentScreen('selection')
  console.log('Configuración completada:', config)
}

  // Selection -> MovementSelection
  const handleSelectionChoice = (type) => {
    setSelectedType(type)
    setCurrentScreen('movements')
    console.log('Tipo seleccionado:', type)
  }

  // MovementSelection -> Counting
  const handleMovementChoice = (type, movements) => {
    setSelectedType(type)
    setSelectedMovements(movements)
    setCurrentScreen('counting')
    
    // Inicializar conteos para la primera franja
    initializeFranjaConteos(movements)
    
    console.log('Iniciando conteo:', type, movements)
  }

  // Volver al dashboard desde cualquier pantalla
  const handleBackToDashboard = () => {
    resetAllStates()
    setCurrentScreen('dashboard')
  }

  // Volver atrás en el flujo
  const handleBack = (targetScreen) => {
    setCurrentScreen(targetScreen)
  }

  // ======= LÓGICA DE FRANJAS =======

  // Inicializar conteos para una franja
  const initializeFranjaConteos = (movements) => {
    const initialCounts = {}
    movements.forEach(movement => {
      initialCounts[movement] = {
        carros: 0,
        buses: 0,
        camiones: 0,
        motos: 0,
        bicicletas: 0,
        peatones: 0
      }
    })
    setConteoActual(initialCounts)
  }

  // Incrementar contador en la franja actual
  const handleIncrement = (movementId, vehicleType) => {
    console.log('🔄 Incrementando:', movementId, vehicleType, 'Franja:', franjaActual)
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

  // Guardar franja actual y avanzar
  const handleSaveFranja = async () => {
  try {
    // Calcular horario de la franja
    const [startHour, startMin] = conteoConfig.horaInicio.split(':').map(Number)
    const startTotalMin = startHour * 60 + startMin
    const franjaStartMin = startTotalMin + ((franjaActual - 1) * 15)
    const franjaEndMin = franjaStartMin + 15
    
    const franjaInicio = `${Math.floor(franjaStartMin / 60).toString().padStart(2, '0')}:${(franjaStartMin % 60).toString().padStart(2, '0')}`
    const franjaFin = `${Math.floor(franjaEndMin / 60).toString().padStart(2, '0')}:${(franjaEndMin % 60).toString().padStart(2, '0')}`

    // Preparar datos para Firebase
    const franjaData = {
      // Identificación del usuario
      userId: user.uid,
      userName: user.fullName || user.email.split('@')[0],
      
      // Configuración del conteo
      nombreVideo: conteoConfig.nombreVideo,
      fecha: conteoConfig.fecha,
      tipo: selectedType === 'vehicles' ? 'Vehículos' : 'Peatones',
      
      // Datos de la franja
      franja: franjaActual,
      horaInicio: franjaInicio,
      horaFin: franjaFin,
      
      // Conteo único ID
      conteoId: conteoConfig.conteoId || `${user.uid}_${conteoConfig.nombreVideo}_${conteoConfig.fecha}`,
      
      // Movimientos con sus conteos
      movimientos: selectedMovements.map(movId => ({
        movimientoId: movId,
        conteos: { ...conteoActual[movId] }
      }))
    }

    // Guardar en Firebase
    console.log('🔄 Guardando franja en Firebase...')
    await conteoService.guardarFranja(franjaData)
    
    // MANTENER la lógica existente para el estado local
    const franjaDataLocal = {
      franjaNum: franjaActual,
      movimientos: selectedMovements.map(movId => ({
        movimientoId: movId,
        conteos: { ...conteoActual[movId] }
      }))
    }

    // Guardar en el estado local (para la funcionalidad actual)
    setFranjasSaved(prev => {
      const updated = prev.filter(f => f.franjaNum !== franjaActual)
      return [...updated, franjaDataLocal].sort((a, b) => a.franjaNum - b.franjaNum)
    })

    // Marcar como completada
    if (!franjasCompletadas.includes(franjaActual)) {
      setFranjasCompletadas(prev => [...prev, franjaActual].sort((a, b) => a - b))
    }

    // Mostrar mensaje de éxito
    console.log('✅ Franja guardada en Firebase y localmente')

    // Avanzar a la siguiente franja o finalizar
    if (franjaActual < conteoConfig.totalFranjas) {
      setFranjaActual(prev => prev + 1)
      initializeFranjaConteos(selectedMovements)
    } else {
      // Conteo completado
      handleConteoCompleto()
    }

  } catch (error) {
    console.error('❌ Error guardando franja:', error)
    alert('Error al guardar la franja en la base de datos. Inténtalo de nuevo.')
  }
}

  // Navegar a una franja específica
  const handleNavigateToFranja = (franjaNum) => {
    if (franjaNum <= franjaActual || franjasCompletadas.includes(franjaNum)) {
      setFranjaActual(franjaNum)
      
      // Cargar datos de la franja si existe
      const franjaExistente = franjasSaved.find(f => f.franjaNum === franjaNum)
      if (franjaExistente) {
        const conteos = {}
        franjaExistente.movimientos.forEach(mov => {
          conteos[mov.movimientoId] = { ...mov.conteos }
        })
        setConteoActual(conteos)
      } else {
        initializeFranjaConteos(selectedMovements)
      }
    }
  }

  // Finalizar conteo completo
  const handleConteoCompleto = () => {
    setCurrentScreen('resumen')
  }

  // ======= FUNCIONES DE RESUMEN =======

  // Construir datos completos del conteo para el resumen
  const buildConteoCompleto = () => {
    return {
      id: Date.now(),
      config: conteoConfig,
      franjas: franjasSaved,
      fechaCreacion: new Date().toISOString(),
      usuario: user.fullName || user.email
    }
  }

  // Exportar CSV del conteo actual
  const handleExportCurrentCSV = () => {
    const conteoCompleto = buildConteoCompleto()
    exportConteoToCSV(conteoCompleto)
  }

  // Guardar conteo en historial
  const handleSaveToHistory = () => {
    const conteoCompleto = buildConteoCompleto()
    setHistorialConteos(prev => [conteoCompleto, ...prev])
    
    // Mostrar mensaje de éxito
    alert('✅ Conteo guardado exitosamente en el historial')
    
    // Volver al dashboard
    handleBackToDashboard()
  }

  // Editar una franja desde el resumen
  const handleEditFranja = (franjaNum) => {
    setFranjaActual(franjaNum)
    setCurrentScreen('counting')
    
    // Cargar datos de la franja
    const franjaExistente = franjasSaved.find(f => f.franjaNum === franjaNum)
    if (franjaExistente) {
      const conteos = {}
      franjaExistente.movimientos.forEach(mov => {
        conteos[mov.movimientoId] = { ...mov.conteos }
      })
      setConteoActual(conteos)
    }
  }

  // ======= FUNCIONES DE HISTORIAL =======

  // Ver detalles de un conteo del historial
  const handleViewConteo = (conteo) => {
    // Podrías implementar una vista detallada aquí
    console.log('Ver conteo:', conteo)
    alert(`📊 Conteo: ${conteo.config.nombreVideo}\nTotal de franjas: ${conteo.franjas.length}`)
  }

  // Eliminar conteo del historial
  const handleDeleteConteo = (conteoId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este conteo?')) {
      setHistorialConteos(prev => prev.filter(c => c.id !== conteoId))
    }
  }

  // Exportar conteo individual
  const handleExportConteo = (conteo) => {
    exportConteoToCSV(conteo)
  }

  // Exportar múltiples conteos
  const handleExportMultiple = (conteoIds) => {
    const conteosToExport = historialConteos.filter(c => conteoIds.includes(c.id))
    
    if (conteosToExport.length === 1) {
      exportConteoToCSV(conteosToExport[0])
    } else {
      exportMultipleConteosToCSV(conteosToExport)
    }
  }

  // ======= FUNCIONES DE EXPORTACIÓN =======

  // Exportar un conteo a CSV
  const exportConteoToCSV = (conteo) => {
    const headers = [
      'Nombre del Video', 'Fecha', 'Usuario', 'Tipo', 'Franja', 'Hora Inicio', 'Hora Fin',
      'Movimiento', 'Carros', 'Buses', 'Camiones', 'Motos', 'Bicicletas', 'Peatones', 'Total Movimiento'
    ]

    const csvRows = [headers.join(',')]

    conteo.franjas.forEach(franja => {
      // Calcular horario de la franja
      const [startHour, startMin] = conteo.config.horaInicio.split(':').map(Number)
      const startTotalMin = startHour * 60 + startMin
      const franjaStartMin = startTotalMin + ((franja.franjaNum - 1) * 15)
      const franjaEndMin = franjaStartMin + 15
      
      const franjaInicio = `${Math.floor(franjaStartMin / 60).toString().padStart(2, '0')}:${(franjaStartMin % 60).toString().padStart(2, '0')}`
      const franjaFin = `${Math.floor(franjaEndMin / 60).toString().padStart(2, '0')}:${(franjaEndMin % 60).toString().padStart(2, '0')}`

      franja.movimientos.forEach(movimiento => {
        const total = Object.values(movimiento.conteos).reduce((sum, val) => sum + (val || 0), 0)
        
        const row = [
          conteo.config.nombreVideo,
          conteo.config.fecha,
          conteo.usuario,
          conteo.config.tipo === 'vehicles' ? 'Vehículos' : 'Peatones',
          franja.franjaNum,
          franjaInicio,
          franjaFin,
          movimiento.movimientoId,
          movimiento.conteos.carros || 0,
          movimiento.conteos.buses || 0,
          movimiento.conteos.camiones || 0,
          movimiento.conteos.motos || 0,
          movimiento.conteos.bicicletas || 0,
          movimiento.conteos.peatones || 0,
          total
        ]
        csvRows.push(row.join(','))
      })
    })

    const csvContent = csvRows.join('\n')
    downloadCSV(csvContent, `${conteo.config.nombreVideo}_${conteo.config.fecha}.csv`)
  }

  // Exportar múltiples conteos
  const exportMultipleConteosToCSV = (conteos) => {
    const headers = [
      'Nombre del Video', 'Fecha', 'Usuario', 'Tipo', 'Franja', 'Hora Inicio', 'Hora Fin',
      'Movimiento', 'Carros', 'Buses', 'Camiones', 'Motos', 'Bicicletas', 'Peatones', 'Total Movimiento'
    ]

    const csvRows = [headers.join(',')]

    conteos.forEach(conteo => {
      conteo.franjas.forEach(franja => {
        const [startHour, startMin] = conteo.config.horaInicio.split(':').map(Number)
        const startTotalMin = startHour * 60 + startMin
        const franjaStartMin = startTotalMin + ((franja.franjaNum - 1) * 15)
        const franjaEndMin = franjaStartMin + 15
        
        const franjaInicio = `${Math.floor(franjaStartMin / 60).toString().padStart(2, '0')}:${(franjaStartMin % 60).toString().padStart(2, '0')}`
        const franjaFin = `${Math.floor(franjaEndMin / 60).toString().padStart(2, '0')}:${(franjaEndMin % 60).toString().padStart(2, '0')}`

        franja.movimientos.forEach(movimiento => {
          const total = Object.values(movimiento.conteos).reduce((sum, val) => sum + (val || 0), 0)
          
          const row = [
            conteo.config.nombreVideo,
            conteo.config.fecha,
            conteo.usuario,
            conteo.config.tipo === 'vehicles' ? 'Vehículos' : 'Peatones',
            franja.franjaNum,
            franjaInicio,
            franjaFin,
            movimiento.movimientoId,
            movimiento.conteos.carros || 0,
            movimiento.conteos.buses || 0,
            movimiento.conteos.camiones || 0,
            movimiento.conteos.motos || 0,
            movimiento.conteos.bicicletas || 0,
            movimiento.conteos.peatones || 0,
            total
          ]
          csvRows.push(row.join(','))
        })
      })
    })

    const csvContent = csvRows.join('\n')
    const timestamp = new Date().toISOString().split('T')[0]
    downloadCSV(csvContent, `conteos_multiples_${timestamp}.csv`)
  }

  // Función helper para descargar CSV
  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Función para obtener la imagen según el movimiento y tipo
  const getMovementImage = (movementId, type) => {
    const getDirection = (movementId) => {
      if (['9(1)', '1', '5', '10(1)'].includes(movementId)) return 'norte'
      if (['10(3)', '7', '3', '9(3)'].includes(movementId)) return 'oeste'
      if (['10(2)', '6', '2', '9(2)'].includes(movementId)) return 'sur'
      if (['10(4)', '8', '4', '9(4)'].includes(movementId)) return 'este'
      if (['1-1', '1-2', '1-3'].includes(movementId)) return 'norte'
      if (['3-1', '3-2', '3-3'].includes(movementId)) return 'oeste'
      if (['2-1', '2-2', '2-3'].includes(movementId)) return 'sur'
      if (['4-1', '4-2', '4-3'].includes(movementId)) return 'este'
      return 'norte'
    }

    const direction = getDirection(movementId)
    return type === 'vehicles' ? `/images/${direction}.png` : `/images/R${direction}.png`
  }

  // Mostrar loading mientras verificamos autenticación
  if (loading) {
    return (
      <div className="app">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh', 
          color: 'white',
          fontSize: '1.2rem'
        }}>
          Cargando...
        </div>
      </div>
    )
  }

  // ======= RENDERIZAR PANTALLA ACTUAL =======
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'login':
        return <Login onLoginSuccess={handleLoginSuccess} />
      
      case 'dashboard':
        return (
          <Dashboard 
            user={user}
            onLogout={handleLogout}
            onCreateNewCount={handleCreateNewCount}
            onViewHistory={handleViewHistory}
          />
        )
      
      case 'config':
        return (
          <ConteoConfig 
            user={user}
            onBack={() => handleBack('dashboard')}
            onContinue={handleConfigComplete}
          />
        )
      
      case 'selection':
        return (
          <Selection 
            user={user}
            onLogout={handleLogout}
            onSelect={handleSelectionChoice}
          />
        )
      
      case 'movements':
        return (
          <MovementSelection 
            user={user}
            selectedType={selectedType}
            onBack={() => handleBack('selection')}
            onStartCounting={handleMovementChoice}
          />
        )
      
      case 'counting':
        return (
          <div className="app">
            {/* Partículas flotantes */}
            <div className="floating-particle"></div>
            <div className="floating-particle"></div>
            <div className="floating-particle"></div>
            <div className="floating-particle"></div>
            <div className="floating-particle"></div>
            <div className="floating-particle"></div>
            <div className="floating-particle"></div>
            <div className="floating-particle"></div>
            <div className="floating-particle"></div>

            {/* Header */}
            <Header user={user} onLogout={handleLogout} />
            
            {/* Progreso de franjas */}
            <FranjaProgress 
              franjaActual={franjaActual}
              totalFranjas={conteoConfig.totalFranjas}
              horaInicio={conteoConfig.horaInicio}
              horaFin={conteoConfig.horaFin}
              nombreVideo={conteoConfig.nombreVideo}
              fecha={conteoConfig.fecha}
              onNavigateToFranja={handleNavigateToFranja}
              franjasCompletadas={franjasCompletadas}
            />
            
            <div className="container">
              {/* Grid de movimientos */}
              <div className="movements-grid">
                {selectedMovements.map((movementId) => (
                  <div key={movementId} className="section">
                    <div className="section-header">
                      <h2 className="section-title">{movementId}</h2>
                      <div className="section-total">
                        <span className="total-label">Total:</span>
                        <span className="total-value">
                          {Object.values(conteoActual[movementId] || {}).reduce((sum, count) => sum + (count || 0), 0)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Imagen del movimiento */}
                    <div className="movement-image-container">
                      <img 
                        src={getMovementImage(movementId, selectedType)}
                        alt={`Movimiento ${movementId}`}
                        className="movement-image"
                        onError={(e) => {
                          e.target.parentElement.style.display = 'none'
                        }}
                      />
                    </div>
                    
                    <VehicleCounter 
                      counts={conteoActual[movementId] || {}}
                      onIncrement={(vehicleType) => handleIncrement(movementId, vehicleType)}
                    />
                  </div>
                ))}
              </div>

              {/* Acciones de la franja */}
              <div className="franja-actions">
                <div className="franja-info">
                  <p style={{ color: '#4ecdc4', fontSize: '1.2rem', fontWeight: '600', textAlign: 'center' }}>
                    Total de la franja actual: <span style={{ color: '#ff6b6b', fontSize: '1.4rem' }}>{getTotalFranjaActual()}</span>
                  </p>
                </div>
                
                <div className="action-buttons">
                  <button 
                    className="reset-franja-button"
                    onClick={handleResetFranja}
                    style={{
                      background: 'rgba(255, 107, 107, 0.2)',
                      border: '2px solid rgba(255, 107, 107, 0.5)',
                      color: '#ff6b6b',
                      padding: '12px 25px',
                      borderRadius: '15px',
                      cursor: 'pointer',
                      marginRight: '15px',
                      fontWeight: '600'
                    }}
                  >
                    🔄 Reiniciar Franja
                  </button>
                  
                  <button 
                    className="save-franja-button"
                    onClick={handleSaveFranja}
                    style={{
                      background: 'linear-gradient(45deg, #26de81, #20bf6b)',
                      border: 'none',
                      color: 'white',
                      padding: '15px 30px',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      boxShadow: '0 6px 20px rgba(38, 222, 129, 0.4)'
                    }}
                  >
                    {franjaActual === conteoConfig.totalFranjas ? '🏁 Finalizar Conteo' : '💾 Guardar Franja y Continuar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'resumen':
        return (
          <ConteoResumen 
            conteoData={buildConteoCompleto()}
            onExportCSV={handleExportCurrentCSV}
            onSaveToHistory={handleSaveToHistory}
            onBackToDashboard={handleBackToDashboard}
            onEditFranja={handleEditFranja}
          />
        )
      
      case 'historial':
        return (
          <ConteoHistorial 
            user={user}
            historialConteos={historialConteos}
            onBack={() => handleBack('dashboard')}
            onViewConteo={handleViewConteo}
            onDeleteConteo={handleDeleteConteo}
            onExportConteo={handleExportConteo}
            onExportAll={handleExportMultiple}
          />
        )
      
      default:
        return <Login onLoginSuccess={handleLoginSuccess} />
    }
  }

  return renderCurrentScreen()
}

export default App