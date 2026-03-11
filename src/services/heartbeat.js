import { chatWithAgent } from './ai'
import { DESKS, timestamp } from '../data/constants'
import { getDaysRemaining } from './sprintPlanner'
import { TaskExecutor } from './taskExecutor'
import { promptBuilder, processMemoryTags } from './promptBuilder'

// ── Heartbeat system prompt for status polling ──────────────────
const HEARTBEAT_SYSTEM_SUFFIX = `

ВАЖНО: Ты сейчас участвуешь в цикле статус-отчёта команды.
Ответь СТРОГО в следующем формате (каждая секция с новой строки):

STATUS: [Над чем работаешь сейчас, прогресс в %]
COMPLETED: [Список завершённых задач через ; или "Нет"]
NEED: [Что нужно от других членов команды через ; или "Нет"]
NEW_TASK: [Предложения по новым задачам: "название (assign to Роль, приоритет)" через ; или "Нет"]
BLOCKER: [Блокеры или "Нет"]

Пример:
STATUS: Работаю над T-003 (API endpoint design), 70% complete
COMPLETED: T-001 (Project setup)
NEED: От Backend — схема базы данных для user table
NEW_TASK: Создать миграции базы данных (assign to Backend, P1); Написать тесты для API (assign to QA, P2)
BLOCKER: Нет

ВАЖНО: Ты AI-агент, не человек. У тебя нет выходных, сна, перерывов.
НЕ используй человеческие сроки: 'завтра', 'на следующей неделе', 'в понедельник'.
Оценивай задачи в минутах: простая 2-5 мин, средняя 5-15 мин, сложная 15-60 мин.`

// ── Parse structured response from agent ─────────────────────────
function parseHeartbeatResponse(text, agentRole) {
  const result = {
    status: '',
    completedTasks: [],
    newTaskRequests: [],
    blockers: [],
    needs: [],
    rawMessage: text,
  }

  // Try structured parsing first
  const statusMatch = text.match(/STATUS:\s*(.+?)(?:\n|$)/i)
  const completedMatch = text.match(/COMPLETED:\s*(.+?)(?:\n|$)/i)
  const needMatch = text.match(/NEED:\s*(.+?)(?:\n|$)/i)
  const newTaskMatch = text.match(/NEW_TASK:\s*(.+?)(?:\n|$)/i)
  const blockerMatch = text.match(/BLOCKER:\s*(.+?)(?:\n|$)/i)

  if (statusMatch) {
    result.status = statusMatch[1].trim()
  }

  if (completedMatch && !/нет/i.test(completedMatch[1])) {
    result.completedTasks = completedMatch[1].split(';').map(s => s.trim()).filter(Boolean)
  }

  if (needMatch && !/нет/i.test(needMatch[1])) {
    result.needs = needMatch[1].split(';').map(s => s.trim()).filter(Boolean)
  }

  if (newTaskMatch && !/нет/i.test(newTaskMatch[1])) {
    result.newTaskRequests = newTaskMatch[1].split(';').map(s => {
      const clean = s.trim()
      if (!clean) return null
      // Parse "Task title (assign to Role, P1)"
      const assignMatch = clean.match(/(.+?)\s*\(assign to\s+(\w+),?\s*(P[0-3])?\)/i)
      if (assignMatch) {
        return {
          title: assignMatch[1].trim(),
          assignTo: assignMatch[2].toLowerCase(),
          priority: assignMatch[3] || 'P1',
        }
      }
      return { title: clean, assignTo: agentRole, priority: 'P1' }
    }).filter(Boolean)
  }

  if (blockerMatch && !/нет/i.test(blockerMatch[1])) {
    result.blockers = blockerMatch[1].split(';').map(s => s.trim()).filter(Boolean)
  }

  // Fallback: extract from free text if no structured data found
  if (!statusMatch) {
    result.status = text.split('\n')[0]?.trim() || 'Обновление статуса'

    // Keyword extraction for Russian text
    const lower = text.toLowerCase()
    if (lower.includes('завершил') || lower.includes('готово') || lower.includes('сделал')) {
      const lines = text.split('\n').filter(l =>
        /завершил|готово|сделал|выполнил/i.test(l)
      )
      result.completedTasks = lines.map(l => l.trim())
    }
    if (lower.includes('нужно') || lower.includes('необходимо') || lower.includes('требуется')) {
      const lines = text.split('\n').filter(l =>
        /нужно|необходимо|требуется/i.test(l)
      )
      result.needs = lines.map(l => l.trim())
    }
    if (lower.includes('создать задачу') || lower.includes('новая задача')) {
      const lines = text.split('\n').filter(l =>
        /создать задачу|новая задача/i.test(l)
      )
      result.newTaskRequests = lines.map(l => ({
        title: l.replace(/создать задачу:?\s*/i, '').replace(/новая задача:?\s*/i, '').trim(),
        assignTo: agentRole,
        priority: 'P1',
      }))
    }
    if (lower.includes('блокер') || lower.includes('заблокирован')) {
      const lines = text.split('\n').filter(l =>
        /блокер|заблокирован/i.test(l)
      )
      result.blockers = lines.map(l => l.trim())
    }
  }

  return result
}

// ── Mock fallback responses per role ─────────────────────────────
function generateMockHeartbeat(agent, tasks, project) {
  const role = agent.role || agent.id
  const agentName = agent.personality?.name || agent.label
  const agentTasks = tasks.filter(t => t.assignee === role)
  const inProgress = agentTasks.filter(t => t.column === 'in_progress')
  const todo = agentTasks.filter(t => t.column === 'todo')
  const review = agentTasks.filter(t => t.column === 'review')
  const pName = project?.name || 'проект'

  // Pick a random in-progress or todo task to report on
  const currentTask = inProgress[0] || todo[0]
  const progress = inProgress[0] ? Math.floor(40 + Math.random() * 50) : (todo[0] ? Math.floor(10 + Math.random() * 30) : 0)

  // Possibly "complete" a review task
  const completable = review[0]

  const ROLE_STATUS = {
    ceo: `Работаю над стратегией ${pName}. Анализирую метрики и готовлю обновление для команды.`,
    cto: `Ревью архитектурных решений. Оптимизирую техническую документацию.`,
    back: `Разрабатываю API endpoints. Покрытие тестами — в процессе.`,
    front: `Реализую UI компоненты. Работаю над адаптивностью и accessibility.`,
    mob: `Разрабатываю мобильный интерфейс. Тестирую на разных устройствах.`,
    ml: `Обучаю модель на новых данных. Анализирую метрики качества.`,
    ops: `Настраиваю CI/CD pipeline. Мониторинг и алертинг.`,
    des: `Работаю над дизайн-системой. Подготовка макетов для новых фич.`,
    mrk: `Анализирую каналы привлечения. Подготовка контент-плана.`,
    wr: `Обновляю документацию. Пишу туториалы для пользователей.`,
    pm: `Приоритизирую бэклог. Планирую следующий спринт.`,
    qa: `Тестирую последние изменения. Автоматизация тест-кейсов.`,
  }

  const estMin = currentTask ? Math.floor(5 + Math.random() * 20) : 0
  const status = currentTask
    ? `Работаю над ${currentTask.id} (${currentTask.title}), ${progress}%. Оценка: ~${estMin} мин`
    : (ROLE_STATUS[role] || `Работаю над задачами ${pName}.`)

  const completed = completable ? `${completable.id} (${completable.title})` : 'Нет'

  // Role-specific needs
  const ROLE_NEEDS = {
    ceo: 'Нет',
    cto: 'От Backend — статус API endpoints; От QA — результаты тестирования',
    back: 'От CTO — ревью архитектуры; От Designer — макеты для API',
    front: 'От Designer — финальные макеты; От Backend — API документация',
    pm: 'От CEO — приоритеты; От всех — обновления статусов',
    des: 'От PM — требования к фичам',
    ops: 'От Backend — список сервисов для деплоя',
    qa: 'От Backend — changelog; От Frontend — новые компоненты для тестирования',
    ml: 'От Backend — API для данных; От DevOps — GPU инстансы',
    mrk: 'От PM — роадмап для контент-плана',
    wr: 'От PM — список фич для документации',
    mob: 'От Designer — мобильные макеты; От Backend — API endpoints',
  }

  // Possibly suggest a new task
  const ROLE_TASKS = {
    ceo: { title: 'Подготовить ежемесячный отчёт для инвесторов', assignTo: 'ceo', priority: 'P1' },
    cto: { title: 'Провести code review спринта', assignTo: 'cto', priority: 'P1' },
    back: { title: 'Написать интеграционные тесты для API', assignTo: 'back', priority: 'P2' },
    front: { title: 'Оптимизировать bundle size', assignTo: 'front', priority: 'P2' },
    pm: { title: 'Обновить roadmap на следующий квартал', assignTo: 'pm', priority: 'P1' },
    des: { title: 'Создать гайдлайны по иконкам', assignTo: 'des', priority: 'P3' },
    ops: { title: 'Настроить мониторинг алертов', assignTo: 'ops', priority: 'P1' },
    qa: { title: 'Автоматизировать regression тесты', assignTo: 'qa', priority: 'P2' },
    ml: { title: 'Собрать бенчмарк датасет', assignTo: 'ml', priority: 'P2' },
    mrk: { title: 'Подготовить launch-страницу', assignTo: 'mrk', priority: 'P1' },
    wr: { title: 'Написать changelog для релиза', assignTo: 'wr', priority: 'P2' },
    mob: { title: 'Настроить push-уведомления', assignTo: 'mob', priority: 'P2' },
  }

  // Only suggest new task ~50% of the time
  const suggestTask = Math.random() > 0.5
  const newTask = suggestTask ? ROLE_TASKS[role] : null

  const lines = [
    `STATUS: ${status}`,
    `COMPLETED: ${completed}`,
    `NEED: ${ROLE_NEEDS[role] || 'Нет'}`,
    `NEW_TASK: ${newTask ? `${newTask.title} (assign to ${newTask.assignTo}, ${newTask.priority})` : 'Нет'}`,
    `BLOCKER: Нет`,
  ]

  return lines.join('\n')
}

// ── HeartbeatEngine class ─────────────────────────────────────────
export class HeartbeatEngine {
  constructor(getState, dispatch) {
    this.getState = getState
    this.dispatch = dispatch
    this._running = false
    this._aborted = false
    this.taskExecutor = new TaskExecutor(getState, dispatch)
  }

  get state() {
    return this.getState()
  }

  // Poll a single agent (skip frozen tasks)
  async pollAgent(agent, onProgress) {
    const { tasks, project, memoryFiles, sprints, currentSprintId } = this.state
    const role = agent.role || agent.id
    const agentName = agent.personality?.name || agent.label
    const desk = DESKS.find(d => d.id === role)
    const agentTasks = (tasks || []).filter(t => t.assignee === role && !t.frozen)

    // Build context for the heartbeat poll
    const tasksSummary = agentTasks.map(t =>
      `${t.id}: "${t.title}" [${t.column}] (${t.priority})`
    ).join('\n') || 'Нет назначенных задач'

    // Sprint context
    let sprintContext = ''
    const currentSprint = (sprints || []).find(s => s.id === currentSprintId)
    if (currentSprint) {
      const days = getDaysRemaining(currentSprint)
      sprintContext = `\nТекущий спринт: ${currentSprint.name}. Цель: ${currentSprint.goal}. Осталось ${days} дней.`
    }

    const heartbeatPrompt = `Дай статус-отчёт по своим задачам.

Твои текущие задачи:
${tasksSummary}

Общий контекст проекта: ${project?.name || 'Проект'}, стадия: ${project?.stage || 'MVP'}.${sprintContext}
${HEARTBEAT_SYSTEM_SUFFIX}`

    // Build context for chatWithAgent (PromptBuilder generates system prompt inside chatWithAgent)
    const context = {
      recentMessages: [],
      project: project || {},
      memoryFiles: memoryFiles || {},
    }

    if (onProgress) onProgress({ agentId: role, agentName, status: 'polling' })

    let responseText
    try {
      responseText = await chatWithAgent(agent, heartbeatPrompt, context)
    } catch {
      // If API fails, use mock
      responseText = generateMockHeartbeat(agent, tasks || [], project || {})
    }

    // If response looks like a free-form chat reply (no STATUS: prefix), it's from fallback
    if (!responseText.includes('STATUS:')) {
      responseText = generateMockHeartbeat(agent, tasks || [], project || {})
    }

    // Process memory tags from response
    processMemoryTags(responseText, role, this.dispatch, this.getState)

    const parsed = parseHeartbeatResponse(responseText, role)

    return {
      agentId: role,
      agentName,
      agentLabel: desk?.label || agent.label,
      agentColor: desk?.color || agent.color || 'var(--ac)',
      ...parsed,
    }
  }

  // Run one full cycle
  async runCycle(onProgress) {
    if (this._running) return null
    this._running = true
    this._aborted = false

    const { team, tasks, project } = this.state
    if (!team || team.length === 0) {
      this._running = false
      return null
    }

    const results = []
    let tasksCompleted = 0
    let tasksCreated = 0

    // Sort: CEO first, then PM, then rest
    const sorted = [...team].sort((a, b) => {
      const order = { ceo: 0, pm: 1 }
      const aO = order[a.role || a.id] ?? 2
      const bO = order[b.role || b.id] ?? 2
      return aO - bO
    })

    for (const agent of sorted) {
      if (this._aborted) break

      const result = await this.pollAgent(agent, onProgress)
      results.push(result)

      const role = agent.role || agent.id
      const agentName = agent.personality?.name || agent.label
      const desk = DESKS.find(d => d.id === role)

      // 1. Process completed tasks — move matching tasks to "done"
      for (const completed of result.completedTasks) {
        // Try to match by task ID (e.g., "T-001 (description)")
        const taskIdMatch = completed.match(/T-\d+/)
        if (taskIdMatch) {
          const existingTask = (tasks || []).find(t => t.id === taskIdMatch[0] && t.column !== 'done')
          if (existingTask) {
            this.dispatch({ type: 'UPDATE_TASK', payload: { id: existingTask.id, column: 'done' } })
            tasksCompleted++
          }
        }
      }

      // 2. Create new requested tasks
      for (const req of result.newTaskRequests) {
        const currentTasks = this.state.tasks || []
        const taskId = `T-${String(currentTasks.length + 1).padStart(3, '0')}`
        // Resolve assignTo — find matching desk/role
        let assignee = req.assignTo
        const matchDesk = DESKS.find(d =>
          d.id === req.assignTo.toLowerCase() ||
          d.label.toLowerCase() === req.assignTo.toLowerCase()
        )
        if (matchDesk) assignee = matchDesk.id
        // Only assign if that role exists in team
        const hasRole = team.some(t => (t.role || t.id) === assignee)
        if (!hasRole) assignee = role // fallback to requesting agent

        this.dispatch({
          type: 'ADD_TASK',
          payload: {
            id: taskId,
            title: req.title,
            description: `Создано автоматически по запросу ${agentName} (${desk?.label || role}) в цикле Heartbeat.`,
            assignee,
            priority: req.priority || 'P1',
            column: 'todo',
            tags: ['heartbeat'],
            dueDate: null,
            createdAt: new Date().toISOString().slice(0, 10),
          },
        })
        tasksCreated++
      }

      // 3. Post status to Meeting Room channel
      const statusLines = [`📊 **Статус:** ${result.status}`]
      if (result.completedTasks.length > 0) {
        statusLines.push(`✅ Завершено: ${result.completedTasks.join(', ')}`)
      }
      if (result.needs.length > 0) {
        statusLines.push(`📋 Нужно: ${result.needs.join('; ')}`)
      }
      if (result.newTaskRequests.length > 0) {
        statusLines.push(`➕ Новые задачи: ${result.newTaskRequests.map(r => r.title).join('; ')}`)
      }
      if (result.blockers.length > 0) {
        statusLines.push(`🚫 Блокеры: ${result.blockers.join('; ')}`)
      }

      this.dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          channel: 'meeting',
          message: {
            id: `hb-${Date.now()}-${role}`,
            from: role,
            name: agentName,
            text: statusLines.join('\n'),
            time: timestamp(),
            heartbeat: true,
          },
        },
      })

      // 4. Update agent memory
      const agentMemKey = `agents`
      const currentMem = this.state.memoryFiles?.agents || {}
      const agentMem = currentMem[role] || {}
      const memoryUpdate = {
        ...agentMem,
        memory: `${agentMem.memory || ''}\n[${new Date().toLocaleString('ru-RU')}] ${result.status}`.trim(),
      }
      this.dispatch({
        type: 'UPDATE_MEMORY_FILE',
        payload: {
          key: 'agents',
          value: { ...currentMem, [role]: memoryUpdate },
        },
      })

      if (onProgress) {
        onProgress({
          agentId: role,
          agentName,
          status: 'done',
          result,
        })
      }

      // Small delay between polls for UX
      if (!this._aborted) {
        await new Promise(r => setTimeout(r, 800))
      }
    }

    // 5. Task Execution Phase — agents pick up and execute To Do tasks
    let tasksExecuted = 0
    let tasksReviewed = 0

    for (const agent of sorted) {
      if (this._aborted) break

      const role = agent.role || agent.id
      const agentName = agent.personality?.name || agent.label

      // Pick next task for this agent
      const nextTask = this.taskExecutor.pickNextTask(role)
      if (nextTask) {
        if (onProgress) onProgress({ agentId: role, agentName, status: 'executing', taskId: nextTask.id })

        try {
          await this.taskExecutor.executeTask(nextTask, agent, onProgress)
          tasksExecuted++
        } catch (err) {
          console.warn(`Task execution failed for ${agentName}:`, err.message)
        }

        if (!this._aborted) await new Promise(r => setTimeout(r, 500))
      }
    }

    // 6. Review Phase — process tasks awaiting review
    const reviewableTasks = this.taskExecutor.findReviewableTasks()
    for (const { task: reviewTask, artifact } of reviewableTasks) {
      if (this._aborted) break

      const reviewerRole = reviewTask.reviewerRole
      const reviewer = team.find(t => (t.role || t.id) === reviewerRole)
      if (!reviewer || !artifact) continue

      const reviewerName = reviewer.personality?.name || reviewer.label
      if (onProgress) onProgress({ agentId: reviewerRole, agentName: reviewerName, status: 'reviewing', taskId: reviewTask.id })

      try {
        const reviewResult = await this.taskExecutor.reviewTask(reviewTask, reviewer, artifact, onProgress)
        tasksReviewed++

        // If approved, trigger chain reaction
        if (reviewResult.verdict === 'APPROVED') {
          tasksCompleted++
          if (!this._aborted) {
            const chain = await this.onTaskCompleted(reviewTask.id, onProgress)
            if (chain) {
              tasksCreated += chain.tasksCreated
              tasksCompleted += chain.tasksCompleted
            }
          }
        }
      } catch (err) {
        console.warn(`Review failed for task ${reviewTask.id}:`, err.message)
      }

      if (!this._aborted) await new Promise(r => setTimeout(r, 500))
    }

    // 7. Update PROGRESS.md
    const progressEntry = `## Цикл Heartbeat — ${new Date().toLocaleString('ru-RU')}
Опрошено: ${results.length} агентов
Задач выполнено: ${tasksExecuted}
Задач на ревью: ${tasksReviewed}
Завершено задач: ${tasksCompleted}
Создано задач: ${tasksCreated}
${results.map(r => `- ${r.agentName} (${r.agentLabel}): ${r.status}`).join('\n')}
`
    const currentProgress = this.state.memoryFiles?.PROGRESS || ''
    this.dispatch({
      type: 'UPDATE_MEMORY_FILE',
      payload: {
        key: 'PROGRESS',
        value: progressEntry + '\n' + currentProgress,
      },
    })

    this._running = false

    return {
      agentsPolled: results.length,
      tasksCompleted,
      tasksCreated,
      tasksExecuted,
      tasksReviewed,
      blockers: results.flatMap(r => r.blockers),
      results,
    }
  }

  // Trigger: agent finished a task — recursive chain reaction
  async onTaskCompleted(taskId, onProgress, _depth = 0) {
    const MAX_CHAIN_DEPTH = 3
    if (_depth >= MAX_CHAIN_DEPTH) return { results: [], tasksCreated: 0, tasksCompleted: 0, chainDepth: _depth }

    const { tasks, team, project } = this.state
    const task = (tasks || []).find(t => t.id === taskId)
    if (!task) return { results: [], tasksCreated: 0, tasksCompleted: 0, chainDepth: _depth }

    const completedRole = task.assignee
    const completedAgent = team.find(t => (t.role || t.id) === completedRole)
    const completedName = completedAgent?.personality?.name || completedAgent?.label || completedRole
    const completedDesk = DESKS.find(d => d.id === completedRole)

    // Find dependent agents (who interact with the completed agent's role)
    const dependentAgents = team.filter(t => {
      const role = t.role || t.id
      if (role === completedRole) return false
      const interactions = t.position?.interactions || []
      return interactions.some(i => i.toLowerCase().includes(completedRole))
    })

    const agentsToPoll = dependentAgents.length > 0
      ? dependentAgents.slice(0, 3)
      : []

    if (agentsToPoll.length === 0) return { results: [], tasksCreated: 0, tasksCompleted: 0, chainDepth: _depth }

    const results = []
    let totalTasksCreated = 0
    let totalTasksCompleted = 0

    for (const agent of agentsToPoll) {
      if (this._aborted) break

      const role = agent.role || agent.id
      const agentName = agent.personality?.name || agent.label
      const desk = DESKS.find(d => d.id === role)

      // Sprint context for chain
      let chainSprintCtx = ''
      const { sprints: chainSprints, currentSprintId: chainSprintId } = this.state
      const chainSprint = (chainSprints || []).find(s => s.id === chainSprintId)
      if (chainSprint) {
        const days = getDaysRemaining(chainSprint)
        chainSprintCtx = `\nТекущий спринт: ${chainSprint.name}. Цель: ${chainSprint.goal}. Осталось ${days} дней.`
      }

      // Contextual heartbeat prompt with chain context
      const chainPrompt = `Задача "${task.title}" (${task.id}) завершена ${completedName} (${completedDesk?.label || completedRole}). Результат доступен.${chainSprintCtx}

Какие твои следующие шаги? Есть ли задачи, которые теперь можно начать или завершить?
${HEARTBEAT_SYSTEM_SUFFIX}`

      const context = {
        recentMessages: [],
        project: project || {},
        memoryFiles: this.state.memoryFiles || {},
      }

      if (onProgress) onProgress({ agentId: role, agentName, status: 'polling', chainDepth: _depth })

      let responseText
      try {
        responseText = await chatWithAgent(agent, chainPrompt, context)
      } catch {
        responseText = generateMockHeartbeat(agent, tasks || [], project || {})
      }
      if (!responseText.includes('STATUS:')) {
        responseText = generateMockHeartbeat(agent, tasks || [], project || {})
      }

      const parsed = parseHeartbeatResponse(responseText, role)
      const result = { agentId: role, agentName, agentLabel: desk?.label, agentColor: desk?.color, chainDepth: _depth, ...parsed }
      results.push(result)

      // Process completed tasks
      for (const completed of parsed.completedTasks) {
        const taskIdMatch = completed.match(/T-\d+/)
        if (taskIdMatch) {
          const existingTask = (this.state.tasks || []).find(t => t.id === taskIdMatch[0] && t.column !== 'done')
          if (existingTask) {
            this.dispatch({ type: 'UPDATE_TASK', payload: { id: existingTask.id, column: 'done' } })
            totalTasksCompleted++

            // Recursive chain reaction
            const sub = await this.onTaskCompleted(existingTask.id, onProgress, _depth + 1)
            if (sub) {
              results.push(...sub.results)
              totalTasksCreated += sub.tasksCreated
              totalTasksCompleted += sub.tasksCompleted
            }
          }
        }
      }

      // Create new tasks
      for (const req of parsed.newTaskRequests) {
        const currentTasks = this.state.tasks || []
        const newId = `T-${String(currentTasks.length + 1).padStart(3, '0')}`
        let assignee = req.assignTo
        const matchDesk = DESKS.find(d => d.id === req.assignTo.toLowerCase() || d.label.toLowerCase() === req.assignTo.toLowerCase())
        if (matchDesk) assignee = matchDesk.id
        const hasRole = team.some(t => (t.role || t.id) === assignee)
        if (!hasRole) assignee = role

        this.dispatch({
          type: 'ADD_TASK',
          payload: {
            id: newId,
            title: req.title,
            description: `Создано в цепной реакции после завершения "${task.title}" по запросу ${agentName} (${desk?.label || role}).`,
            assignee,
            priority: req.priority || 'P1',
            column: 'todo',
            tags: ['chain'],
            dueDate: null,
            createdAt: new Date().toISOString().slice(0, 10),
          },
        })
        totalTasksCreated++
      }

      // Post to Meeting Room
      const statusLines = [`🔗 **Цепная реакция** (уровень ${_depth + 1}): ${agentName} реагирует на завершение "${task.title}"`]
      if (parsed.status) statusLines.push(`📊 ${parsed.status}`)
      if (parsed.completedTasks.length > 0) statusLines.push(`✅ Завершено: ${parsed.completedTasks.join(', ')}`)
      if (parsed.newTaskRequests.length > 0) statusLines.push(`➕ Новые: ${parsed.newTaskRequests.map(r => r.title).join('; ')}`)

      this.dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          channel: 'meeting',
          message: {
            id: `chain-${Date.now()}-${role}`,
            from: role,
            name: agentName,
            text: statusLines.join('\n'),
            time: timestamp(),
            heartbeat: true,
          },
        },
      })

      if (onProgress) onProgress({ agentId: role, agentName, status: 'done', result, chainDepth: _depth })

      if (!this._aborted) await new Promise(r => setTimeout(r, 600))
    }

    // Update PROGRESS.md after chain
    if (_depth === 0) {
      const chainEntry = `## Цепная реакция — ${new Date().toLocaleString('ru-RU')}
Триггер: "${task.title}" завершена ${completedName}
Опрошено: ${results.length} агентов (глубина: ${Math.max(...results.map(r => r.chainDepth ?? 0)) + 1})
Создано задач: ${totalTasksCreated}
Завершено задач: ${totalTasksCompleted}
${results.map(r => `- ${r.agentName} (${r.agentLabel}): ${r.status}`).join('\n')}
`
      const currentProgress = this.state.memoryFiles?.PROGRESS || ''
      this.dispatch({
        type: 'UPDATE_MEMORY_FILE',
        payload: { key: 'PROGRESS', value: chainEntry + '\n' + currentProgress },
      })
    }

    return { results, tasksCreated: totalTasksCreated, tasksCompleted: totalTasksCompleted, chainDepth: _depth }
  }

  // Manual cycle trigger
  manualCycle(onProgress) {
    return this.runCycle(onProgress)
  }

  // Abort running cycle
  abort() {
    this._aborted = true
  }

  get isRunning() {
    return this._running
  }

  // Estimate cost for a cycle
  estimateCost(teamSize) {
    // ~1000 tokens per poll (input + output), ~$0.003 per 1K tokens for Sonnet
    const tokensPerPoll = 1500
    const costPer1K = 0.003
    const totalTokens = teamSize * tokensPerPoll
    const cost = (totalTokens / 1000) * costPer1K
    return Math.max(0.01, Math.round(cost * 100) / 100)
  }
}
