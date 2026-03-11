import { useState, useEffect } from 'react'
import { X, Check, ChevronDown, ChevronUp, Lightbulb, Wrench, Activity, Clock, CheckCircle, Loader, Circle } from 'lucide-react'
import { DESKS, MODELS, WORKSPACE_TABS } from '../data/constants'
import { AVAILABLE_TOOLS, TOOL_DESCRIPTIONS, getDefaultTools } from '../services/promptBuilder'
import { useApp } from '../context/AppContext'
import RoleIcon from './RoleIcon'
import Avatar from './Avatar'
import Button from './Button'

const inputClass = 'w-full px-3 py-2 rounded-lg text-sm text-[var(--t)] bg-[var(--bg)] border border-[var(--bd)] outline-none focus:border-[var(--ac)] transition-colors'
const labelClass = 'text-xs font-semibold text-[var(--t2)] uppercase tracking-wide'

const TEMPERAMENTS = ['Аналитик', 'Драйвер', 'Креатив', 'Коммуникатор']
const COMM_STYLES = ['Лаконичный', 'Детальный', 'Дружеский', 'Формальный']
const EXP_LEVELS = ['Junior (1-3)', 'Middle (3-6)', 'Senior (6-10)', 'Lead (10+)']

export function generateSystemPrompt(role, position, personality, projectName) {
  const lines = []
  lines.push(`Ты — ${personality.name}, ${role.label} проекта "${projectName}".`)
  if (personality.age) lines.push(`Возраст: ${personality.age}. Опыт: ${personality.experience}.`)
  if (personality.background) lines.push(`Бэкграунд: ${personality.background}.`)
  if (position.functions?.length) lines.push(`Функции: ${position.functions.join(', ')}.`)
  if (position.responsibilities?.length) lines.push(`Ответственность: ${position.responsibilities.join(', ')}.`)
  if (position.interactions?.length) lines.push(`Взаимодействия: ${position.interactions.join('; ')}.`)
  if (personality.skills?.length) {
    const sk = Array.isArray(personality.skills) ? personality.skills : personality.skills.split(',').map(s => s.trim())
    lines.push(`Ключевые навыки: ${sk.join(', ')}.`)
  }
  if (personality.temperament) lines.push(`Темперамент: ${personality.temperament}. Стиль: ${personality.communicationStyle}.`)
  if (personality.strengths) lines.push(`Сильные стороны: ${personality.strengths}.`)
  if (personality.weaknesses) lines.push(`Слабые стороны: ${personality.weaknesses}.`)
  if (position.metrics?.length) lines.push(`Метрики успеха: ${position.metrics.join(', ')}.`)
  lines.push('Отвечай в характере своей роли. Будь полезным и конструктивным.')
  return lines.join('\n')
}

/**
 * AgentConfigModal — reusable 2-tab agent editor.
 *
 * Props:
 *   agent     — agent/entry object (needs: id/role, label, color, iconName/icon,
 *               position, personality, model, systemPrompt; optional: per, _aiPrefilled)
 *   projectName — string
 *   onSave(data) — called with { position, personality, model, systemPrompt }
 *   onClose   — close handler
 */
const PHASE_LABELS = {
  idle: { icon: '💤', text: 'Ожидание' },
  analyzing: { icon: '🔍', text: 'Анализ...' },
  planning: { icon: '📋', text: 'Планирование...' },
  executing: { icon: '⚙️', text: 'Выполнение...' },
  validating: { icon: '🔎', text: 'Валидация...' },
  saving: { icon: '💾', text: 'Сохранение...' },
  complete: { icon: '✅', text: 'Готово' },
}

export default function AgentConfigModal({ agent, projectName, onSave, onClose }) {
  const { state: appState } = useApp()
  const [tab, setTab] = useState('position')

  const [position, setPosition] = useState({
    functions: agent.position?.functions || [],
    responsibilities: agent.position?.responsibilities || [],
    interactions: agent.position?.interactions || [],
    modules: agent.position?.modules || WORKSPACE_TABS.map(t => t.id),
    metrics: agent.position?.metrics || [],
  })

  const [personality, setPersonality] = useState({
    name: agent.personality?.name || '',
    gender: agent.personality?.gender || 'male',
    age: agent.personality?.age || 28,
    experience: agent.personality?.experience || 'Middle (3-6)',
    skills: Array.isArray(agent.personality?.skills) ? agent.personality.skills.join(', ') : (agent.personality?.skills || ''),
    background: agent.personality?.background || '',
    strengths: agent.personality?.strengths || '',
    weaknesses: agent.personality?.weaknesses || '',
    temperament: agent.personality?.temperament || 'Аналитик',
    communicationStyle: agent.personality?.communicationStyle || 'Лаконичный',
  })

  const [model, setModel] = useState(agent.model || 'claude-sonnet-4-6')
  const [tools, setTools] = useState(agent.tools || getDefaultTools(agent.role || agent.id))
  const [customTools, setCustomTools] = useState((agent.customTools || []).join(', '))
  const [showPrompt, setShowPrompt] = useState(false)
  const [promptText, setPromptText] = useState(agent.systemPrompt || '')

  const roleId = agent.role || agent.id
  const desk = DESKS.find(d => d.id === roleId) || agent
  const iconName = agent.iconName || agent.icon || desk.iconName
  const color = agent.color || desk.color || 'var(--ac)'
  const label = agent.label || desk.label

  useEffect(() => {
    const generated = generateSystemPrompt(desk, position, personality, projectName)
    setPromptText(generated)
  }, [position, personality, desk, projectName])

  const setPos = (key, val) => setPosition(p => ({ ...p, [key]: val }))
  const setPers = (key, val) => setPersonality(p => ({ ...p, [key]: val }))

  const arrayToText = (arr) => Array.isArray(arr) ? arr.join('\n') : (arr || '')
  const textToArray = (text) => text.split('\n').map(s => s.trim()).filter(Boolean)

  const toggleModule = (modId) => {
    setPosition(p => ({
      ...p,
      modules: p.modules.includes(modId)
        ? p.modules.filter(m => m !== modId)
        : [...p.modules, modId],
    }))
  }

  const toggleTool = (toolId) => {
    setTools(prev => prev.includes(toolId) ? prev.filter(t => t !== toolId) : [...prev, toolId])
  }

  const handleSave = () => {
    const skillsArr = personality.skills.split(',').map(s => s.trim()).filter(Boolean)
    const customToolsArr = customTools.split(',').map(s => s.trim()).filter(Boolean)
    onSave({
      position,
      personality: { ...personality, skills: skillsArr },
      model,
      tools,
      customTools: customToolsArr,
      systemPrompt: promptText,
    })
  }

  const hasAiHints = agent._aiPrefilled

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[999] animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="animate-pop rounded-2xl w-[520px] max-h-[85vh] flex flex-col"
        style={{
          background: 'var(--card-bg)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${color}33`,
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-4 p-5 pb-0">
          {agent.per ? (
            <Avatar person={agent.per} size={48} />
          ) : (
            <div
              className="flex items-center justify-center rounded-full w-12 h-12 shrink-0"
              style={{ background: `${color}18` }}
            >
              <RoleIcon name={iconName} size={22} color={color} />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <RoleIcon name={iconName} size={18} color={color} />
              <div className="text-base font-bold" style={{ color }}>
                {label}
              </div>
            </div>
            <div className="text-xs text-[var(--t3)] mt-0.5">Настройка сотрудника</div>
          </div>
          {hasAiHints && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--ac)]/10 border border-[var(--ac)]/20">
              <Lightbulb size={12} className="text-[var(--ac)]" />
              <span className="text-[10px] text-[var(--ac)] font-medium">Рекомендовано AI</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 mt-4">
          <button
            onClick={() => setTab('position')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border-none ${
              tab === 'position'
                ? 'bg-[var(--ac)] text-white'
                : 'bg-[var(--bg2)] text-[var(--t2)] hover:text-[var(--t)]'
            }`}
          >
            Должность
          </button>
          <button
            onClick={() => setTab('personality')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border-none ${
              tab === 'personality'
                ? 'bg-[var(--ac)] text-white'
                : 'bg-[var(--bg2)] text-[var(--t2)] hover:text-[var(--t)]'
            }`}
          >
            Личность
          </button>
          <button
            onClick={() => setTab('monitor')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border-none flex items-center gap-1.5 ${
              tab === 'monitor'
                ? 'bg-[var(--ac)] text-white'
                : 'bg-[var(--bg2)] text-[var(--t2)] hover:text-[var(--t)]'
            }`}
          >
            <Activity size={12} /> Монитор
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
          {tab === 'position' && (
            <>
              <div>
                <label className={labelClass}>Роль</label>
                <div className="mt-1 px-3 py-2 rounded-lg bg-[var(--bg3)] text-sm font-medium" style={{ color }}>
                  {label}
                </div>
              </div>
              <div>
                <label className={labelClass}>Должностные функции</label>
                <textarea
                  value={arrayToText(position.functions)}
                  onChange={(e) => setPos('functions', textToArray(e.target.value))}
                  rows={3}
                  placeholder="По одной на строку"
                  className={`${inputClass} resize-y mt-1`}
                />
              </div>
              <div>
                <label className={labelClass}>Зона ответственности</label>
                <textarea
                  value={arrayToText(position.responsibilities)}
                  onChange={(e) => setPos('responsibilities', textToArray(e.target.value))}
                  rows={3}
                  placeholder="По одной на строку"
                  className={`${inputClass} resize-y mt-1`}
                />
              </div>
              <div>
                <label className={labelClass}>Взаимодействия</label>
                <textarea
                  value={arrayToText(position.interactions)}
                  onChange={(e) => setPos('interactions', textToArray(e.target.value))}
                  rows={2}
                  placeholder="От кого получает / кому передаёт"
                  className={`${inputClass} resize-y mt-1`}
                />
              </div>
              <div>
                <label className={labelClass}>Активные модули</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {WORKSPACE_TABS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => toggleModule(t.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                        position.modules.includes(t.id)
                          ? 'bg-[var(--ac)] text-white border-[var(--ac)]'
                          : 'bg-[var(--bg2)] text-[var(--t3)] border-[var(--bd)] hover:border-[var(--ac)]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Метрики успеха</label>
                <textarea
                  value={arrayToText(position.metrics)}
                  onChange={(e) => setPos('metrics', textToArray(e.target.value))}
                  rows={2}
                  placeholder="По одной на строку"
                  className={`${inputClass} resize-y mt-1`}
                />
              </div>
            </>
          )}

          {tab === 'personality' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Имя</label>
                  <input
                    value={personality.name}
                    onChange={(e) => setPers('name', e.target.value)}
                    placeholder="Имя"
                    className={`${inputClass} mt-1`}
                  />
                </div>
                <div>
                  <label className={labelClass}>Гендер</label>
                  <select
                    value={personality.gender}
                    onChange={(e) => setPers('gender', e.target.value)}
                    className={`${inputClass} mt-1 cursor-pointer`}
                  >
                    <option value="male">Мужской</option>
                    <option value="female">Женский</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Возраст</label>
                  <input
                    type="number"
                    min={18}
                    max={65}
                    value={personality.age}
                    onChange={(e) => setPers('age', Number(e.target.value))}
                    className={`${inputClass} mt-1`}
                  />
                </div>
                <div>
                  <label className={labelClass}>Опыт</label>
                  <select
                    value={personality.experience}
                    onChange={(e) => setPers('experience', e.target.value)}
                    className={`${inputClass} mt-1 cursor-pointer`}
                  >
                    {EXP_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Ключевые скилы</label>
                <input
                  value={personality.skills}
                  onChange={(e) => setPers('skills', e.target.value)}
                  placeholder="React, TypeScript, System Design..."
                  className={`${inputClass} mt-1`}
                />
              </div>
              <div>
                <label className={labelClass}>Предыдущий опыт</label>
                <textarea
                  value={personality.background}
                  onChange={(e) => setPers('background', e.target.value)}
                  rows={2}
                  placeholder="Например: 10 лет в FAANG, ex-Google"
                  className={`${inputClass} resize-y mt-1`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Сильные стороны</label>
                  <textarea
                    value={personality.strengths}
                    onChange={(e) => setPers('strengths', e.target.value)}
                    rows={2}
                    className={`${inputClass} resize-y mt-1`}
                  />
                </div>
                <div>
                  <label className={labelClass}>Слабые стороны</label>
                  <textarea
                    value={personality.weaknesses}
                    onChange={(e) => setPers('weaknesses', e.target.value)}
                    rows={2}
                    className={`${inputClass} resize-y mt-1`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Темперамент</label>
                  <select
                    value={personality.temperament}
                    onChange={(e) => setPers('temperament', e.target.value)}
                    className={`${inputClass} mt-1 cursor-pointer`}
                  >
                    {TEMPERAMENTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Стиль коммуникации</label>
                  <select
                    value={personality.communicationStyle}
                    onChange={(e) => setPers('communicationStyle', e.target.value)}
                    className={`${inputClass} mt-1 cursor-pointer`}
                  >
                    {COMM_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>
                  <span className="flex items-center gap-1.5"><Wrench size={12} /> Инструменты</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {AVAILABLE_TOOLS.map(t => (
                    <button
                      key={t}
                      onClick={() => toggleTool(t)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                        tools.includes(t)
                          ? 'bg-[var(--ac)] text-white border-[var(--ac)]'
                          : 'bg-[var(--bg2)] text-[var(--t3)] border-[var(--bd)] hover:border-[var(--ac)]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-[var(--t3)] mt-1">
                  {tools.map(t => TOOL_DESCRIPTIONS[t] || t).join(' / ')}
                </div>
              </div>
              <div>
                <label className={labelClass}>Кастомные инструменты</label>
                <input
                  value={customTools}
                  onChange={(e) => setCustomTools(e.target.value)}
                  placeholder="Через запятую: Figma, Jira, Slack..."
                  className={`${inputClass} mt-1`}
                />
              </div>
              <div>
                <label className={labelClass}>LLM модель</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className={`${inputClass} mt-1 cursor-pointer`}
                >
                  {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <button
                  onClick={() => setShowPrompt(!showPrompt)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[var(--t2)] uppercase tracking-wide cursor-pointer bg-transparent border-none hover:text-[var(--ac)] transition-colors"
                >
                  System Prompt Preview
                  {showPrompt ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                {showPrompt && (
                  <textarea
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    rows={6}
                    className={`${inputClass} resize-y mt-1 font-mono text-xs`}
                  />
                )}
              </div>
            </>
          )}

          {tab === 'monitor' && <MonitorTab roleId={roleId} appState={appState} />}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 p-5 pt-3 border-t border-[var(--bd)]">
          <Button onClick={onClose} variant="ghost" small>
            <X size={14} /> Отмена
          </Button>
          <Button onClick={handleSave} small>
            <Check size={14} /> Сохранить
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Monitor Tab component ──────────────────────────────────────
function MonitorTab({ roleId, appState }) {
  const [showCompleted, setShowCompleted] = useState(false)
  const progress = appState.agentProgress?.[roleId]
  const tasks = appState.tasks || []
  const artifacts = appState.artifacts || []
  const wikiPages = appState.wikiPages || []

  const agentTasks = tasks.filter(t => t.assignee === roleId)
  const todoTasks = agentTasks.filter(t => t.column === 'todo').sort((a, b) => {
    const po = { P0: 0, P1: 1, P2: 2, P3: 3 }
    return (po[a.priority] || 9) - (po[b.priority] || 9)
  })
  const doneTasks = agentTasks.filter(t => t.column === 'done')
  const agentArtifacts = artifacts.filter(a => a.agentId === roleId)
  const avgTime = agentArtifacts.length > 0
    ? Math.round(agentArtifacts.reduce((s, a) => s + (a.actualMinutes || 0), 0) / agentArtifacts.length)
    : 0

  const isActive = progress && progress.phase && progress.phase !== 'idle' && progress.percent > 0

  const phaseInfo = PHASE_LABELS[progress?.phase] || PHASE_LABELS.idle

  return (
    <div className="flex flex-col gap-4">
      {/* Current Task */}
      <div className="rounded-xl p-4" style={{ background: 'var(--bg2)', border: '1px solid var(--bd)' }}>
        <div className="text-[10px] font-bold text-[var(--t3)] uppercase tracking-wider mb-2">Текущая задача</div>
        {isActive ? (
          <>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-[var(--t)] flex-1 truncate">{progress.taskTitle}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                progress.priority === 'P0' ? 'bg-red-500/20 text-red-400' :
                progress.priority === 'P1' ? 'bg-orange-500/20 text-orange-400' :
                progress.priority === 'P2' ? 'bg-blue-500/20 text-blue-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>{progress.priority}</span>
              {progress.estimatedMinutes && (
                <span className="flex items-center gap-1 text-[10px] text-[var(--t3)]">
                  <Clock size={10} /> ~{progress.estimatedMinutes} мин
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div className="relative h-2 rounded-full overflow-hidden mb-2" style={{ background: 'var(--bg3)' }}>
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                style={{
                  width: `${progress.percent}%`,
                  background: progress.phase === 'complete' ? 'var(--gn)' : 'var(--ac)',
                }}
              />
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-medium text-[var(--t2)]">
                {phaseInfo.icon} {phaseInfo.text}
              </span>
              <span className="text-xs font-bold text-[var(--ac)]">{progress.percent}%</span>
            </div>

            {/* Steps stream */}
            <div className="max-h-[140px] overflow-y-auto flex flex-col gap-1 pr-1" style={{ scrollbarWidth: 'thin' }}>
              {(progress.steps || []).map((step, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  {step.status === 'done' ? (
                    <CheckCircle size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                  ) : step.status === 'active' ? (
                    <Loader size={12} className="text-[var(--ac)] shrink-0 mt-0.5 animate-spin" />
                  ) : (
                    <Circle size={12} className="text-[var(--t3)] shrink-0 mt-0.5" />
                  )}
                  <span className={`flex-1 ${
                    step.status === 'active' ? 'text-[var(--t)] font-medium' :
                    step.status === 'done' ? 'text-[var(--t2)]' : 'text-[var(--t3)]'
                  }`}>{step.text}</span>
                  <span className="text-[10px] text-[var(--t3)] shrink-0">
                    {new Date(step.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 py-3">
            <div className="w-2 h-2 rounded-full bg-[var(--t3)]" />
            <span className="text-sm text-[var(--t3)]">Агент ожидает задачу</span>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Выполнено', value: doneTasks.length },
          { label: 'Артефактов', value: agentArtifacts.length },
          { label: 'Ср. время', value: avgTime ? `${avgTime} м` : '—' },
          { label: 'Очередь', value: todoTasks.length },
        ].map((s, i) => (
          <div key={i} className="rounded-lg p-2 text-center" style={{ background: 'var(--bg2)', border: '1px solid var(--bd)' }}>
            <div className="text-base font-bold text-[var(--t)]">{s.value}</div>
            <div className="text-[10px] text-[var(--t3)]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Task Queue */}
      {todoTasks.length > 0 && (
        <div>
          <div className="text-[10px] font-bold text-[var(--t3)] uppercase tracking-wider mb-1.5">Очередь задач</div>
          <div className="flex flex-col gap-1 max-h-[120px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {todoTasks.map(t => (
              <div key={t.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs" style={{ background: 'var(--bg2)' }}>
                <span className={`px-1 py-0.5 rounded text-[9px] font-bold ${
                  t.priority === 'P0' ? 'bg-red-500/20 text-red-400' :
                  t.priority === 'P1' ? 'bg-orange-500/20 text-orange-400' :
                  t.priority === 'P2' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>{t.priority}</span>
                <span className="flex-1 truncate text-[var(--t)]">{t.title}</span>
                {t.estimatedMinutes && <span className="text-[10px] text-[var(--t3)]">~{t.estimatedMinutes}м</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {doneTasks.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--t3)] uppercase tracking-wider cursor-pointer bg-transparent border-none hover:text-[var(--t2)] transition-colors"
          >
            {showCompleted ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            Завершённые ({doneTasks.length})
          </button>
          {showCompleted && (
            <div className="flex flex-col gap-1 mt-1.5 max-h-[120px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              {doneTasks.map(t => {
                const art = artifacts.find(a => a.taskId === t.id)
                return (
                  <div key={t.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs" style={{ background: 'var(--bg2)' }}>
                    <CheckCircle size={12} className="text-emerald-500 shrink-0" />
                    <span className="flex-1 truncate text-[var(--t2)]">{t.title}</span>
                    {t.actualMinutes && <span className="text-[10px] text-[var(--t3)]">{t.actualMinutes}м</span>}
                    {art && <span className="text-[10px] text-[var(--ac)]">📄</span>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
