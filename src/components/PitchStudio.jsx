import { useState, useEffect, useCallback } from 'react'
import { Plus, Eye, PenLine, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import RoleIcon from './RoleIcon'
import Button from './Button'

export default function PitchStudio() {
  const { state, dispatch } = useApp()
  const slides = state.pitchSlides || []

  const [ac, setAc] = useState(0)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState(null)

  // Clamp active index
  const idx = Math.min(ac, Math.max(0, slides.length - 1))
  const slide = slides[idx]

  const saveEdit = useCallback(() => {
    if (!editForm) return
    const updated = slides.map((s, i) => (i === idx ? { ...s, ...editForm } : s))
    dispatch({ type: 'SET_PITCH_SLIDES', payload: updated })
    setEditForm(null)
  }, [editForm, slides, idx, dispatch])

  const startEdit = () => {
    setEditForm({ title: slide?.title || '', text: slide?.text || '', iconName: slide?.iconName || 'FileText' })
    setEditing(true)
  }

  const toggleMode = () => {
    if (editing) {
      saveEdit()
      setEditing(false)
    } else {
      startEdit()
    }
  }

  const prev = useCallback(() => setAc(a => Math.max(0, a - 1)), [])
  const next = useCallback(() => setAc(a => Math.min(slides.length - 1, a + 1)), [slides.length])

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [prev, next])

  const addSlide = () => {
    const newSlides = [...slides, { title: 'Новый слайд', iconName: 'FileText', text: '' }]
    dispatch({ type: 'SET_PITCH_SLIDES', payload: newSlides })
    setAc(newSlides.length - 1)
    setEditing(false)
    setEditForm(null)
  }

  const deleteSlide = (i) => {
    if (slides.length <= 1) return
    if (!confirm('Удалить слайд?')) return
    const newSlides = slides.filter((_, j) => j !== i)
    dispatch({ type: 'SET_PITCH_SLIDES', payload: newSlides })
    if (ac >= newSlides.length) setAc(newSlides.length - 1)
    setEditing(false)
    setEditForm(null)
  }

  if (!slides.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--t3)]">
        Нет слайдов. Пройдите генерацию workspace.
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden w-full">
      {/* ── Slide list ─────────────────────────────────── */}
      <aside className="w-[200px] shrink-0 border-r border-[var(--card-border)] bg-[var(--bg2)] p-3 overflow-auto flex flex-col" aria-label="Слайды">
        <div className="text-[11px] font-bold text-[var(--t3)] uppercase tracking-wider mb-3 px-1">
          Слайды
        </div>
        <div className="flex-1 space-y-0.5">
          {slides.map((s, i) => (
            <div
              key={i}
              onClick={() => { setAc(i); setEditing(false); setEditForm(null) }}
              className={`group flex items-center gap-2 px-2 rounded-lg cursor-pointer transition-colors duration-150 shrink-0 ${
                ac === i
                  ? 'bg-[rgba(99,102,241,0.12)] text-[var(--t)] font-semibold'
                  : 'text-[var(--t2)] hover:bg-[var(--bg3)] hover:text-[var(--t)]'
              }`}
              style={{ height: 40 }}
            >
              <span className="text-[13px] text-[var(--t3)] font-mono w-5 shrink-0 text-right">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-[12px] truncate flex-1">{s.title}</span>
              {slides.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSlide(i) }}
                  className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-5 h-5 rounded border-none cursor-pointer bg-transparent text-[var(--t3)] hover:text-red-400 transition-all shrink-0"
                  aria-label="Удалить слайд"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
        <Button
          onClick={addSlide}
          small
          variant="ghost"
          style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}
        >
          <Plus size={14} /> Слайд
        </Button>
      </aside>

      {/* ── Slide preview ──────────────────────────────── */}
      <div
        className="flex-1 flex flex-col items-center justify-center p-8 relative"
        style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg3))' }}
      >
        {/* Nav arrows */}
        <button
          onClick={() => { if (editing) saveEdit(); setEditing(false); prev() }}
          disabled={idx === 0}
          className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full border-none cursor-pointer bg-[var(--bg3)] text-[var(--t2)] hover:bg-[var(--bg4)] hover:text-[var(--t)] transition-colors disabled:opacity-20 disabled:cursor-default"
          aria-label="Предыдущий слайд"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => { if (editing) saveEdit(); setEditing(false); next() }}
          disabled={idx === slides.length - 1}
          className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full border-none cursor-pointer bg-[var(--bg3)] text-[var(--t2)] hover:bg-[var(--bg4)] hover:text-[var(--t)] transition-colors disabled:opacity-20 disabled:cursor-default"
          aria-label="Следующий слайд"
        >
          <ChevronRight size={18} />
        </button>

        {/* Slide frame */}
        <div
          className="w-full max-w-[640px] rounded-[14px] border border-[var(--card-border)] flex flex-col items-center justify-center p-8 relative"
          style={{
            aspectRatio: '16/9',
            boxShadow: 'var(--shadow-lg)',
            background: 'linear-gradient(180deg, var(--bg2), var(--bg3))',
          }}
        >
          {/* Slide counter */}
          <div className="absolute top-4 left-5 text-[11px] text-[var(--t3)] font-mono">
            {idx + 1} / {slides.length}
          </div>

          {/* Toggle edit/preview */}
          <button
            onClick={toggleMode}
            className="absolute top-4 right-5 flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-[var(--t2)] cursor-pointer border-none bg-[var(--bg3)] hover:bg-[var(--bg4)] hover:text-[var(--t)] transition-colors duration-150 font-medium"
          >
            {editing ? <Eye size={14} /> : <PenLine size={14} />}
            {editing ? 'Просмотр' : 'Редактировать'}
          </button>

          {editing && editForm ? (
            <div key={`edit-${idx}`} className="w-full flex flex-col gap-4 animate-fade-in mt-4">
              <input
                value={editForm.iconName}
                onChange={(e) => setEditForm(f => ({ ...f, iconName: e.target.value }))}
                placeholder="Иконка (например FileText)"
                className="text-xs px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--bd)] text-[var(--t)] outline-none focus:border-[var(--ac)] transition-colors font-mono w-48 mx-auto"
              />
              <input
                value={editForm.title}
                onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))}
                className="text-[24px] font-extrabold bg-transparent border-none text-center text-[var(--t)] p-2 outline-none border-b-2 border-b-[var(--bd)] focus:border-b-[var(--ac)] transition-colors"
                autoFocus
              />
              <textarea
                value={editForm.text}
                onChange={(e) => setEditForm(f => ({ ...f, text: e.target.value }))}
                rows={4}
                className="text-[14px] rounded-lg text-[var(--t2)] p-4 leading-relaxed outline-none resize-y bg-[var(--bg)] border border-[var(--bd)] focus:border-[var(--ac)] transition-colors font-mono"
              />
            </div>
          ) : (
            <div key={`view-${idx}`} className="animate-fade-in flex flex-col items-center">
              <div className="mb-4">
                <RoleIcon name={slide?.iconName} size={40} color="var(--ac)" />
              </div>
              <div className="text-[26px] font-extrabold mb-3">{slide?.title}</div>
              <div className="text-[15px] text-[var(--t2)] leading-relaxed text-center whitespace-pre-wrap max-w-[480px]" style={{ lineHeight: 1.6 }}>
                {slide?.text}
              </div>
            </div>
          )}

          {/* Dots */}
          <div className="absolute bottom-4 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => { if (editing) saveEdit(); setEditing(false); setAc(i) }}
                className="rounded-full cursor-pointer transition-all duration-200 border-none p-0"
                aria-label={`Слайд ${i + 1}`}
                style={{
                  width: i === idx ? 20 : 8,
                  height: 8,
                  background: i === idx ? 'var(--ac)' : 'var(--bg4)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
