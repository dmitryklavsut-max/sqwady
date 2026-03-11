import { useState, useMemo, useRef, useCallback } from 'react'
import { ChevronDown, ChevronUp, Zap, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useNotify } from './Notifications'
import { checkSprintProgress, planNextSprint, getDaysRemaining } from '../services/sprintPlanner'
import { MeetingEngine } from '../services/meetings'
import { DESKS } from '../data/constants'

const STATUS_CONFIG = {
  on_track: { label: 'В графике', color: 'var(--gn)', icon: CheckCircle },
  behind: { label: 'Отстаём', color: '#f59e0b', icon: Clock },
  at_risk: { label: 'Под угрозой', color: '#ef4444', icon: AlertTriangle },
}

export default function SprintBar() {
  const { state, dispatch } = useApp()
  const notify = useNotify()
  const [expanded, setExpanded] = useState(false)

  const { sprints, currentSprintId, tasks, team } = state
  const meetingRef = useRef(null)

  const getMeetingEngine = useCallback(() => {
    if (!meetingRef.current) {
      meetingRef.current = new MeetingEngine(() => state, dispatch)
    }
    meetingRef.current.getState = () => state
    return meetingRef.current
  }, [state, dispatch])
  const sprint = useMemo(
    () => (sprints || []).find(s => s.id === currentSprintId),
    [sprints, currentSprintId]
  )

  const progress = useMemo(
    () => sprint ? checkSprintProgress(sprint, tasks || []) : null,
    [sprint, tasks]
  )

  const daysLeft = useMemo(() => getDaysRemaining(sprint), [sprint])

  if (!sprint) return null

  const statusCfg = STATUS_CONFIG[progress?.status] || STATUS_CONFIG.on_track
  const StatusIcon = statusCfg.icon

  const handleComplete = async () => {
    const completedSprint = sprint
    const { sprints: updated, currentSprintId: nextId } = planNextSprint(
      sprints, currentSprintId, tasks
    )
    dispatch({ type: 'SET_SPRINTS', payload: updated })
    dispatch({ type: 'SET_CURRENT_SPRINT', payload: nextId })
    if (notify) {
      notify('info', nextId
        ? `Спринт завершён! Запуск ревью-митинга...`
        : `Все спринты завершены!`
      )
    }
    setExpanded(false)

    // Auto-trigger Sprint Review meeting
    if (team.length > 0 && completedSprint) {
      const engine = getMeetingEngine()
      engine.sprintReview(team, completedSprint, () => {})
    }
  }

  // Task breakdown by agent for expanded view
  const agentBreakdown = useMemo(() => {
    if (!sprint) return []
    const sprintTasks = (tasks || []).filter(t => sprint.taskIds.includes(t.id))
    const byAgent = {}
    for (const t of sprintTasks) {
      if (!byAgent[t.assignee]) byAgent[t.assignee] = { total: 0, done: 0 }
      byAgent[t.assignee].total++
      if (t.column === 'done') byAgent[t.assignee].done++
    }
    return Object.entries(byAgent).map(([role, counts]) => {
      const agent = (team || []).find(a => (a.role || a.id) === role)
      const desk = DESKS.find(d => d.id === role)
      return {
        role,
        name: agent?.personality?.name || agent?.label || role,
        color: desk?.color || agent?.color || 'var(--ac)',
        ...counts,
      }
    })
  }, [sprint, tasks, team])

  return (
    <div className="border-b border-[var(--card-border)] bg-[var(--bg2)]">
      {/* Compact bar */}
      <div className="flex items-center gap-3 px-4 h-10">
        {/* Left: sprint name + phase */}
        <div className="flex items-center gap-2 min-w-0">
          <Zap size={14} className="text-[var(--ac)] shrink-0" />
          <span className="text-[13px] font-semibold text-[var(--t)] truncate">
            {sprint.name}
          </span>
        </div>

        {/* Center: progress bar + days */}
        <div className="flex-1 flex items-center gap-3 justify-center">
          <div className="flex items-center gap-2 max-w-[280px] w-full">
            <div className="flex-1 h-1.5 bg-[var(--bg3)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress?.percent || 0}%`,
                  background: statusCfg.color,
                }}
              />
            </div>
            <span className="text-[11px] text-[var(--t3)] font-medium whitespace-nowrap">
              {progress?.done}/{progress?.total}
            </span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--bg3)] text-[var(--t2)] font-medium whitespace-nowrap">
            {daysLeft} дн.
          </span>
        </div>

        {/* Right: status + expand */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ color: statusCfg.color, background: statusCfg.color + '18' }}
          >
            <StatusIcon size={12} />
            {statusCfg.label}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded-md hover:bg-[var(--bg3)] text-[var(--t3)] hover:text-[var(--t)] transition-colors cursor-pointer bg-transparent border-none"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded dropdown */}
      {expanded && (
        <div className="px-4 pb-3 animate-fade-in">
          <div className="grid grid-cols-[1fr_auto] gap-4 mt-1">
            {/* Left column: goal + agent breakdown */}
            <div>
              <div className="text-[11px] font-bold text-[var(--t3)] uppercase tracking-wider mb-1.5">
                Цель спринта
              </div>
              <div className="text-[13px] text-[var(--t2)] mb-3">{sprint.goal}</div>

              {agentBreakdown.length > 0 && (
                <>
                  <div className="text-[11px] font-bold text-[var(--t3)] uppercase tracking-wider mb-1.5">
                    По исполнителям
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {agentBreakdown.map(a => (
                      <div
                        key={a.role}
                        className="flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg bg-[var(--bg3)]"
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: a.color }}
                        />
                        <span className="text-[var(--t2)] font-medium">{a.name}</span>
                        <span className="text-[var(--t3)]">{a.done}/{a.total}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Right column: dates + action */}
            <div className="flex flex-col items-end gap-2">
              <div className="text-[11px] text-[var(--t3)]">
                {sprint.startDate} → {sprint.endDate}
              </div>
              <button
                onClick={handleComplete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer transition-all duration-200 border-none"
                style={{
                  background: 'var(--ac)',
                  color: '#fff',
                  boxShadow: '0 0 12px -3px rgba(99,102,241,0.4)',
                }}
              >
                <CheckCircle size={13} />
                Завершить спринт
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
