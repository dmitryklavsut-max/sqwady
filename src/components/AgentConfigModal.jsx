import { useState, useEffect } from 'react'
import { X, Check, ChevronDown, ChevronUp, Lightbulb, Wrench } from 'lucide-react'
import { DESKS, MODELS, WORKSPACE_TABS } from '../data/constants'
import { AVAILABLE_TOOLS, TOOL_DESCRIPTIONS, getDefaultTools } from '../services/promptBuilder'
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
export default function AgentConfigModal({ agent, projectName, onSave, onClose }) {
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
