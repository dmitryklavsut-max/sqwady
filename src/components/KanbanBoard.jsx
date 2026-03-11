import { useState, useRef, useCallback, useMemo } from 'react'
import { DndContext, useDroppable, useDraggable, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { Plus, X, Check, Trash2 } from 'lucide-react'
import { KANBAN_COLS, KANBAN_NAMES, KANBAN_COLORS, PRIORITY_COLORS, DESKS } from '../data/constants'
import { useApp } from '../context/AppContext'
import { HeartbeatEngine } from '../services/heartbeat'
import { useNotify } from './Notifications'
import Button from './Button'

const inputClass = 'w-full px-3 py-2.5 rounded-lg text-sm text-[var(--t)] bg-[var(--bg)] border border-[var(--bd)] outline-none focus:border-[var(--ac)] transition-colors'

function getInitials(name) {
  if (!name) return '?'
  return name.trim().split(/\s+/).map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

/* ── Draggable Task Card ───────────────────────────── */
function TaskCard({ task, team, onClick, isInSprint }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  })

  const agent = team.find(t => (t.role || t.id) === task.assignee)
  const desk = DESKS.find(d => d.id === task.assignee)
  const assigneeName = agent?.personality?.name || agent?.label || task.assignee
  const assigneeColor = desk?.color || agent?.color || '#888'

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => { e.stopPropagation(); onClick(task) }}
      className={`rounded-xl cursor-grab border border-[var(--card-border)] bg-[var(--bg2)] transition-all duration-200 active:cursor-grabbing ${
        isDragging ? 'opacity-40 scale-95' : 'hover:-translate-y-0.5 hover:border-[rgba(99,102,241,0.2)]'
      }`}
      style={{
        borderLeft: `3px solid ${PRIORITY_COLORS[task.priority] || '#94a3b8'}`,
        boxShadow: 'var(--card-shadow)',
        padding: 14,
      }}
    >
      {/* ID + Priority */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-[11px] text-[var(--t3)] font-mono font-medium">{task.id}</span>
        <span
          className="text-[11px] font-bold px-2 py-0.5 rounded-full"
          style={{ color: PRIORITY_COLORS[task.priority], background: (PRIORITY_COLORS[task.priority] || '#94a3b8') + '18' }}
        >
          {task.priority}
        </span>
      </div>
      {/* Title */}
      <div className="text-[13px] font-semibold mb-1.5 leading-snug">{task.title}</div>
      {/* Description */}
      {task.description && (
        <div className="text-[11px] text-[var(--t3)] mb-2 line-clamp-2 leading-relaxed">{task.description}</div>
      )}
      {/* Tags */}
      {(task.tags?.length > 0 || isInSprint) && (
        <div className="flex flex-wrap gap-1 mb-2">
          {isInSprint && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--ac)' }}>
              sprint
            </span>
          )}
          {(task.tags || []).map(tag => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg3)] text-[var(--t3)] font-medium">
              {tag}
            </span>
          ))}
        </div>
      )}
      {/* Bottom: assignee + due date */}
      <div className="flex items-center justify-between">
        {agent && (
          <div className="flex items-center gap-1.5">
            <div
              className="flex items-center justify-center rounded-full font-bold select-none"
              style={{ width: 22, height: 22, background: `${assigneeColor}22`, color: assigneeColor, fontSize: 9 }}
            >
              {getInitials(assigneeName)}
            </div>
            <span className="text-[11px] text-[var(--t3)] font-medium">{assigneeName.split(' ')[0]}</span>
          </div>
        )}
        {task.dueDate && (
          <span className="text-[11px] text-[var(--t3)]">{task.dueDate}</span>
        )}
      </div>
    </div>
  )
}

/* ── Droppable Column ──────────────────────────────── */
function Column({ colId, tasks, team, onClickTask, sprintTaskIds }) {
  const { isOver, setNodeRef } = useDroppable({ id: colId })

  return (
    <div
      ref={setNodeRef}
      className="flex-1 min-w-[220px] flex flex-col rounded-xl p-2.5 transition-all duration-150"
      style={{
        background: 'var(--bg2)',
        border: isOver ? '2px solid var(--ac)' : '2px solid transparent',
      }}
    >
      {/* Column header */}
      <div className="flex items-center gap-2.5 mb-3 px-1.5">
        <div className="w-2 h-2 rounded-full" style={{ background: KANBAN_COLORS[colId] }} />
        <span className="text-[13px] font-bold text-[var(--t)] uppercase tracking-wide">{KANBAN_NAMES[colId]}</span>
        <span className="text-xs text-[var(--t3)] ml-auto bg-[var(--bg3)] px-2 py-0.5 rounded-full font-medium">
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto space-y-2.5 px-0.5">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} team={team} onClick={onClickTask} isInSprint={sprintTaskIds.has(task.id)} />
        ))}
        {tasks.length === 0 && (
          <div className="flex items-center justify-center border-2 border-dashed border-[var(--bd)] rounded-lg min-h-[70px] text-[12px] text-[var(--t3)]">
            Перетащите задачу
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Create/Edit Modal ─────────────────────────────── */
function TaskModal({ task, isNew, team, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({
    title: task.title || '',
    description: task.description || '',
    assignee: task.assignee || (team[0]?.role || team[0]?.id || ''),
    priority: task.priority || 'P1',
    column: task.column || 'todo',
    tags: (task.tags || []).join(', '),
    dueDate: task.dueDate || '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    if (!form.title.trim()) return
    onSave({
      ...task,
      title: form.title.trim(),
      description: form.description.trim(),
      assignee: form.assignee,
      priority: form.priority,
      column: form.column,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      dueDate: form.dueDate || null,
      createdAt: task.createdAt || new Date().toISOString().slice(0, 10),
    })
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[999] animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="animate-pop rounded-2xl p-6 w-[420px] border border-[var(--card-border)] bg-[var(--bg2)]"
        style={{ boxShadow: 'var(--shadow-lg)' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-5">
          {isNew ? 'Новая задача' : `Редактировать ${task.id}`}
        </h2>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-[var(--t2)] uppercase tracking-wide">Название</label>
            <input
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Название задачи"
              className={`${inputClass} mt-1`}
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--t2)] uppercase tracking-wide">Описание</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={2}
              placeholder="Подробное описание (необязательно)"
              className={`${inputClass} mt-1 resize-y`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[var(--t2)] uppercase tracking-wide">Исполнитель</label>
              <select
                value={form.assignee}
                onChange={e => set('assignee', e.target.value)}
                className={`${inputClass} mt-1 cursor-pointer`}
              >
                {team.map(t => {
                  const role = t.role || t.id
                  const name = t.personality?.name || t.label
                  return <option key={role} value={role}>{name} ({t.label})</option>
                })}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--t2)] uppercase tracking-wide">Приоритет</label>
              <select
                value={form.priority}
                onChange={e => set('priority', e.target.value)}
                className={`${inputClass} mt-1 cursor-pointer`}
              >
                {Object.keys(PRIORITY_COLORS).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[var(--t2)] uppercase tracking-wide">Колонка</label>
              <select
                value={form.column}
                onChange={e => set('column', e.target.value)}
                className={`${inputClass} mt-1 cursor-pointer`}
              >
                {KANBAN_COLS.map(c => (
                  <option key={c} value={c}>{KANBAN_NAMES[c]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--t2)] uppercase tracking-wide">Дедлайн</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={e => set('dueDate', e.target.value)}
                className={`${inputClass} mt-1`}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--t2)] uppercase tracking-wide">Теги</label>
            <input
              value={form.tags}
              onChange={e => set('tags', e.target.value)}
              placeholder="frontend, backend, bug..."
              className={`${inputClass} mt-1`}
            />
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <div>
            {!isNew && (
              <Button onClick={() => onDelete(task.id)} variant="ghost" small>
                <Trash2 size={14} className="text-red-400" /> Удалить
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button onClick={onClose} variant="ghost" small>
              <X size={14} /> Отмена
            </Button>
            <Button onClick={handleSave} small disabled={!form.title.trim()}>
              <Check size={14} /> {isNew ? 'Создать' : 'Сохранить'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Main Component ─────────────────────────────────── */
export default function KanbanBoard({ team }) {
  const { state, dispatch } = useApp()
  const tasks = state.tasks || []
  const notify = useNotify()
  const engineRef = useRef(null)

  const [modal, setModal] = useState(null) // { task, isNew }
  const [filter, setFilter] = useState('all')
  const [activeTask, setActiveTask] = useState(null)

  // Current sprint task IDs for badge
  const sprintTaskIds = useMemo(() => {
    const sprint = (state.sprints || []).find(s => s.id === state.currentSprintId)
    return new Set(sprint?.taskIds || [])
  }, [state.sprints, state.currentSprintId])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.assignee === filter)

  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new HeartbeatEngine(() => state, dispatch)
    }
    engineRef.current.getState = () => state
    return engineRef.current
  }, [state, dispatch])

  const triggerChainReaction = useCallback(async (taskId, taskTitle) => {
    if (!notify) return
    notify('task_completed', `Задача "${taskTitle}" завершена!`)

    const engine = getEngine()
    const chainResult = await engine.onTaskCompleted(taskId, (update) => {
      if (update.status === 'done' && update.result) {
        const r = update.result
        if (r.newTaskRequests.length > 0) {
          notify('new_task', `${update.agentName} создал: ${r.newTaskRequests.map(t => t.title).join(', ')}`)
        }
        if (r.completedTasks.length > 0) {
          notify('chain', `${update.agentName} завершил: ${r.completedTasks.join(', ')}`)
        }
        if (r.blockers.length > 0) {
          notify('blocker', `${update.agentName}: ${r.blockers.join(', ')}`)
        }
      }
    })

    if (chainResult && chainResult.results.length > 0) {
      notify('chain', `Цепная реакция: ${chainResult.results.length} агентов, +${chainResult.tasksCreated} задач`)
    }
  }, [getEngine, notify])

  const handleDragStart = (event) => {
    const task = event.active.data.current?.task
    setActiveTask(task || null)
  }

  const handleDragEnd = (event) => {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const taskId = active.id
    const newColumn = over.id

    // Only move if dropping on a valid column
    if (!KANBAN_COLS.includes(newColumn)) return

    const task = tasks.find(t => t.id === taskId)
    if (!task || task.column === newColumn) return

    dispatch({ type: 'UPDATE_TASK', payload: { id: taskId, column: newColumn } })

    // Trigger chain reaction when task moved to done
    if (newColumn === 'done' && task.column !== 'done') {
      triggerChainReaction(taskId, task.title)
    }
  }

  const handleSave = (taskData) => {
    if (modal.isNew) {
      const id = `T-${String(tasks.length + 1).padStart(3, '0')}`
      dispatch({ type: 'ADD_TASK', payload: { ...taskData, id } })
    } else {
      dispatch({ type: 'UPDATE_TASK', payload: taskData })
    }
    setModal(null)
  }

  const handleDelete = (taskId) => {
    dispatch({ type: 'DELETE_TASK', payload: taskId })
    setModal(null)
  }

  const openCreate = () => {
    setModal({
      isNew: true,
      task: {
        title: '',
        description: '',
        assignee: team[0]?.role || team[0]?.id || '',
        priority: 'P1',
        column: 'todo',
        tags: [],
        dueDate: '',
      },
    })
  }

  const openEdit = (task) => {
    setModal({ isNew: false, task })
  }

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-5 shrink-0">
        <h1 className="text-xl font-bold" style={{ letterSpacing: '-0.5px' }}>Kanban</h1>
        <div className="flex gap-3 items-center">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="px-3 h-9 rounded-lg text-xs text-[var(--t)] bg-[var(--bg2)] border border-[var(--bd)] outline-none focus:border-[var(--ac)] transition-colors cursor-pointer"
          >
            <option value="all">Все участники</option>
            {team.map(t => {
              const role = t.role || t.id
              const name = t.personality?.name || t.label
              return <option key={role} value={role}>{name}</option>
            })}
          </select>
          <Button onClick={openCreate} small>
            <Plus size={16} /> Задача
          </Button>
        </div>
      </div>

      {/* Columns with DnD */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex-1 flex gap-3 overflow-x-auto pb-2">
          {KANBAN_COLS.map(colId => (
            <Column
              key={colId}
              colId={colId}
              tasks={filtered.filter(t => t.column === colId)}
              team={team}
              onClickTask={openEdit}
              sprintTaskIds={sprintTaskIds}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div
              className="rounded-xl border border-[var(--ac)] bg-[var(--bg2)] shadow-lg"
              style={{
                borderLeft: `3px solid ${PRIORITY_COLORS[activeTask.priority] || '#94a3b8'}`,
                padding: 14,
                width: 240,
                transform: 'rotate(2deg)',
              }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] text-[var(--t3)] font-mono font-medium">{activeTask.id}</span>
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{ color: PRIORITY_COLORS[activeTask.priority], background: (PRIORITY_COLORS[activeTask.priority] || '#94a3b8') + '18' }}
                >
                  {activeTask.priority}
                </span>
              </div>
              <div className="text-[13px] font-semibold leading-snug">{activeTask.title}</div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Modal */}
      {modal && (
        <TaskModal
          task={modal.task}
          isNew={modal.isNew}
          team={team}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
