import { createContext, useContext, useReducer, useEffect } from 'react'

const STORAGE_KEY = 'sqwady-state'
const PROJECTS_KEY = 'sqwady-projects'
const TEAMS_KEY = 'sqwady-teams'
const AGENTS_KEY = 'sqwady-agents'
const CURRENT_KEY = 'sqwady-current'

const initialState = {
  project: null,
  team: [],
  tasks: [],
  messages: { general: [], eng: [], prod: [], stand: [], meeting: [] },
  roadmap: [],
  economics: { months: [], revenue: [], costs: [], users: [] },
  pitchSlides: [],
  wikiPages: [],
  sprints: [],
  currentSprintId: null,
  watchdogIssues: [],
  memoryFiles: {
    PROJECT: '',
    ARCHITECTURE: '',
    TEAM_CONTEXT: '',
    DECISIONS: '',
    PROGRESS: '',
    agents: {},
  },
  recommendations: null,
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return { ...initialState, ...parsed }
    }
  } catch {
    // corrupted data — start fresh
  }
  return initialState
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PROJECT':
      return { ...state, project: action.payload }
    case 'SET_TEAM':
      return { ...state, team: action.payload }
    case 'UPDATE_AGENT':
      return {
        ...state,
        team: state.team.map((a) =>
          a.id === action.payload.id ? { ...a, ...action.payload } : a
        ),
      }
    case 'SET_TASKS':
      return { ...state, tasks: action.payload }
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] }
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.id ? { ...t, ...action.payload } : t
        ),
      }
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.payload),
      }
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.channel]: [
            ...(state.messages[action.payload.channel] || []),
            action.payload.message,
          ],
        },
      }
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload }
    case 'SET_ROADMAP':
      return { ...state, roadmap: action.payload }
    case 'SET_ECONOMICS':
      return { ...state, economics: action.payload }
    case 'SET_PITCH_SLIDES':
      return { ...state, pitchSlides: action.payload }
    case 'SET_WIKI_PAGES':
      return { ...state, wikiPages: action.payload }
    case 'SET_MEMORY_FILES':
      return { ...state, memoryFiles: action.payload }
    case 'UPDATE_MEMORY_FILE':
      return {
        ...state,
        memoryFiles: {
          ...state.memoryFiles,
          [action.payload.key]: action.payload.value,
        },
      }
    case 'SET_SPRINTS':
      return { ...state, sprints: action.payload }
    case 'ADD_SPRINT':
      return { ...state, sprints: [...state.sprints, action.payload] }
    case 'UPDATE_SPRINT':
      return {
        ...state,
        sprints: state.sprints.map((s) =>
          s.id === action.payload.id ? { ...s, ...action.payload } : s
        ),
      }
    case 'SET_CURRENT_SPRINT':
      return { ...state, currentSprintId: action.payload }
    case 'SET_WATCHDOG_ISSUES':
      return { ...state, watchdogIssues: action.payload }
    case 'SET_RECOMMENDATIONS':
      return { ...state, recommendations: action.payload }
    case 'LOAD_PROJECT_STATE':
      return { ...initialState, ...action.payload }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, loadState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

// ── Project management utilities ──────────────────────

function readJSON(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeJSON(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

export function listProjects() {
  const projects = readJSON(PROJECTS_KEY) || []
  return projects.map(({ id, name, industry, stage, updatedAt, state }) => {
    const taskStats = {
      total: state?.tasks?.length || 0,
      done: state?.tasks?.filter(t => t.column === 'done').length || 0,
    }
    return { id, name, industry, stage, updatedAt, taskStats, teamSize: state?.team?.length || 0 }
  })
}

export function saveCurrentProject(state) {
  if (!state.project) return null
  const projects = readJSON(PROJECTS_KEY) || []
  const current = readJSON(CURRENT_KEY)
  const id = current?.projectId || crypto.randomUUID()
  const entry = {
    id,
    name: state.project.name || 'Без названия',
    industry: state.project.industry || '',
    stage: state.project.stage || '',
    updatedAt: new Date().toISOString(),
    state,
  }
  const idx = projects.findIndex(p => p.id === id)
  if (idx >= 0) {
    projects[idx] = entry
  } else {
    projects.push(entry)
  }
  writeJSON(PROJECTS_KEY, projects)
  writeJSON(CURRENT_KEY, { projectId: id })
  return id
}

export function loadProject(projectId) {
  const projects = readJSON(PROJECTS_KEY) || []
  const found = projects.find(p => p.id === projectId)
  if (!found) return null
  writeJSON(CURRENT_KEY, { projectId })
  return found.state
}

export function deleteProject(projectId) {
  const projects = readJSON(PROJECTS_KEY) || []
  writeJSON(PROJECTS_KEY, projects.filter(p => p.id !== projectId))
  const current = readJSON(CURRENT_KEY)
  if (current?.projectId === projectId) {
    localStorage.removeItem(CURRENT_KEY)
  }
}

export function getCurrentProjectId() {
  return readJSON(CURRENT_KEY)?.projectId || null
}

// ── Team templates ────────────────────────────────────

export function listTeamTemplates() {
  return readJSON(TEAMS_KEY) || []
}

export function saveTeamTemplate(team, name, description) {
  const templates = readJSON(TEAMS_KEY) || []
  const entry = {
    id: crypto.randomUUID(),
    name,
    description,
    roles: team.map(({ id, role, label, color, position, personality, model, temperature }) => ({
      id, role, label, color, position, personality, model, temperature,
    })),
    createdAt: new Date().toISOString(),
  }
  templates.push(entry)
  writeJSON(TEAMS_KEY, templates)
  return entry
}

export function deleteTeamTemplate(id) {
  const templates = readJSON(TEAMS_KEY) || []
  writeJSON(TEAMS_KEY, templates.filter(t => t.id !== id))
}

// ── Agent configs ─────────────────────────────────────

export function listAgentConfigs() {
  return readJSON(AGENTS_KEY) || []
}

export function saveAgentConfig(agent) {
  const configs = readJSON(AGENTS_KEY) || []
  const entry = {
    id: crypto.randomUUID(),
    name: agent.personality?.name || agent.label || 'Agent',
    role: agent.role || agent.id,
    label: agent.label,
    color: agent.color,
    personality: agent.personality,
    position: agent.position,
    model: agent.model,
    temperature: agent.temperature,
    createdAt: new Date().toISOString(),
  }
  configs.push(entry)
  writeJSON(AGENTS_KEY, configs)
  return entry
}

export function deleteAgentConfig(id) {
  const configs = readJSON(AGENTS_KEY) || []
  writeJSON(AGENTS_KEY, configs.filter(a => a.id !== id))
}
