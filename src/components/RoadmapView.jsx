import { useState } from 'react'
import { Map, X, Check } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Button from './Button'

const inputClass = 'w-full px-3 py-2 rounded-lg text-sm text-[var(--t)] bg-[var(--bg)] border border-[var(--bd)] outline-none focus:border-[var(--ac)] transition-colors'

export default function RoadmapView() {
  const { state, dispatch } = useApp()
  const roadmap = state.roadmap || []
  const [hover, setHover] = useState(null)
  const [editing, setEditing] = useState(null) // index

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
              <div className="min-w-0 overflow-hidden">
                <div className="text-[13px] font-bold truncate" style={{ color: r.color }}>
                  {r.phase}
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
