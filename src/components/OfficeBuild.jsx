import { useState, useEffect, useRef, useMemo } from 'react'
import { DndContext, useDraggable, useDroppable, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { Plus, UserPlus, X, Users, Rocket, Settings, Lightbulb, ChevronDown, ChevronRight, Search } from 'lucide-react'
import { ROLES, DEPARTMENTS, ROLE_LEVELS, getRolesByDepartment, PEOPLE, WORKSPACE_TABS, DESKS } from '../data/constants'
import { useApp } from '../context/AppContext'
import RoleIcon from './RoleIcon'
import Avatar from './Avatar'
import Button from './Button'
import AgentConfigModal, { generateSystemPrompt } from './AgentConfigModal'

/* ── Draggable role item ─────────────────────────────── */
function RoleDrag({ role, used }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `desk-${role.id}`,
    data: { type: 'desk', desk: role },
    disabled: used,
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-[var(--bd)] transition-all duration-150 ${
        !used ? 'hover:border-[var(--bd2)] hover:shadow-sm' : ''
      }`}
      style={{
        background: used ? 'var(--bg3)' : 'var(--bg2)',
        opacity: used ? 0.3 : isDragging ? 0.5 : 1,
        cursor: used ? 'default' : 'grab',
      }}
    >
      <div
        className="flex items-center justify-center rounded-md w-7 h-7 shrink-0"
        style={{ background: `${role.color}18` }}
      >
        <RoleIcon name={role.iconName} size={14} color={role.color} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold truncate">{role.label}</div>
        {role.level && (
          <div className="text-[9px] text-[var(--t3)] truncate">{role.level}</div>
        )}
      </div>
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

/* ── Department section (collapsible) ─────────────────── */
function DepartmentSection({ dept, roles, usedIds, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen)
  const count = roles.length
  const usedCount = roles.filter(r => usedIds.has(r.id)).length

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-left bg-transparent border-none cursor-pointer hover:bg-[var(--bg3)] transition-colors"
      >
        <div className="flex items-center justify-center w-5 h-5 rounded shrink-0" style={{ background: `${dept.color}18` }}>
          <RoleIcon name={dept.iconName} size={12} color={dept.color} />
        </div>
        <span className="text-[11px] font-bold text-[var(--t2)] flex-1 truncate">{dept.name}</span>
        <span className="text-[9px] text-[var(--t3)] font-medium">{usedCount}/{count}</span>
        {open ? <ChevronDown size={12} className="text-[var(--t3)]" /> : <ChevronRight size={12} className="text-[var(--t3)]" />}
      </button>
      {open && (
        <div className="flex flex-col gap-1 mt-1 pl-1">
          {roles.map(role => (
            <RoleDrag key={role.id} role={role} used={usedIds.has(role.id)} />
          ))}
        </div>
      )}
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
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const initialized = useRef(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  // Filter roles by search + level
  const filteredRoles = useMemo(() => {
    let result = ROLES
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(r =>
        r.label.toLowerCase().includes(q) ||
        r.bio.toLowerCase().includes(q) ||
        r.id.includes(q) ||
        (r.defaultSkills || []).some(s => s.toLowerCase().includes(q))
      )
    }
    if (levelFilter !== 'all') {
      result = result.filter(r => r.level === levelFilter)
    }
    return result
  }, [search, levelFilter])

  // Group filtered roles by department
  const groupedRoles = useMemo(() => {
    const groups = []
    for (const dept of DEPARTMENTS) {
      const deptRoles = filteredRoles.filter(r => r.department === dept.id)
      if (deptRoles.length > 0) groups.push({ dept, roles: deptRoles })
    }
    return groups
  }, [filteredRoles])

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
      if (i >= 12) return // max 12 slots
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

  // Dynamic grid: expand from 8 to 12 slots if needed
  const slotCount = Math.max(8, Math.min(12, placed.length + 2))

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
            Перетащи роль → посади сотрудника → настрой
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
          {/* Sidebar: Role Catalog */}
          <div className="w-56 shrink-0 flex flex-col gap-1.5 overflow-hidden">
            {/* Search */}
            <div className="relative mb-1">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--t3)]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Поиск ролей..."
                className="w-full pl-8 pr-3 py-2 rounded-lg text-[11px] text-[var(--t)] bg-[var(--bg2)] border border-[var(--bd)] outline-none focus:border-[var(--ac)] transition-colors"
              />
            </div>

            {/* Level filter */}
            <div className="flex flex-wrap gap-1 mb-1">
              <button
                onClick={() => setLevelFilter('all')}
                className={`px-2 py-1 rounded-md text-[10px] font-semibold cursor-pointer border transition-all ${
                  levelFilter === 'all'
                    ? 'bg-[var(--ac)] text-white border-[var(--ac)]'
                    : 'bg-[var(--bg2)] text-[var(--t3)] border-[var(--bd)] hover:border-[var(--ac)]'
                }`}
              >
                Все ({ROLES.length})
              </button>
              {ROLE_LEVELS.map(l => {
                const count = ROLES.filter(r => r.level === l.id).length
                return (
                  <button
                    key={l.id}
                    onClick={() => setLevelFilter(l.id === levelFilter ? 'all' : l.id)}
                    className={`px-2 py-1 rounded-md text-[10px] font-semibold cursor-pointer border transition-all ${
                      levelFilter === l.id
                        ? 'bg-[var(--ac)] text-white border-[var(--ac)]'
                        : 'bg-[var(--bg2)] text-[var(--t3)] border-[var(--bd)] hover:border-[var(--ac)]'
                    }`}
                  >
                    {l.label} ({count})
                  </button>
                )
              })}
            </div>

            {/* Department groups */}
            <div className="flex-1 overflow-y-auto pr-1">
              {groupedRoles.map(({ dept, roles }) => (
                <DepartmentSection
                  key={dept.id}
                  dept={dept}
                  roles={roles}
                  usedIds={usedDeskIds}
                  defaultOpen={search.length > 0 || roles.some(r => usedDeskIds.has(r.id))}
                />
              ))}
              {groupedRoles.length === 0 && (
                <div className="text-center text-[var(--t3)] text-xs py-4">
                  Ничего не найдено
                </div>
              )}

              {/* People section */}
              <div className="mt-3 pt-3 border-t border-[var(--bd)]">
                <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--t3)] uppercase tracking-wider mb-2 px-2">
                  <Users size={12} />
                  Люди
                </div>
                <div className="flex flex-wrap gap-2 px-2">
                  {PEOPLE.map(person => (
                    <PersonDrag key={person.id} person={person} />
                  ))}
                </div>
              </div>
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
              {Array.from({ length: slotCount }, (_, i) => (
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
        <AgentConfigModal
          agent={configEntry}
          projectName={project.name}
          onSave={(data) => updateEntry(configSlot, data)}
          onClose={() => setConfigSlot(null)}
        />
      )}
    </DndContext>
  )
}
