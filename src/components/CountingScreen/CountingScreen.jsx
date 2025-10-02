import React from 'react'
import { useConteo } from '../../hooks/useConteo'
import { useAuth } from '../../hooks/useAuth'
import { useNavigation } from '../../hooks/useNavigation'
import { useConteoLogic } from '../../hooks/useConteoLogic'
import { franjaUtils } from '../../utils/franjaUtils'
import Header from '../Header'
import FranjaProgress from '../FranjaProgress/FranjaProgress'
import VehicleCounter from '../VehicleCounter'

const CountingScreen = () => {
  const conteoContext = useConteo()
  const { 
    conteoConfig, 
    selectedType, 
    selectedMovements, 
    franjaActual, 
    franjasCompletadas,
    conteoActual,
    handleIncrement,
    handleResetFranja,
    getTotalFranjaActual,
    handleSaveFranja,
    getMovementImage,
    getMovementName,
    navigateToFranja,
    isFranjaCompletada,
    getProgresoTotal,
    finalizarConteo
  } = conteoContext
  
  const { user, handleLogout } = useAuth()
  const { navigateTo } = useNavigation()
  const conteoLogic = useConteoLogic()

  // Función para navegar a una franja específica
  const handleNavigateToFranja = async (franjaNum) => {
    try {
      await navigateToFranja(franjaNum, user)
    } catch (error) {
      console.error('Error navegando a franja:', error)
      alert('Error navegando a la franja: ' + error.message)
    }
  }

  // Función para continuar a la siguiente franja
  const handleContinuarFranja = async () => {
    try {
      // Guardar la franja actual
      await handleSaveFranja(user)
      
      // Navegar a la siguiente franja
      const totalFranjas = conteoConfig ? franjaUtils.calculateTotalFranjas(conteoConfig.horaInicio, conteoConfig.horaFin) : 0
      if (franjaActual < totalFranjas) {
        await navigateToFranja(franjaActual + 1, user)
      }
    } catch (error) {
      console.error('Error continuando franja:', error)
      alert('Error continuando a la siguiente franja: ' + error.message)
    }
  }

  // Función para finalizar el conteo
  const handleFinalizarConteo = async () => {
    try {
      const result = await finalizarConteo(user)
      
      if (result.success) {
        alert('✅ ' + result.message)
        navigateTo('dashboard')
      } else {
        alert('⚠️ ' + result.message)
      }
    } catch (error) {
      console.error('Error finalizando conteo:', error)
      alert('Error finalizando conteo: ' + error.message)
    }
  }

  // Obtener progreso total
  const progresoTotal = getProgresoTotal()

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
      
      {/* Botón de regreso */}
      <div style={{ 
        position: 'relative',
        zIndex: 10,
        display: 'flex', 
        justifyContent: 'flex-start', 
        marginBottom: '30px',
        maxWidth: '1200px',
        margin: '0 auto 30px auto',
        padding: '0 20px'
      }}>
        <button 
          onClick={() => navigateTo('dashboard')}
          style={{
            position: 'relative',
            zIndex: 11,
            background: 'rgba(255, 255, 255, 0.1)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '15px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)'
            e.target.style.transform = 'translateY(-2px)'
            e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)'
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)'
            e.target.style.transform = 'translateY(0)'
            e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)'
          }}
        >
          ← Volver al Dashboard
        </button>
      </div>
      
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
        isFranjaCompletada={isFranjaCompletada}
        getProgresoTotal={getProgresoTotal}
      />
      
      <div className="container">
        {/* Grid de movimientos */}
        <div className="movements-grid">
          {selectedMovements.map((movementId) => (
            <div key={movementId} className="section">
              <div className="section-header">
                <h2 className="section-title">{getMovementName(movementId)}</h2>
                <div className="section-total">
                  <span className="total-label">Total:</span>
                  <span className="total-value">
                    {Object.values(conteoActual[movementId] || {}).reduce((sum, count) => sum + (count || 0), 0)}
                  </span>
                </div>
              </div>
              
              
              <VehicleCounter 
                counts={conteoActual[movementId] || {}}
                onIncrement={(vehicleType) => handleIncrement(movementId, vehicleType)}
                selectedType={selectedType}
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
                fontWeight: '600'
              }}
            >
              🔄 Reiniciar Franja
            </button>
            
            <button 
              className="save-progress-button"
              onClick={async () => {
                try {
                  await handleSaveFranja(user)
                  alert('✅ Progreso guardado exitosamente')
                  navigateTo('dashboard')
                } catch (error) {
                  console.error('Error guardando progreso:', error)
                  alert('Error al guardar el progreso. Inténtalo de nuevo.')
                }
              }}
              style={{
                background: 'rgba(255, 211, 61, 0.2)',
                border: '2px solid rgba(255, 211, 61, 0.5)',
                color: '#ffd93d',
                padding: '12px 25px',
                borderRadius: '15px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              💾 Guardar Progreso
            </button>
            
            {franjaActual < conteoConfig.totalFranjas ? (
              <button 
                className="next-franja-button"
                onClick={handleContinuarFranja}
                style={{
                  background: 'linear-gradient(45deg, #26de81, #20bf6b)',
                  border: 'none',
                  color: 'white',
                  padding: '12px 25px',
                  borderRadius: '15px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  boxShadow: '0 4px 15px rgba(38, 222, 129, 0.3)'
                }}
              >
                ⏭️ Siguiente Franja
              </button>
            ) : (
              <button 
                className="finish-conteo-button"
                onClick={handleFinalizarConteo}
                style={{
                  background: progresoTotal.isCompleto 
                    ? 'linear-gradient(45deg, #4caf50, #66bb6a)'
                    : 'linear-gradient(45deg, #ff6b6b, #ff8e8e)',
                  border: 'none',
                  color: 'white',
                  padding: '15px 30px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  boxShadow: progresoTotal.isCompleto 
                    ? '0 6px 20px rgba(76, 175, 80, 0.4)'
                    : '0 6px 20px rgba(255, 107, 107, 0.4)'
                }}
              >
                {progresoTotal.isCompleto ? '✅ Finalizar Conteo' : '⚠️ Finalizar Conteo'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CountingScreen
