import { useState } from 'react'
import { DndContext, useDraggable, useDroppable, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { Plus, UserPlus, X, Check, Armchair, Users, Rocket, Settings } from 'lucide-react'
import { DESKS, PEOPLE, MODELS } from '../data/constants'
import RoleIcon from './RoleIcon'
import Avatar from './Avatar'
import Button from './Button'

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
        boxShadow: !used ? 'var(--shadow-card)' : 'none',
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
                {entry.pn || <Settings size={12} />}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Config Modal ───────────────────────────────────── */
function ConfigModal({ entry, onSave, onClose }) {
  const [name, setName] = useState(entry.pn || '')
  const [bio, setBio] = useState(entry.bio || '')
  const [model, setModel] = useState(entry.model)
  const [mem, setMem] = useState(entry.mem || '')

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[999] animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="animate-pop rounded-2xl p-6 w-[420px]"
        style={{
          background: 'var(--card-bg)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${entry.color}33`,
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-5">
          <Avatar person={entry.per} size={52} />
          <div>
            <div className="flex items-center gap-2">
              <RoleIcon name={entry.iconName} size={18} color={entry.color} />
              <div className="text-base font-bold" style={{ color: entry.color }}>
                {entry.label}
              </div>
            </div>
            <div className="text-xs text-[var(--t3)] mt-0.5">Настройка сотрудника</div>
          </div>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Имя"
            className="w-full px-4 py-3 rounded-lg text-sm text-[var(--t)] bg-[var(--bg)] border border-[var(--bd)] outline-none focus:border-[var(--ac)] transition-colors"
          />
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={2}
            placeholder="Bio / роль"
            className="w-full px-4 py-3 rounded-lg text-sm text-[var(--t)] bg-[var(--bg)] border border-[var(--bd)] outline-none resize-y focus:border-[var(--ac)] transition-colors"
          />
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="px-4 py-3 rounded-lg text-sm text-[var(--t)] bg-[var(--bg)] border border-[var(--bd)] outline-none"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
          <input
            value={mem}
            onChange={(e) => setMem(e.target.value)}
            placeholder="Memory URL"
            className="w-full px-4 py-3 rounded-lg text-xs text-[var(--t)] bg-[var(--bg)] border border-[var(--bd)] outline-none font-mono focus:border-[var(--ac)] transition-colors"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-5">
          <Button onClick={onClose} variant="ghost" small>
            <X size={14} /> Отмена
          </Button>
          <Button onClick={() => onSave({ pn: name, bio, model, mem })} small>
            <Check size={14} /> Сохранить
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ── Main Component ─────────────────────────────────── */
export default function OfficeBuild({ project, onDone }) {
  const [placed, setPlaced] = useState([])
  const [configSlot, setConfigSlot] = useState(null)
  const [activeItem, setActiveItem] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const addDesk = (deskId, slotIndex) => {
    if (placed.find((p) => p.slot === slotIndex)) return
    const desk = DESKS.find((d) => d.id === deskId)
    if (!desk) return
    setPlaced((prev) => [
      ...prev,
      { ...desk, slot: slotIndex, per: null, pn: '', model: 'claude-sonnet-4-6', bio: desk.bio, mem: '' },
    ])
  }

  const seatPerson = (personId, slotIndex) => {
    const person = PEOPLE.find((p) => p.id === personId)
    if (!person) return
    setPlaced((prev) =>
      prev.map((x) => (x.slot === slotIndex ? { ...x, per: person } : x))
    )
    setConfigSlot(slotIndex)
  }

  const updateEntry = (slotIndex, data) => {
    setPlaced((prev) => prev.map((x) => (x.slot === slotIndex ? { ...x, ...data } : x)))
    setConfigSlot(null)
  }

  const removeDesk = (slotIndex) => {
    setPlaced((prev) => prev.filter((x) => x.slot !== slotIndex))
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
      const entry = placed.find((p) => p.slot === slotIndex)
      if (entry && !entry.per) {
        seatPerson(data.person.id, slotIndex)
      }
    }
  }

  const usedDeskIds = new Set(placed.map((p) => p.id))
  const seatedCount = placed.filter((p) => p.per).length

  const configEntry = configSlot !== null ? placed.find((p) => p.slot === configSlot) : null

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen flex flex-col p-6">
        {/* Header */}
        <div className="text-center mb-6 animate-fade-up">
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

        {/* Main area */}
        <div className="flex flex-1 gap-4 overflow-hidden">
          {/* Sidebar: Palette */}
          <div className="w-48 shrink-0 flex flex-col gap-2 overflow-auto pr-1">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--t3)] uppercase tracking-wider mb-1">
              <Armchair size={14} />
              Столы
            </div>
            {DESKS.map((desk) => (
              <DeskDrag key={desk.id} desk={desk} used={usedDeskIds.has(desk.id)} />
            ))}

            <div className="flex items-center gap-2 text-xs font-bold text-[var(--t3)] uppercase tracking-wider mt-3 mb-1">
              <Users size={14} />
              Люди
            </div>
            <div className="flex flex-wrap gap-2">
              {PEOPLE.map((person) => (
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
                  entry={placed.find((p) => p.slot === i)}
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
            {seatedCount} сотрудников · {placed.length} столов
          </span>
          <Button
            onClick={() => onDone(placed.filter((p) => p.per))}
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
          onSave={(data) => updateEntry(configSlot, data)}
          onClose={() => setConfigSlot(null)}
        />
      )}
    </DndContext>
  )
}
