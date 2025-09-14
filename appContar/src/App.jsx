import React, { useState } from 'react'
import './App.css'
import VehicleCounter from './components/VehicleCounter'
import Header from './components/Header'
import SavedCounts from './components/SavedCounts'

function App() {
  const [movimiento1Counts, setMovimiento1Counts] = useState({
    autos: 0,
    microbus: 0,
    buseta: 0,
    bus: 0,
    camion2ejes: 0,
    camion2ejesGrande: 0,
    camion34ejes: 0,
    camion5ejes: 0,
    camion6ejes: 0,
    motos: 0,
    bicicletas: 0
  })

  const [movimiento2Counts, setMovimiento2Counts] = useState({
    autos: 0,
    microbus: 0,
    buseta: 0,
    bus: 0,
    camion2ejes: 0,
    camion2ejesGrande: 0,
    camion34ejes: 0,
    camion5ejes: 0,
    camion6ejes: 0,
    motos: 0,
    bicicletas: 0
  })

  const [savedCounts, setSavedCounts] = useState([])
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [countName, setCountName] = useState('')

  const handleIncrement = (section, vehicleType) => {
    if (section === 'movimiento1') {
      setMovimiento1Counts(prev => ({
        ...prev,
        [vehicleType]: prev[vehicleType] + 1
      }))
    } else {
      setMovimiento2Counts(prev => ({
        ...prev,
        [vehicleType]: prev[vehicleType] + 1
      }))
    }
  }

  const handleReset = (section) => {
    if (section === 'movimiento1') {
      setMovimiento1Counts({
        autos: 0,
        microbus: 0,
        buseta: 0,
        bus: 0,
        camion2ejes: 0,
        camion2ejesGrande: 0,
        camion34ejes: 0,
        camion5ejes: 0,
        camion6ejes: 0,
        motos: 0,
        bicicletas: 0
      })
    } else {
      setMovimiento2Counts({
        autos: 0,
        microbus: 0,
        buseta: 0,
        bus: 0,
        camion2ejes: 0,
        camion2ejesGrande: 0,
        camion34ejes: 0,
        camion5ejes: 0,
        camion6ejes: 0,
        motos: 0,
        bicicletas: 0
      })
    }
  }

  const getTotalCount = (counts) => {
    return Object.values(counts).reduce((sum, count) => sum + count, 0)
  }

  const handleSaveCount = () => {
    if (countName.trim() === '') {
      alert('Por favor ingresa un nombre para el conteo')
      return
    }

    const newCount = {
      id: Date.now(),
      name: countName,
      date: new Date().toLocaleString('es-ES'),
      movimiento1: { ...movimiento1Counts },
      movimiento2: { ...movimiento2Counts },
      total1: getTotalCount(movimiento1Counts),
      total2: getTotalCount(movimiento2Counts)
    }

    setSavedCounts(prev => [...prev, newCount])
    setCountName('')
    setShowSaveModal(false)
  }

  const handleDeleteCount = (id) => {
    setSavedCounts(prev => prev.filter(count => count.id !== id))
  }

  const handleDownload = () => {
    if (savedCounts.length === 0) {
      alert('No hay conteos guardados para descargar')
      return
    }

    const csvContent = generateCSV()
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `conteos_vehiculos_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const generateCSV = () => {
    const headers = [
      'Nombre del Conteo',
      'Fecha y Hora',
      '',
      '=== MOVIMIENTO 1 ===',
      'Autos',
      'Microbus',
      'Buseta',
      'Bus',
      'Camión 2 Ejes',
      'Camión 2 Ejes Grande',
      'Camión 3-4 Ejes',
      'Camión 5 Ejes',
      'Camión 6 Ejes',
      'Motos',
      'Bicicletas',
      'TOTAL MOVIMIENTO 1',
      '',
      '=== MOVIMIENTO 2 ===',
      'Autos',
      'Microbus',
      'Buseta',
      'Bus',
      'Camión 2 Ejes',
      'Camión 2 Ejes Grande',
      'Camión 3-4 Ejes',
      'Camión 5 Ejes',
      'Camión 6 Ejes',
      'Motos',
      'Bicicletas',
      'TOTAL MOVIMIENTO 2',
      '',
      'TOTAL GENERAL'
    ]

    const csvRows = [headers.join(',')]

    savedCounts.forEach(count => {
      const row = [
        count.name,
        count.date,
        '',
        '',
        count.movimiento1.autos,
        count.movimiento1.microbus,
        count.movimiento1.buseta,
        count.movimiento1.bus,
        count.movimiento1.camion2ejes,
        count.movimiento1.camion2ejesGrande,
        count.movimiento1.camion34ejes,
        count.movimiento1.camion5ejes,
        count.movimiento1.camion6ejes,
        count.movimiento1.motos,
        count.movimiento1.bicicletas,
        count.total1,
        '',
        '',
        count.movimiento2.autos,
        count.movimiento2.microbus,
        count.movimiento2.buseta,
        count.movimiento2.bus,
        count.movimiento2.camion2ejes,
        count.movimiento2.camion2ejesGrande,
        count.movimiento2.camion34ejes,
        count.movimiento2.camion5ejes,
        count.movimiento2.camion6ejes,
        count.movimiento2.motos,
        count.movimiento2.bicicletas,
        count.total2,
        '',
        count.total1 + count.total2
      ]
      csvRows.push(row.join(','))
    })

    return csvRows.join('\n')
  }

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

      <Header />
      
      <div className="container">
        <div className="sections-container">
          {/* Movimiento 1 */}
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Movimiento 1</h2>
              <div className="section-total">
                <span className="total-label">Total:</span>
                <span className="total-value">{getTotalCount(movimiento1Counts)}</span>
              </div>
              <button 
                className="reset-button"
                onClick={() => handleReset('movimiento1')}
              >
                Reiniciar
              </button>
            </div>
            <VehicleCounter 
              counts={movimiento1Counts}
              onIncrement={(vehicleType) => handleIncrement('movimiento1', vehicleType)}
            />
          </div>

          {/* Movimiento 2 */}
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Movimiento 2</h2>
              <div className="section-total">
                <span className="total-label">Total:</span>
                <span className="total-value">{getTotalCount(movimiento2Counts)}</span>
              </div>
              <button 
                className="reset-button"
                onClick={() => handleReset('movimiento2')}
              >
                Reiniciar
              </button>
            </div>
            <VehicleCounter 
              counts={movimiento2Counts}
              onIncrement={(vehicleType) => handleIncrement('movimiento2', vehicleType)}
            />
          </div>
        </div>

        {/* Botón Guardar Conteo */}
        <div className="save-section">
          <button 
            className="save-button"
            onClick={() => setShowSaveModal(true)}
          >
            💾 Guardar Conteo
          </button>
        </div>

        {/* Modal para guardar */}
        {showSaveModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Guardar Conteo</h3>
              <input
                type="text"
                placeholder="Nombre del conteo..."
                value={countName}
                onChange={(e) => setCountName(e.target.value)}
                className="count-name-input"
                autoFocus
              />
              <div className="modal-buttons">
                <button 
                  className="modal-button cancel"
                  onClick={() => {
                    setShowSaveModal(false)
                    setCountName('')
                  }}
                >
                  Cancelar
                </button>
                <button 
                  className="modal-button save"
                  onClick={handleSaveCount}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de conteos guardados */}
        <SavedCounts 
          savedCounts={savedCounts}
          onDelete={handleDeleteCount}
          onDownload={handleDownload}
        />
      </div>
    </div>
  )
}

export default App 