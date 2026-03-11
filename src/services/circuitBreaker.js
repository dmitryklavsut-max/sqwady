import { DESKS, timestamp } from '../data/constants'

// ── Limit constants ─────────────────────────────────────────────
const LIMITS = {
  MAX_REASSIGN: 3,
  MAX_RETURNS: 2,
  MAX_SUBTASKS: 5,
  MAX_STUCK_CYCLES: 5,
  MAX_CHAIN_DEPTH: 3,
  MAX_AGENTS: 12,
  MAX_HIRES_PER_SPRINT: 2,
}

export { LIMITS }

// ── CircuitBreaker ──────────────────────────────────────────────
export class CircuitBreaker {
  constructor(getState, dispatch, notify, meetingEngine) {
    this.getState = getState
    this.dispatch = dispatch
    this.notify = notify
    this.meetingEngine = meetingEngine
  }

  get state() {
    return this.getState()
  }

  /**
   * Check a single task for limit violations.
   * Returns array of violations (empty = OK).
   */
  checkTask(task) {
    if (!task) return []
    const violations = []
    const { tasks } = this.state

    // Limit 1: Max reassignments
    if ((task.reassignCount || 0) > LIMITS.MAX_REASSIGN) {
      violations.push({
        type: 'max_reassign',
        task,
        severity: 'high',
        title: `Задача ${task.id} переназначена ${task.reassignCount} раз`,
        description: `"${task.title}" превысила лимит переназначений (${LIMITS.MAX_REASSIGN}). Возможен конфликт ответственности.`,
        action: 'escalate_ceo',
      })
    }

    // Limit 2: Max returns to previous column
    if ((task.returnCount || 0) > LIMITS.MAX_RETURNS) {
      violations.push({
        type: 'max_returns',
        task,
        severity: 'high',
        title: `Задача ${task.id} возвращена ${task.returnCount} раз`,
        description: `"${task.title}" возвращена из Review/Done ${task.returnCount} раз. Качество работы недостаточно.`,
        action: 'freeze_and_meeting',
      })
    }

    // Limit 3: Max subtasks from one task
    const subtaskCount = (tasks || []).filter(t => t.parentTaskId === task.id).length
    if (subtaskCount > LIMITS.MAX_SUBTASKS) {
      violations.push({
        type: 'max_subtasks',
        task,
        severity: 'warning',
        title: `Задача ${task.id} создала ${subtaskCount} подзадач`,
        description: `Превышен лимит подзадач (${LIMITS.MAX_SUBTASKS}). Завершите существующие перед созданием новых.`,
        action: 'block_creation',
      })
    }

    // Limit 4: Task stuck in same column > N cycles
    if ((task.cyclesSinceUpdate || 0) > LIMITS.MAX_STUCK_CYCLES) {
      violations.push({
        type: 'stuck',
        task,
        severity: 'high',
        title: `Задача ${task.id} зависла на ${task.cyclesSinceUpdate} циклов`,
        description: `"${task.title}" не менялась ${task.cyclesSinceUpdate} циклов. Агент ${task.assignee} не продвигается.`,
        action: 'escalate_ceo',
      })
    }

    return violations
  }

  /**
   * Check all tasks and return all violations.
   */
  checkAllTasks() {
    const { tasks } = this.state
    const allViolations = []
    for (const task of (tasks || [])) {
      if (task.frozen) continue // skip frozen tasks
      const v = this.checkTask(task)
      allViolations.push(...v)
    }
    return allViolations
  }

  /**
   * Handle a violation — execute the appropriate action.
   * Returns { handled, escalation } where escalation is user-facing if needed.
   */
  async handleViolation(violation) {
    const { task } = violation
    const { team } = this.state

    switch (violation.action) {
      case 'escalate_ceo': {
        // Find CEO agent
        const ceo = (team || []).find(a => (a.role || a.id) === 'ceo')
        const ceoName = ceo?.personality?.name || 'CEO'

        // Generate CEO recommendation (mock)
        const recommendation = this._generateCEORecommendation(violation, team)

        // Post to meeting room
        this.dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            channel: 'meeting',
            message: {
              id: `cb-esc-${Date.now()}`,
              from: 'ceo',
              name: ceoName,
              text: `⚠️ **Circuit Breaker**: ${violation.title}\n\n${violation.description}\n\n**Рекомендация:** ${recommendation.text}`,
              time: timestamp(),
              circuitBreaker: true,
            },
          },
        })

        if (this.notify) {
          this.notify('blocker', `${violation.title}`)
        }

        // Return escalation for UI
        return {
          handled: false,
          escalation: {
            id: `esc-${Date.now()}-${task.id}`,
            violation,
            ceoRecommendation: recommendation,
            ceoName,
            createdAt: Date.now(),
          },
        }
      }

      case 'freeze_and_meeting': {
        // Freeze the task
        this.dispatch({
          type: 'UPDATE_TASK',
          payload: { id: task.id, frozen: true },
        })

        if (this.notify) {
          this.notify('blocker', `Задача ${task.id} заморожена: ${violation.title}`)
        }

        // Post to meeting room
        this.dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            channel: 'meeting',
            message: {
              id: `cb-freeze-${Date.now()}`,
              from: 'system',
              name: 'Circuit Breaker',
              text: `❄️ **Задача заморожена**: ${task.id} "${task.title}"\n${violation.description}\nТребуется совещание для решения проблемы.`,
              time: timestamp(),
              circuitBreaker: true,
            },
          },
        })

        // Trigger emergency meeting if meeting engine available
        if (this.meetingEngine) {
          const involved = this._getInvolvedAgents(task)
          if (involved.length > 0) {
            this.meetingEngine.emergencyMeeting(
              involved,
              `Задача "${task.title}" заморожена — возвращена ${task.returnCount} раз`,
              () => {}
            )
          }
        }

        return { handled: true, escalation: null }
      }

      case 'block_creation': {
        if (this.notify) {
          this.notify('info', `Достигнут лимит подзадач для ${task.id}. Завершите существующие.`)
        }
        return { handled: true, escalation: null }
      }

      case 'escalate_user': {
        // Direct escalation — requires user modal
        return {
          handled: false,
          escalation: {
            id: `esc-${Date.now()}-${task.id}`,
            violation,
            ceoRecommendation: { type: 'escalate', text: 'Требуется решение основателя' },
            ceoName: 'Система',
            createdAt: Date.now(),
          },
        }
      }

      default:
        return { handled: true, escalation: null }
    }
  }

  /**
   * Process all violations — check tasks, handle each, collect escalations.
   */
  async processAll() {
    const violations = this.checkAllTasks()
    const escalations = []

    for (const v of violations) {
      const result = await this.handleViolation(v)
      if (result.escalation) {
        escalations.push(result.escalation)
      }
    }

    return { violations, escalations }
  }

  /**
   * Prevent infinite chain reactions — safety net.
   */
  checkChainDepth(currentDepth) {
    if (currentDepth > LIMITS.MAX_CHAIN_DEPTH) {
      return { blocked: true, reason: 'max_chain_depth' }
    }
    return { blocked: false }
  }

  /**
   * Prevent infinite agent hiring.
   */
  checkHiringLimit() {
    const { team, sprints, currentSprintId } = this.state
    const teamSize = (team || []).length
    const issues = []

    if (teamSize >= LIMITS.MAX_AGENTS) {
      issues.push({
        type: 'max_agents',
        title: `Достигнут лимит команды (${LIMITS.MAX_AGENTS})`,
        description: 'Нельзя добавить больше агентов. Оптимизируйте существующую команду.',
      })
    }

    // Check hires this sprint (agents added during current sprint)
    const currentSprint = (sprints || []).find(s => s.id === currentSprintId)
    if (currentSprint) {
      const hiresThisSprint = (team || []).filter(a =>
        a.hiredAt && new Date(a.hiredAt) >= new Date(currentSprint.startDate)
      ).length
      if (hiresThisSprint >= LIMITS.MAX_HIRES_PER_SPRINT) {
        issues.push({
          type: 'max_sprint_hires',
          title: `Лимит найма в спринте (${LIMITS.MAX_HIRES_PER_SPRINT})`,
          description: 'Дождитесь следующего спринта для расширения команды.',
        })
      }
    }

    return issues
  }

  /**
   * Check if a new subtask can be created for a parent task.
   */
  canCreateSubtask(parentTaskId) {
    const { tasks } = this.state
    const count = (tasks || []).filter(t => t.parentTaskId === parentTaskId).length
    return count < LIMITS.MAX_SUBTASKS
  }

  // ── Private helpers ─────────────────────────────────────────

  _generateCEORecommendation(violation, team) {
    const { task } = violation

    switch (violation.type) {
      case 'max_reassign': {
        // Recommend the agent with fewest in-progress tasks
        const tasks = this.state.tasks || []
        const candidates = (team || []).filter(a => {
          const role = a.role || a.id
          return role !== task.assignee && role !== 'ceo'
        })
        const sorted = candidates.sort((a, b) => {
          const aCount = tasks.filter(t => t.assignee === (a.role || a.id) && t.column === 'in_progress').length
          const bCount = tasks.filter(t => t.assignee === (b.role || b.id) && t.column === 'in_progress').length
          return aCount - bCount
        })
        const best = sorted[0]
        if (best) {
          const desk = DESKS.find(d => d.id === (best.role || best.id))
          return {
            type: 'reassign',
            agentId: best.role || best.id,
            agentName: best.personality?.name || best.label,
            text: `Переназначить на ${best.personality?.name || best.label} (${desk?.label || 'Agent'}) — у него наименьшая нагрузка`,
          }
        }
        return { type: 'cancel', text: 'Отменить задачу — нет подходящего исполнителя' }
      }

      case 'stuck': {
        return {
          type: 'break_down',
          text: `Разбить задачу "${task.title}" на 2-3 более мелкие и переназначить`,
        }
      }

      default:
        return { type: 'review', text: 'Провести ревью задачи и принять решение' }
    }
  }

  _getInvolvedAgents(task) {
    const { team } = this.state
    return (team || []).filter(a => {
      const role = a.role || a.id
      return role === task.assignee || role === 'ceo' || role === 'pm'
    }).slice(0, 4)
  }
}
