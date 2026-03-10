import { createContext, useContext, useReducer, useEffect } from 'react'

const STORAGE_KEY = 'sqwady-state'

const initialState = {
  project: null,
  team: [],
  tasks: [],
  messages: { general: [], eng: [], prod: [], stand: [], meeting: [] },
  roadmap: [],
  economics: { months: [], revenue: [], costs: [], users: [] },
  pitchSlides: [],
  wikiPages: [],
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
    case 'SET_RECOMMENDATIONS':
      return { ...state, recommendations: action.payload }
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
