// LLM Models
export const MODELS = [
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6' },
  { id: 'claude-opus-4-6', label: 'Opus 4.6' },
  { id: 'claude-haiku-4-5', label: 'Haiku 4.5' },
  { id: 'gpt-4o', label: 'GPT-4o' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
]

// Desk roles (12 types)
export const DESKS = [
  { id: 'ceo', label: 'CEO', iconName: 'Target', color: '#6366f1', bio: 'Strategy, sales, fundraising.' },
  { id: 'cto', label: 'CTO', iconName: 'Brain', color: '#06b6d4', bio: 'Architecture, ML, tech leadership.' },
  { id: 'back', label: 'Backend', iconName: 'Zap', color: '#8b5cf6', bio: 'APIs, distributed systems.' },
  { id: 'front', label: 'Frontend', iconName: 'Palette', color: '#f59e0b', bio: 'React, UI/UX, design systems.' },
  { id: 'mob', label: 'Mobile', iconName: 'Smartphone', color: '#3b82f6', bio: 'iOS/Android development.' },
  { id: 'ml', label: 'ML Eng', iconName: 'Bot', color: '#10b981', bio: 'NLP, embeddings, eval.' },
  { id: 'ops', label: 'DevOps', iconName: 'Shield', color: '#ef4444', bio: 'K8s, CI/CD, security.' },
  { id: 'des', label: 'Designer', iconName: 'Sparkles', color: '#ec4899', bio: 'Figma, prototyping.' },
  { id: 'mrk', label: 'Marketer', iconName: 'TrendingUp', color: '#14b8a6', bio: 'SEO, ads, growth.' },
  { id: 'wr', label: 'Writer', iconName: 'Pencil', color: '#a855f7', bio: 'Content, docs.' },
  { id: 'pm', label: 'PM', iconName: 'Clipboard', color: '#f97316', bio: 'Roadmap, priorities.' },
  { id: 'qa', label: 'QA', iconName: 'Search', color: '#84cc16', bio: 'Testing, quality.' },
]

// People
export const PEOPLE = [
  { id: 'm1', initials: 'АК', color: '#6366f1' },
  { id: 'm2', initials: 'ДМ', color: '#06b6d4' },
  { id: 'm3', initials: 'ИС', color: '#10b981' },
  { id: 'w1', initials: 'ЕВ', color: '#f59e0b' },
  { id: 'w2', initials: 'НП', color: '#ec4899' },
  { id: 'w3', initials: 'ОЛ', color: '#8b5cf6' },
]

// Chat channels
export const CHANNELS = {
  general: { name: 'General', iconName: 'MessageSquare' },
  eng: { name: 'Engineering', iconName: 'Settings' },
  prod: { name: 'Product', iconName: 'BarChart2' },
  stand: { name: 'Standup', iconName: 'Clipboard' },
}

// Kanban columns
export const KANBAN_COLS = ['backlog', 'todo', 'in_progress', 'review', 'done']
export const KANBAN_NAMES = {
  backlog: 'Backlog', todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done',
}
export const KANBAN_COLORS = {
  backlog: '#64748b', todo: '#6366f1', in_progress: '#f59e0b', review: '#a855f7', done: '#10b981',
}
export const PRIORITY_COLORS = { P0: '#ef4444', P1: '#f59e0b', P2: '#6366f1', P3: '#94a3b8' }

// Roadmap phases
export const ROADMAP = [
  { id: 'r1', phase: 'Phase 1 — MVP', color: '#6366f1', start: 0, duration: 3, items: ['Core proxy', 'Classifier', 'Dashboard v1', '5 beta'] },
  { id: 'r2', phase: 'Phase 2 — Beta', color: '#06b6d4', start: 3, duration: 3, items: ['ML classifier', 'Semantic cache', 'SDK v1', '20 clients'] },
  { id: 'r3', phase: 'Phase 3 — Launch', color: '#10b981', start: 6, duration: 3, items: ['Model cascade', 'Analytics v2', 'Enterprise', '100 clients'] },
  { id: 'r4', phase: 'Phase 4 — Scale', color: '#f59e0b', start: 9, duration: 3, items: ['Multi-region', 'Marketplace', 'Mobile', '500 clients'] },
]

// Economics data
export const ECONOMICS = {
  months: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
  revenue: [0, 0, 2, 5, 12, 26, 40, 65, 95, 130, 170, 220],
  costs: [35, 35, 38, 40, 42, 45, 50, 55, 60, 65, 70, 78],
  users: [0, 50, 150, 400, 800, 1500, 2500, 4000, 6000, 9000, 13000, 18000],
}

// Pitch slides
export const PITCH_SLIDES = [
  { title: 'Проблема', iconName: 'Flame', text: 'LLM API стоит дорого. 70% запросов не требуют мощных моделей.' },
  { title: 'Решение', iconName: 'Lightbulb', text: 'Intelligent Routing — маршрутизация к оптимальному бэкенду.' },
  { title: 'Рынок', iconName: 'BarChart2', text: 'TAM $50B+ к 2030. AI agents CAGR 46%.' },
  { title: 'Продукт', iconName: 'Rocket', text: 'Classifier + Cache + Cascade. <30ms, 30-50% savings.' },
  { title: 'Бизнес', iconName: 'DollarSign', text: 'Usage-based. Free → Pro $49 → Team $149.' },
  { title: 'Traction', iconName: 'TrendingUp', text: 'MVP ready. 5 beta. $26K MRR target.' },
  { title: 'Команда', iconName: 'Users', text: 'AI-native team built with Sqwady.' },
  { title: 'Ask', iconName: 'Target', text: 'Pre-Seed $400K. 12 months runway.' },
]

// Wiki pages
export const WIKI_PAGES = [
  { title: 'Architecture Overview', iconName: 'Building', text: 'Classifier → Cache → Cascade → Normalizer\nLatency: <30ms. SLA: 99.9%' },
  { title: 'API Reference', iconName: 'BookOpen', text: 'POST /v1/route\n{prompt, model?, metadata?}\nOpenAI-compatible response' },
  { title: 'Onboarding', iconName: 'Rocket', text: '1. Sign up → API key\n2. pip install ir-sdk\n3. Replace openai.chat() → ir.chat()\n4. See savings' },
  { title: 'Team Agreements', iconName: 'Handshake', text: 'Standup: daily 09:00\nSprint: 2 weeks\nDeploy: canary → full\nPR review: required' },
]

// Workspace tabs
export const WORKSPACE_TABS = [
  { id: 'chat', iconName: 'MessageSquare', label: 'Чаты' },
  { id: 'kanban', iconName: 'Clipboard', label: 'Kanban' },
  { id: 'road', iconName: 'Map', label: 'Roadmap' },
  { id: 'econ', iconName: 'DollarSign', label: 'Экономика' },
  { id: 'cal', iconName: 'Calendar', label: 'Календарь' },
  { id: 'pitch', iconName: 'Mic', label: 'Питч' },
  { id: 'wiki', iconName: 'BookOpen', label: 'Wiki' },
]

// Helpers
export const timestamp = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
