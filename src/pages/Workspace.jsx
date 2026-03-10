import { useState } from 'react'
import { ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react'
import { WORKSPACE_TABS, DESKS } from '../data/constants'
import { useTheme } from '../hooks/useTheme'
import { useApp } from '../context/AppContext'
import RoleIcon from '../components/RoleIcon'
import ChatPanel from '../components/ChatPanel'
import KanbanBoard from '../components/KanbanBoard'
import RoadmapView from '../components/RoadmapView'
import EconomicsView from '../components/EconomicsView'
import CalendarView from '../components/CalendarView'
import PitchStudio from '../components/PitchStudio'
import WikiView from '../components/WikiView'

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

export default function Workspace({ project, team }) {
  const { state, dispatch } = useApp()
  const [activeTab, setActiveTab] = useState('chat')
  const [collapsed, setCollapsed] = useState(false)
  const { theme, toggle: toggleTheme } = useTheme()

  const tasks = state.tasks || []
  const setTasks = (newTasks) => {
    if (typeof newTasks === 'function') {
      dispatch({ type: 'SET_TASKS', payload: newTasks(tasks) })
    } else {
      dispatch({ type: 'SET_TASKS', payload: newTasks })
    }
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'chat': return <ChatPanel />
      case 'kanban': return <KanbanBoard team={team} />
      case 'road': return <RoadmapView />
      case 'econ': return <EconomicsView />
      case 'cal': return <CalendarView team={team} tasks={tasks} />
      case 'pitch': return <PitchStudio />
      case 'wiki': return <WikiView />
      default: return null
    }
  }

  const sw = collapsed ? 'w-[56px]' : 'w-[240px]'

  return (
    <div className="h-screen flex overflow-hidden bg-[var(--bg)]">
      {/* ── Sidebar ────────────────────────────────────── */}
      <aside
        className={`${sw} shrink-0 flex flex-col border-r border-[var(--card-border)] transition-[width] duration-200 overflow-hidden`}
        style={{ background: 'var(--bg2)', backdropFilter: 'blur(10px)' }}
        aria-label="Главная навигация"
      >
        {/* Logo + project */}
        <div className={`flex flex-col ${collapsed ? 'items-center py-3' : 'px-4 py-4'} border-b border-[var(--card-border)] shrink-0`}>
          <span className={`text-[20px] font-bold leading-none logo-gradient`} style={{ letterSpacing: '-0.5px' }}>
            {collapsed ? 'S' : 'Sqwady'}
          </span>
          {!collapsed && (
            <span className="text-xs text-[var(--t3)] mt-1 truncate">
              {project.name}
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 px-2 py-3 overflow-y-auto overflow-x-hidden" aria-label="Модули">
          {WORKSPACE_TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-3'} h-10 rounded-xl border-none cursor-pointer text-sm font-medium transition-all duration-200 shrink-0 ${
                  isActive
                    ? 'bg-[var(--bg3)] text-[var(--t)] font-semibold border-l-[3px] border-l-[var(--ac)]'
                    : 'bg-transparent text-[var(--t2)] hover:bg-[var(--bg3)] hover:text-[var(--t)] border-l-[3px] border-l-transparent hover:-translate-y-px'
                }`}
                style={{ fontFamily: 'inherit' }}
                title={collapsed ? tab.label : undefined}
                aria-label={collapsed ? tab.label : undefined}
                aria-current={isActive ? 'page' : undefined}
              >
                <RoleIcon
                  name={tab.iconName}
                  size={18}
                  color={isActive ? 'var(--ac)' : undefined}
                  className="shrink-0"
                />
                {!collapsed && <span className="truncate">{tab.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Team section */}
        <div className="border-t border-[var(--card-border)] shrink-0">
          {!collapsed && (
            <div className="px-4 py-3">
              <div className="text-[11px] font-bold text-[var(--t3)] uppercase tracking-wider mb-2">Команда</div>
              {team.map((t) => {
                const name = t.personality?.name || t.label
                const desk = DESKS.find(d => d.id === (t.role || t.id))
                const color = desk?.color || t.color || 'var(--ac)'
                const initials = getInitials(name)
                return (
                  <div
                    key={t.id || t.role}
                    className="flex items-center gap-2.5 py-1.5 px-1 rounded-lg hover:bg-[var(--bg3)] transition-colors"
                  >
                    <div className="relative shrink-0">
                      <div
                        className="flex items-center justify-center rounded-full font-bold text-[10px] select-none"
                        style={{ width: 28, height: 28, background: `${color}22`, color }}
                      >
                        {initials}
                      </div>
                      <div className="absolute -bottom-px -right-px w-2 h-2 rounded-full bg-[var(--gn)] border-[1.5px] border-[var(--bg2)]" />
                    </div>
                    <span className="text-[13px] font-medium text-[var(--t)] truncate">
                      {name}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Theme + collapse */}
          <div className="px-2 pb-2 flex flex-col gap-1">
            <button
              onClick={toggleTheme}
              className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-3'} w-full h-9 rounded-lg border-none cursor-pointer bg-transparent text-[var(--t3)] hover:text-[var(--t2)] hover:bg-[var(--bg3)] transition-colors duration-150 text-xs`}
              style={{ fontFamily: 'inherit' }}
              aria-label={theme === 'dark' ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              {!collapsed && <span>{theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}</span>}
            </button>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex items-center justify-center w-full h-9 rounded-lg border-none cursor-pointer bg-transparent text-[var(--t3)] hover:text-[var(--t2)] hover:bg-[var(--bg3)] transition-colors duration-150"
              style={{ fontFamily: 'inherit' }}
              aria-label={collapsed ? 'Развернуть панель' : 'Свернуть панель'}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────── */}
      <main className="flex-1 flex overflow-hidden bg-[var(--bg)]">
        {renderTab()}
      </main>
    </div>
  )
}
