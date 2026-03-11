import { useState, useRef, useCallback } from 'react'
import { X, Play, Loader2, CheckCircle, Users } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useNotify } from './Notifications'
import { MeetingEngine, MEETING_TYPES } from '../services/meetings'
import { DESKS } from '../data/constants'
import Button from './Button'

function getInitials(name) {
  if (!name) return '?'
  return name.trim().split(/\s+/).map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

export default function MeetingControls({ onClose }) {
  const { state, dispatch } = useApp()
  const { team } = state
  const notify = useNotify()
  const engineRef = useRef(null)

  const [meetingType, setMeetingType] = useState('standup')
  const [agenda, setAgenda] = useState('')
  const [selected, setSelected] = useState(() => new Set(team.map(t => t.role || t.id)))
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState([]) // [{ agentId, agentName, status }]
  const [result, setResult] = useState(null)

  // Auto-select participants based on type
  const handleTypeChange = (type) => {
    setMeetingType(type)
    const config = MEETING_TYPES[type]
    if (config?.defaultRoles) {
      const available = team.filter(t => config.defaultRoles.includes(t.role || t.id))
      setSelected(new Set(available.map(t => t.role || t.id)))
    } else {
      setSelected(new Set(team.map(t => t.role || t.id)))
    }
  }

  const toggleAgent = (roleId) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(roleId)) next.delete(roleId)
      else next.add(roleId)
      return next
    })
  }

  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new MeetingEngine(() => state, dispatch)
    }
    engineRef.current.getState = () => state
    return engineRef.current
  }, [state, dispatch])

  const handleStart = async () => {
    if (selected.size === 0) return
    setRunning(true)
    setProgress([])
    setResult(null)

    const participants = team.filter(t => selected.has(t.role || t.id))
    const engine = getEngine()

    const meetingResult = await engine.runMeeting(
      meetingType,
      participants,
      agenda || MEETING_TYPES[meetingType]?.label || 'Обсуждение',
      {},
      (update) => {
        if (update.status === 'speaking' || update.status === 'done') {
          setProgress(prev => {
            const exists = prev.find(p => p.agentId === update.agentId)
            if (exists) {
              return prev.map(p => p.agentId === update.agentId ? { ...p, ...update } : p)
            }
            return [...prev, update]
          })
        }
      }
    )

    setRunning(false)
    setResult(meetingResult)

    if (meetingResult && notify) {
      const taskCount = meetingResult.actionItems?.length || 0
      notify('info', `Митинг завершён! Решений: ${meetingResult.decisions?.length || 0}, задач: ${taskCount}`)
    }
  }

  const config = MEETING_TYPES[meetingType]

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[999] animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="animate-pop rounded-2xl p-6 w-[480px] max-h-[85vh] overflow-y-auto border border-[var(--card-border)] bg-[var(--bg2)]"
        style={{ boxShadow: 'var(--shadow-lg)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users size={18} className="text-[var(--ac)]" />
            Созвать митинг
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg3)] text-[var(--t3)] hover:text-[var(--t)] cursor-pointer bg-transparent border-none"
          >
            <X size={16} />
          </button>
        </div>

        {!running && !result && (
          <>
            {/* Meeting type */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-[var(--t2)] uppercase tracking-wide">
                Тип совещания
              </label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {Object.entries(MEETING_TYPES).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => handleTypeChange(key)}
                    className={`px-3 py-2 rounded-xl text-[12px] font-semibold cursor-pointer border transition-all duration-150 ${
                      meetingType === key
                        ? 'bg-[var(--ac)] text-white border-[var(--ac)]'
                        : 'bg-[var(--bg3)] text-[var(--t2)] border-[var(--card-border)] hover:border-[var(--ac)]'
                    }`}
                    style={{ fontFamily: 'inherit' }}
                  >
                    {cfg.emoji} {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Participants */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-[var(--t2)] uppercase tracking-wide">
                Участники ({selected.size})
              </label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {team.map(t => {
                  const role = t.role || t.id
                  const name = t.personality?.name || t.label
                  const desk = DESKS.find(d => d.id === role)
                  const color = desk?.color || t.color || 'var(--ac)'
                  const isSelected = selected.has(role)
                  return (
                    <button
                      key={role}
                      onClick={() => toggleAgent(role)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] cursor-pointer border transition-all duration-150 text-left ${
                        isSelected
                          ? 'border-[var(--ac)] bg-[rgba(99,102,241,0.08)]'
                          : 'border-[var(--card-border)] bg-[var(--bg3)] opacity-60 hover:opacity-100'
                      }`}
                      style={{ fontFamily: 'inherit' }}
                    >
                      <div
                        className="flex items-center justify-center rounded-full font-bold text-[9px] select-none shrink-0"
                        style={{ width: 24, height: 24, background: `${color}22`, color }}
                      >
                        {getInitials(name)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-[var(--t)] truncate">{name}</div>
                        <div className="text-[10px] text-[var(--t3)]">{desk?.label}</div>
                      </div>
                      {isSelected && (
                        <CheckCircle size={14} className="text-[var(--ac)] ml-auto shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Agenda */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-[var(--t2)] uppercase tracking-wide">
                Повестка / тема
              </label>
              <input
                value={agenda}
                onChange={e => setAgenda(e.target.value)}
                placeholder={config?.label || 'Тема обсуждения...'}
                className="w-full mt-2 px-3 py-2.5 rounded-lg text-sm text-[var(--t)] bg-[var(--bg)] border border-[var(--bd)] outline-none focus:border-[var(--ac)] transition-colors"
              />
            </div>

            {/* Start button */}
            <div className="flex justify-end gap-3">
              <Button onClick={onClose} variant="ghost" small>
                Отмена
              </Button>
              <Button onClick={handleStart} small disabled={selected.size === 0}>
                <Play size={14} /> Начать митинг
              </Button>
            </div>
          </>
        )}

        {/* Running state */}
        {running && (
          <div className="py-4">
            <div className="flex items-center gap-2 mb-4 text-sm text-[var(--ac)] font-semibold">
              <Loader2 size={16} className="animate-spin" />
              {config?.emoji} Митинг в процессе...
            </div>
            <div className="flex flex-col gap-2">
              {progress.map(p => {
                const desk = DESKS.find(d => d.id === p.agentId)
                const color = desk?.color || 'var(--ac)'
                return (
                  <div key={p.agentId} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[var(--bg3)]">
                    <div
                      className="flex items-center justify-center rounded-full font-bold text-[9px] select-none shrink-0"
                      style={{ width: 24, height: 24, background: `${color}22`, color }}
                    >
                      {getInitials(p.agentName)}
                    </div>
                    <span className="text-[13px] font-medium text-[var(--t)]">{p.agentName}</span>
                    <span className="ml-auto text-[11px]">
                      {p.status === 'speaking' ? (
                        <span className="flex items-center gap-1 text-[var(--ac)]">
                          <Loader2 size={12} className="animate-spin" /> Выступает...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[var(--gn)]">
                          <CheckCircle size={12} /> Готово
                        </span>
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Result state */}
        {result && (
          <div className="py-2">
            <div className="flex items-center gap-2 mb-4 text-sm text-[var(--gn)] font-semibold">
              <CheckCircle size={16} />
              Митинг завершён
            </div>

            {result.decisions?.length > 0 && (
              <div className="mb-4">
                <div className="text-[11px] font-bold text-[var(--t3)] uppercase tracking-wider mb-2">
                  Решения
                </div>
                <div className="flex flex-col gap-1.5">
                  {result.decisions.map((d, i) => (
                    <div key={i} className="text-[13px] text-[var(--t2)] px-3 py-1.5 rounded-lg bg-[var(--bg3)]">
                      {i + 1}. {d}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.actionItems?.length > 0 && (
              <div className="mb-4">
                <div className="text-[11px] font-bold text-[var(--t3)] uppercase tracking-wider mb-2">
                  Созданные задачи
                </div>
                <div className="flex flex-col gap-1.5">
                  {result.actionItems.map((a, i) => {
                    const desk = DESKS.find(d => d.id === a.assignTo)
                    return (
                      <div key={i} className="flex items-center gap-2 text-[13px] px-3 py-1.5 rounded-lg bg-[var(--bg3)]">
                        <span className="text-[var(--t2)] flex-1">{a.title}</span>
                        <span className="text-[11px] text-[var(--t3)]">→ {desk?.label || a.assignTo}</span>
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ color: a.priority === 'P0' ? '#ef4444' : '#f59e0b', background: (a.priority === 'P0' ? '#ef4444' : '#f59e0b') + '18' }}
                        >
                          {a.priority}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={onClose} small>
                <CheckCircle size={14} /> Закрыть
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
