import { useState } from 'react'
import { Plus, Save, PenLine, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import RoleIcon from './RoleIcon'
import Button from './Button'

function renderContent(text) {
  if (!text) return null
  // Split by code blocks (```...```)
  const parts = text.split(/(```[\s\S]*?```)/g)
  return parts.map((part, i) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const code = part.slice(3, -3).replace(/^\w*\n/, '') // strip optional lang hint
      return (
        <pre
          key={i}
          className="bg-[var(--bg3)] text-[var(--t)] rounded-lg px-4 py-3 text-[13px] font-mono overflow-x-auto my-3"
        >
          {code}
        </pre>
      )
    }
    return (
      <span key={i} className="whitespace-pre-wrap">
        {part}
      </span>
    )
  })
}

export default function WikiView() {
  const { state, dispatch } = useApp()
  const pages = state.wikiPages || []

  const [ac, setAc] = useState(0)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState(null)

  const idx = Math.min(ac, Math.max(0, pages.length - 1))
  const page = pages[idx]

  const startEdit = () => {
    setEditForm({ title: page?.title || '', text: page?.text || '', iconName: page?.iconName || 'FileText' })
    setEditing(true)
  }

  const saveEdit = () => {
    if (!editForm) return
    const updated = pages.map((p, i) => (i === idx ? { ...p, ...editForm } : p))
    dispatch({ type: 'SET_WIKI_PAGES', payload: updated })
    setEditForm(null)
    setEditing(false)
  }

  const toggleMode = () => {
    if (editing) {
      saveEdit()
    } else {
      startEdit()
    }
  }

  const addPage = () => {
    const newPages = [...pages, { title: 'Новая страница', iconName: 'FileText', text: '' }]
    dispatch({ type: 'SET_WIKI_PAGES', payload: newPages })
    setAc(newPages.length - 1)
    setEditForm({ title: 'Новая страница', iconName: 'FileText', text: '' })
    setEditing(true)
  }

  const deletePage = (i) => {
    if (pages.length <= 1) return
    if (!confirm('Удалить страницу?')) return
    const newPages = pages.filter((_, j) => j !== i)
    dispatch({ type: 'SET_WIKI_PAGES', payload: newPages })
    if (ac >= newPages.length) setAc(newPages.length - 1)
    setEditing(false)
    setEditForm(null)
  }

  if (!pages.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--t3)]">
        Нет страниц wiki. Пройдите генерацию workspace.
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden w-full">
      {/* ── Page list ──────────────────────────────────── */}
      <aside className="w-[200px] shrink-0 border-r border-[var(--card-border)] bg-[var(--bg2)] p-3 overflow-auto flex flex-col" aria-label="Wiki страницы">
        <div className="text-[11px] font-bold text-[var(--t3)] uppercase tracking-wider mb-3 px-1">
          Wiki
        </div>
        <div className="flex-1 space-y-0.5">
          {pages.map((p, i) => (
            <div
              key={i}
              onClick={() => { setAc(i); setEditing(false); setEditForm(null) }}
              className={`group flex items-center gap-2 px-2 rounded-lg cursor-pointer text-[12px] transition-colors duration-150 shrink-0 ${
                ac === i
                  ? 'bg-[var(--bg3)] text-[var(--t)] font-semibold border-l-[3px] border-l-[var(--ac)]'
                  : 'text-[var(--t2)] border-l-[3px] border-l-transparent hover:bg-[var(--bg3)] hover:text-[var(--t)]'
              }`}
              style={{ height: 36 }}
            >
              <RoleIcon name={p.iconName} size={14} color={ac === i ? 'var(--ac)' : undefined} className="shrink-0" />
              <span className="truncate flex-1">{p.title}</span>
              {pages.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); deletePage(i) }}
                  className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-5 h-5 rounded border-none cursor-pointer bg-transparent text-[var(--t3)] hover:text-red-400 transition-all shrink-0"
                  aria-label="Удалить страницу"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
        <Button
          onClick={addPage}
          small
          variant="ghost"
          style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}
        >
          <Plus size={14} /> Страница
        </Button>
      </aside>

      {/* ── Content area ───────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-[680px] mx-auto py-8 px-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            {editing && editForm ? (
              <input
                value={editForm.title}
                onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))}
                className="text-[22px] font-bold bg-transparent border-none text-[var(--t)] p-1 outline-none flex-1 border-b-2 border-b-[var(--bd)] focus:border-b-[var(--ac)] transition-colors"
                autoFocus
              />
            ) : (
              <div className="flex items-center gap-3 text-[22px] font-bold">
                <RoleIcon name={page?.iconName} size={22} color="var(--ac)" />
                {page?.title}
              </div>
            )}
            <button
              onClick={toggleMode}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs text-[var(--t2)] cursor-pointer border-none ml-4 bg-[var(--bg3)] hover:bg-[var(--bg4)] hover:text-[var(--t)] transition-colors duration-150 font-medium shrink-0"
              aria-label={editing ? 'Сохранить' : 'Редактировать'}
            >
              {editing ? <><Save size={14} /> Сохранить</> : <><PenLine size={14} /> Редактировать</>}
            </button>
          </div>

          {/* Content */}
          {editing && editForm ? (
            <textarea
              value={editForm.text}
              onChange={(e) => setEditForm(f => ({ ...f, text: e.target.value }))}
              className="w-full min-h-[400px] p-5 rounded-xl text-[13px] text-[var(--t)] outline-none resize-y bg-[var(--bg)] border border-[var(--bd)] focus:border-[var(--ac)] transition-colors font-mono"
              style={{ lineHeight: 1.7 }}
            />
          ) : (
            <div
              className="text-[14px] text-[var(--t2)] p-6 rounded-2xl border border-[var(--card-border)] bg-[var(--bg2)]"
              style={{ lineHeight: 1.7, boxShadow: 'var(--card-shadow)', fontFamily: 'var(--font-mono, monospace)' }}
            >
              {renderContent(page?.text)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
