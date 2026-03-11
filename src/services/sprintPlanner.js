// ── Sprint Planner — pure functions, no AI ──────────────────────

const SPRINT_DURATION_DAYS = 14

/**
 * Generate sprints from roadmap phases.
 * Each phase (duration in months) splits into 2-week sprints.
 * Tasks matching phase items get distributed evenly across sprints.
 */
export function generateSprints(roadmap, tasks, team) {
  if (!roadmap || roadmap.length === 0) return { sprints: [], currentSprintId: null }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const sprints = []

  for (const phase of roadmap) {
    const phaseMonths = phase.duration || 3
    const sprintCount = Math.max(1, Math.round((phaseMonths * 30) / SPRINT_DURATION_DAYS))
    const phaseStartDate = new Date(today)
    phaseStartDate.setMonth(phaseStartDate.getMonth() + (phase.start || 0))

    // Find tasks that match this phase's items (by keyword overlap)
    const phaseItems = (phase.items || []).map(i => i.toLowerCase())
    const phaseTasks = (tasks || []).filter(t => {
      const text = `${t.title} ${t.description} ${(t.tags || []).join(' ')}`.toLowerCase()
      return phaseItems.some(item => {
        const words = item.split(/\s+/).filter(w => w.length > 3)
        return words.some(w => text.includes(w))
      })
    })

    // If no keyword match, distribute tasks assigned to team members in this phase
    const taskPool = phaseTasks.length > 0 ? phaseTasks : []

    // Distribute tasks evenly across sprints
    const tasksPerSprint = Math.ceil(taskPool.length / sprintCount) || 0

    const phaseLabel = phase.phase || `Phase ${phase.id}`
    const phaseSnippet = phaseLabel.length > 20 ? phaseLabel.slice(0, 20) + '…' : phaseLabel

    for (let n = 0; n < sprintCount; n++) {
      const startDate = new Date(phaseStartDate)
      startDate.setDate(startDate.getDate() + n * SPRINT_DURATION_DAYS)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + SPRINT_DURATION_DAYS - 1)

      const sprintTasks = taskPool.slice(n * tasksPerSprint, (n + 1) * tasksPerSprint)

      sprints.push({
        id: `sp-${phase.id || sprints.length + 1}-${n + 1}`,
        name: `Sprint ${sprints.length + 1} — ${phaseSnippet}`,
        goal: n === 0
          ? `Запуск: ${phaseItems.slice(0, 3).join(', ') || phaseLabel}`
          : `Продолжение: ${phaseItems.slice(0, 3).join(', ') || phaseLabel}`,
        phase: phase.id || `p${sprints.length}`,
        startDate: fmt(startDate),
        endDate: fmt(endDate),
        taskIds: sprintTasks.map(t => t.id),
        status: 'planned',
      })
    }
  }

  // First sprint is active
  if (sprints.length > 0) {
    sprints[0].status = 'active'
  }

  return { sprints, currentSprintId: sprints[0]?.id || null }
}

/**
 * Check sprint progress based on tasks.
 * Returns { done, total, percent, status }
 */
export function checkSprintProgress(sprint, tasks) {
  if (!sprint || !tasks) return { done: 0, total: 0, percent: 0, status: 'on_track' }

  const sprintTasks = tasks.filter(t => sprint.taskIds.includes(t.id))
  const total = sprintTasks.length
  const done = sprintTasks.filter(t => t.column === 'done').length
  const percent = total > 0 ? Math.round((done / total) * 100) : 0

  // Calculate time progress
  const now = new Date()
  const start = new Date(sprint.startDate)
  const end = new Date(sprint.endDate)
  const totalDays = Math.max(1, (end - start) / (1000 * 60 * 60 * 24))
  const elapsed = Math.max(0, (now - start) / (1000 * 60 * 60 * 24))
  const timePercent = Math.min(100, Math.round((elapsed / totalDays) * 100))

  let status = 'on_track'
  if (timePercent > 70 && percent < 30) {
    status = 'at_risk'
  } else if (timePercent > percent + 20) {
    status = 'behind'
  }

  return { done, total, percent, status, timePercent }
}

/**
 * Advance to next sprint: mark current as completed, carry over incomplete tasks, activate next.
 * Returns { sprints, currentSprintId }
 */
export function planNextSprint(sprints, currentSprintId, tasks) {
  if (!sprints || sprints.length === 0) return { sprints: [], currentSprintId: null }

  const currentIdx = sprints.findIndex(s => s.id === currentSprintId)
  if (currentIdx === -1) return { sprints, currentSprintId }

  const current = sprints[currentIdx]

  // Find incomplete tasks from current sprint
  const incompleteTasks = (tasks || [])
    .filter(t => current.taskIds.includes(t.id) && t.column !== 'done')
    .map(t => t.id)

  // Find next planned sprint
  const nextIdx = sprints.findIndex((s, i) => i > currentIdx && s.status === 'planned')

  const updated = sprints.map((s, i) => {
    if (i === currentIdx) {
      return { ...s, status: 'completed' }
    }
    if (nextIdx !== -1 && i === nextIdx) {
      return {
        ...s,
        status: 'active',
        taskIds: [...new Set([...s.taskIds, ...incompleteTasks])],
      }
    }
    return s
  })

  const newCurrentId = nextIdx !== -1 ? updated[nextIdx].id : null

  return { sprints: updated, currentSprintId: newCurrentId }
}

/**
 * Get days remaining in sprint.
 */
export function getDaysRemaining(sprint) {
  if (!sprint) return 0
  const now = new Date()
  const end = new Date(sprint.endDate)
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

function fmt(date) {
  return date.toISOString().slice(0, 10)
}
