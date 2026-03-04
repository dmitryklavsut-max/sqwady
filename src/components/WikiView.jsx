import { useState } from 'react'
import { Plus, Save, PenLine, BookOpen } from 'lucide-react'
import { WIKI_PAGES } from '../data/constants'
import RoleIcon from './RoleIcon'
import Button from './Button'

export default function WikiView() {
  const [ac, setAc] = useState(0)
  const [pages, setPages] = useState(
    WIKI_PAGES.map((w, i) => ({ ...w, id: i }))
  )
  const [editing, setEditing] = useState(false)

  const updatePage = (field, value) => {
    const n = [...pages]
    n[ac] = { ...n[ac], [field]: value }
    setPages(n)
  }

  return (
    <div className="flex h-full overflow-hidden w-full">
      {/* ── Page list ──────────────────────────────────── */}
      <div className="w-[220px] shrink-0 border-r border-[var(--bd)] bg-[var(--bg2)] p-4 overflow-auto flex flex-col">
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--t3)] uppercase tracking-wider mb-3">
          <BookOpen size={14} />
          Wiki
        </div>
        <div className="flex-1 space-y-1">
          {pages.map((p, i) => (
            <div
              key={i}
              onClick={() => { setAc(i); setEditing(false) }}
              className={`flex items-center gap-3 px-3 h-9 rounded-lg cursor-pointer text-sm transition-colors duration-150 shrink-0 ${
                ac === i
                  ? 'bg-[var(--bg3)] text-[var(--t)] font-semibold border-l-[3px] border-l-[var(--ac)]'
                  : 'text-[var(--t2)] border-l-[3px] border-l-transparent hover:bg-[var(--bg3)] hover:text-[var(--t)]'
              }`}
            >
              <RoleIcon name={p.iconName} size={16} color={ac === i ? 'var(--ac)' : undefined} />
              <span className="truncate">{p.title}</span>
            </div>
          ))}
        </div>
        <Button
          onClick={() => {
            setPages((prev) => [...prev, { title: 'New Page', iconName: 'FileText', text: '', id: prev.length }])
            setAc(pages.length)
            setEditing(true)
          }}
          small
          variant="ghost"
          style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}
        >
          <Plus size={14} /> Страница
        </Button>
      </div>

      {/* ── Content area ───────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-[720px] mx-auto py-8 px-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            {editing ? (
              <input
                value={pages[ac]?.title || ''}
                onChange={(e) => updatePage('title', e.target.value)}
                className="text-[28px] font-extrabold bg-transparent border-none text-[var(--t)] p-1 outline-none flex-1 border-b-2 border-b-[var(--bd)] focus:border-b-[var(--ac)] transition-colors"
              />
            ) : (
              <div className="flex items-center gap-3 text-[28px] font-extrabold">
                <RoleIcon name={pages[ac]?.iconName} size={28} color="var(--ac)" />
                {pages[ac]?.title}
              </div>
            )}
            <button
              onClick={() => setEditing(!editing)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs text-[var(--t2)] cursor-pointer border-none ml-4 bg-[var(--bg3)] hover:bg-[var(--bg4)] hover:text-[var(--t)] transition-colors duration-150 font-medium shrink-0"
            >
              {editing ? <><Save size={14} /> Сохранить</> : <><PenLine size={14} /> Редактировать</>}
            </button>
          </div>

          {/* Content */}
          {editing ? (
            <textarea
              value={pages[ac]?.text || ''}
              onChange={(e) => updatePage('text', e.target.value)}
              className="w-full min-h-[400px] p-5 rounded-xl text-[15px] text-[var(--t)] outline-none resize-y bg-[var(--bg)] border border-[var(--bd)] focus:border-[var(--ac)] transition-colors font-mono"
              style={{ lineHeight: 1.8 }}
            />
          ) : (
            <div
              className="text-[15px] text-[var(--t2)] whitespace-pre-wrap p-6 rounded-xl border border-[var(--bd)] bg-[var(--bg2)] font-mono"
              style={{ lineHeight: 1.8, boxShadow: 'var(--shadow-card)' }}
            >
              {pages[ac]?.text}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
