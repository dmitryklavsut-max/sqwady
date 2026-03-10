import { useState, useEffect, useRef } from 'react'
import { DndContext, useDraggable, useDroppable, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { Plus, UserPlus, X, Check, Armchair, Users, Rocket, Settings, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react'
import { DESKS, PEOPLE, MODELS, WORKSPACE_TABS } from '../data/constants'
import { useApp } from '../context/AppContext'
import RoleIcon from './RoleIcon'
import Avatar from './Avatar'
import Button from './Button'

const inputClass = 'w-full px-3 py-2 rounded-lg text-sm text-[var(--t)] bg-[var(--bg)] border border-[var(--bd)] outline-none focus:border-[var(--ac)] transition-colors'
const labelClass = 'text-xs font-semibold text-[var(--t2)] uppercase tracking-wide'

const TEMPERAMENTS = ['Аналитик', 'Драйвер', 'Креатив', 'Коммуникатор']
const COMM_STYLES = ['Лаконичный', 'Детальный', 'Дружеский', 'Формальный']
const EXP_LEVELS = ['Junior (1-3)', 'Middle (3-6)', 'Senior (6-10)', 'Lead (10+)']

function generateSystemPrompt(role, position, personality, projectName) {
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

/* ── Draggable palette item ─────────────────────────── */
function DeskDrag({ desk, used }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `desk-${desk.id}`,
    data: { type: 'desk', desk },
    disabled: used,
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[var(--bd)] transition-all duration-150 ${
        !used ? 'hover:border-[var(--bd2)] hover:shadow-sm' : ''
      }`}
      style={{
        background: used ? 'var(--bg3)' : 'var(--bg2)',
        opacity: used ? 0.3 : isDragging ? 0.5 : 1,
        cursor: used ? 'default' : 'grab',
      }}
    >
      <div
        className="flex items-center justify-center rounded-lg w-8 h-8 shrink-0"
        style={{ background: `${desk.color}18` }}
      >
        <RoleIcon name={desk.iconName} size={16} color={desk.color} />
      </div>
      <span className="text-xs font-semibold truncate">{desk.label}</span>
    </div>
  )
}

function PersonDrag({ person }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `person-${person.id}`,
    data: { type: 'person', person },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="cursor-grab hover:scale-105 transition-transform duration-150"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <Avatar person={person} size={44} />
    </div>
  )
}

/* ── Droppable grid slot ────────────────────────────── */
function GridSlot({ index, entry, onRemove, onOpenConfig }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `slot-${index}`,
    data: { index },
  })

  const borderColor = isOver
    ? 'var(--ac)'
    : entry
      ? `${entry.color}44`
      : 'var(--bd2)'

  return (
    <div
      ref={setNodeRef}
      className={`relative flex flex-col items-center justify-center rounded-2xl p-3 min-h-[120px] transition-all duration-200 ${
        !entry ? 'hover:border-[var(--bd2)]' : ''
      }`}
      style={{
        border: `2px dashed ${borderColor}`,
        background: entry ? `${entry.color}06` : isOver ? 'rgba(99,102,241,0.03)' : 'var(--bg)',
      }}
    >
      {!entry && (
        <div className="text-center text-[var(--t3)]">
          <Plus size={22} className="mx-auto mb-1 opacity-40" />
          <div className="text-xs font-medium">Стол сюда</div>
        </div>
      )}

      {entry && (
        <div className="animate-pop text-center w-full">
          <button
            onClick={() => onRemove(index)}
            className="absolute top-2 right-3 bg-transparent border-none text-[var(--t3)] cursor-pointer hover:text-[var(--t)] p-1 rounded transition-colors"
          >
            <X size={14} />
          </button>
          <div
            className="flex items-center justify-center rounded-full mx-auto mb-2 w-11 h-11"
            style={{ background: `${entry.color}18` }}
          >
            <RoleIcon name={entry.iconName} size={22} color={entry.color} />
          </div>
          <div className="text-xs font-bold mb-2" style={{ color: entry.color }}>
            {entry.label}
          </div>

          {!entry.per ? (
            <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--t3)] px-3 py-1.5 border border-dashed border-[var(--bd2)] rounded-lg">
              <UserPlus size={12} />
              Посади
            </div>
          ) : (
            <div
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onOpenConfig(index)}
            >
              <Avatar person={entry.per} size={36} className="mx-auto" />
              <div className="flex items-center justify-center gap-1 text-xs text-[var(--t2)] mt-1 font-medium">
                {entry.personality?.name || <Settings size={12} />}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Config Modal — 2 Tabs ─────────────────────────── */
function ConfigModal({ entry, projectName, onSave, onClose }) {
  const [tab, setTab] = useState('position')

  const [position, setPosition] = useState({
    functions: entry.position?.functions || [],
    responsibilities: entry.position?.responsibilities || [],
    interactions: entry.position?.interactions || [],
    modules: entry.position?.modules || WORKSPACE_TABS.map(t => t.id),
    metrics: entry.position?.metrics || [],
  })

  const [personality, setPersonality] = useState({
    name: entry.personality?.name || '',
    gender: entry.personality?.gender || 'male',
    age: entry.personality?.age || 28,
    experience: entry.personality?.experience || 'Middle (3-6)',
    skills: Array.isArray(entry.personality?.skills) ? entry.personality.skills.join(', ') : (entry.personality?.skills || ''),
    background: entry.personality?.background || '',
    strengths: entry.personality?.strengths || '',
    weaknesses: entry.personality?.weaknesses || '',
    temperament: entry.personality?.temperament || 'Аналитик',
    communicationStyle: entry.personality?.communicationStyle || 'Лаконичный',
  })

  const [model, setModel] = useState(entry.model || 'claude-sonnet-4-6')
  const [showPrompt, setShowPrompt] = useState(false)
  const [promptText, setPromptText] = useState(entry.systemPrompt || '')

  const desk = DESKS.find(d => d.id === entry.id) || entry

  // Regenerate prompt when fields change
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

  const handleSave = () => {
    const skillsArr = personality.skills.split(',').map(s => s.trim()).filter(Boolean)
    onSave({
      position,
      personality: { ...personality, skills: skillsArr },
      model,
      systemPrompt: promptText,
    })
  }

  const hasAiHints = entry._aiPrefilled

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
          border: `1px solid ${entry.color}33`,
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-4 p-5 pb-0">
          <Avatar person={entry.per} size={48} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <RoleIcon name={entry.iconName} size={18} color={entry.color} />
              <div className="text-base font-bold" style={{ color: entry.color }}>
                {entry.label}
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
                <div className="mt-1 px-3 py-2 rounded-lg bg-[var(--bg3)] text-sm font-medium" style={{ color: entry.color }}>
                  {entry.label}
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

/* ── Main Component ─────────────────────────────────── */
export default function OfficeBuild({ project, onDone }) {
  const { state } = useApp()
  const recs = state.recommendations
  const [placed, setPlaced] = useState([])
  const [configSlot, setConfigSlot] = useState(null)
  const [activeItem, setActiveItem] = useState(null)
  const initialized = useRef(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  // Auto-place recommended team on mount
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const teamComp = recs?.teamComposition || []
    const agentDefs = recs?.agentDefaults || {}

    if (teamComp.length === 0) return

    const autoPlaced = []
    let personIdx = 0
    teamComp.forEach((rec, i) => {
      if (i >= 8) return // max 8 slots
      const desk = DESKS.find(d => d.id === rec.role)
      if (!desk) return
      const person = PEOPLE[personIdx % PEOPLE.length]
      personIdx++
      const defaults = agentDefs[rec.role] || {}
      autoPlaced.push({
        ...desk,
        slot: i,
        per: person,
        position: defaults.position || { functions: [], responsibilities: [], interactions: [], modules: WORKSPACE_TABS.map(t => t.id), metrics: [] },
        personality: defaults.personality || {},
        model: 'claude-sonnet-4-6',
        systemPrompt: '',
        _aiPrefilled: true,
      })
    })

    // Generate system prompts for each auto-placed agent
    autoPlaced.forEach(agent => {
      agent.systemPrompt = generateSystemPrompt(
        DESKS.find(d => d.id === agent.id) || agent,
        agent.position,
        agent.personality,
        project.name
      )
    })

    setPlaced(autoPlaced)
  }, [recs, project.name])

  const addDesk = (deskId, slotIndex) => {
    if (placed.find(p => p.slot === slotIndex)) return
    const desk = DESKS.find(d => d.id === deskId)
    if (!desk) return
    setPlaced(prev => [
      ...prev,
      {
        ...desk,
        slot: slotIndex,
        per: null,
        position: { functions: [], responsibilities: [], interactions: [], modules: WORKSPACE_TABS.map(t => t.id), metrics: [] },
        personality: {},
        model: 'claude-sonnet-4-6',
        systemPrompt: '',
        _aiPrefilled: false,
      },
    ])
  }

  const seatPerson = (personId, slotIndex) => {
    const person = PEOPLE.find(p => p.id === personId)
    if (!person) return
    setPlaced(prev =>
      prev.map(x => (x.slot === slotIndex ? { ...x, per: person } : x))
    )
    setConfigSlot(slotIndex)
  }

  const updateEntry = (slotIndex, data) => {
    setPlaced(prev => prev.map(x => (x.slot === slotIndex ? { ...x, ...data } : x)))
    setConfigSlot(null)
  }

  const removeDesk = (slotIndex) => {
    setPlaced(prev => prev.filter(x => x.slot !== slotIndex))
  }

  const handleDragStart = (event) => {
    setActiveItem(event.active.data.current)
  }

  const handleDragEnd = (event) => {
    setActiveItem(null)
    const { active, over } = event
    if (!over) return

    const slotMatch = String(over.id).match(/^slot-(\d+)$/)
    if (!slotMatch) return
    const slotIndex = Number(slotMatch[1])
    const data = active.data.current

    if (data.type === 'desk') {
      addDesk(data.desk.id, slotIndex)
    } else if (data.type === 'person') {
      const entry = placed.find(p => p.slot === slotIndex)
      if (entry && !entry.per) {
        seatPerson(data.person.id, slotIndex)
      }
    }
  }

  const handleDone = () => {
    const team = placed
      .filter(p => p.per)
      .map(p => ({
        id: p.id,
        role: p.id,
        label: p.label,
        icon: p.iconName,
        color: p.color,
        position: p.position,
        personality: p.personality,
        model: p.model,
        systemPrompt: p.systemPrompt,
        temperature: 0.7,
      }))
    onDone(team)
  }

  const usedDeskIds = new Set(placed.map(p => p.id))
  const seatedCount = placed.filter(p => p.per).length
  const configEntry = configSlot !== null ? placed.find(p => p.slot === configSlot) : null

  // Recommended team chips
  const recRoles = (recs?.teamComposition || []).map(r => {
    const desk = DESKS.find(d => d.id === r.role)
    return desk ? desk.label : r.role
  }).filter(Boolean)

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen flex flex-col p-6">
        {/* Header */}
        <div className="text-center mb-4 animate-fade-up">
          <div className="text-sm font-semibold text-[var(--ac)] tracking-widest uppercase mb-1">
            Шаг 2
          </div>
          <h1 className="text-2xl font-bold">
            Собери команду «{project.name}»
          </h1>
          <p className="text-[var(--t2)] text-sm mt-1.5">
            Перетащи стол → посади сотрудника → настрой
          </p>
        </div>

        {/* AI Recommendation banner */}
        {recRoles.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl bg-[var(--ac)]/8 border border-[var(--ac)]/15 animate-fade-in">
            <Lightbulb size={16} className="text-[var(--ac)] shrink-0" />
            <div>
              <span className="text-xs text-[var(--ac)] font-medium">Рекомендуемая команда для {project.name}:</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {recRoles.map((name, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-[var(--ac)]/15 text-[var(--ac)] text-xs font-semibold"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main area */}
        <div className="flex flex-1 gap-4 overflow-hidden">
          {/* Sidebar: Palette */}
          <div className="w-48 shrink-0 flex flex-col gap-2 overflow-auto pr-1">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--t3)] uppercase tracking-wider mb-1">
              <Armchair size={14} />
              Столы
            </div>
            {DESKS.map(desk => (
              <DeskDrag key={desk.id} desk={desk} used={usedDeskIds.has(desk.id)} />
            ))}

            <div className="flex items-center gap-2 text-xs font-bold text-[var(--t3)] uppercase tracking-wider mt-3 mb-1">
              <Users size={14} />
              Люди
            </div>
            <div className="flex flex-wrap gap-2">
              {PEOPLE.map(person => (
                <PersonDrag key={person.id} person={person} />
              ))}
            </div>
          </div>

          {/* Grid */}
          <div
            className="flex-1 rounded-2xl border border-[var(--card-border)] p-5 relative overflow-auto"
            style={{ background: 'var(--card-bg)', backdropFilter: 'blur(10px)', boxShadow: 'var(--card-shadow)' }}
          >
            {/* Dot pattern */}
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle, var(--t3) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />

            <div className="grid grid-cols-4 gap-3 relative z-[1]">
              {Array.from({ length: 8 }, (_, i) => (
                <GridSlot
                  key={i}
                  index={i}
                  entry={placed.find(p => p.slot === i)}
                  onRemove={removeDesk}
                  onOpenConfig={setConfigSlot}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center mt-4">
          <span className="text-xs text-[var(--t3)] font-medium">
            {seatedCount} сотр · {placed.length} столов
          </span>
          <Button
            onClick={handleDone}
            disabled={seatedCount < 1}
            style={{ padding: '12px 32px' }}
          >
            <Rocket size={16} />
            Запустить
          </Button>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeItem?.type === 'desk' && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--ac)] bg-[var(--bg2)]"
            style={{ opacity: 0.95, boxShadow: 'var(--shadow-lg)' }}
          >
            <RoleIcon name={activeItem.desk.iconName} size={16} color={activeItem.desk.color} />
            <span className="text-xs font-semibold">{activeItem.desk.label}</span>
          </div>
        )}
        {activeItem?.type === 'person' && (
          <div style={{ opacity: 0.95 }}>
            <Avatar person={activeItem.person} size={44} />
          </div>
        )}
      </DragOverlay>

      {/* Config Modal */}
      {configEntry && (
        <ConfigModal
          entry={configEntry}
          projectName={project.name}
          onSave={(data) => updateEntry(configSlot, data)}
          onClose={() => setConfigSlot(null)}
        />
      )}
    </DndContext>
  )
}
