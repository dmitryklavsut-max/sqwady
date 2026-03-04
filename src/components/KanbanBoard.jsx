import { useState } from 'react'
import { Plus, X, Check, GripVertical } from 'lucide-react'
import { KANBAN_COLS, KANBAN_NAMES, KANBAN_COLORS, PRIORITY_COLORS } from '../data/constants'
import Avatar from './Avatar'
import Button from './Button'

export default function KanbanBoard({ team, tasks, onSetTasks }) {
  const [mod, setMod] = useState(null)
  const [isNew, setIsNew] = useState(false)
  const [flt, setFlt] = useState('all')
  const [dragOver, setDragOver] = useState(null)
  const [dragging, setDragging] = useState(null)

  const tm = {}
  team.forEach((m) => { tm[m.id + m.slot] = m })

  const mv = (tid, col) => {
    onSetTasks(tasks.map((t) => (t.id === tid ? { ...t, col } : t)))
  }

  const saveTask = (f) => {
    if (isNew) {
      onSetTasks([...tasks, { ...f, id: `T-${String(tasks.length + 1).padStart(3, '0')}` }])
    } else {
      onSetTasks(tasks.map((t) => (t.id === f.id ? f : t)))
    }
    setMod(null)
    setIsNew(false)
  }

  const ft = flt === 'all' ? tasks : tasks.filter((t) => t.as === flt)

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h1 className="text-2xl font-bold" style={{ letterSpacing: '-0.5px' }}>Kanban</h1>
        <div className="flex gap-3 items-center">
          <select
            value={flt}
            onChange={(e) => setFlt(e.target.value)}
            className="px-3 h-9 rounded-lg text-xs text-[var(--t)] bg-[var(--bg2)] border border-[var(--bd)] outline-none focus:border-[var(--ac)] transition-colors"
          >
            <option value="all">Все участники</option>
            {team.map((m) => (
              <option key={m.id + m.slot} value={m.id + m.slot}>
                {m.pn || m.label}
              </option>
            ))}
          </select>
          <Button
            onClick={() => {
              setIsNew(true)
              setMod({ title: '', as: team[0] ? team[0].id + team[0].slot : '', pr: 'P1', col: 'todo', tags: [] })
            }}
            small
          >
            <Plus size={16} /> Задача
          </Button>
        </div>
      </div>

      {/* Columns */}
      <div className="flex-1 flex gap-3 overflow-x-auto pb-2">
        {KANBAN_COLS.map((c) => {
          const ct = ft.filter((t) => t.col === c)
          const isOver = dragOver === c
          return (
            <div
              key={c}
              onDragOver={(e) => { e.preventDefault(); setDragOver(c) }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(null)
                setDragging(null)
                mv(e.dataTransfer.getData('tid'), c)
              }}
              className="flex-1 min-w-[260px] flex flex-col rounded-[10px] p-3 transition-colors duration-150 bg-[var(--bg3)]"
              style={{ borderColor: isOver ? 'var(--ac)' : 'transparent', border: isOver ? '2px solid var(--ac)' : '2px solid transparent' }}
            >
              {/* Column header */}
              <div className="flex items-center gap-2.5 mb-3 px-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: KANBAN_COLORS[c] }} />
                <span className="text-sm font-semibold text-[var(--t)]">{KANBAN_NAMES[c]}</span>
                <span className="text-xs text-[var(--t3)] ml-auto bg-[var(--bg4)] px-2 py-0.5 rounded-full font-medium">
                  {ct.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto space-y-3">
                {ct.map((t) => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData('tid', t.id); setDragging(t.id) }}
                    onDragEnd={() => setDragging(null)}
                    onClick={() => { setIsNew(false); setMod(t) }}
                    className={`rounded-[10px] cursor-grab border border-[var(--bd)] bg-[var(--bg2)] transition-all duration-150 active:cursor-grabbing ${
                      dragging === t.id ? 'scale-[1.02] rotate-[1deg] opacity-70' : 'hover:-translate-y-0.5'
                    }`}
                    style={{
                      borderLeft: `3px solid ${PRIORITY_COLORS[t.pr]}`,
                      boxShadow: dragging === t.id ? 'var(--shadow-lg)' : 'var(--card-shadow)',
                      padding: 14,
                    }}
                  >
                    {/* ID + Priority */}
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[11px] text-[var(--t3)] font-mono font-medium">{t.id}</span>
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                        style={{ color: PRIORITY_COLORS[t.pr], background: PRIORITY_COLORS[t.pr] + '18' }}
                      >
                        {t.pr}
                      </span>
                    </div>
                    {/* Title */}
                    <div className="text-sm font-semibold mb-3 leading-snug">{t.title}</div>
                    {/* Bottom: tags + assignee */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {t.tags?.map((tag) => (
                          <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg3)] text-[var(--t3)] font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                      {tm[t.as] && <Avatar person={tm[t.as]?.per} size={24} />}
                    </div>
                  </div>
                ))}

                {/* Empty state */}
                {ct.length === 0 && (
                  <div className="flex-1 flex items-center justify-center border-2 border-dashed border-[var(--bd)] rounded-[10px] min-h-[80px] text-[13px] text-[var(--t3)]">
                    Перетащите задачу сюда
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Edit modal ─────────────────────────────────── */}
      {mod && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[999] animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => { setMod(null); setIsNew(false) }}
        >
          <div
            className="animate-pop rounded-[14px] p-6 w-[480px] border border-[var(--bd)] bg-[var(--bg2)]"
            style={{ boxShadow: 'var(--shadow-lg)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-5">
              {isNew ? 'Новая задача' : `Редактировать ${mod.id}`}
            </h2>
            <input
              value={mod.title}
              onChange={(e) => setMod({ ...mod, title: e.target.value })}
              placeholder="Название задачи"
              className="w-full px-4 h-10 rounded-lg text-sm text-[var(--t)] bg-[var(--bg)] border border-[var(--bd)] outline-none focus:border-[var(--ac)] transition-colors mb-3"
            />
            <div className="flex gap-3 mb-3">
              <select
                value={mod.as}
                onChange={(e) => setMod({ ...mod, as: e.target.value })}
                className="flex-1 px-3 h-10 rounded-lg text-xs text-[var(--t)] bg-[var(--bg)] border border-[var(--bd)] outline-none"
              >
                {team.map((m) => (
                  <option key={m.id + m.slot} value={m.id + m.slot}>{m.pn || m.label}</option>
                ))}
              </select>
              <select
                value={mod.pr}
                onChange={(e) => setMod({ ...mod, pr: e.target.value })}
                className="w-[100px] px-3 h-10 rounded-lg text-xs text-[var(--t)] bg-[var(--bg)] border border-[var(--bd)] outline-none"
              >
                {Object.keys(PRIORITY_COLORS).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <select
              value={mod.col}
              onChange={(e) => setMod({ ...mod, col: e.target.value })}
              className="w-full px-3 h-10 rounded-lg text-xs text-[var(--t)] bg-[var(--bg)] border border-[var(--bd)] outline-none mb-6"
            >
              {KANBAN_COLS.map((c) => (
                <option key={c} value={c}>{KANBAN_NAMES[c]}</option>
              ))}
            </select>
            <div className="flex justify-end gap-3">
              <Button onClick={() => { setMod(null); setIsNew(false) }} variant="ghost" small>
                <X size={14} /> Отмена
              </Button>
              <Button onClick={() => saveTask(mod)} small>
                <Check size={14} /> Сохранить
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
