import React from 'react'
import './App.css'
import { AuthProvider } from './contexts/AuthContext'
import { ConteoProvider } from './contexts/ConteoContext'
import { NavigationProvider } from './contexts/NavigationContext'
import AppRouter from './components/AppRouter'

function App() {
    return (
    <NavigationProvider>
      <AuthProvider>
        <ConteoProvider>
          <AppRouter />
        </ConteoProvider>
      </AuthProvider>
    </NavigationProvider>
  )
}

export default App