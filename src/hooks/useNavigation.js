import { useContext } from 'react'
import { NavigationContext } from '../contexts/NavigationContext'

export const useNavigation = () => {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation debe ser usado dentro de NavigationProvider')
  }
  return context
}
