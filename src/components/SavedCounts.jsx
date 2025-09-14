import React from 'react'
import './SavedCounts.css'

const VEHICLES = [
  { key: 'carros', name: 'Carros' },
  { key: 'buses', name: 'Buses' },
  { key: 'camiones', name: 'Camiones' },
  { key: 'motos', name: 'Motos' },
  { key: 'bicicletas', name: 'Bicicletas' },
  { key: 'peatones', name: 'Peatones' }
]

const SavedCounts = ({ savedCounts, onDelete, onDownload }) => {
  if (savedCounts.length === 0) {
    return null
  }

  return (
    <div className="saved-counts">
      <div className="saved-counts-header">
        <h3>Conteos Guardados</h3>
        <button 
          className="download-button"
          onClick={onDownload}
        >
          📥 Descargar CSV
        </button>
      </div>
      <div className="counts-table-container">
        <table className="counts-table compact">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Fecha</th>
              <th>Movimiento</th>
              {VEHICLES.map(v => (
                <th key={v.key}>{v.name}</th>
              ))}
              <th>Total</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {savedCounts.map((count) => [
              <tr key={count.id + '-m1'}>
                <td className="count-name">{count.name}</td>
                <td className="count-date">{count.date}</td>
                <td className="movimiento">1</td>
                {VEHICLES.map(v => (
                  <td key={v.key} className="count-detail m1">
                    {count.movimiento1[v.key] || 0}
                  </td>
                ))}
                <td className="count-total m1">{count.total1}</td>
                <td className="count-actions" rowSpan={2}>
                  <button 
                    className="delete-button"
                    onClick={() => onDelete(count.id)}
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </td>
              </tr>,
              <tr key={count.id + '-m2'}>
                <td className="count-name">{count.name}</td>
                <td className="count-date">{count.date}</td>
                <td className="movimiento">2</td>
                {VEHICLES.map(v => (
                  <td key={v.key} className="count-detail m2">
                    {count.movimiento2[v.key] || 0}
                  </td>
                ))}
                <td className="count-total m2">{count.total2}</td>
                {/* Acciones solo en la fila de movimiento 1 */}
              </tr>
            ])}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default SavedCounts