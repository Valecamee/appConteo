import { useContext } from 'react'
import { ConteoContext } from '../contexts/ConteoContext'

export const useConteo = () => {
  const context = useContext(ConteoContext)
  if (!context) {
    throw new Error('useConteo debe ser usado dentro de ConteoProvider')
  }
  return context
}
