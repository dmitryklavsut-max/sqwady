// LLM Models
export const MODELS = [
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6' },
  { id: 'claude-opus-4-6', label: 'Opus 4.6' },
  { id: 'claude-haiku-4-5', label: 'Haiku 4.5' },
  { id: 'gpt-4o', label: 'GPT-4o' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
]

// ── Departments ─────────────────────────────────────────────────────
export const DEPARTMENTS = [
  { id: 'executive', name: 'Руководство', iconName: 'Crown', color: '#6366f1' },
  { id: 'product', name: 'Продукт', iconName: 'Package', color: '#8b5cf6' },
  { id: 'engineering', name: 'Разработка', iconName: 'Code', color: '#06b6d4' },
  { id: 'design', name: 'Дизайн', iconName: 'Palette', color: '#ec4899' },
  { id: 'data', name: 'Данные и AI', iconName: 'Brain', color: '#10b981' },
  { id: 'marketing', name: 'Маркетинг', iconName: 'Megaphone', color: '#f59e0b' },
  { id: 'sales', name: 'Продажи', iconName: 'TrendingUp', color: '#ef4444' },
  { id: 'operations', name: 'Операции', iconName: 'Settings', color: '#64748b' },
  { id: 'finance', name: 'Финансы', iconName: 'DollarSign', color: '#14b8a6' },
  { id: 'hr', name: 'HR и люди', iconName: 'Users', color: '#a855f7' },
  { id: 'legal', name: 'Юридический', iconName: 'Shield', color: '#78716c' },
  { id: 'support', name: 'Поддержка', iconName: 'Headphones', color: '#f97316' },
]

// ── Full role catalog (48 roles) ────────────────────────────────────
export const ROLES = [
  // === EXECUTIVE ===
  { id: 'ceo', label: 'CEO', iconName: 'Target', department: 'executive', level: 'c-suite',
    color: '#6366f1', bio: 'Стратегия, видение, фандрайзинг, лидерство.',
    defaultSkills: ['Strategy', 'Leadership', 'Fundraising', 'Public Speaking', 'Business Development'] },
  { id: 'coo', label: 'COO', iconName: 'Briefcase', department: 'executive', level: 'c-suite',
    color: '#6366f1', bio: 'Операционное управление, процессы, масштабирование.',
    defaultSkills: ['Operations', 'Process Design', 'Team Management', 'KPIs', 'Scaling'] },
  { id: 'cfo', label: 'CFO', iconName: 'DollarSign', department: 'executive', level: 'c-suite',
    color: '#14b8a6', bio: 'Финансы, бюджетирование, юнит-экономика, инвесторы.',
    defaultSkills: ['Financial Modeling', 'Budgeting', 'Fundraising', 'Unit Economics', 'Reporting'] },
  { id: 'cmo', label: 'CMO', iconName: 'Megaphone', department: 'executive', level: 'c-suite',
    color: '#f59e0b', bio: 'Маркетинговая стратегия, бренд, рост.',
    defaultSkills: ['Brand Strategy', 'Growth', 'Digital Marketing', 'Analytics', 'Content Strategy'] },
  { id: 'cpo', label: 'CPO', iconName: 'Package', department: 'executive', level: 'c-suite',
    color: '#8b5cf6', bio: 'Продуктовое видение, roadmap, product-market fit.',
    defaultSkills: ['Product Strategy', 'User Research', 'Roadmapping', 'Prioritization', 'Analytics'] },

  // === PRODUCT ===
  { id: 'pm', label: 'Product Manager', iconName: 'Clipboard', department: 'product', level: 'manager',
    color: '#8b5cf6', bio: 'Управление продуктом, user stories, приоритизация.',
    defaultSkills: ['Agile', 'User Stories', 'JIRA', 'A/B Testing', 'Metrics'] },
  { id: 'po', label: 'Product Owner', iconName: 'ListChecks', department: 'product', level: 'manager',
    color: '#8b5cf6', bio: 'Бэклог, спринты, приёмка, стейкхолдеры.',
    defaultSkills: ['Scrum', 'Backlog Management', 'Stakeholder Management', 'Acceptance Criteria'] },
  { id: 'ba', label: 'Business Analyst', iconName: 'BarChart2', department: 'product', level: 'specialist',
    color: '#8b5cf6', bio: 'Бизнес-требования, процессы, аналитика.',
    defaultSkills: ['Requirements', 'BPMN', 'Data Analysis', 'SQL', 'Documentation'] },
  { id: 'ux_researcher', label: 'UX Researcher', iconName: 'Search', department: 'product', level: 'specialist',
    color: '#8b5cf6', bio: 'Пользовательские исследования, интервью, юзабилити.',
    defaultSkills: ['User Interviews', 'Surveys', 'Usability Testing', 'Personas', 'Journey Mapping'] },

  // === ENGINEERING ===
  { id: 'cto', label: 'CTO', iconName: 'Brain', department: 'engineering', level: 'c-suite',
    color: '#06b6d4', bio: 'Техническая архитектура, стек, техлидерство.',
    defaultSkills: ['System Design', 'Architecture', 'Tech Strategy', 'Code Review', 'Team Building'] },
  { id: 'tech_lead', label: 'Tech Lead', iconName: 'GitBranch', department: 'engineering', level: 'lead',
    color: '#06b6d4', bio: 'Техническое лидерство, ревью, менторство.',
    defaultSkills: ['Architecture', 'Code Review', 'Mentoring', 'Technical Debt', 'Best Practices'] },
  { id: 'backend', label: 'Backend Developer', iconName: 'Zap', department: 'engineering', level: 'developer',
    color: '#06b6d4', bio: 'API, базы данных, серверная логика.',
    defaultSkills: ['Node.js', 'Python', 'PostgreSQL', 'REST API', 'Microservices'] },
  { id: 'frontend', label: 'Frontend Developer', iconName: 'Palette', department: 'engineering', level: 'developer',
    color: '#f59e0b', bio: 'UI, React, адаптивная вёрстка.',
    defaultSkills: ['React', 'TypeScript', 'CSS', 'Responsive Design', 'Performance'] },
  { id: 'fullstack', label: 'Fullstack Developer', iconName: 'Layers', department: 'engineering', level: 'developer',
    color: '#06b6d4', bio: 'Полный стек, от БД до UI.',
    defaultSkills: ['React', 'Node.js', 'PostgreSQL', 'Docker', 'Git'] },
  { id: 'mobile', label: 'Mobile Developer', iconName: 'Smartphone', department: 'engineering', level: 'developer',
    color: '#3b82f6', bio: 'iOS/Android, React Native, Flutter.',
    defaultSkills: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Mobile UI'] },
  { id: 'devops', label: 'DevOps Engineer', iconName: 'Shield', department: 'engineering', level: 'developer',
    color: '#ef4444', bio: 'CI/CD, инфраструктура, деплой, мониторинг.',
    defaultSkills: ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Monitoring'] },
  { id: 'qa', label: 'QA Engineer', iconName: 'Search', department: 'engineering', level: 'developer',
    color: '#84cc16', bio: 'Тестирование, автоматизация, качество.',
    defaultSkills: ['Test Plans', 'Automation', 'Selenium', 'API Testing', 'Bug Tracking'] },
  { id: 'security', label: 'Security Engineer', iconName: 'Lock', department: 'engineering', level: 'developer',
    color: '#ef4444', bio: 'Безопасность, аудит, penetration testing.',
    defaultSkills: ['OWASP', 'Penetration Testing', 'Encryption', 'Compliance', 'Security Audit'] },

  // === DESIGN ===
  { id: 'designer', label: 'UI/UX Designer', iconName: 'Sparkles', department: 'design', level: 'specialist',
    color: '#ec4899', bio: 'Интерфейсы, прототипы, дизайн-система.',
    defaultSkills: ['Figma', 'Prototyping', 'Design Systems', 'User Flows', 'Accessibility'] },
  { id: 'ux_designer', label: 'UX Designer', iconName: 'MousePointer', department: 'design', level: 'specialist',
    color: '#ec4899', bio: 'Пользовательский опыт, wireframes, информационная архитектура.',
    defaultSkills: ['Wireframing', 'Information Architecture', 'Usability', 'Figma', 'User Testing'] },
  { id: 'graphic_designer', label: 'Graphic Designer', iconName: 'Image', department: 'design', level: 'specialist',
    color: '#ec4899', bio: 'Визуальный дизайн, брендинг, иллюстрации.',
    defaultSkills: ['Illustrator', 'Photoshop', 'Branding', 'Typography', 'Print Design'] },
  { id: 'motion_designer', label: 'Motion Designer', iconName: 'Film', department: 'design', level: 'specialist',
    color: '#ec4899', bio: 'Анимация, видео, motion graphics.',
    defaultSkills: ['After Effects', 'Lottie', 'Video Editing', 'Animation', '3D'] },

  // === DATA & AI ===
  { id: 'ml_eng', label: 'ML Engineer', iconName: 'Bot', department: 'data', level: 'developer',
    color: '#10b981', bio: 'Модели, обучение, inference, MLOps.',
    defaultSkills: ['PyTorch', 'TensorFlow', 'NLP', 'MLOps', 'Python'] },
  { id: 'data_scientist', label: 'Data Scientist', iconName: 'LineChart', department: 'data', level: 'specialist',
    color: '#10b981', bio: 'Анализ данных, модели, эксперименты.',
    defaultSkills: ['Python', 'SQL', 'Statistics', 'A/B Testing', 'Visualization'] },
  { id: 'data_engineer', label: 'Data Engineer', iconName: 'Database', department: 'data', level: 'developer',
    color: '#10b981', bio: 'Пайплайны данных, ETL, хранилища.',
    defaultSkills: ['Spark', 'Airflow', 'SQL', 'Data Warehousing', 'Streaming'] },
  { id: 'ai_researcher', label: 'AI Researcher', iconName: 'FlaskConical', department: 'data', level: 'specialist',
    color: '#10b981', bio: 'Исследования, новые архитектуры, papers.',
    defaultSkills: ['LLMs', 'Transformers', 'Research', 'Papers', 'Experiments'] },

  // === MARKETING ===
  { id: 'marketer', label: 'Growth Marketer', iconName: 'TrendingUp', department: 'marketing', level: 'specialist',
    color: '#f59e0b', bio: 'Рост, acquisition, retention, эксперименты.',
    defaultSkills: ['SEO', 'Paid Ads', 'Analytics', 'Funnels', 'Growth Hacking'] },
  { id: 'content_manager', label: 'Content Manager', iconName: 'FileText', department: 'marketing', level: 'specialist',
    color: '#f59e0b', bio: 'Контент-стратегия, блог, соцсети.',
    defaultSkills: ['Copywriting', 'SEO', 'Social Media', 'Content Calendar', 'Analytics'] },
  { id: 'smm', label: 'SMM Manager', iconName: 'Share2', department: 'marketing', level: 'specialist',
    color: '#f59e0b', bio: 'Социальные сети, комьюнити, вовлечение.',
    defaultSkills: ['Instagram', 'Twitter/X', 'TikTok', 'Community', 'Analytics'] },
  { id: 'seo', label: 'SEO Specialist', iconName: 'Search', department: 'marketing', level: 'specialist',
    color: '#f59e0b', bio: 'Поисковая оптимизация, ключевые слова, ранжирование.',
    defaultSkills: ['Technical SEO', 'Keywords', 'Link Building', 'Google Analytics', 'Search Console'] },
  { id: 'pr', label: 'PR Manager', iconName: 'Newspaper', department: 'marketing', level: 'specialist',
    color: '#f59e0b', bio: 'Связи с общественностью, медиа, репутация.',
    defaultSkills: ['Media Relations', 'Press Releases', 'Crisis Management', 'Events', 'Branding'] },
  { id: 'email_marketer', label: 'Email Marketer', iconName: 'Mail', department: 'marketing', level: 'specialist',
    color: '#f59e0b', bio: 'Email-рассылки, автоматизация, воронки.',
    defaultSkills: ['Mailchimp', 'Automation', 'A/B Testing', 'Segmentation', 'Copywriting'] },

  // === SALES ===
  { id: 'sales_manager', label: 'Sales Manager', iconName: 'Handshake', department: 'sales', level: 'manager',
    color: '#ef4444', bio: 'Продажи, переговоры, закрытие сделок.',
    defaultSkills: ['Negotiation', 'CRM', 'B2B Sales', 'Pipeline', 'Closing'] },
  { id: 'bdr', label: 'BDR / SDR', iconName: 'PhoneCall', department: 'sales', level: 'specialist',
    color: '#ef4444', bio: 'Лидогенерация, холодные контакты, квалификация.',
    defaultSkills: ['Outreach', 'Cold Email', 'LinkedIn', 'Qualification', 'CRM'] },
  { id: 'account_manager', label: 'Account Manager', iconName: 'UserCheck', department: 'sales', level: 'specialist',
    color: '#ef4444', bio: 'Управление клиентами, retention, upsell.',
    defaultSkills: ['Client Relations', 'Upselling', 'Retention', 'Onboarding', 'SLA'] },
  { id: 'partnerships', label: 'Partnership Manager', iconName: 'Link', department: 'sales', level: 'manager',
    color: '#ef4444', bio: 'Партнёрства, интеграции, BD.',
    defaultSkills: ['Business Development', 'Negotiations', 'Integrations', 'Ecosystem', 'Co-marketing'] },

  // === OPERATIONS ===
  { id: 'ops_manager', label: 'Operations Manager', iconName: 'Settings', department: 'operations', level: 'manager',
    color: '#64748b', bio: 'Процессы, эффективность, логистика.',
    defaultSkills: ['Process Optimization', 'KPIs', 'Automation', 'Reporting', 'Logistics'] },
  { id: 'project_manager', label: 'Project Manager', iconName: 'Gantt', department: 'operations', level: 'manager',
    color: '#64748b', bio: 'Управление проектами, сроки, ресурсы.',
    defaultSkills: ['Agile', 'Scrum', 'Gantt', 'Risk Management', 'Stakeholders'] },
  { id: 'secretary', label: 'Executive Assistant', iconName: 'CalendarCheck', department: 'operations', level: 'assistant',
    color: '#64748b', bio: 'Координация, расписание, документооборот.',
    defaultSkills: ['Scheduling', 'Communication', 'Documentation', 'Organization', 'Minutes'] },
  { id: 'office_manager', label: 'Office Manager', iconName: 'Building', department: 'operations', level: 'assistant',
    color: '#64748b', bio: 'Офис, снабжение, административные задачи.',
    defaultSkills: ['Administration', 'Vendor Management', 'Budgeting', 'Events', 'Facilities'] },

  // === FINANCE ===
  { id: 'accountant', label: 'Accountant', iconName: 'Calculator', department: 'finance', level: 'specialist',
    color: '#14b8a6', bio: 'Бухгалтерия, отчётность, налоги.',
    defaultSkills: ['Accounting', 'Tax', 'Reporting', 'Compliance', 'Excel'] },
  { id: 'financial_analyst', label: 'Financial Analyst', iconName: 'PieChart', department: 'finance', level: 'specialist',
    color: '#14b8a6', bio: 'Финансовый анализ, модели, прогнозы.',
    defaultSkills: ['Financial Modeling', 'Forecasting', 'Valuation', 'Excel', 'SQL'] },

  // === HR ===
  { id: 'hr_manager', label: 'HR Manager', iconName: 'Users', department: 'hr', level: 'manager',
    color: '#a855f7', bio: 'Найм, культура, развитие команды.',
    defaultSkills: ['Recruiting', 'Onboarding', 'Culture', 'Performance Reviews', 'Employer Brand'] },
  { id: 'recruiter', label: 'Recruiter', iconName: 'UserPlus', department: 'hr', level: 'specialist',
    color: '#a855f7', bio: 'Поиск кандидатов, собеседования, оценка.',
    defaultSkills: ['Sourcing', 'Screening', 'Interviews', 'LinkedIn', 'ATS'] },

  // === LEGAL ===
  { id: 'lawyer', label: 'Legal Counsel', iconName: 'Scale', department: 'legal', level: 'specialist',
    color: '#78716c', bio: 'Юридическая поддержка, договоры, compliance.',
    defaultSkills: ['Contracts', 'IP', 'GDPR', 'Corporate Law', 'Compliance'] },

  // === SUPPORT ===
  { id: 'support_manager', label: 'Support Manager', iconName: 'Headphones', department: 'support', level: 'manager',
    color: '#f97316', bio: 'Клиентская поддержка, SLA, база знаний.',
    defaultSkills: ['Zendesk', 'SLA', 'Knowledge Base', 'Escalation', 'CSAT'] },
  { id: 'support_agent', label: 'Support Agent', iconName: 'MessageCircle', department: 'support', level: 'specialist',
    color: '#f97316', bio: 'Ответы клиентам, тикеты, решение проблем.',
    defaultSkills: ['Communication', 'Troubleshooting', 'Ticketing', 'Empathy', 'Documentation'] },

  // === CONTENT & CREATIVE ===
  { id: 'writer', label: 'Technical Writer', iconName: 'Pencil', department: 'marketing', level: 'specialist',
    color: '#a855f7', bio: 'Документация, гайды, API docs.',
    defaultSkills: ['Technical Writing', 'Markdown', 'API Docs', 'Tutorials', 'Style Guide'] },
  { id: 'copywriter', label: 'Copywriter', iconName: 'Type', department: 'marketing', level: 'specialist',
    color: '#a855f7', bio: 'Продающие тексты, landing pages, email.',
    defaultSkills: ['Copywriting', 'Headlines', 'Landing Pages', 'Email', 'A/B Copy'] },
  { id: 'video_producer', label: 'Video Producer', iconName: 'Video', department: 'marketing', level: 'specialist',
    color: '#a855f7', bio: 'Видеоконтент, YouTube, рекламные ролики.',
    defaultSkills: ['Video Editing', 'YouTube', 'Scripting', 'Premiere Pro', 'Storytelling'] },
]

// ── Role helpers ────────────────────────────────────────────────────
export const getRolesByDepartment = (deptId) => ROLES.filter(r => r.department === deptId)
export const getRolesByLevel = (level) => ROLES.filter(r => r.level === level)

export const ROLE_LEVELS = [
  { id: 'c-suite', label: 'C-Level', description: 'Топ-менеджмент' },
  { id: 'lead', label: 'Lead', description: 'Руководитель направления' },
  { id: 'manager', label: 'Manager', description: 'Менеджер' },
  { id: 'developer', label: 'Developer', description: 'Разработчик' },
  { id: 'specialist', label: 'Specialist', description: 'Специалист' },
  { id: 'assistant', label: 'Assistant', description: 'Ассистент' },
]

// ── Old ID → New ID mapping (backward compatibility) ────────────────
const LEGACY_ID_MAP = {
  back: 'backend', front: 'frontend', mob: 'mobile', ml: 'ml_eng',
  ops: 'devops', des: 'designer', mrk: 'marketer', wr: 'writer',
}

// Resolve role ID (supports old and new IDs)
export const resolveRoleId = (id) => LEGACY_ID_MAP[id] || id

// ── Label-to-ID reverse map (for AI-generated snake_case assignees) ──
// Maps "backend_developer" → "backend", "growth_marketer" → "marketer", etc.
const _labelToIdMap = {}
ROLES.forEach(r => {
  // "Backend Developer" → "backend_developer" → maps to "backend"
  const snakeLabel = r.label.toLowerCase().replace(/[\/\s]+/g, '_')
  _labelToIdMap[snakeLabel] = r.id
  // Also without special chars: "UI/UX Designer" → "ui_ux_designer"
  const cleanSnake = r.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  if (cleanSnake !== snakeLabel) _labelToIdMap[cleanSnake] = r.id
})

// Normalize any assignee string to a valid role ID
// Handles: exact ID, legacy ID, snake_case label, spaced label
export function normalizeAssignee(assignee) {
  if (!assignee) return null
  const a = assignee.toLowerCase().trim()
  // 1. Exact match to a role ID
  if (ROLES.find(r => r.id === a)) return a
  // 2. Legacy ID resolution
  if (LEGACY_ID_MAP[a]) return LEGACY_ID_MAP[a]
  // 3. Snake_case label match (e.g. "backend_developer" → "backend")
  if (_labelToIdMap[a]) return _labelToIdMap[a]
  // 4. Try matching against labels directly (e.g. "backend developer")
  const byLabel = ROLES.find(r => r.label.toLowerCase() === a)
  if (byLabel) return byLabel.id
  // 5. Partial match: if assignee contains a role ID or vice versa
  const byPartial = ROLES.find(r => a.includes(r.id) || r.id.includes(a))
  if (byPartial) return byPartial.id
  // 6. No match — return as-is
  return a
}

// ── DESKS — backward-compatible alias ───────────────────────────────
// All code that uses DESKS.find(d => d.id === role) still works.
// Includes legacy alias entries so old saved projects resolve correctly.
const _legacyEntries = Object.entries(LEGACY_ID_MAP).map(([oldId, newId]) => {
  const role = ROLES.find(r => r.id === newId)
  return role ? { ...role, id: oldId } : null
}).filter(Boolean)
export const DESKS = [...ROLES, ..._legacyEntries]

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
  meeting: { name: 'Meeting Room', iconName: 'Users' },
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
