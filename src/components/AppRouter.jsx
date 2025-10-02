import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigation } from '../hooks/useNavigation'
import { useAdminLogic } from '../hooks/useAdminLogic'
import { useConteoLogic } from '../hooks/useConteoLogic'
import { useConteo } from '../hooks/useConteo'
import { userService } from '../services/userService'

// Importar componentes
import Login from './Login/Login'
import Dashboard from './Dashboard/Dashboard'
import AdminSetup from './AdminSetup/AdminSetup'
import AdminDashboard from './AdminDashboard/AdminDashboard'
import ProjectManagement from './AdminDashboard/ProjectManagement/ProjectManagement'
import CreateProject from './AdminDashboard/ProjectManagement/CreateProject'
import EditProject from './AdminDashboard/ProjectManagement/EditProject'
import ProjectView from './AdminDashboard/ProjectManagement/ProjectView'
import UserManagement from './AdminDashboard/UserManagement/UserManagement'
import UserProfile from './AdminDashboard/UserManagement/UserProfile'
import PendingUsers from './AdminDashboard/UserManagement/PendingUsers'
import ActiveUsers from './AdminDashboard/UserManagement/ActiveUsers'
import AssignmentModal from './AdminDashboard/UserManagement/AssignmentModal'
import ConteoConfig from './ConteoConfig/ConteoConfig'
import Selection from './Selection/Selection'
import MovementSelection from './MovementSelection/MovementSelection'
import CountingScreen from './CountingScreen/CountingScreen'
import ConteoResumen from './ConteoResumen/ConteoResumen'
import ConteoHistorial from './ConteoHistorial/ConteoHistorial'

const AppRouter = () => {
  const { user, loading, adminExists, handleLoginSuccess, handleLogout, handleAdminCreated } = useAuth()
  const { 
    currentScreen, 
    selectedProject, 
    selectedUserId, 
    showAssignmentModal, 
    selectedUserForAssignment,
    setShowAssignmentModal,
    setSelectedUserForAssignment,
    setSelectedProject,
    setSelectedUserId,
    navigateTo
  } = useNavigation()
  
  const adminLogic = useAdminLogic()
  const conteoLogic = useConteoLogic()
  const { selectedType, franjasSaved, conteoConfig } = useConteo()

  if (loading) {
    return (
      <div className="app">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh', 
          color: 'white',
          fontSize: '1.2rem'
        }}>
          Cargando...
        </div>
      </div>
    )
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'admin-setup':
        return <AdminSetup onAdminCreated={handleAdminCreated} />
      
      case 'admin-dashboard':
        return (
          <AdminDashboard 
            user={user}
            onLogout={handleLogout}
            onNavigateToProjects={adminLogic.handleNavigateToAdminProjects}
            onNavigateToUsers={adminLogic.handleNavigateToAdminUsers}
          />
        )
      
      case 'admin-projects':
        return (
          <ProjectManagement 
            user={user}
            onBack={() => navigateTo('admin-dashboard')}
            onCreateProject={adminLogic.handleCreateProject}
            onEditProject={adminLogic.handleEditProject}
            onViewProject={adminLogic.handleViewProject}
          />
        )
      
      case 'pending-approval':
        return (
          <div className="pending-approval-container" style={{
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            padding: '20px'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 211, 61, 0.5)',
              borderRadius: '25px',
              padding: '40px',
              backdropFilter: 'blur(15px)',
              maxWidth: '500px'
            }}>
              <h1 style={{ 
                fontSize: '2.5rem', 
                marginBottom: '20px',
                background: 'linear-gradient(45deg, #ffd93d, #ff6b6b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                ⏳ Cuenta Pendiente
              </h1>
              <p style={{ 
                fontSize: '1.2rem', 
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: '20px'
              }}>
                Tu solicitud de registro está siendo revisada por el administrador.
              </p>
              <p style={{ 
                fontSize: '1rem', 
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '30px'
              }}>
                Recibirás un email cuando tu cuenta sea aprobada.
              </p>
              <button 
                onClick={handleLogout}
                style={{
                  background: 'linear-gradient(45deg, #ff6b6b, #ff8e8e)',
                  border: 'none',
                  color: 'white',
                  padding: '12px 25px',
                  borderRadius: '15px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                🚪 Cerrar Sesión
              </button>
            </div>
          </div>
        )
      
      case 'login':
        return <Login onLoginSuccess={handleLoginSuccess} />
      
      case 'dashboard':
        return (
          <Dashboard 
            user={user} 
            onLogout={handleLogout}
            onStartCounting={conteoLogic.handleStartCountingFromAssignment}
          />
        )
      
      case 'config':
        return (
          <ConteoConfig 
            user={user}
            onBack={() => navigateTo('dashboard')}
            onContinue={conteoLogic.handleConfigComplete}
          />
        )
      
      case 'selection':
        return (
          <Selection 
            user={user}
            onLogout={handleLogout}
            onSelect={conteoLogic.handleSelectionChoice}
          />
        )
      
      case 'movements':
        return (
          <MovementSelection 
            user={user}
            selectedType={selectedType}
            onBack={() => navigateTo('selection')}
            onStartCounting={conteoLogic.handleMovementChoice}
          />
        )
      
      case 'counting':
        return <CountingScreen />
      
      case 'resumen':
        return (
          <ConteoResumen 
            conteoData={{
              franjas: franjasSaved,
              config: conteoConfig
            }}
            onBackToDashboard={() => navigateTo('dashboard')}
          />
        )
      
      case 'historial':
        return (
          <ConteoHistorial 
            user={user}
            onBack={() => navigateTo('dashboard')}
          />
        )
      
      case 'admin-create-project':
        return (
          <CreateProject 
            user={user}
            onBack={() => navigateTo('admin-projects')}
            onSave={adminLogic.handleSaveNewProject}
          />
        )

      case 'admin-edit-project':
        return (
          <EditProject 
            user={user}
            project={selectedProject}
            onBack={() => {
              setSelectedProject(null)
              navigateTo('admin-projects')
            }}
            onSave={adminLogic.handleSaveEditedProject}
          />
        )

      case 'admin-view-project':
        return (
          <ProjectView 
            project={selectedProject}
            onBack={() => {
              setSelectedProject(null)
              navigateTo('admin-projects')
            }}
            onDownloadCSV={async (project) => {
              try {
                const { conteoService } = await import('../services/conteoService')
                await conteoService.downloadProjectCSV(project)
              } catch (error) {
                console.error('Error descargando CSV:', error)
                alert('Error al descargar CSV: ' + error.message)
              }
            }}
          />
        )

      case 'admin-users':
        return (
          <>
            <UserManagement 
              user={user}
              onBack={() => navigateTo('admin-dashboard')}
              onNavigateToPending={() => navigateTo('pending-users')}
              onNavigateToActive={() => navigateTo('active-users')}
              onNavigateToProfile={adminLogic.handleNavigateToUserProfile}
              onAssignProject={adminLogic.handleAssignProjectFromUsers}
            />
            
            <AssignmentModal
              user={selectedUserForAssignment}
              isOpen={showAssignmentModal}
              onAssign={adminLogic.handleCreateAssignment}
              onClose={() => {
                setShowAssignmentModal(false)
                setSelectedUserForAssignment(null)
              }}
            />
          </>
        )

      case 'user-profile':
        return (
          <UserProfile 
            userId={selectedUserId}
            onBack={() => navigateTo('admin-users')}
            onEdit={(userId) => console.log('Editar usuario:', userId)}
            onDelete={async (userId) => {
              try {
                if (confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) {
                  console.log('Eliminar usuario:', userId)
                  await userService.deleteUser(userId)
                  alert('✅ Usuario eliminado exitosamente')
                  // Navegar de vuelta a la lista de usuarios
                  navigateTo('admin-users')
                }
              } catch (error) {
                console.error('Error eliminando usuario:', error)
                alert('Error al eliminar usuario: ' + error.message)
              }
            }}
          />
        )

      case 'pending-users':
        return (
          <PendingUsers 
            onBack={() => navigateTo('admin-users')}
            onApprove={(userId) => console.log('Aprobar usuario:', userId)}
            onReject={(userId, reason) => console.log('Rechazar usuario:', userId, reason)}
            onViewProfile={(userId) => {
              setSelectedUserId(userId)
              navigateTo('user-profile')
            }}
          />
        )

      case 'active-users':
        return (
          <ActiveUsers 
            onBack={() => navigateTo('admin-users')}
            onAssignProject={(userId) => console.log('Asignar proyecto:', userId)}
            onViewProfile={(userId) => {
              setSelectedUserId(userId)
              navigateTo('user-profile')
            }}
            onSendMessage={(userId) => console.log('Enviar mensaje:', userId)}
          />
        )
               
      default:
        return <Login onLoginSuccess={handleLoginSuccess} />
    }
  }

  return renderScreen()
}

export default AppRouter
