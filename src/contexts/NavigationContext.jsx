import React, { createContext, useState } from 'react'

export const NavigationContext = createContext()

export const NavigationProvider = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState('login')
  const [selectedProject, setSelectedProject] = useState(null)
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [selectedUserForAssignment, setSelectedUserForAssignment] = useState(null)

  const navigateTo = (screen) => {
    console.log('🧭 NavigationContext: Navegando a:', screen)
    setCurrentScreen(screen)
  }

  const navigateBack = (targetScreen) => {
    setCurrentScreen(targetScreen)
  }

  const resetNavigation = () => {
    setCurrentScreen('login')
    setSelectedProject(null)
    setSelectedUserId(null)
    setShowAssignmentModal(false)
    setSelectedUserForAssignment(null)
  }

  const value = {
    currentScreen,
    setCurrentScreen,
    selectedProject,
    setSelectedProject,
    selectedUserId,
    setSelectedUserId,
    showAssignmentModal,
    setShowAssignmentModal,
    selectedUserForAssignment,
    setSelectedUserForAssignment,
    navigateTo,
    navigateBack,
    resetNavigation
  }

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  )
}
