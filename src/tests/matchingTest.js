/**
 * Task-Agent Matching Test
 * Tests that _buildRoleIds + _isTaskForAgent correctly match
 * all real-world assignee formats to agent roles.
 *
 * Run: node src/tests/matchingTest.js
 */

// ── Inline the logic from constants.js (no ESM import in Node CJS) ──

const ROLES = [
  { id: 'ceo', label: 'CEO' },
  { id: 'coo', label: 'COO' },
  { id: 'cfo', label: 'CFO' },
  { id: 'cmo', label: 'CMO' },
  { id: 'cpo', label: 'CPO' },
  { id: 'pm', label: 'Product Manager' },
  { id: 'po', label: 'Product Owner' },
  { id: 'ba', label: 'Business Analyst' },
  { id: 'ux_researcher', label: 'UX Researcher' },
  { id: 'cto', label: 'CTO' },
  { id: 'tech_lead', label: 'Tech Lead' },
  { id: 'backend', label: 'Backend Developer' },
  { id: 'frontend', label: 'Frontend Developer' },
  { id: 'fullstack', label: 'Fullstack Developer' },
  { id: 'mobile', label: 'Mobile Developer' },
  { id: 'devops', label: 'DevOps Engineer' },
  { id: 'qa', label: 'QA Engineer' },
  { id: 'security', label: 'Security Engineer' },
  { id: 'designer', label: 'UI/UX Designer' },
  { id: 'ux_designer', label: 'UX Designer' },
  { id: 'graphic_designer', label: 'Graphic Designer' },
  { id: 'motion_designer', label: 'Motion Designer' },
  { id: 'ml_eng', label: 'ML Engineer' },
  { id: 'data_scientist', label: 'Data Scientist' },
  { id: 'data_engineer', label: 'Data Engineer' },
  { id: 'ai_researcher', label: 'AI Researcher' },
  { id: 'marketer', label: 'Growth Marketer' },
  { id: 'content_manager', label: 'Content Manager' },
  { id: 'smm', label: 'SMM Manager' },
  { id: 'seo', label: 'SEO Specialist' },
  { id: 'pr', label: 'PR Manager' },
  { id: 'email_marketer', label: 'Email Marketer' },
  { id: 'sales_manager', label: 'Sales Manager' },
  { id: 'bdr', label: 'BDR / SDR' },
  { id: 'account_manager', label: 'Account Manager' },
  { id: 'partnerships', label: 'Partnership Manager' },
  { id: 'ops_manager', label: 'Operations Manager' },
  { id: 'project_manager', label: 'Project Manager' },
  { id: 'secretary', label: 'Executive Assistant' },
  { id: 'office_manager', label: 'Office Manager' },
  { id: 'accountant', label: 'Accountant' },
  { id: 'financial_analyst', label: 'Financial Analyst' },
  { id: 'hr_manager', label: 'HR Manager' },
  { id: 'recruiter', label: 'Recruiter' },
  { id: 'lawyer', label: 'Legal Counsel' },
  { id: 'support_manager', label: 'Support Manager' },
  { id: 'support_agent', label: 'Support Agent' },
  { id: 'writer', label: 'Technical Writer' },
  { id: 'copywriter', label: 'Copywriter' },
  { id: 'video_producer', label: 'Video Producer' },
]

const LEGACY_ID_MAP = {
  back: 'backend', front: 'frontend', mob: 'mobile', ml: 'ml_eng',
  ops: 'devops', des: 'designer', mrk: 'marketer', wr: 'writer',
}
const resolveRoleId = (id) => LEGACY_ID_MAP[id] || id

const _legacyEntries = Object.entries(LEGACY_ID_MAP).map(([oldId, newId]) => {
  const role = ROLES.find(r => r.id === newId)
  return role ? { ...role, id: oldId } : null
}).filter(Boolean)
const DESKS = [...ROLES, ..._legacyEntries]

// Label-to-ID map
const _labelToIdMap = {}
ROLES.forEach(r => {
  const snakeLabel = r.label.toLowerCase().replace(/[\/\s]+/g, '_')
  _labelToIdMap[snakeLabel] = r.id
  const cleanSnake = r.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  if (cleanSnake !== snakeLabel) _labelToIdMap[cleanSnake] = r.id
})

function normalizeAssignee(assignee) {
  if (!assignee) return null
  const a = assignee.toLowerCase().trim()
  if (ROLES.find(r => r.id === a)) return a
  if (LEGACY_ID_MAP[a]) return LEGACY_ID_MAP[a]
  if (_labelToIdMap[a]) return _labelToIdMap[a]
  const byLabel = ROLES.find(r => r.label.toLowerCase() === a)
  if (byLabel) return byLabel.id
  const byPartial = ROLES.find(r => a.includes(r.id) || r.id.includes(a))
  if (byPartial) return byPartial.id
  return a
}

// ── Replicate _buildRoleIds from taskExecutor.js ──
const REVERSE_MAP = { backend: 'back', frontend: 'front', mobile: 'mob', ml_eng: 'ml', devops: 'ops', designer: 'des', marketer: 'mrk', writer: 'wr' }

function buildRoleIds(agentRole) {
  const ids = new Set([agentRole])
  const resolved = resolveRoleId(agentRole)
  if (resolved !== agentRole) ids.add(resolved)
  if (REVERSE_MAP[agentRole]) ids.add(REVERSE_MAP[agentRole])
  const desk = DESKS.find(d => d.id === agentRole || d.id === resolved)
  if (desk?.label) {
    ids.add(desk.label.toLowerCase())
    ids.add(desk.label.toLowerCase().replace(/[\/\s]+/g, '_'))
    ids.add(desk.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''))
  }
  return ids
}

function isTaskForAgent(task, roleIds) {
  if (!task.assignee) return false
  const assignee = task.assignee.toLowerCase().trim()
  for (const id of roleIds) {
    if (assignee === id) return true
  }
  const normalized = normalizeAssignee(assignee)
  if (normalized !== assignee) {
    for (const id of roleIds) {
      if (normalized === id) return true
    }
  }
  return false
}

// ── Tests ──
let passed = 0
let failed = 0

function test(name, result) {
  if (result) {
    console.log(`  PASS: ${name}`)
    passed++
  } else {
    console.log(`  FAIL: ${name}`)
    failed++
  }
}

console.log('\n=== TEST 1: normalizeAssignee() ===')
test('backend_developer → backend', normalizeAssignee('backend_developer') === 'backend')
test('growth_marketer → marketer', normalizeAssignee('growth_marketer') === 'marketer')
test('ui_ux_designer → designer', normalizeAssignee('ui_ux_designer') === 'designer')
test('mobile_developer → mobile', normalizeAssignee('mobile_developer') === 'mobile')
test('frontend_developer → frontend', normalizeAssignee('frontend_developer') === 'frontend')
test('devops_engineer → devops', normalizeAssignee('devops_engineer') === 'devops')
test('qa_engineer → qa', normalizeAssignee('qa_engineer') === 'qa')
test('ml_engineer → ml_eng', normalizeAssignee('ml_engineer') === 'ml_eng')
test('tech_lead → tech_lead (exact)', normalizeAssignee('tech_lead') === 'tech_lead')
test('data_scientist → data_scientist (exact)', normalizeAssignee('data_scientist') === 'data_scientist')
test('ceo → ceo (exact)', normalizeAssignee('ceo') === 'ceo')
test('back → backend (legacy)', normalizeAssignee('back') === 'backend')
test('des → designer (legacy)', normalizeAssignee('des') === 'designer')
test('mrk → marketer (legacy)', normalizeAssignee('mrk') === 'marketer')
test('Backend Developer → backend (label)', normalizeAssignee('Backend Developer') === 'backend')
test('Growth Marketer → marketer (label)', normalizeAssignee('Growth Marketer') === 'marketer')
test('UI/UX Designer → designer (label)', normalizeAssignee('UI/UX Designer') === 'designer')
test('technical_writer → writer', normalizeAssignee('technical_writer') === 'writer')
test('product_manager → pm', normalizeAssignee('product_manager') === 'pm')
test('security_engineer → security', normalizeAssignee('security_engineer') === 'security')

console.log('\n=== TEST 2: buildRoleIds() coverage ===')
const backendIds = buildRoleIds('backend')
test('backend ids include: backend', backendIds.has('backend'))
test('backend ids include: back', backendIds.has('back'))
test('backend ids include: backend developer', backendIds.has('backend developer'))
test('backend ids include: backend_developer', backendIds.has('backend_developer'))

const designerIds = buildRoleIds('designer')
test('designer ids include: designer', designerIds.has('designer'))
test('designer ids include: des', designerIds.has('des'))
test('designer ids include: ui/ux designer', designerIds.has('ui/ux designer'))
test('designer ids include: ui_ux_designer', designerIds.has('ui_ux_designer'))

const marketerIds = buildRoleIds('marketer')
test('marketer ids include: marketer', marketerIds.has('marketer'))
test('marketer ids include: mrk', marketerIds.has('mrk'))
test('marketer ids include: growth_marketer', marketerIds.has('growth_marketer'))

const mobileIds = buildRoleIds('mobile')
test('mobile ids include: mobile', mobileIds.has('mobile'))
test('mobile ids include: mob', mobileIds.has('mob'))
test('mobile ids include: mobile_developer', mobileIds.has('mobile_developer'))

console.log('\n=== TEST 3: isTaskForAgent() matching ===')
// Simulate real-world mismatch scenarios from debug logs
const testCases = [
  { agent: 'backend', assignee: 'backend_developer', expect: true },
  { agent: 'backend', assignee: 'backend', expect: true },
  { agent: 'backend', assignee: 'back', expect: true },
  { agent: 'designer', assignee: 'ui_ux_designer', expect: true },
  { agent: 'designer', assignee: 'designer', expect: true },
  { agent: 'marketer', assignee: 'growth_marketer', expect: true },
  { agent: 'marketer', assignee: 'marketer', expect: true },
  { agent: 'mobile', assignee: 'mobile_developer', expect: true },
  { agent: 'mobile', assignee: 'mobile', expect: true },
  { agent: 'frontend', assignee: 'frontend_developer', expect: true },
  { agent: 'ceo', assignee: 'ceo', expect: true },
  { agent: 'cto', assignee: 'cto', expect: true },
  { agent: 'devops', assignee: 'devops_engineer', expect: true },
  { agent: 'qa', assignee: 'qa_engineer', expect: true },
  { agent: 'writer', assignee: 'technical_writer', expect: true },
  { agent: 'ml_eng', assignee: 'ml_engineer', expect: true },
  // Negative tests
  { agent: 'backend', assignee: 'frontend_developer', expect: false },
  { agent: 'designer', assignee: 'backend_developer', expect: false },
  { agent: 'ceo', assignee: 'cto', expect: false },
]

for (const tc of testCases) {
  const roleIds = buildRoleIds(tc.agent)
  const task = { assignee: tc.assignee }
  const result = isTaskForAgent(task, roleIds)
  test(`agent:${tc.agent} ↔ assignee:${tc.assignee} → ${tc.expect}`, result === tc.expect)
}

console.log('\n=== TEST 4: Simulated pickNextTask() ===')
// Simulate a real team + tasks scenario
const mockTeam = [
  { id: 'ceo', role: 'ceo', label: 'CEO', personality: { name: 'Дмитрий' } },
  { id: 'backend', role: 'backend', label: 'Backend Developer', personality: { name: 'Алексей' } },
  { id: 'frontend', role: 'frontend', label: 'Frontend Developer', personality: { name: 'Мария' } },
  { id: 'designer', role: 'designer', label: 'UI/UX Designer', personality: { name: 'Елена' } },
  { id: 'marketer', role: 'marketer', label: 'Growth Marketer', personality: { name: 'Иван' } },
  { id: 'mobile', role: 'mobile', label: 'Mobile Developer', personality: { name: 'Сергей' } },
]

// Tasks with AI-generated snake_case assignees (the problem scenario)
const mockTasks = [
  { id: 't1', title: 'Setup CI/CD', assignee: 'backend_developer', column: 'todo', priority: 'P0' },
  { id: 't2', title: 'Design wireframes', assignee: 'ui_ux_designer', column: 'todo', priority: 'P0' },
  { id: 't3', title: 'Growth strategy', assignee: 'growth_marketer', column: 'todo', priority: 'P1' },
  { id: 't4', title: 'Mobile app shell', assignee: 'mobile_developer', column: 'todo', priority: 'P1' },
  { id: 't5', title: 'Landing page', assignee: 'frontend_developer', column: 'todo', priority: 'P1' },
  { id: 't6', title: 'Investor pitch', assignee: 'ceo', column: 'todo', priority: 'P0' },
  // Also test with correct format
  { id: 't7', title: 'API design', assignee: 'backend', column: 'todo', priority: 'P2' },
  { id: 't8', title: 'Brand colors', assignee: 'designer', column: 'todo', priority: 'P2' },
]

function pickNextTask(agentRole, tasks) {
  const roleIds = buildRoleIds(agentRole)
  const matched = tasks.filter(t => isTaskForAgent(t, roleIds))
  const todo = matched.filter(t => t.column === 'todo')
  const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 }
  todo.sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9))
  return todo[0] || null
}

for (const agent of mockTeam) {
  const role = agent.role || agent.id
  const task = pickNextTask(role, mockTasks)
  const status = task ? `→ ${task.id} "${task.title}"` : '→ NONE'
  const success = task !== null
  test(`Agent ${agent.personality.name} (${role}) ${status}`, success)
}

// Verify backend picks P0 task (t1) over P2 task (t7) — tests priority sort fix
const backendTask = pickNextTask('backend', mockTasks)
test('Backend picks P0 task (t1) over P2 (t7)', backendTask?.id === 't1')
const designerTask = pickNextTask('designer', mockTasks)
test('Designer picks P0 task (t2) over P2 (t8)', designerTask?.id === 't2')

// ── Summary ──
console.log(`\n${'='.repeat(50)}`)
console.log(`TOTAL: ${passed + failed} tests | PASSED: ${passed} | FAILED: ${failed}`)
if (failed > 0) {
  console.log('STATUS: SOME TESTS FAILED')
  process.exit(1)
} else {
  console.log('STATUS: ALL TESTS PASSED')
  process.exit(0)
}
