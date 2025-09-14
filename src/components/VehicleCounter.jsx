import React from 'react'
import { IoCar, IoBicycleSharp } from 'react-icons/io5'
import { FaBus, FaTruckMoving, FaMotorcycle, FaPersonWalking } from 'react-icons/fa6'
import './VehicleCounter.css'

const VehicleCounter = ({ counts, onIncrement }) => {
  const vehicles = [
    { key: 'carros', name: 'Carros', icon: IoCar, color: '#ff6b6b' },
    { key: 'buses', name: 'Buses', icon: FaBus, color: '#4ecdc4' },
    { key: 'camiones', name: 'Camiones', icon: FaTruckMoving, color: '#45b7d1' },
    { key: 'motos', name: 'Motos', icon: FaMotorcycle, color: '#feca57' },
    { key: 'bicicletas', name: 'Bicicletas', icon: IoBicycleSharp, color: '#26de81' },
    { key: 'peatones', name: 'Peatones', icon: FaPersonWalking, color: '#ff9ff3' }
  ]

  return (
    <div className="vehicle-counter">
      <div className="vehicles-grid">
        {vehicles.map((vehicle) => {
          const IconComponent = vehicle.icon
          
          return (
            <div key={vehicle.key} className="vehicle-item">
              <button
                className="vehicle-button"
                onClick={() => onIncrement(vehicle.key)}
                style={{ '--vehicle-color': vehicle.color }}
              >
                <IconComponent 
                  size={36} 
                  className="vehicle-icon"
                />
                <span className="vehicle-label">{vehicle.name}</span>
              </button>
              <div className="counter-display" style={{ '--vehicle-color': vehicle.color }}>
                <span className="counter-value" style={{ '--vehicle-color': vehicle.color }}>
                  {counts[vehicle.key] || 0}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default VehicleCounter