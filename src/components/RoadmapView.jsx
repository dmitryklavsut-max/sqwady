import { useState, useMemo } from 'react'
import { Map, X, Check, Zap } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Button from './Button'

const inputClass = 'w-full px-3 py-2 rounded-lg text-sm text-[var(--t)] bg-[var(--bg)] border border-[var(--bd)] outline-none focus:border-[var(--ac)] transition-colors'

export default function RoadmapView() {
  const { state, dispatch } = useApp()
  const roadmap = state.roadmap || []
  const sprints = state.sprints || []
  const tasks = state.tasks || []
  const currentSprintId = state.currentSprintId
  const [hover, setHover] = useState(null)
  const [editing, setEditing] = useState(null) // index

  // Calculate estimated minutes per phase from sprint tasks
  const phaseEstimates = useMemo(() => {
    const estimates = {}
    for (const sprint of sprints) {
      const sprintTasks = tasks.filter(t => sprint.taskIds.includes(t.id))
      const phase = sprint.phase
      if (!estimates[phase]) estimates[phase] = { totalMin: 0, doneMin: 0, overflows: false }
      for (const t of sprintTasks) {
        estimates[phase].totalMin += t.estimatedMinutes || 0
        if (t.column === 'done') estimates[phase].doneMin += t.actualMinutes || t.estimatedMinutes || 0
      }
    }
    // Check if any phase has tasks exceeding sprint capacity (14 days * 24h * 60min per agent)
    for (const key of Object.keys(estimates)) {
      const e = estimates[key]
      const phaseSprints = sprints.filter(s => s.phase === key)
      const sprintCapMin = phaseSprints.length * 14 * 24 * 60 // max continuous capacity
      if (e.totalMin > sprintCapMin && sprintCapMin > 0) e.overflows = true
    }
    return estimates
  }, [sprints, tasks])

  // Current sprint date range for overlay
  const currentSprint = useMemo(
    () => sprints.find(s => s.id === currentSprintId),
    [sprints, currentSprintId]
  )

  const months = Array.from({ length: 12 }, (_, i) => `Мес ${i + 1}`)

  // Today marker — approximate position based on month 3 (adjustable)
  const todayMonth = 2.5 // ~mid month 3
  const todayPct = (todayMonth / 12) * 100

  const openEdit = (idx) => {
    setEditing(idx)
  }

  const saveEdit = (idx, updated) => {
    const newRoadmap = roadmap.map((r, i) => (i === idx ? updated : r))
    dispatch({ type: 'SET_ROADMAP', payload: newRoadmap })
    setEditing(null)
  }

  return (
    <div className="p-6 overflow-auto h-full w-full">
      <div className="flex items-center gap-2.5 mb-6">
        <Map size={20} />
        <h1 className="text-xl font-bold" style={{ letterSpacing: '-0.5px' }}>Roadmap</h1>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-[var(--ac)] font-medium">
          <div className="w-3 h-0 border-t-2 border-dashed border-[var(--ac)]" />
          Сегодня
        </div>
      </div>

      <div className="relative min-w-[900px]">
        {/* Month headers */}
        <div className="flex border-b border-[var(--bd)] pb-2.5 mb-4">
          {months.map((m, i) => (
            <div key={i} className="flex-1 text-center text-[13px] text-[var(--t3)] font-medium">
              {m}
            </div>
          ))}
        </div>

        {/* Grid lines */}
        <div className="absolute inset-0 flex pointer-events-none" style={{ top: 38 }}>
          {months.map((_, i) => (
            <div
              key={i}
              className="flex-1"
              style={{ borderRight: i < 11 ? '1px solid var(--bd)' : 'none', opacity: 0.5 }}
            />
          ))}
        </div>

        {/* Phase bars */}
        {roadmap.map((r, idx) => (
          <div
            key={r.id}
            className="mb-4 relative animate-fade-up"
            style={{ height: 56, animationDelay: `${idx * 80}ms` }}
          >
            <div
              className="absolute flex items-center px-4 rounded-lg cursor-pointer transition-all duration-200"
              style={{
                left: `${(r.start / 12) * 100}%`,
                width: `${(r.duration / 12) * 100}%`,
                height: 56,
                background: `${r.color}15`,
                border: `2px solid ${hover === r.id ? r.color : r.color + '44'}`,
              }}
              onMouseEnter={() => setHover(r.id)}
              onMouseLeave={() => setHover(null)}
              onClick={() => openEdit(idx)}
            >
              <div className="min-w-0 overflow-hidden flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-[13px] font-bold truncate" style={{ color: r.color }}>
                    {r.phase}
                  </div>
                  {phaseEstimates[r.id]?.totalMin > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                      style={{
                        background: phaseEstimates[r.id].overflows ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.12)',
                        color: phaseEstimates[r.id].overflows ? '#ef4444' : 'var(--ac)',
                      }}>
                      {phaseEstimates[r.id].doneMin}/{phaseEstimates[r.id].totalMin} мин
                      {phaseEstimates[r.id].overflows && ' !!'}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[var(--t2)] mt-0.5 truncate">
                  {(r.items || []).join(', ')}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Today marker */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none z-10"
          style={{ left: `${todayPct}%` }}
        >
          <div className="h-full" style={{ borderLeft: '2px dashed var(--ac)' }} />
        </div>

        {/* Current sprint overlay */}
        {currentSprint && (() => {
          const sprintStart = new Date(currentSprint.startDate)
          const sprintEnd = new Date(currentSprint.endDate)
          const timelineStart = new Date()
          timelineStart.setHours(0, 0, 0, 0)
          // Timeline spans 12 months from ~now
          const totalMs = 12 * 30 * 24 * 60 * 60 * 1000
          const startPct = Math.max(0, ((sprintStart - timelineStart) / totalMs) * 100)
          const widthPct = Math.max(1, ((sprintEnd - sprintStart) / totalMs) * 100)
          return (
            <div
              className="absolute pointer-events-none z-[5]"
              style={{
                left: `${startPct}%`,
                width: `${widthPct}%`,
                top: 38,
                bottom: 0,
                background: 'rgba(99,102,241,0.06)',
                borderLeft: '2px solid rgba(99,102,241,0.3)',
                borderRight: '2px solid rgba(99,102,241,0.3)',
              }}
            >
              <div className="absolute -top-5 left-1 flex items-center gap-1 text-[10px] font-bold text-[var(--ac)]">
                <Zap size={10} />
                Спринт
              </div>
            </div>
          )
        })()}

        {roadmap.length === 0 && (
          <div className="text-center text-[var(--t3)] py-12">
            Нет данных roadmap. Пройдите генерацию workspace.
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing !== null && roadmap[editing] && (
        <PhaseEditModal
          phase={roadmap[editing]}
          onSave={(updated) => saveEdit(editing, updated)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function PhaseEditModal({ phase, onSave, onClose }) {
  const [form, setForm] = useState({
    phase: phase.phase || '',
    start: phase.start ?? 0,
    duration: phase.duration ?? 3,
    items: (phase.items || []).join(', '),
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    onSave({
      ...phase,
      phase: form.phase,
      start: Number(form.start),
      duration: Number(form.duration),
      items: form.items.split(',').map(s => s.trim()).filter(Boolean),
    })
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[999] animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="animate-pop rounded-2xl p-6 w-[400px] border border-[var(--card-border)] bg-[var(--bg2)]"
        style={{ boxShadow: 'var(--shadow-lg)' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">Редактировать фазу</h2>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-[var(--t2)] uppercase tracking-wide">Название</label>
            <input value={form.phase} onChange={e => set('phase', e.target.value)} className={`${inputClass} mt-1`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[var(--t2)] uppercase tracking-wide">Начало (месяц)</label>
              <input type="number" min={0} max={11} value={form.start} onChange={e => set('start', e.target.value)} className={`${inputClass} mt-1`} />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--t2)] uppercase tracking-wide">Длительность (мес)</label>
              <input type="number" min={1} max={12} value={form.duration} onChange={e => set('duration', e.target.value)} className={`${inputClass} mt-1`} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--t2)] uppercase tracking-wide">Milestones</label>
            <textarea value={form.items} onChange={e => set('items', e.target.value)} rows={3} placeholder="Через запятую" className={`${inputClass} mt-1 resize-y`} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <Button onClick={onClose} variant="ghost" small><X size={14} /> Отмена</Button>
          <Button onClick={handleSave} small><Check size={14} /> Сохранить</Button>
        </div>
      </div>
    </div>
  )
}
