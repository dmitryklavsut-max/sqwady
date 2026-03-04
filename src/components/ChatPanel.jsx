import { useState, useEffect, useRef } from 'react'
import { Send, Clipboard, Hash } from 'lucide-react'
import { CHANNELS, timestamp } from '../data/constants'
import RoleIcon from './RoleIcon'
import Avatar from './Avatar'
import Button from './Button'

export default function ChatPanel({ project, team, tasks, onAddTask }) {
  const [ch, setCh] = useState('general')
  const [msgs, setMsgs] = useState(() => {
    const o = {}
    Object.keys(CHANNELS).forEach((k) => { o[k] = [] })
    if (team[0]) o.general.push({ id: 1, f: team[0].id + team[0].slot, tx: `Команда ${project.name} собрана! Я ${team[0].pn || team[0].label}. Определяю приоритеты.`, t: '09:00' })
    if (team[1]) o.general.push({ id: 2, f: team[1].id + team[1].slot, tx: 'Начинаю архитектурный обзор.', t: '09:05' })
    if (team[2]) o.general.push({ id: 3, f: team[2].id + team[2].slot, tx: 'Инфраструктура готова. Жду задачи.', t: '09:10' })
    team.forEach((m, i) => {
      o.stand.push({ id: 10 + i, f: m.id + m.slot, tx: `Standup:\n- Онбординг\n- Основные задачи\n- Нет блокеров`, t: `09:${String(i * 2).padStart(2, '0')}` })
    })
    return o
  })
  const [inp, setInp] = useState('')
  const endRef = useRef(null)
  const tm = {}
  team.forEach((m) => { tm[m.id + m.slot] = m })

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ch, msgs])

  const send = () => {
    if (!inp.trim()) return
    const taskMatch = inp.match(/^\/task\s+(.+)/)
    const m = { id: Date.now(), f: 'you', tx: inp, t: timestamp() }
    if (taskMatch && onAddTask) {
      const t = {
        id: `T-${String((tasks?.length || 0) + 1).padStart(3, '0')}`,
        title: taskMatch[1],
        as: team[0] ? team[0].id + team[0].slot : '',
        pr: 'P1',
        col: 'todo',
        tags: ['chat'],
      }
      onAddTask(t)
      m.task = t.id + ': ' + taskMatch[1]
    }
    setMsgs((p) => ({ ...p, [ch]: [...(p[ch] || []), m] }))
    setInp('')
  }

  const cm = msgs[ch] || []
  const showTaskHint = inp.startsWith('/task')

  return (
    <div className="flex h-full overflow-hidden w-full">
      {/* ── Channel sidebar ────────────────────────────── */}
      <aside className="w-[200px] shrink-0 flex flex-col overflow-auto border-r border-[var(--bd)] bg-[var(--bg2)]" aria-label="Каналы">
        <div className="px-4 pt-4 pb-2 text-[11px] font-bold text-[var(--t3)] uppercase tracking-wider">
          Каналы
        </div>
        {Object.entries(CHANNELS).map(([k, c]) => {
          const isActive = ch === k
          const unread = !isActive && k === 'eng'
          return (
            <button
              key={k}
              onClick={() => setCh(k)}
              className={`flex items-center gap-2.5 mx-2 px-3 h-9 rounded-lg border-none cursor-pointer text-sm font-medium transition-colors duration-150 shrink-0 text-left ${
                isActive
                  ? 'bg-[var(--bg3)] text-[var(--t)] font-semibold border-l-[3px] border-l-[var(--ac)]'
                  : 'bg-transparent text-[var(--t2)] border-l-[3px] border-l-transparent hover:bg-[var(--bg3)] hover:text-[var(--t)]'
              }`}
              style={{ fontFamily: 'inherit' }}
            >
              <Hash size={14} className="shrink-0 text-[var(--t3)]" />
              <span className="truncate">{c.name}</span>
              {unread && <div className="w-2 h-2 rounded-full bg-red-500 ml-auto shrink-0" />}
            </button>
          )
        })}

        <div className="mt-auto border-t border-[var(--bd)] px-4 py-3">
          <div className="text-[11px] font-bold text-[var(--t3)] uppercase tracking-wider mb-2">Команда</div>
          {team.map((m) => (
            <div
              key={m.id + m.slot}
              className="flex items-center gap-2.5 py-1.5 px-1 rounded-lg hover:bg-[var(--bg3)] transition-colors"
            >
              <div className="relative shrink-0">
                <Avatar person={m.per} size={24} />
                <div className="absolute -bottom-px -right-px w-2 h-2 rounded-full bg-[var(--gn)] border-[1.5px] border-[var(--bg2)]" />
              </div>
              <span className="text-[13px] font-medium text-[var(--t)] truncate">
                {m.pn || m.label}
              </span>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Messages ───────────────────────────────────── */}
      <section className="flex-1 flex flex-col min-w-0">
        {/* Channel header */}
        <header className="flex items-center gap-2.5 px-6 py-3 border-b border-[var(--bd)] bg-[var(--bg2)] shrink-0">
          <Hash size={16} className="text-[var(--t3)]" />
          <span className="text-lg font-semibold">{CHANNELS[ch]?.name}</span>
        </header>

        {/* Message feed */}
        <div className="flex-1 overflow-y-auto py-3">
          {cm.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-[var(--t3)]">
              <RoleIcon name={CHANNELS[ch]?.iconName} size={40} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">Нет сообщений</p>
              <p className="text-xs mt-1">Начните общение в #{CHANNELS[ch]?.name}</p>
            </div>
          )}
          {cm.map((m) => {
            const d = m.f === 'you'
              ? { pn: 'You', color: 'var(--ac)', per: null }
              : tm[m.f] || { pn: '?', color: '#666', per: null }
            return (
              <div
                key={m.id}
                className="flex gap-3 px-6 py-2 hover:bg-[var(--bg3)] transition-colors duration-100 group"
              >
                <div className="shrink-0 mt-1">
                  <Avatar person={m.f === 'you' ? null : d.per} size={36} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-sm" style={{ color: d.color }}>
                      {d.pn || d.label}
                    </span>
                    <span className="text-xs text-[var(--t3)] ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      {m.t}
                    </span>
                  </div>
                  <div className="text-sm text-[var(--t2)] mt-0.5 whitespace-pre-wrap" style={{ lineHeight: 1.6 }}>
                    {m.tx}
                  </div>
                  {m.task && (
                    <div
                      className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--ac)]"
                      style={{ background: 'rgba(99,102,241,0.1)' }}
                    >
                      <Clipboard size={13} />
                      {m.task}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          <div ref={endRef} />
        </div>

        {/* Input area */}
        <div className="px-6 py-4 border-t border-[var(--bd)] bg-[var(--bg2)]">
          {showTaskHint && (
            <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--bg3)] text-xs text-[var(--ac)] font-medium">
              <Clipboard size={12} />
              Создание задачи
            </div>
          )}
          <div className="flex gap-3">
            <input
              value={inp}
              onChange={(e) => setInp(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Сообщение... (/task для задачи)"
              className="flex-1 px-4 h-11 rounded-lg text-sm text-[var(--t)] bg-[var(--bg)] border border-[var(--bd)] outline-none focus:border-[var(--ac)] transition-colors"
            />
            <Button onClick={send} small aria-label="Отправить">
              <Send size={16} />
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
