import { useState, useRef, useCallback, useEffect } from 'react'
import { Play, Square, ChevronDown, ChevronUp, Activity, CheckCircle, AlertTriangle, Plus, Loader } from 'lucide-react'
import { DESKS } from '../data/constants'
import { useApp } from '../context/AppContext'
import { HeartbeatEngine } from '../services/heartbeat'
import RoleIcon from './RoleIcon'

export default function HeartbeatPanel() {
  const { state, dispatch } = useApp()
  const { team } = state

  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState([]) // [{ agentId, agentName, status }]
  const [summary, setSummary] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const [autoTrigger, setAutoTrigger] = useState(false)
  const engineRef = useRef(null)

  // Lazily create engine with fresh state getter
  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new HeartbeatEngine(() => state, dispatch)
    }
    // Always update the state getter so engine sees latest state
    engineRef.current.getState = () => state
    return engineRef.current
  }, [state, dispatch])

  const handleRun = useCallback(async () => {
    if (running) return
    setRunning(true)
    setProgress([])
    setSummary(null)
    setExpanded(true)

    const engine = getEngine()

    const result = await engine.manualCycle((update) => {
      setProgress(prev => {
        const existing = prev.findIndex(p => p.agentId === update.agentId)
        if (existing >= 0) {
          const next = [...prev]
          next[existing] = update
          return next
        }
        return [...prev, update]
      })
    })

    setSummary(result)
    setRunning(false)
  }, [running, getEngine])

  const handleStop = useCallback(() => {
    engineRef.current?.abort()
  }, [])

  const estimatedCost = team.length > 0
    ? new HeartbeatEngine(() => state, dispatch).estimateCost(team.length)
    : 0

  if (!team || team.length === 0) return null

  return (
    <div className="border-b border-[var(--card-border)] bg-[var(--bg2)]">
      {/* Control bar */}
      <div className="flex items-center gap-3 px-6 py-2.5">
        {/* Pulse indicator */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Activity size={16} className={running ? 'text-[var(--ac)]' : 'text-[var(--t3)]'} />
            {running && (
              <div className="absolute inset-0 animate-ping">
                <Activity size={16} className="text-[var(--ac)] opacity-30" />
              </div>
            )}
          </div>
          <span className="text-xs font-semibold text-[var(--t2)]">Heartbeat</span>
        </div>

        {/* Run/Stop button */}
        {!running ? (
          <button
            onClick={handleRun}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer border-none transition-all hover:-translate-y-px"
            style={{ background: 'var(--ac)', boxShadow: '0 0 15px -3px rgba(99,102,241,0.4)' }}
          >
            <Play size={12} />
            Запустить цикл
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-500 hover:bg-red-600 cursor-pointer border-none transition-colors"
          >
            <Square size={12} />
            Остановить
          </button>
        )}

        {/* Running status */}
        {running && (
          <div className="flex items-center gap-2 text-xs text-[var(--ac)] font-medium">
            <Loader size={14} className="animate-spin" />
            <span>Цикл выполняется... ({progress.filter(p => p.status === 'done').length}/{team.length})</span>
          </div>
        )}

        {/* Cost estimate */}
        {!running && !summary && (
          <span className="text-[11px] text-[var(--t3)]">
            ~${estimatedCost.toFixed(2)} · {team.length} агентов
          </span>
        )}

        {/* Summary badge */}
        {summary && !running && (
          <div className="flex items-center gap-3 text-[11px] text-[var(--t2)]">
            <span className="flex items-center gap-1">
              <CheckCircle size={12} className="text-[var(--gn)]" />
              {summary.agentsPolled} опрошено
            </span>
            {summary.tasksCreated > 0 && (
              <span className="flex items-center gap-1">
                <Plus size={12} className="text-[var(--ac)]" />
                {summary.tasksCreated} создано
              </span>
            )}
            {summary.tasksCompleted > 0 && (
              <span className="flex items-center gap-1">
                <CheckCircle size={12} className="text-[var(--gn)]" />
                {summary.tasksCompleted} завершено
              </span>
            )}
            {summary.blockers.length > 0 && (
              <span className="flex items-center gap-1 text-amber-400">
                <AlertTriangle size={12} />
                {summary.blockers.length} блокеров
              </span>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Auto-trigger toggle */}
        <label className="flex items-center gap-1.5 text-[11px] text-[var(--t3)] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoTrigger}
            onChange={(e) => setAutoTrigger(e.target.checked)}
            className="w-3.5 h-3.5 rounded accent-[var(--ac)] cursor-pointer"
          />
          Авто при завершении
        </label>

        {/* Expand/collapse log */}
        {(progress.length > 0 || summary) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] text-[var(--t3)] hover:text-[var(--t2)] cursor-pointer bg-transparent border-none transition-colors"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Лог
          </button>
        )}
      </div>

      {/* Expanded cycle log */}
      {expanded && progress.length > 0 && (
        <div className="px-6 pb-3 max-h-[200px] overflow-y-auto">
          <div className="space-y-1.5">
            {progress.map((p) => {
              const desk = DESKS.find(d => d.id === p.agentId)
              const isDone = p.status === 'done'
              const result = p.result

              return (
                <div
                  key={p.agentId}
                  className={`flex items-start gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                    isDone ? 'bg-[var(--bg3)]' : 'bg-[var(--ac)]/5'
                  }`}
                >
                  {/* Agent icon */}
                  <div className="shrink-0 mt-0.5">
                    {isDone ? (
                      <CheckCircle size={14} className="text-[var(--gn)]" />
                    ) : (
                      <Loader size={14} className="text-[var(--ac)] animate-spin" />
                    )}
                  </div>

                  {/* Agent info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <RoleIcon name={desk?.iconName} size={12} color={desk?.color} />
                      <span className="text-xs font-semibold" style={{ color: desk?.color }}>
                        {p.agentName}
                      </span>
                      <span className="text-[11px] text-[var(--t3)]">{desk?.label}</span>
                    </div>

                    {isDone && result && (
                      <div className="mt-1 text-[11px] text-[var(--t2)] leading-relaxed">
                        {result.status && <div>{result.status}</div>}
                        {result.completedTasks.length > 0 && (
                          <div className="text-[var(--gn)]">
                            Завершено: {result.completedTasks.join(', ')}
                          </div>
                        )}
                        {result.newTaskRequests.length > 0 && (
                          <div className="text-[var(--ac)]">
                            Новые: {result.newTaskRequests.map(r => r.title).join(', ')}
                          </div>
                        )}
                        {result.blockers.length > 0 && (
                          <div className="text-amber-400">
                            Блокеры: {result.blockers.join(', ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
