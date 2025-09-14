import React from 'react'
import './VehicleCounter.css'

const VehicleCounter = ({ counts, onIncrement }) => {
  const vehicles = [
    { key: 'autos', name: 'Autos', color: '#ff6b6b' },
    { key: 'microbus', name: 'Microbus', color: '#4ecdc4' },
    { key: 'buseta', name: 'Buseta', color: '#45b7d1' },
    { key: 'bus', name: 'Bus', color: '#96ceb4' },
    { key: 'camion2ejes', name: 'Camión 2 Ejes', color: '#feca57' },
    { key: 'camion2ejesGrande', name: 'Camión 2 Ejes Grande', color: '#ff9ff3' },
    { key: 'camion34ejes', name: 'Camión 3-4 Ejes', color: '#54a0ff' },
    { key: 'camion5ejes', name: 'Camión 5 Ejes', color: '#5f27cd' },
    { key: 'camion6ejes', name: 'Camión 6 Ejes', color: '#00d2d3' },
    { key: 'motos', name: 'Motos', color: '#ff6348' },
    { key: 'bicicletas', name: 'Bicicletas', color: '#26de81' }
  ]

  return (
    <div className="vehicle-counter">
      <div className="vehicles-grid">
        {vehicles.map((vehicle) => (
          <div key={vehicle.key} className="vehicle-item">
            <button
              className="vehicle-button"
              onClick={() => onIncrement(vehicle.key)}
              style={{ '--vehicle-color': vehicle.color }}
            >
              <span className="vehicle-name">{vehicle.name}</span>
            </button>
            <div className="counter-display">
              <span className="counter-value">{counts[vehicle.key]}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default VehicleCounter 