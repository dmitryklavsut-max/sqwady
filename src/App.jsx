import { useState } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import Landing from './pages/Landing'
import ProjectSetup from './pages/ProjectSetup'
import OfficeBuild from './components/OfficeBuild'
import Workspace from './pages/Workspace'

function AppRoutes() {
  const { state, dispatch } = useApp()
  const [page, setPage] = useState('landing')

  return (
    <>
      {page === 'landing' && (
        <Landing onGo={() => setPage('project')} />
      )}
      {page === 'project' && (
        <ProjectSetup onNext={(p) => {
          dispatch({ type: 'SET_PROJECT', payload: p })
          setPage('office')
        }} />
      )}
      {page === 'office' && state.project && (
        <OfficeBuild
          project={state.project}
          onDone={(t) => {
            dispatch({ type: 'SET_TEAM', payload: t })
            setPage('workspace')
          }}
        />
      )}
      {page === 'workspace' && state.project && state.team.length > 0 && (
        <Workspace project={state.project} team={state.team} />
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
