import { useState, useEffect, useRef } from 'react'
import { Send, Clipboard, Hash } from 'lucide-react'
import { CHANNELS, DESKS, timestamp } from '../data/constants'
import { useApp } from '../context/AppContext'
import { chatWithAgent } from '../services/ai'
import Avatar from './Avatar'
import Button from './Button'

// Channel → preferred responder roles
const CHANNEL_ROLES = {
  general: ['ceo', 'pm', 'cto'],
  eng: ['cto', 'back', 'front', 'ops'],
  prod: ['pm', 'ceo', 'des'],
  stand: ['pm', 'ceo'],
  meeting: ['ceo', 'pm', 'cto'],
}

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

function renderMessageText(text, team) {
  // Highlight @mentions in indigo
  const mentionPattern = team.map(t => t.personality?.name).filter(Boolean).join('|')
  if (!mentionPattern) return text
  const regex = new RegExp(`@(${mentionPattern})`, 'gi')
  const parts = text.split(regex)
  if (parts.length === 1) return text
  return parts.map((part, i) => {
    const isMatch = team.some(t => t.personality?.name?.toLowerCase() === part.toLowerCase())
    if (isMatch) {
      return <span key={i} className="text-[var(--ac)] font-semibold">@{part}</span>
    }
    return part
  })
}

export default function ChatPanel() {
  const { state, dispatch } = useApp()
  const { project, team, messages, tasks } = state

  const [ch, setCh] = useState('general')
  const [inp, setInp] = useState('')
  const [typing, setTyping] = useState(null) // { name, role }
  const [readChannels, setReadChannels] = useState(() => new Set(['general']))
  const endRef = useRef(null)

  // Build agent lookup
  const agentByRole = {}
  const agentByName = {}
  team.forEach(t => {
    const role = t.role || t.id
    agentByRole[role] = t
    if (t.personality?.name) {
      agentByName[t.personality.name.toLowerCase()] = t
    }
  })

  // Get desk info for a role
  const getDeskForRole = (roleId) => DESKS.find(d => d.id === roleId)

  // Auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ch, messages, typing])

  // Mark channel as read when switching
  useEffect(() => {
    setReadChannels(prev => new Set([...prev, ch]))
  }, [ch])

  // Check unread: channel has messages not in readChannels
  const hasUnread = (channel) => {
    if (channel === ch) return false
    if (readChannels.has(channel)) return false
    return (messages[channel] || []).length > 0
  }

  const channelMessages = messages[ch] || []

  // Find which agent should respond
  const pickResponder = (userMessage) => {
    // Check @mention first
    for (const t of team) {
      const name = t.personality?.name
      if (name && userMessage.includes(`@${name}`)) {
        return t
      }
    }

    // Channel-based preference
    const preferred = CHANNEL_ROLES[ch] || CHANNEL_ROLES.general
    for (const roleId of preferred) {
      if (agentByRole[roleId]) return agentByRole[roleId]
    }

    // Fallback: first agent
    return team[0]
  }

  const addMessage = (channel, message) => {
    dispatch({
      type: 'ADD_MESSAGE',
      payload: { channel, message },
    })
  }

  const send = async () => {
    if (!inp.trim()) return
    const text = inp.trim()
    setInp('')

    // Check /task command
    const taskMatch = text.match(/^\/task\s+(.+)/)
    const taskTitle = taskMatch ? taskMatch[1] : null

    // Add user message
    const userMsg = {
      id: `msg-${Date.now()}`,
      from: 'user',
      name: 'Вы',
      text,
      time: timestamp(),
      task: null,
    }

    if (taskTitle) {
      const taskId = `T-${String((tasks?.length || 0) + 1).padStart(3, '0')}`
      const assignee = team[0]?.role || team[0]?.id || 'ceo'
      const newTask = {
        id: taskId,
        title: taskTitle,
        description: '',
        assignee,
        priority: 'P1',
        column: 'todo',
        tags: ['chat'],
        dueDate: null,
        createdAt: new Date().toISOString().slice(0, 10),
      }
      dispatch({ type: 'ADD_TASK', payload: newTask })
      userMsg.task = `${taskId}: ${taskTitle}`
    }

    addMessage(ch, userMsg)

    // Pick responder and get AI response
    const agent = pickResponder(text)
    if (!agent) return

    const agentName = agent.personality?.name || agent.label
    const agentRole = agent.role || agent.id

    // Show typing indicator
    setTyping({ name: agentName, role: agentRole })

    // Build context for the agent
    const context = {
      recentMessages: channelMessages.slice(-10).map(m => ({
        from: m.from === 'user' ? 'user' : 'agent',
        text: m.text,
      })),
      projectName: project?.name || '',
    }

    try {
      let replyText
      if (taskTitle) {
        const assigneeName = team[0]?.personality?.name || team[0]?.label || 'CEO'
        replyText = `Задача создана: "${taskTitle}". Назначена на ${assigneeName}. Добавлена в колонку To Do.`
      } else {
        replyText = await chatWithAgent(agent, text, context)
      }

      // Small delay for natural feel
      await new Promise(r => setTimeout(r, 800 + Math.random() * 700))

      setTyping(null)

      const agentMsg = {
        id: `msg-${Date.now()}`,
        from: agentRole,
        name: agentName,
        text: replyText,
        time: timestamp(),
      }
      addMessage(ch, agentMsg)
      // Mark other channels as potentially unread
    } catch {
      setTyping(null)
    }
  }

  const showTaskHint = inp.startsWith('/task')

  return (
    <div className="flex h-full overflow-hidden w-full">
      {/* ── Channel sidebar ────────────────────────────── */}
      <aside className="w-[200px] shrink-0 flex flex-col overflow-auto border-r border-[var(--card-border)] bg-[var(--bg2)]" aria-label="Каналы">
        <div className="px-4 pt-4 pb-2 text-[11px] font-bold text-[var(--t3)] uppercase tracking-wider">
          Каналы
        </div>
        {Object.entries(CHANNELS).map(([k, c]) => {
          const isActive = ch === k
          const unread = hasUnread(k)
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
          {team.map((t) => {
            const name = t.personality?.name || t.label
            const desk = getDeskForRole(t.role || t.id)
            const color = desk?.color || t.color || 'var(--ac)'
            const initials = getInitials(name)
            return (
              <div
                key={t.id || t.role}
                className="flex items-center gap-2.5 py-1.5 px-1 rounded-lg hover:bg-[var(--bg3)] transition-colors"
              >
                <div className="relative shrink-0">
                  <div
                    className="flex items-center justify-center rounded-full font-bold text-[10px] select-none"
                    style={{ width: 24, height: 24, background: `${color}22`, color }}
                  >
                    {initials}
                  </div>
                  <div className="absolute -bottom-px -right-px w-2 h-2 rounded-full bg-[var(--gn)] border-[1.5px] border-[var(--bg2)]" />
                </div>
                <span className="text-[13px] font-medium text-[var(--t)] truncate">
                  {name}
                </span>
              </div>
            )
          })}
        </div>
      </aside>

      {/* ── Messages ───────────────────────────────────── */}
      <section className="flex-1 flex flex-col min-w-0">
        {/* Channel header */}
        <header className="flex items-center gap-2.5 px-6 py-3 border-b border-[var(--bd)] bg-[var(--bg2)] shrink-0">
          <Hash size={16} className="text-[var(--t3)]" />
          <span className="text-lg font-semibold">{CHANNELS[ch]?.name}</span>
          <span className="text-xs text-[var(--t3)] ml-2">{team.length} участников</span>
        </header>

        {/* Message feed */}
        <div className="flex-1 overflow-y-auto py-3">
          {channelMessages.length === 0 && !typing && (
            <div className="flex flex-col items-center justify-center h-full text-[var(--t3)]">
              <Hash size={40} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">Нет сообщений</p>
              <p className="text-xs mt-1">Начните общение в #{CHANNELS[ch]?.name}</p>
            </div>
          )}
          {channelMessages.map((m) => {
            const isUser = m.from === 'user'
            const agent = !isUser ? agentByRole[m.from] : null
            const desk = !isUser ? getDeskForRole(m.from) : null
            const displayName = isUser ? 'Вы' : (m.name || agent?.personality?.name || agent?.label || m.from)
            const color = isUser ? 'var(--ac)' : (desk?.color || agent?.color || '#888')
            const initials = isUser ? 'Вы' : getInitials(displayName)

            return (
              <div
                key={m.id}
                className="flex gap-3 px-6 py-2 hover:bg-[var(--bg3)] transition-colors duration-100 group"
              >
                <div className="shrink-0 mt-1">
                  <div
                    className="flex items-center justify-center rounded-full font-bold select-none"
                    style={{
                      width: 36,
                      height: 36,
                      background: isUser ? 'var(--ac2)' : `${color}22`,
                      color: isUser ? 'white' : color,
                      fontSize: 13,
                    }}
                  >
                    {initials}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-sm" style={{ color }}>
                      {displayName}
                    </span>
                    <span className="text-xs text-[var(--t3)] ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      {m.time}
                    </span>
                  </div>
                  <div className="text-sm text-[var(--t2)] mt-0.5 whitespace-pre-wrap" style={{ lineHeight: 1.6 }}>
                    {renderMessageText(m.text, team)}
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

          {/* Typing indicator */}
          {typing && (
            <div className="flex gap-3 px-6 py-2 animate-fade-in">
              <div className="shrink-0 mt-1">
                <div
                  className="flex items-center justify-center rounded-full font-bold select-none"
                  style={{
                    width: 36,
                    height: 36,
                    background: `${getDeskForRole(typing.role)?.color || 'var(--ac)'}22`,
                    color: getDeskForRole(typing.role)?.color || 'var(--ac)',
                    fontSize: 13,
                  }}
                >
                  {getInitials(typing.name)}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-[var(--t3)] italic">
                <span>{typing.name} печатает</span>
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-[var(--t3)] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 rounded-full bg-[var(--t3)] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 rounded-full bg-[var(--t3)] animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Input area */}
        <div className="px-6 py-4 border-t border-[var(--bd)] bg-[var(--bg2)]">
          {showTaskHint && (
            <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--bg3)] text-xs text-[var(--ac)] font-medium">
              <Clipboard size={12} />
              Создать задачу: /task Название задачи
            </div>
          )}
          <div className="flex gap-3">
            <input
              value={inp}
              onChange={(e) => setInp(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Сообщение... (/task для задачи)"
              className="flex-1 px-4 h-11 rounded-lg text-sm text-[var(--t)] bg-[var(--bg)] border border-[var(--bd)] outline-none focus:border-[var(--ac)] transition-colors"
              disabled={!!typing}
            />
            <Button onClick={send} small aria-label="Отправить" disabled={!!typing}>
              <Send size={16} />
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
