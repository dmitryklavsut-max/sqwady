import { chatWithAgent } from './ai'
import { DESKS, timestamp } from '../data/constants'

// ── Meeting type configs ───────────────────────────────────────
const MEETING_TYPES = {
  standup: {
    label: 'Стендап',
    emoji: '🔄',
    defaultRoles: null, // all team
    prompt: (agenda) => `Это ежедневный стендап-митинг. Тема: ${agenda || 'Статус задач'}.
Кратко расскажи:
1. Что ты сделал с прошлого стендапа
2. Что планируешь делать сегодня
3. Есть ли блокеры`,
  },
  review: {
    label: 'Ревью спринта',
    emoji: '📊',
    defaultRoles: null,
    prompt: (agenda) => `Это ревью завершённого спринта. Тема: ${agenda || 'Итоги спринта'}.
Расскажи:
1. Какие задачи завершил в этом спринте
2. Что получилось хорошо, что нет
3. Что можно улучшить в следующем спринте`,
  },
  tech: {
    label: 'Техническое',
    emoji: '⚙️',
    defaultRoles: ['cto', 'back', 'front', 'mob', 'ml', 'ops'],
    prompt: (agenda) => `Это техническое совещание. Тема: ${agenda || 'Архитектурные решения'}.
Поделись своим мнением по теме обсуждения с технической точки зрения.
Предложи конкретные решения и аргументируй.`,
  },
  strategy: {
    label: 'Стратегическое',
    emoji: '🎯',
    defaultRoles: ['ceo', 'pm', 'cto', 'mrk'],
    prompt: (agenda) => `Это стратегическое совещание. Тема: ${agenda || 'Бизнес-стратегия'}.
Поделись своим видением по теме с точки зрения бизнеса и стратегии.
Предложи конкретные шаги и метрики.`,
  },
  emergency: {
    label: 'Экстренное',
    emoji: '🚨',
    defaultRoles: null,
    prompt: (agenda) => `Это экстренное совещание! Проблема: ${agenda || 'Критический блокер'}.
Нужно срочно решить проблему. Предложи:
1. Причину проблемы
2. Немедленное решение
3. Как предотвратить в будущем`,
  },
}

export { MEETING_TYPES }

// ── Mock meeting responses ─────────────────────────────────────
function generateMockMeetingResponse(agent, type, agenda, previousMessages) {
  const role = agent.role || agent.id
  const name = agent.personality?.name || agent.label

  const MOCK_BY_TYPE = {
    standup: {
      ceo: `Вчера: анализировал метрики конверсии, обновил финансовую модель.\nСегодня: встреча с потенциальным инвестором, работаю над питч-деком.\nБлокеры: нет.`,
      cto: `Вчера: ревью архитектуры API, оптимизация запросов к БД.\nСегодня: настройка кэширования, code review PR-ов команды.\nБлокеры: нужна финальная спецификация от PM по новому модулю.`,
      back: `Вчера: реализовал endpoint для авторизации, написал unit-тесты.\nСегодня: интеграция с внешним API, миграции БД.\nБлокеры: жду от CTO решение по структуре базы данных.`,
      front: `Вчера: вёрстка дашборда, компонент графиков.\nСегодня: форма настроек, адаптив под мобильные.\nБлокеры: нужны финальные макеты от дизайнера.`,
      pm: `Вчера: приоритизация бэклога, обновление roadmap.\nСегодня: планирование спринта, sync с командой.\nБлокеры: нет.`,
      des: `Вчера: макеты для страницы настроек, обновление UI kit.\nСегодня: прототип онбординга, иконки.\nБлокеры: нет.`,
      qa: `Вчера: тестирование авторизации, нашёл 3 бага.\nСегодня: регрессионное тестирование, обновление тест-планов.\nБлокеры: нужен доступ к staging окружению.`,
    },
    review: {
      ceo: `В этом спринте: закрыли 8 задач из 12, выполнение 67%. Хорошо: команда стабильно доставляет фичи. Улучшить: нужно лучше оценивать задачи, 4 перенесены.`,
      cto: `Технический долг сократился на 15%. Хорошо: внедрили кэширование, производительность +40%. Улучшить: нужно больше code review, 2 бага в проде.`,
      pm: `Спринт закрыт на 67%. Ключевые фичи доставлены. Хорошо: приоритизация работает. Улучшить: нужно точнее estimating и раньше эскалировать блокеры.`,
    },
    tech: {
      cto: `Предлагаю использовать модульную архитектуру. Каждый сервис — отдельный модуль с чёткими контрактами. Это позволит масштабировать команду без конфликтов.`,
      back: `Согласен с модульным подходом. Для API рекомендую REST + WebSocket для real-time. База: PostgreSQL с Redis для кэша. Нужно определить rate limiting.`,
      front: `С фронта: предлагаю Server Components для критичных страниц, Client Components для интерактива. Design system на базе Tailwind + Radix UI.`,
    },
    strategy: {
      ceo: `Рынок растёт. Наш фокус сейчас — product-market fit. Предлагаю: 1) Интервью с 10 клиентами. 2) A/B тест pricing. 3) Запуск программы early access.`,
      pm: `Согласен с фокусом на PMF. Предлагаю: метрика NPS еженедельно, user research sprint, и чёткие OKR на квартал. Дедлайн по MVP — жёсткий.`,
      mrk: `Для привлечения: Content marketing + SEO, Developer community building. Бюджет: 70% organic, 30% paid. KPI: 500 signups за первый месяц.`,
    },
    emergency: {
      cto: `Анализирую проблему. Вероятная причина: перегрузка сервера из-за отсутствия rate limiting. Немедленное решение: включить throttling. Долгосрочно: автоскейлинг.`,
      back: `Подтверждаю. Логи показывают spike запросов. Включаю rate limiter, добавляю circuit breaker. Время восстановления: ~30 минут.`,
      ops: `Мониторинг подтверждает. Алерт сработал в 14:23. Масштабирую инфраструктуру. Добавляю health checks и автоматический failover.`,
    },
  }

  const typeResponses = MOCK_BY_TYPE[type] || MOCK_BY_TYPE.standup
  if (typeResponses[role]) return typeResponses[role]

  // Generic response for roles not in the mock map
  if (previousMessages.length > 0) {
    const lastSpeaker = previousMessages[previousMessages.length - 1]
    return `Согласен с ${lastSpeaker.name}. Со своей стороны как ${agent.label}: продолжаю работу над текущими задачами. По теме "${agenda}" — готов поддержать решение команды и взять на себя задачи по моему направлению.`
  }
  return `Как ${agent.label}, считаю тему "${agenda}" важной. Работаю над текущими задачами, прогресс стабильный. Готов обсудить детали.`
}

// ── Extract decisions and action items from discussion ──────────
function extractDecisionsAndActions(meetingMessages, team) {
  const decisions = []
  const actionItems = []

  for (const msg of meetingMessages) {
    const text = msg.text || ''
    const lines = text.split('\n')

    for (const line of lines) {
      const lower = line.toLowerCase()
      // Decision keywords
      if (/предлагаю|решение|нужно|необходимо|давайте|согласен.*:|план:/i.test(line) && line.length > 15) {
        const cleaned = line.replace(/^[\d.\-*)\s]+/, '').trim()
        if (cleaned.length > 10 && !decisions.includes(cleaned)) {
          decisions.push(cleaned)
        }
      }
      // Action item keywords
      if (/нужно|необходимо|задача:|создать|реализовать|настроить|написать|добавить|обновить/i.test(line) && line.length > 10) {
        const cleaned = line.replace(/^[\d.\-*)\s]+/, '').trim()
        // Try to find assignee hint
        let assignTo = msg.from
        const assignMatch = cleaned.match(/от\s+(\w+)|для\s+(\w+)/i)
        if (assignMatch) {
          const hint = (assignMatch[1] || assignMatch[2]).toLowerCase()
          const matchDesk = DESKS.find(d =>
            d.id === hint || d.label.toLowerCase().includes(hint)
          )
          if (matchDesk) assignTo = matchDesk.id
        }
        const existing = actionItems.find(a => a.title === cleaned)
        if (!existing && cleaned.length > 10) {
          actionItems.push({
            title: cleaned.slice(0, 100),
            assignTo,
            priority: /срочно|критич|немедленно|экстренн/i.test(cleaned) ? 'P0' : 'P1',
            fromAgent: msg.name || msg.from,
          })
        }
      }
    }
  }

  // Limit to reasonable counts
  return {
    decisions: decisions.slice(0, 5),
    actionItems: actionItems.slice(0, 6),
  }
}

// ── MeetingEngine class ─────────────────────────────────────────
export class MeetingEngine {
  constructor(getState, dispatch) {
    this.getState = getState
    this.dispatch = dispatch
    this._running = false
    this._aborted = false
  }

  get state() {
    return this.getState()
  }

  abort() {
    this._aborted = true
  }

  get isRunning() {
    return this._running
  }

  /**
   * Run a meeting with selected agents.
   * @param {string} type - 'standup' | 'review' | 'tech' | 'strategy' | 'emergency'
   * @param {Array} participants - agent objects
   * @param {string} agenda - meeting topic
   * @param {Object} extraContext - optional extra context (e.g. sprint info)
   * @param {Function} onProgress - callback({ agentId, agentName, status, message })
   * @returns {{ decisions, actionItems, summary, messages }}
   */
  async runMeeting(type, participants, agenda, extraContext = {}, onProgress) {
    if (this._running) return null
    this._running = true
    this._aborted = false

    const config = MEETING_TYPES[type] || MEETING_TYPES.standup
    const { project, tasks, memoryFiles, sprints, currentSprintId } = this.state
    const meetingId = `mtg-${Date.now()}`
    const meetingMessages = []

    // 1. Post meeting start message
    const participantNames = participants.map(a => a.personality?.name || a.label).join(', ')
    const startMsg = {
      id: `${meetingId}-start`,
      from: 'system',
      name: 'Система',
      text: `${config.emoji} **${config.label}**: ${agenda || 'Обсуждение'}.\nУчастники: ${participantNames}`,
      time: timestamp(),
      meetingId,
      meetingType: type,
      meetingStart: true,
    }
    this.dispatch({
      type: 'ADD_MESSAGE',
      payload: { channel: 'meeting', message: startMsg },
    })
    meetingMessages.push(startMsg)

    if (onProgress) onProgress({ status: 'started', meetingId, meetingType: type })

    // 2. Each participant speaks in order
    const previousSpeakers = []

    // Sort: CEO/PM first for standup/strategy, CTO first for tech
    const sorted = [...participants].sort((a, b) => {
      const roleA = a.role || a.id
      const roleB = b.role || b.id
      const orderMap = type === 'tech'
        ? { cto: 0, back: 1, front: 2, ml: 3, ops: 4 }
        : { ceo: 0, pm: 1, cto: 2 }
      const aO = orderMap[roleA] ?? 5
      const bO = orderMap[roleB] ?? 5
      return aO - bO
    })

    for (const agent of sorted) {
      if (this._aborted) break

      const role = agent.role || agent.id
      const agentName = agent.personality?.name || agent.label
      const desk = DESKS.find(d => d.id === role)

      if (onProgress) onProgress({ agentId: role, agentName, status: 'speaking' })

      // Build context with previous speakers' messages
      const prevDiscussion = previousSpeakers.length > 0
        ? previousSpeakers.map(s => `${s.name} (${s.label}): ${s.text}`).join('\n\n')
        : 'Ты первый выступающий.'

      const agentTasks = (tasks || []).filter(t => t.assignee === role)
      const tasksSummary = agentTasks.map(t =>
        `${t.id}: "${t.title}" [${t.column}] (${t.priority})`
      ).join('\n') || 'Нет назначенных задач'

      // Sprint context
      let sprintCtx = ''
      const currentSprint = (sprints || []).find(s => s.id === currentSprintId)
      if (currentSprint) {
        sprintCtx = `\nТекущий спринт: ${currentSprint.name}. Цель: ${currentSprint.goal}.`
      }

      const meetingPrompt = `${config.prompt(agenda)}

Предыдущие выступления:
${prevDiscussion}

Твои текущие задачи:
${tasksSummary}
${sprintCtx}
${extraContext.context || ''}

Отвечай кратко (3-5 предложений), конкретно и по делу. Не повторяй то, что уже сказали другие.`

      const context = {
        recentMessages: previousSpeakers.map(s => ({
          from: 'agent',
          name: s.name,
          text: s.text,
        })),
        project: project || {},
        memoryFiles: memoryFiles || {},
      }

      let responseText
      try {
        responseText = await chatWithAgent(agent, meetingPrompt, context)
      } catch {
        responseText = generateMockMeetingResponse(agent, type, agenda, previousSpeakers)
      }

      // Post agent's message
      const agentMsg = {
        id: `${meetingId}-${role}`,
        from: role,
        name: agentName,
        text: responseText,
        time: timestamp(),
        meetingId,
      }
      this.dispatch({
        type: 'ADD_MESSAGE',
        payload: { channel: 'meeting', message: agentMsg },
      })
      meetingMessages.push(agentMsg)

      previousSpeakers.push({
        role,
        name: agentName,
        label: desk?.label || agent.label,
        text: responseText,
      })

      if (onProgress) onProgress({ agentId: role, agentName, status: 'done', message: responseText })

      // Delay between speakers for UX
      if (!this._aborted) {
        await new Promise(r => setTimeout(r, 1000))
      }
    }

    if (this._aborted) {
      this._running = false
      return null
    }

    // 3. Extract decisions and action items
    const { decisions, actionItems } = extractDecisionsAndActions(
      meetingMessages.filter(m => m.from !== 'system'), participants
    )

    // 4. Build summary
    const summaryLines = [`${config.emoji} **Итоги: ${config.label}** — ${agenda || 'Обсуждение'}`]
    if (decisions.length > 0) {
      summaryLines.push(`\n**Решения:**`)
      decisions.forEach((d, i) => summaryLines.push(`${i + 1}. ${d}`))
    }
    if (actionItems.length > 0) {
      summaryLines.push(`\n**Задачи:**`)
      actionItems.forEach(a => {
        const assignDesk = DESKS.find(d => d.id === a.assignTo)
        summaryLines.push(`- ${a.title} → ${assignDesk?.label || a.assignTo} (${a.priority})`)
      })
    }
    if (decisions.length === 0 && actionItems.length === 0) {
      summaryLines.push(`\nОбсуждение проведено. Конкретные решения будут зафиксированы позже.`)
    }

    const summaryMsg = {
      id: `${meetingId}-summary`,
      from: 'system',
      name: 'Система',
      text: summaryLines.join('\n'),
      time: timestamp(),
      meetingId,
      meetingSummary: true,
      decisions,
      actionItems,
    }
    this.dispatch({
      type: 'ADD_MESSAGE',
      payload: { channel: 'meeting', message: summaryMsg },
    })

    // 5. Create tasks from action items
    for (const item of actionItems) {
      const currentTasks = this.state.tasks || []
      const taskId = `T-${String(currentTasks.length + 1).padStart(3, '0')}`
      let assignee = item.assignTo
      const hasRole = (this.state.team || []).some(t => (t.role || t.id) === assignee)
      if (!hasRole) assignee = sorted[0]?.role || sorted[0]?.id || 'ceo'

      this.dispatch({
        type: 'ADD_TASK',
        payload: {
          id: taskId,
          title: item.title,
          description: `Создано на ${config.label}: "${agenda}". Инициатор: ${item.fromAgent}.`,
          assignee,
          priority: item.priority || 'P1',
          column: 'todo',
          tags: ['meeting', type],
          dueDate: null,
          createdAt: new Date().toISOString().slice(0, 10),
        },
      })
    }

    // 6. Log to DECISIONS.md
    const decisionEntry = `## ${new Date().toLocaleString('ru-RU')} — ${config.label}
Участники: ${participantNames}
Тема: ${agenda || 'Обсуждение'}
${decisions.length > 0 ? `Решения:\n${decisions.map(d => `- ${d}`).join('\n')}` : 'Решения: обсуждение проведено'}
${actionItems.length > 0 ? `Задачи:\n${actionItems.map(a => `- ${a.title} → ${a.assignTo} (${a.priority})`).join('\n')}` : ''}
`
    const currentDecisions = this.state.memoryFiles?.DECISIONS || ''
    this.dispatch({
      type: 'UPDATE_MEMORY_FILE',
      payload: {
        key: 'DECISIONS',
        value: decisionEntry + '\n' + currentDecisions,
      },
    })

    this._running = false

    return {
      meetingId,
      decisions,
      actionItems,
      summary: summaryLines.join('\n'),
      messages: meetingMessages,
    }
  }

  // Pre-built meeting types

  async sprintStandup(team, onProgress) {
    return this.runMeeting('standup', team, 'Ежедневный статус задач', {}, onProgress)
  }

  async sprintReview(team, sprint, onProgress) {
    const agenda = sprint
      ? `Итоги спринта: ${sprint.name}`
      : 'Ревью завершённого спринта'
    return this.runMeeting('review', team, agenda, {
      context: sprint ? `Спринт: ${sprint.name}. Цель: ${sprint.goal}.` : '',
    }, onProgress)
  }

  async techMeeting(techAgents, topic, onProgress) {
    return this.runMeeting('tech', techAgents, topic || 'Техническое решение', {}, onProgress)
  }

  async strategyMeeting(bizAgents, topic, onProgress) {
    return this.runMeeting('strategy', bizAgents, topic || 'Бизнес-стратегия', {}, onProgress)
  }

  async emergencyMeeting(agents, blocker, onProgress) {
    return this.runMeeting('emergency', agents, blocker || 'Критический блокер', {}, onProgress)
  }
}
