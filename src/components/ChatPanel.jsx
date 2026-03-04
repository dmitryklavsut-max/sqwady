import { useState, useEffect, useRef } from 'react'
import { Send, Clipboard } from 'lucide-react'
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

  return (
    <div className="flex h-full overflow-hidden w-full">
      {/* ── Channel sidebar ────────────────────────────── */}
      <div className="w-[220px] shrink-0 flex flex-col overflow-auto border-r border-[var(--bd)] bg-[var(--bg2)]">
        <div className="px-4 pt-4 pb-2 text-xs font-bold text-[var(--t3)] uppercase tracking-wider">
          Каналы
        </div>
        {Object.entries(CHANNELS).map(([k, c]) => (
          <div
            key={k}
            onClick={() => setCh(k)}
            className={`flex items-center gap-3 px-4 h-9 cursor-pointer text-sm transition-colors duration-150 shrink-0 ${
              ch === k
                ? 'bg-[var(--bg3)] text-[var(--t)] font-semibold border-l-[3px] border-l-[var(--ac)]'
                : 'text-[var(--t2)] border-l-[3px] border-l-transparent hover:bg-[var(--bg3)] hover:text-[var(--t)]'
            }`}
          >
            <RoleIcon name={c.iconName} size={18} color={ch === k ? 'var(--ac)' : undefined} />
            <span>{c.name}</span>
          </div>
        ))}

        <div className="mt-auto border-t border-[var(--bd)] px-4 py-3">
          <div className="text-xs font-bold text-[var(--t3)] uppercase tracking-wider mb-2">Команда</div>
          {team.map((m) => (
            <div
              key={m.id + m.slot}
              className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-[var(--bg3)] transition-colors"
            >
              <div className="relative">
                <Avatar person={m.per} size={24} />
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--gn)] border-2 border-[var(--bg2)]" />
              </div>
              <span className="text-xs font-medium text-[var(--t)] truncate">
                {m.pn || m.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Messages ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel header */}
        <div className="flex items-center gap-2.5 px-6 py-3 border-b border-[var(--bd)] bg-[var(--bg2)] shrink-0">
          <RoleIcon name={CHANNELS[ch]?.iconName} size={18} color="var(--ac)" />
          <span className="text-base font-semibold">{CHANNELS[ch]?.name}</span>
        </div>

        {/* Message feed */}
        <div className="flex-1 overflow-y-auto py-3">
          {cm.map((m) => {
            const d = m.f === 'you'
              ? { pn: 'You', color: 'var(--ac)', per: null }
              : tm[m.f] || { pn: '?', color: '#666', per: null }
            return (
              <div
                key={m.id}
                className="flex gap-3 px-6 py-2 hover:bg-[var(--bg2)] transition-colors group"
              >
                <div className="shrink-0 mt-0.5">
                  <Avatar person={m.f === 'you' ? null : d.per} size={32} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-[13px]" style={{ color: d.color }}>
                      {d.pn || d.label}
                    </span>
                    <span className="text-xs text-[var(--t3)] opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                      {m.t}
                    </span>
                  </div>
                  <div className="text-sm text-[var(--t2)] leading-relaxed mt-0.5 whitespace-pre-wrap">
                    {m.tx}
                  </div>
                  {m.task && (
                    <div
                      className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--ac)]"
                      style={{ background: 'rgba(129,140,248,0.08)' }}
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

        {/* Input */}
        <div className="px-6 py-4 border-t border-[var(--bd)] bg-[var(--bg2)]">
          <div className="text-xs text-[var(--t3)] mb-2 font-mono">/task Название — создать задачу</div>
          <div className="flex gap-3">
            <input
              value={inp}
              onChange={(e) => setInp(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Написать сообщение..."
              className="flex-1 px-4 h-11 rounded-lg text-sm text-[var(--t)] bg-[var(--bg)] border border-[var(--bd)] outline-none focus:border-[var(--ac)] transition-colors"
            />
            <Button onClick={send} small>
              <Send size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
