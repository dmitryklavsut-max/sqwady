import { DESKS, timestamp } from '../data/constants'

// ── Issue severity levels ──────────────────────────────────────
// warning  → toast notification
// medium   → CEO/PM reviews
// high     → emergency meeting or user escalation

const SEVERITY_LABELS = {
  warning: 'Предупреждение',
  medium: 'Требует внимания',
  high: 'Критично',
}

export { SEVERITY_LABELS }

// ── WatchdogEngine ─────────────────────────────────────────────
export class WatchdogEngine {
  constructor(getState, dispatch, notify) {
    this.getState = getState
    this.dispatch = dispatch
    this.notify = notify
  }

  get state() {
    return this.getState()
  }

  /**
   * Run full system health check.
   * Returns array of issues found.
   */
  runHealthCheck() {
    const { tasks, team, sprints, currentSprintId } = this.state
    const issues = []
    const now = Date.now()

    // ── Check 1: Stalled agents ────────────────────────────
    // Tasks stuck in "in_progress" with high cyclesSinceUpdate
    const inProgressTasks = (tasks || []).filter(t => t.column === 'in_progress')
    for (const task of inProgressTasks) {
      const cycles = task.cyclesSinceUpdate || 0
      if (cycles >= 2) {
        const agent = (team || []).find(a => (a.role || a.id) === task.assignee)
        const desk = DESKS.find(d => d.id === task.assignee)
        const agentName = agent?.personality?.name || agent?.label || task.assignee
        issues.push({
          id: `stalled-${task.id}`,
          type: 'stalled_agent',
          severity: cycles >= 4 ? 'high' : 'warning',
          title: `${agentName} завис на задаче ${task.id}`,
          description: `Задача "${task.title}" в статусе In Progress уже ${cycles} цикл(ов) без прогресса.`,
          taskId: task.id,
          agentId: task.assignee,
          agentName,
          agentColor: desk?.color || 'var(--ac)',
          recommendation: cycles >= 4 ? 'Созвать экстренный митинг' : 'Опросить агента',
          action: cycles >= 4 ? 'emergency_meeting' : 'poll_agent',
          createdAt: now,
        })
      }
    }

    // ── Check 2: Ping-pong tasks ───────────────────────────
    // Tasks reassigned too many times
    for (const task of (tasks || [])) {
      const reassignCount = task.reassignCount || 0
      if (reassignCount > 3) {
        issues.push({
          id: `pingpong-${task.id}`,
          type: 'ping_pong',
          severity: reassignCount > 5 ? 'high' : 'warning',
          title: `Задача ${task.id} зациклилась`,
          description: `"${task.title}" переназначена ${reassignCount} раз. Возможен конфликт ответственности.`,
          taskId: task.id,
          recommendation: 'Назначить ответственного вручную',
          action: 'reassign',
          createdAt: now,
        })
      }
    }

    // ── Check 3: Task spam ─────────────────────────────────
    // Agent created too many tasks in recent heartbeat
    const recentTasks = (tasks || []).filter(t => {
      if (!t.createdAt) return false
      const created = new Date(t.createdAt).getTime()
      // Within last hour (simulated)
      return now - created < 3600000
    })
    const tasksByCreator = {}
    for (const t of recentTasks) {
      if (t.tags?.includes('heartbeat') || t.tags?.includes('chain')) {
        const creator = t.assignee || 'unknown'
        tasksByCreator[creator] = (tasksByCreator[creator] || 0) + 1
      }
    }
    for (const [role, count] of Object.entries(tasksByCreator)) {
      if (count > 5) {
        const agent = (team || []).find(a => (a.role || a.id) === role)
        const desk = DESKS.find(d => d.id === role)
        const agentName = agent?.personality?.name || agent?.label || role
        issues.push({
          id: `spam-${role}`,
          type: 'task_spam',
          severity: 'warning',
          title: `${agentName} создал слишком много задач`,
          description: `${count} задач создано за последний цикл. Возможна генерация мусорных задач.`,
          agentId: role,
          agentName,
          agentColor: desk?.color || 'var(--ac)',
          recommendation: 'Проверить качество задач',
          action: 'review_tasks',
          createdAt: now,
        })
      }
    }

    // ── Check 4: Returned tasks (backtest fail) ────────────
    for (const task of (tasks || [])) {
      const returnCount = task.returnCount || 0
      if (returnCount > 2) {
        issues.push({
          id: `backtest-${task.id}`,
          type: 'backtest_fail',
          severity: 'high',
          title: `Задача ${task.id} возвращена ${returnCount} раз`,
          description: `"${task.title}" многократно возвращена из Review/Done. Качество работы недостаточно.`,
          taskId: task.id,
          recommendation: 'Созвать техническое совещание',
          action: 'tech_meeting',
          createdAt: now,
        })
      }
    }

    // ── Check 5: Idle system ───────────────────────────────
    const currentSprint = (sprints || []).find(s => s.id === currentSprintId)
    if (currentSprint) {
      const sprintTasks = (tasks || []).filter(t => currentSprint.taskIds.includes(t.id))
      const activeCount = sprintTasks.filter(t => t.column === 'in_progress').length
      const todoCount = sprintTasks.filter(t => t.column === 'todo' || t.column === 'backlog').length
      if (activeCount === 0 && todoCount > 0) {
        issues.push({
          id: 'idle-system',
          type: 'idle',
          severity: 'medium',
          title: 'Система простаивает',
          description: `Нет активных задач в спринте, но ${todoCount} задач ожидают. Агенты не работают.`,
          recommendation: 'Запустить цикл Heartbeat',
          action: 'run_heartbeat',
          createdAt: now,
        })
      }
    }

    // ── Check 6: Token anomaly (estimated) ─────────────────
    // Check if tasks created in recent cycles is abnormally high
    const totalHeartbeatTasks = (tasks || []).filter(t =>
      t.tags?.includes('heartbeat') || t.tags?.includes('chain')
    ).length
    const totalTasks = (tasks || []).length
    if (totalTasks > 0 && totalHeartbeatTasks / totalTasks > 0.7 && totalHeartbeatTasks > 10) {
      issues.push({
        id: 'token-anomaly',
        type: 'token_anomaly',
        severity: 'high',
        title: 'Аномальная генерация задач',
        description: `${totalHeartbeatTasks} из ${totalTasks} задач созданы автоматически (${Math.round(totalHeartbeatTasks / totalTasks * 100)}%). Возможна петля генерации.`,
        recommendation: 'Остановить автоматику и проверить',
        action: 'stop_auto',
        createdAt: now,
      })
    }

    return issues
  }

  /**
   * Resolve issues: notify, post to meeting room, escalate.
   */
  resolveIssues(issues) {
    if (!issues || issues.length === 0) return

    const warnings = issues.filter(i => i.severity === 'warning')
    const mediums = issues.filter(i => i.severity === 'medium')
    const highs = issues.filter(i => i.severity === 'high')

    // Notify user about warnings
    for (const issue of warnings) {
      if (this.notify) {
        this.notify('blocker', issue.title)
      }
    }

    // Medium: notify with more detail
    for (const issue of mediums) {
      if (this.notify) {
        this.notify('info', `${issue.title}: ${issue.recommendation}`)
      }
    }

    // High: urgent notification
    for (const issue of highs) {
      if (this.notify) {
        this.notify('blocker', `${issue.title}`)
      }
    }

    // Post summary to Meeting Room if any issues
    if (issues.length > 0) {
      const lines = [`🔍 **Watchdog**: обнаружено ${issues.length} проблем(а)`]
      for (const issue of issues) {
        const icon = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟠'
        lines.push(`${icon} ${issue.title}`)
      }
      if (highs.length > 0) {
        lines.push(`\n⚠️ Требуется внимание: ${highs.map(i => i.title).join('; ')}`)
      }

      this.dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          channel: 'meeting',
          message: {
            id: `wd-${Date.now()}`,
            from: 'system',
            name: 'Watchdog',
            text: lines.join('\n'),
            time: timestamp(),
            watchdog: true,
          },
        },
      })
    }

    // Store issues in state
    this.dispatch({
      type: 'SET_WATCHDOG_ISSUES',
      payload: issues,
    })
  }

  /**
   * Full run: check + resolve.
   */
  run() {
    const issues = this.runHealthCheck()
    this.resolveIssues(issues)
    return issues
  }
}

/**
 * Increment cyclesSinceUpdate for all in-progress tasks.
 * Call this at the start of each heartbeat cycle.
 */
export function incrementTaskCycles(tasks, dispatch) {
  for (const task of (tasks || [])) {
    if (task.column === 'in_progress') {
      dispatch({
        type: 'UPDATE_TASK',
        payload: {
          id: task.id,
          cyclesSinceUpdate: (task.cyclesSinceUpdate || 0) + 1,
        },
      })
    }
  }
}

/**
 * Reset cyclesSinceUpdate when a task changes status.
 */
export function resetTaskCycle(taskId, dispatch) {
  dispatch({
    type: 'UPDATE_TASK',
    payload: { id: taskId, cyclesSinceUpdate: 0 },
  })
}
