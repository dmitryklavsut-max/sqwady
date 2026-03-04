import { useState, useEffect, useCallback } from 'react'
import { Plus, Eye, PenLine, ChevronLeft, ChevronRight } from 'lucide-react'
import { PITCH_SLIDES } from '../data/constants'
import RoleIcon from './RoleIcon'
import Button from './Button'

export default function PitchStudio() {
  const [ac, setAc] = useState(0)
  const [slides, setSlides] = useState(
    PITCH_SLIDES.map((s, i) => ({ ...s, id: i }))
  )
  const [editing, setEditing] = useState(false)

  const updateSlide = (field, value) => {
    const n = [...slides]
    n[ac] = { ...n[ac], [field]: value }
    setSlides(n)
  }

  const prev = useCallback(() => setAc((a) => Math.max(0, a - 1)), [])
  const next = useCallback(() => setAc((a) => Math.min(slides.length - 1, a + 1)), [slides.length])

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [prev, next])

  return (
    <div className="flex h-full overflow-hidden w-full">
      {/* ── Slide list ─────────────────────────────────── */}
      <aside className="w-[220px] shrink-0 border-r border-[var(--bd)] bg-[var(--bg2)] p-4 overflow-auto flex flex-col" aria-label="Слайды">
        <div className="text-xs font-bold text-[var(--t3)] uppercase tracking-wider mb-3">
          Слайды
        </div>
        <div className="flex-1 space-y-1">
          {slides.map((s, i) => (
            <div
              key={i}
              onClick={() => { setAc(i); setEditing(false) }}
              className={`flex items-center gap-3 px-3 rounded-lg cursor-pointer text-sm transition-colors duration-150 shrink-0 ${
                ac === i
                  ? 'bg-[var(--bg3)] text-[var(--t)] font-semibold border-l-[3px] border-l-[var(--ac)]'
                  : 'text-[var(--t2)] border-l-[3px] border-l-transparent hover:bg-[var(--bg3)] hover:text-[var(--t)]'
              }`}
              style={{ height: 44 }}
            >
              <span className="text-base text-[var(--t3)] font-mono w-5 shrink-0 text-right">{i + 1}</span>
              <RoleIcon name={s.iconName} size={16} color={ac === i ? 'var(--ac)' : undefined} />
              <span className="truncate">{s.title}</span>
            </div>
          ))}
        </div>
        <Button
          onClick={() => {
            setSlides((p) => [...p, { title: 'Новый', iconName: 'FileText', text: '', id: p.length }])
            setAc(slides.length)
          }}
          small
          variant="ghost"
          style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}
        >
          <Plus size={14} /> Добавить слайд
        </Button>
      </aside>

      {/* ── Slide preview ──────────────────────────────── */}
      <div
        className="flex-1 flex flex-col items-center justify-center p-8 relative"
        style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg3))' }}
      >
        {/* Nav arrows */}
        <button
          onClick={prev}
          disabled={ac === 0}
          className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full border-none cursor-pointer bg-[var(--bg3)] text-[var(--t2)] hover:bg-[var(--bg4)] hover:text-[var(--t)] transition-colors disabled:opacity-20 disabled:cursor-default"
          aria-label="Предыдущий слайд"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          onClick={next}
          disabled={ac === slides.length - 1}
          className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full border-none cursor-pointer bg-[var(--bg3)] text-[var(--t2)] hover:bg-[var(--bg4)] hover:text-[var(--t)] transition-colors disabled:opacity-20 disabled:cursor-default"
          aria-label="Следующий слайд"
        >
          <ChevronRight size={22} />
        </button>

        {/* Slide frame */}
        <div
          className="w-full max-w-[720px] rounded-xl border-2 border-[var(--bd)] flex flex-col items-center justify-center p-12 relative bg-[var(--bg2)]"
          style={{ aspectRatio: '16/9', boxShadow: 'var(--shadow-lg)' }}
        >
          {/* Toggle edit */}
          <button
            onClick={() => setEditing(!editing)}
            className="absolute top-4 right-5 flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-[var(--t2)] cursor-pointer border-none bg-[var(--bg3)] hover:bg-[var(--bg4)] hover:text-[var(--t)] transition-colors duration-150 font-medium"
          >
            {editing ? <Eye size={14} /> : <PenLine size={14} />}
            {editing ? 'Preview' : 'Edit'}
          </button>

          {/* Slide counter */}
          <div className="absolute top-4 left-5 text-xs text-[var(--t3)] font-mono">
            {ac + 1} / {slides.length}
          </div>

          {editing ? (
            <div key={`edit-${ac}`} className="w-full flex flex-col gap-4 animate-fade-in">
              <input
                value={slides[ac]?.title || ''}
                onChange={(e) => updateSlide('title', e.target.value)}
                className="text-[32px] font-extrabold bg-transparent border-none text-center text-[var(--t)] p-2 outline-none border-b-2 border-b-[var(--bd)] focus:border-b-[var(--ac)] transition-colors"
              />
              <textarea
                value={slides[ac]?.text || ''}
                onChange={(e) => updateSlide('text', e.target.value)}
                rows={4}
                className="text-base rounded-lg text-[var(--t2)] p-4 leading-relaxed outline-none resize-y bg-[var(--bg)] border border-[var(--bd)] focus:border-[var(--ac)] transition-colors"
              />
            </div>
          ) : (
            <div key={`view-${ac}`} className="animate-fade-in flex flex-col items-center">
              <div className="mb-5">
                <RoleIcon name={slides[ac]?.iconName} size={48} color="var(--ac)" />
              </div>
              <div className="text-[32px] font-extrabold mb-3">{slides[ac]?.title}</div>
              <div className="text-base text-[var(--t2)] leading-relaxed text-center whitespace-pre-wrap max-w-[520px]">
                {slides[ac]?.text}
              </div>
            </div>
          )}

          {/* Dots */}
          <div className="absolute bottom-4 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setAc(i)}
                className="rounded-full cursor-pointer transition-all duration-200 border-none p-0"
                aria-label={`Слайд ${i + 1}`}
                style={{
                  width: i === ac ? 20 : 8,
                  height: 8,
                  background: i === ac ? 'var(--ac2)' : 'var(--bg4)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
