import { useState, useCallback, useEffect } from 'react'
import { AppProvider, useApp, saveCurrentProject, loadProject, listProjects, getCurrentProjectId } from './context/AppContext'
import Landing from './pages/Landing'
import ProjectSetup from './pages/ProjectSetup'
import OfficeBuild from './components/OfficeBuild'
import GenerationScreen from './pages/GenerationScreen'
import Workspace from './pages/Workspace'
import ProjectsHub from './pages/ProjectsHub'
import TeamsHub from './pages/TeamsHub'

function AppRoutes() {
  const { state, dispatch } = useApp()
  const [page, setPage] = useState(() => {
    // Migration: if sqwady-state has data but sqwady-projects is empty, auto-import
    const projects = listProjects()
    if (projects.length === 0 && state.project) {
      saveCurrentProject(state)
    }

    // Check if we have a current project loaded in workspace
    const currentId = getCurrentProjectId()
    if (currentId && state.project && state.team.length > 0 && (state.tasks?.length > 0 || state.pitchSlides?.length > 0)) return 'workspace'
    if (currentId && state.project && state.team.length > 0) return 'generation'
    if (currentId && state.project) return 'office'

    // If any projects exist, show hub; otherwise show hub (empty state handles CTA)
    return 'hub'
  })

  const saveAndNavigate = useCallback((target) => {
    // Auto-save current project when leaving workspace
    if (state.project) {
      saveCurrentProject(state)
    }
    setPage(target)
  }, [state])

  const handleOpenProject = useCallback((projectId) => {
    const projectState = loadProject(projectId)
    if (projectState) {
      dispatch({ type: 'LOAD_PROJECT_STATE', payload: projectState })
      // Determine which page to show based on project state
      if (projectState.team?.length > 0 && (projectState.tasks?.length > 0 || projectState.pitchSlides?.length > 0)) {
        setPage('workspace')
      } else if (projectState.team?.length > 0) {
        setPage('generation')
      } else if (projectState.project) {
        setPage('office')
      } else {
        setPage('project')
      }
    }
  }, [dispatch])

  const handleNewProject = useCallback(() => {
    // Save current project if any
    if (state.project) {
      saveCurrentProject(state)
    }
    // Reset state for new project
    dispatch({ type: 'RESET' })
    localStorage.removeItem('sqwady-current')
    setPage('project')
  }, [state, dispatch])

  return (
    <>
      {page === 'hub' && (
        <ProjectsHub
          onOpenProject={handleOpenProject}
          onNewProject={handleNewProject}
          onOpenTeams={() => saveAndNavigate('teams')}
        />
      )}
      {page === 'teams' && (
        <TeamsHub onBack={() => setPage('hub')} />
      )}
      {page === 'landing' && (
        <Landing onGo={() => setPage('project')} />
      )}
      {page === 'project' && (
        <ProjectSetup onNext={() => setPage('office')} />
      )}
      {page === 'office' && state.project && (
        <OfficeBuild
          project={state.project}
          onDone={(t) => {
            dispatch({ type: 'SET_TEAM', payload: t })
            setPage('generation')
          }}
        />
      )}
      {page === 'generation' && state.project && state.team.length > 0 && (
        <GenerationScreen onDone={() => setPage('workspace')} />
      )}
      {page === 'workspace' && state.project && state.team.length > 0 && (
        <Workspace
          project={state.project}
          team={state.team}
          onBackToHub={() => saveAndNavigate('hub')}
        />
      )}
    </>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  )
}
