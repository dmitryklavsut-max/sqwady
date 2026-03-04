import { useState } from 'react'
import Landing from './pages/Landing'
import ProjectSetup from './pages/ProjectSetup'
import OfficeBuild from './components/OfficeBuild'
import Workspace from './pages/Workspace'

export default function App() {
  const [page, setPage] = useState('landing')
  const [project, setProject] = useState(null)
  const [team, setTeam] = useState(null)

  return (
    <>
      {page === 'landing' && (
        <Landing onGo={() => setPage('project')} />
      )}
      {page === 'project' && (
        <ProjectSetup onNext={(p) => { setProject(p); setPage('office') }} />
      )}
      {page === 'office' && project && (
        <OfficeBuild
          project={project}
          onDone={(t) => { setTeam(t); setPage('workspace') }}
        />
      )}
      {page === 'workspace' && project && team && (
        <Workspace project={project} team={team} />
      )}
    </>
  )
}
