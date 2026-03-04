import { useState } from 'react'
import { ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react'
import { WORKSPACE_TABS } from '../data/constants'
import { useTheme } from '../hooks/useTheme'
import RoleIcon from '../components/RoleIcon'
import Avatar from '../components/Avatar'
import ChatPanel from '../components/ChatPanel'
import KanbanBoard from '../components/KanbanBoard'
import RoadmapView from '../components/RoadmapView'
import EconomicsView from '../components/EconomicsView'
import CalendarView from '../components/CalendarView'
import PitchStudio from '../components/PitchStudio'
import WikiView from '../components/WikiView'

export default function Workspace({ project, team }) {
  const [activeTab, setActiveTab] = useState('chat')
  const [collapsed, setCollapsed] = useState(false)
  const { theme, toggle: toggleTheme } = useTheme()

  const [tasks, setTasks] = useState(() =>
    team.map((m, i) => ({
      id: `T-${String(i + 1).padStart(3, '0')}`,
      title: `Setup: ${m.pn || m.label}`,
      as: m.id + m.slot,
      pr: i < 2 ? 'P0' : 'P1',
      col: 'todo',
      tags: ['setup'],
    }))
  )

  const addTask = (t) => setTasks((p) => [...p, t])

  const renderTab = () => {
    switch (activeTab) {
      case 'chat': return <ChatPanel project={project} team={team} tasks={tasks} onAddTask={addTask} />
      case 'kanban': return <KanbanBoard team={team} tasks={tasks} onSetTasks={setTasks} />
      case 'road': return <RoadmapView />
      case 'econ': return <EconomicsView />
      case 'cal': return <CalendarView team={team} tasks={tasks} />
      case 'pitch': return <PitchStudio />
      case 'wiki': return <WikiView />
      default: return null
    }
  }

  return (
    <div className="h-screen flex overflow-hidden bg-[var(--bg)]">
      {/* ── Sidebar ────────────────────────────────────── */}
      <aside
        className={`${collapsed ? 'w-[60px]' : 'w-[220px]'} shrink-0 flex flex-col border-r border-[var(--bd)] bg-[var(--bg2)] transition-[width] duration-200 overflow-hidden`}
      >
        {/* Logo + project */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-4'} h-14 border-b border-[var(--bd)] shrink-0`}>
          <span
            className="text-[20px] font-black shrink-0 leading-none"
            style={{
              background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {collapsed ? 'S' : 'Sqwady'}
          </span>
          {!collapsed && (
            <span className="text-xs text-[var(--t3)] font-medium truncate ml-auto px-2 py-0.5 rounded-md bg-[var(--bg3)]">
              {project.name}
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 px-2.5 py-3 overflow-y-auto overflow-x-hidden">
          {WORKSPACE_TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-3'} h-9 rounded-lg border-none cursor-pointer text-sm transition-colors duration-150 shrink-0 ${
                  isActive
                    ? 'bg-[var(--bg3)] text-[var(--t)] font-semibold border-l-[3px] border-l-[var(--ac)]'
                    : 'bg-transparent text-[var(--t2)] hover:bg-[var(--bg3)] hover:text-[var(--t)] border-l-[3px] border-l-transparent'
                }`}
                style={{ fontFamily: 'inherit' }}
                title={collapsed ? tab.label : undefined}
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

        {/* Footer: team + theme + collapse */}
        <div className="border-t border-[var(--bd)] p-2.5 shrink-0 space-y-2">
          {/* Team avatars */}
          {!collapsed && (
            <div className="flex items-center gap-1.5 px-1">
              {team.slice(0, 5).map((m) => (
                <div key={m.id + m.slot} className="relative">
                  <Avatar person={m.per} size={26} />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--gn)] border-2 border-[var(--bg2)]" />
                </div>
              ))}
              {team.length > 5 && (
                <span className="text-xs text-[var(--t3)] ml-1">+{team.length - 5}</span>
              )}
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5 px-3'} w-full h-8 rounded-lg border-none cursor-pointer bg-transparent text-[var(--t3)] hover:text-[var(--t2)] hover:bg-[var(--bg3)] transition-colors duration-150 text-xs`}
            style={{ fontFamily: 'inherit' }}
            title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {!collapsed && <span>{theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}</span>}
          </button>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full h-8 rounded-lg border-none cursor-pointer bg-transparent text-[var(--t3)] hover:text-[var(--t2)] hover:bg-[var(--bg3)] transition-colors duration-150"
            style={{ fontFamily: 'inherit' }}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────── */}
      <main className="flex-1 flex overflow-hidden bg-[var(--bg)]">
        {renderTab()}
      </main>
    </div>
  )
}
