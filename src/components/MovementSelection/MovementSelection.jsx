// src/components/MovementSelection/MovementSelection.jsx
import React, { useState } from 'react'
import './MovementSelection.css'

const MovementSelection = ({ user, selectedType, onBack, onStartCounting }) => {
  const [selectedMovements, setSelectedMovements] = useState([])

  const getMovementData = () => {
    if (selectedType === 'vehicles') {
      return {
        title: 'Motorizados y Bicicletas',
        groups: [
          {
            id: 'norte',
            name: 'Acceso Norte',
            icon: '⬆️',
            color: '#4ecdc4',
            movements: [
              { id: '9(1)', name: '9(1)' },
              { id: '1', name: '1' },
              { id: '5', name: '5' },
              { id: '10(1)', name: '10(1)' }
            ]
          },
          {
            id: 'oeste',
            name: 'Acceso Oeste',
            icon: '⬅️',
            color: '#45b7d1',
            movements: [
              { id: '10(3)', name: '10(3)' },
              { id: '7', name: '7' },
              { id: '3', name: '3' },
              { id: '9(3)', name: '9(3)' }
            ]
          },
          {
            id: 'sur',
            name: 'Acceso Sur',
            icon: '⬇️',
            color: '#96ceb4',
            movements: [
              { id: '10(2)', name: '10(2)' },
              { id: '6', name: '6' },
              { id: '2', name: '2' },
              { id: '9(2)', name: '9(2)' }
            ]
          },
          {
            id: 'este',
            name: 'Acceso Este',
            icon: '➡️',
            color: '#ff6b6b',
            movements: [
              { id: '10(4)', name: '10(4)' },
              { id: '8', name: '8' },
              { id: '4', name: '4' },
              { id: '9(4)', name: '9(4)' }
            ]
          }
        ]
      }
    } else {
      return {
        title: 'Peatones',
        groups: [
          {
            id: 'rama_norte',
            name: 'Rama Norte',
            icon: '⬆️',
            color: '#4ecdc4',
            movements: [
              { id: '1-1', name: '1-1' },
              { id: '1-2', name: '1-2' },
              { id: '1-3', name: '1-3' }
            ]
          },
          {
            id: 'rama_oeste',
            name: 'Rama Oeste',
            icon: '⬅️',
            color: '#45b7d1',
            movements: [
              { id: '3-1', name: '3-1' },
              { id: '3-2', name: '3-2' },
              { id: '3-3', name: '3-3' }
            ]
          },
          {
            id: 'rama_sur',
            name: 'Rama Sur',
            icon: '⬇️',
            color: '#96ceb4',
            movements: [
              { id: '2-1', name: '2-1' },
              { id: '2-2', name: '2-2' },
              { id: '2-3', name: '2-3' }
            ]
          },
          {
            id: 'rama_este',
            name: 'Rama Este',
            icon: '➡️',
            color: '#ff6b6b',
            movements: [
              { id: '4-1', name: '4-1' },
              { id: '4-2', name: '4-2' },
              { id: '4-3', name: '4-3' }
            ]
          }
        ]
      }
    }
  }

  const movementData = getMovementData()

  const handleMovementToggle = (movementId) => {
    setSelectedMovements(prev => {
      if (prev.includes(movementId)) {
        return prev.filter(id => id !== movementId)
      } else {
        return [...prev, movementId]
      }
    })
  }

  const handleGroupToggle = (groupMovements) => {
    const groupIds = groupMovements.map(m => m.id)
    const allSelected = groupIds.every(id => selectedMovements.includes(id))
    
    if (allSelected) {
      // Deseleccionar todos del grupo
      setSelectedMovements(prev => prev.filter(id => !groupIds.includes(id)))
    } else {
      // Seleccionar todos del grupo
      setSelectedMovements(prev => {
        const newSelected = [...prev]
        groupIds.forEach(id => {
          if (!newSelected.includes(id)) {
            newSelected.push(id)
          }
        })
        return newSelected
      })
    }
  }

  const handleSelectAll = () => {
    const allMovements = movementData.groups.flatMap(group => 
      group.movements.map(m => m.id)
    )
    
    if (selectedMovements.length === allMovements.length) {
      setSelectedMovements([])
    } else {
      setSelectedMovements(allMovements)
    }
  }

  const handleStartCounting = () => {
    if (selectedMovements.length === 0) {
      alert('Por favor selecciona al menos un movimiento')
      return
    }
    
    onStartCounting(selectedType, selectedMovements)
  }

  return (
    <div className="movement-container">
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

      {/* Botón de volver */}
      <button className="back-button" onClick={onBack}>
        ← Volver
      </button>

      {/* Header */}
      <div className="movement-header">
        <h1 className="movement-title">Seleccionar Movimientos</h1>
        <p className="movement-subtitle">Conteo de: {movementData.title}</p>
        <p className="movement-description">
          Selecciona los movimientos que deseas contar
        </p>
      </div>

      {/* Imagen central según la selección */}
      <div className="central-image-container">
        <img 
          src={selectedType === 'vehicles' ? '/images/motorized.jpeg' : '/images/pedestrians.jpeg'}
          alt={movementData.title}
          className="central-image"
          onError={(e) => {
            e.target.style.display = 'none'
          }}
        />
      </div>

      {/* Controles generales */}
      <div className="movement-controls">
        <div className="selected-count">
          Seleccionados: {selectedMovements.length} movimientos
        </div>
      </div>

      {/* Grid de grupos */}
      <div className="movement-groups">
        {movementData.groups.map((group) => {
          const groupIds = group.movements.map(m => m.id)
          const selectedInGroup = groupIds.filter(id => selectedMovements.includes(id)).length
          const allGroupSelected = selectedInGroup === groupIds.length

          return (
            <div 
              key={group.id} 
              className="movement-group"
              style={{ '--group-color': group.color }}
            >
              <div className="group-header">
                <div className="group-title">
                  <span className="group-icon">{group.icon}</span>
                  <h3 className="group-name">{group.name}</h3>
                </div>
                <button
                  className={`group-toggle ${allGroupSelected ? 'selected' : ''}`}
                  onClick={() => handleGroupToggle(group.movements)}
                >
                  {allGroupSelected ? '✅' : '☐'} Grupo ({selectedInGroup}/{groupIds.length})
                </button>
              </div>

              <div className="group-movements">
                {group.movements.map((movement) => {
                  const isSelected = selectedMovements.includes(movement.id)
                  
                  return (
                    <div 
                      key={movement.id}
                      className={`movement-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleMovementToggle(movement.id)}
                    >
                      <div className="movement-checkbox">
                        {isSelected ? '✅' : '☐'}
                      </div>
                      <span className="movement-name">{movement.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Botón de iniciar conteo */}
      <div className="start-counting">
        <button 
          className={`start-button ${selectedMovements.length > 0 ? 'enabled' : 'disabled'}`}
          onClick={handleStartCounting}
          disabled={selectedMovements.length === 0}
        >
          🎯 Iniciar Conteo ({selectedMovements.length} movimientos)
        </button>
      </div>
    </div>
  )
}

export default MovementSelection