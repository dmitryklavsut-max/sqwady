import { useState } from 'react'
import { AlertTriangle, X, UserCheck, XCircle, Users, Clock, ChevronDown, ChevronUp, Snowflake } from 'lucide-react'
import { DESKS } from '../data/constants'
import { useApp } from '../context/AppContext'
import { useNotify } from './Notifications'

export default function EscalationModal({ escalations, onResolve, onClose }) {
  const { state, dispatch } = useApp()
  const notify = useNotify()
  const { team } = state

  const [manualAssignFor, setManualAssignFor] = useState(null) // escalation id
  const [selectedAgent, setSelectedAgent] = useState('')
  const [expandedHistory, setExpandedHistory] = useState(false)
  const [resolved, setResolved] = useState([]) // resolved escalation ids

  const active = (escalations || []).filter(e => !resolved.includes(e.id))

  if (active.length === 0 && resolved.length === 0) return null

  const current = active[0]

  const handleAcceptRecommendation = (esc) => {
    const rec = esc.ceoRecommendation
    const task = esc.violation.task

    if (rec.type === 'reassign' && rec.agentId) {
      dispatch({
        type: 'UPDATE_TASK',
        payload: { id: task.id, assignee: rec.agentId, reassignCount: 0, cyclesSinceUpdate: 0 },
      })
      if (notify) notify('info', `Задача ${task.id} переназначена на ${rec.agentName}`)
    } else if (rec.type === 'cancel') {
      dispatch({
        type: 'UPDATE_TASK',
        payload: { id: task.id, frozen: true, column: task.column },
      })
      if (notify) notify('info', `Задача ${task.id} отменена и заморожена`)
    } else if (rec.type === 'break_down') {
      if (notify) notify('info', `Рекомендовано разбить задачу ${task.id}. Создайте подзадачи вручную.`)
    }

    // Log to DECISIONS.md
    logDecision(esc, `Принята рекомендация CEO: ${rec.text}`)
    markResolved(esc.id)
  }

  const handleManualAssign = (esc) => {
    if (!selectedAgent) return
    const task = esc.violation.task
    dispatch({
      type: 'UPDATE_TASK',
      payload: { id: task.id, assignee: selectedAgent, reassignCount: 0, cyclesSinceUpdate: 0 },
    })
    const agent = team.find(a => (a.role || a.id) === selectedAgent)
    const agentName = agent?.personality?.name || agent?.label || selectedAgent
    if (notify) notify('info', `Задача ${task.id} назначена на ${agentName}`)
    logDecision(esc, `Назначена вручную на ${agentName}`)
    setManualAssignFor(null)
    setSelectedAgent('')
    markResolved(esc.id)
  }

  const handleCancelTask = (esc) => {
    const task = esc.violation.task
    dispatch({
      type: 'UPDATE_TASK',
      payload: { id: task.id, frozen: true },
    })
    if (notify) notify('info', `Задача ${task.id} заморожена`)
    logDecision(esc, 'Задача отменена и заморожена пользователем')
    markResolved(esc.id)
  }

  const handleCallMeeting = (esc) => {
    if (notify) notify('info', 'Откройте Meeting Room и созовите экстренное совещание')
    logDecision(esc, 'Пользователь запросил экстренное совещание')
    markResolved(esc.id)
  }

  const handleSnooze = (esc) => {
    if (notify) notify('info', `Эскалация по ${esc.violation.task.id} отложена на 1 цикл`)
    markResolved(esc.id)
  }

  const markResolved = (id) => {
    setResolved(prev => [...prev, id])
    if (onResolve) onResolve(id)
  }

  const logDecision = (esc, decision) => {
    const entry = `## ${new Date().toLocaleString('ru-RU')} — Эскалация (Circuit Breaker)
Задача: ${esc.violation.task.id} "${esc.violation.task.title}"
Причина: ${esc.violation.title}
Рекомендация CEO: ${esc.ceoRecommendation?.text || 'нет'}
Решение пользователя: ${decision}
`
    const currentDecisions = state.memoryFiles?.DECISIONS || ''
    dispatch({
      type: 'UPDATE_MEMORY_FILE',
      payload: { key: 'DECISIONS', value: entry + '\n' + currentDecisions },
    })
  }

  if (!current) {
    // All resolved — close
    onClose()
    return null
  }

  const task = current.violation.task
  const desk = DESKS.find(d => d.id === task.assignee)
  const assigneeName = team.find(a => (a.role || a.id) === task.assignee)?.personality?.name || desk?.label || task.assignee

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[1000] animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="animate-pop rounded-2xl w-[480px] max-h-[80vh] border border-[var(--card-border)] bg-[var(--bg2)] overflow-hidden flex flex-col"
        style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[var(--card-border)]">
          <AlertTriangle size={18} className="text-red-400" />
          <span className="text-[15px] font-bold text-[var(--t)]">Требуется решение</span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 ml-1">
            {active.length} эскалаци{active.length === 1 ? 'я' : 'й'}
          </span>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-[var(--bg3)] text-[var(--t3)] cursor-pointer bg-transparent border-none"
          >
            <X size={16} />
          </button>
        </div>

        {/* Context */}
        <div className="px-5 py-4 overflow-y-auto flex-1">
          {/* What happened */}
          <div className="mb-4">
            <div className="text-[11px] font-bold text-[var(--t3)] uppercase tracking-wider mb-1.5">
              Что произошло
            </div>
            <div className="rounded-xl bg-[var(--bg3)] px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[13px] font-semibold text-[var(--t)]">{task.id}</span>
                <span className="text-[13px] text-[var(--t2)]">{task.title}</span>
              </div>
              <div className="text-[12px] text-[var(--t3)] leading-relaxed">
                {current.violation.description}
              </div>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-[var(--t3)]">
                <span>Исполнитель: <strong style={{ color: desk?.color }}>{assigneeName}</strong></span>
                {task.reassignCount > 0 && <span>Переназначений: {task.reassignCount}</span>}
                {task.returnCount > 0 && <span>Возвратов: {task.returnCount}</span>}
                {task.cyclesSinceUpdate > 0 && <span>Циклов без изменений: {task.cyclesSinceUpdate}</span>}
              </div>
            </div>
          </div>

          {/* CEO Recommendation */}
          {current.ceoRecommendation && (
            <div className="mb-4">
              <div className="text-[11px] font-bold text-[var(--t3)] uppercase tracking-wider mb-1.5">
                Рекомендация CEO
              </div>
              <div className="rounded-xl border border-[var(--ac)]/20 bg-[var(--ac)]/5 px-4 py-3">
                <div className="text-[13px] text-[var(--t)]">
                  <strong>{current.ceoName}</strong> рекомендует: {current.ceoRecommendation.text}
                </div>
              </div>
            </div>
          )}

          {/* Manual assign selector */}
          {manualAssignFor === current.id && (
            <div className="mb-4 p-3 rounded-xl bg-[var(--bg3)]">
              <div className="text-[12px] font-semibold text-[var(--t2)] mb-2">Выберите агента:</div>
              <div className="flex flex-wrap gap-2">
                {(team || []).map(a => {
                  const role = a.role || a.id
                  const name = a.personality?.name || a.label
                  const d = DESKS.find(dd => dd.id === role)
                  const isSelected = selectedAgent === role
                  return (
                    <button
                      key={role}
                      onClick={() => setSelectedAgent(role)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer border transition-all ${
                        isSelected
                          ? 'border-[var(--ac)] bg-[var(--ac)]/10 text-[var(--ac)]'
                          : 'border-[var(--card-border)] bg-transparent text-[var(--t2)] hover:bg-[var(--bg2)]'
                      }`}
                      style={{ fontFamily: 'inherit' }}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ background: d?.color || 'var(--ac)' }} />
                      {name}
                    </button>
                  )
                })}
              </div>
              {selectedAgent && (
                <button
                  onClick={() => handleManualAssign(current)}
                  className="mt-3 px-4 py-2 rounded-lg text-[12px] font-bold text-white border-none cursor-pointer"
                  style={{ background: 'var(--ac)', fontFamily: 'inherit' }}
                >
                  Назначить
                </button>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2">
            {current.ceoRecommendation && (
              <button
                onClick={() => handleAcceptRecommendation(current)}
                className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white border-none cursor-pointer transition-all hover:-translate-y-px"
                style={{ background: 'var(--ac)', boxShadow: '0 0 15px -3px rgba(99,102,241,0.4)', fontFamily: 'inherit' }}
              >
                <UserCheck size={14} />
                Принять рекомендацию CEO
              </button>
            )}

            <button
              onClick={() => {
                setManualAssignFor(manualAssignFor === current.id ? null : current.id)
                setSelectedAgent('')
              }}
              className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-[13px] font-semibold text-[var(--t)] bg-[var(--bg3)] border-none cursor-pointer transition-all hover:-translate-y-px hover:bg-[var(--bg3)]/80"
              style={{ fontFamily: 'inherit' }}
            >
              <UserCheck size={14} className="text-[var(--ac)]" />
              Назначить вручную
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => handleCancelTask(current)}
                className="flex items-center gap-2 flex-1 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-red-400 bg-red-500/10 border-none cursor-pointer transition-colors hover:bg-red-500/15"
                style={{ fontFamily: 'inherit' }}
              >
                <Snowflake size={14} />
                Заморозить задачу
              </button>

              <button
                onClick={() => handleCallMeeting(current)}
                className="flex items-center gap-2 flex-1 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-[var(--t2)] bg-[var(--bg3)] border-none cursor-pointer transition-colors hover:bg-[var(--bg3)]/80"
                style={{ fontFamily: 'inherit' }}
              >
                <Users size={14} />
                Созвать митинг
              </button>
            </div>

            <button
              onClick={() => handleSnooze(current)}
              className="flex items-center gap-2 w-full px-4 py-2 rounded-xl text-[12px] text-[var(--t3)] hover:text-[var(--t2)] bg-transparent border-none cursor-pointer transition-colors"
              style={{ fontFamily: 'inherit' }}
            >
              <Clock size={13} />
              Разберусь позже (отложить на 1 цикл)
            </button>
          </div>

          {/* Resolved history */}
          {resolved.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[var(--card-border)]">
              <button
                onClick={() => setExpandedHistory(!expandedHistory)}
                className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--t3)] uppercase tracking-wider cursor-pointer bg-transparent border-none"
                style={{ fontFamily: 'inherit' }}
              >
                {expandedHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                Решено ({resolved.length})
              </button>
              {expandedHistory && (
                <div className="mt-2 space-y-1.5">
                  {resolved.map(id => {
                    const esc = escalations.find(e => e.id === id)
                    if (!esc) return null
                    return (
                      <div key={id} className="text-[11px] text-[var(--t3)] px-3 py-1.5 rounded-lg bg-[var(--bg3)]">
                        {esc.violation.task.id} — {esc.violation.title} (решено)
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--card-border)] flex items-center justify-between">
          <span className="text-[11px] text-[var(--t3)]">
            Пользователь &gt; CEO &gt; Агенты
          </span>
          <span className="text-[11px] text-[var(--t3)]">
            {active.length > 1 ? `Ещё ${active.length - 1} эскалаци${active.length - 1 === 1 ? 'я' : 'й'}` : ''}
          </span>
        </div>
      </div>
    </div>
  )
}
