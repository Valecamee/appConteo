import { useAuth } from './useAuth'
import { useNavigation } from './useNavigation'
import { userService } from '../services/userService'

export const useAdminLogic = () => {
  const { user, handleLogout } = useAuth()
  const { 
    navigateTo, 
    setSelectedProject, 
    setSelectedUserId,
    setShowAssignmentModal,
    setSelectedUserForAssignment
  } = useNavigation()

  // Navegación admin
  const handleNavigateToAdminProjects = () => {
    navigateTo('admin-projects')
  }

  const handleNavigateToAdminUsers = () => {
    navigateTo('admin-users')
    setShowAssignmentModal(false)
    setSelectedUserForAssignment(null)
  }

  // Funciones de proyecto
  const handleCreateProject = () => {
    navigateTo('admin-create-project')
  }

  const handleEditProject = (project) => {
    setSelectedProject(project)
    navigateTo('admin-edit-project')
  }

  const handleViewProject = (project) => {
    setSelectedProject(project)
    navigateTo('admin-view-project')
  }

  const handleSaveNewProject = (projectData) => {
    console.log('Proyecto creado exitosamente:', projectData)
    alert('✅ Proyecto creado exitosamente!')
    navigateTo('admin-projects')
  }

  const handleSaveEditedProject = (updatedProject) => {
    console.log('Proyecto actualizado exitosamente:', updatedProject)
    alert('✅ Proyecto actualizado exitosamente!')
    setSelectedProject(null)
    navigateTo('admin-projects')
  }

  // Funciones de usuario
  const handleAssignProjectFromUsers = (userId) => {
    setSelectedUserForAssignment({ uid: userId })
    setShowAssignmentModal(true)
  }

  const handleCreateAssignment = async (userId, assignmentData) => {
    try {
      await userService.assignProjectToUser(userId, {
        ...assignmentData,
        adminId: user.uid
      })
      
      alert('✅ Proyecto asignado exitosamente!')
      setShowAssignmentModal(false)
      setSelectedUserForAssignment(null)
    } catch (error) {
      console.error('Error asignando proyecto:', error)
      alert('Error al asignar proyecto: ' + error.message)
    }
  }

  const handleNavigateToUserProfile = (userId) => {
    setSelectedUserId(userId)
    navigateTo('user-profile')
  }

  return {
    handleNavigateToAdminProjects,
    handleNavigateToAdminUsers,
    handleCreateProject,
    handleEditProject,
    handleViewProject,
    handleSaveNewProject,
    handleSaveEditedProject,
    handleAssignProjectFromUsers,
    handleCreateAssignment,
    handleNavigateToUserProfile
  }
}
