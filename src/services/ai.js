import { DESKS } from '../data/constants.js'

// ─── Anthropic API config ───────────────────────────────────────────
const RECOMMEND_URL = '/api/recommend'
const GENERATE_URL = '/api/generate'
const CHAT_URL = '/api/chat'
const MODEL = 'claude-sonnet-4-20250514'

// ─── generateRecommendations ────────────────────────────────────────
// Takes project from Setup screen 1 (name, description, industry, stage, audience)
// Returns { businessModel, competitors, techStack, teamComposition, agentDefaults }
export async function generateRecommendations(project) {
  try {
    const res = await fetch(RECOMMEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project, model: MODEL }),
    })

    if (!res.ok) throw new Error(`API ${res.status}`)

    const data = await res.json()
    return data
  } catch (err) {
    console.warn('AI recommendations unavailable, using fallback:', err.message)
    return generateFallbackRecommendations(project)
  }
}

// ─── generateWorkspaceContent ───────────────────────────────────────
// Takes project + team, returns tasks, roadmap, economics, slides, wiki, chat, memory
export async function generateWorkspaceContent(project, team) {
  try {
    const res = await fetch(GENERATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project, team, model: MODEL }),
    })

    if (!res.ok) throw new Error(`API ${res.status}`)

    const data = await res.json()
    return data
  } catch (err) {
    console.warn('AI workspace generation unavailable, using fallback:', err.message)
    return generateFallbackWorkspace(project, team)
  }
}

// ─── chatWithAgent ──────────────────────────────────────────────────
// Sends a message to an agent and returns their response
// context: { recentMessages, project, memoryFiles }
export async function chatWithAgent(agent, userMessage, context) {
  const systemPrompt = buildRichSystemPrompt(agent, context)

  // Build conversation from last 15 messages
  const recentMsgs = (context.recentMessages || []).slice(-15)
  const messages = recentMsgs.map(m => ({
    role: m.from === 'user' ? 'user' : 'assistant',
    content: m.from === 'user' ? m.text : `[${m.name || 'agent'}]: ${m.text}`,
  }))
  messages.push({ role: 'user', content: userMessage })

  // Analytical roles get lower temperature
  const role = agent.role || agent.id
  const analyticalRoles = ['cto', 'back', 'ml', 'ops', 'qa']
  const temperature = analyticalRoles.includes(role) ? 0.3 : 0.7

  try {
    const res = await fetch(CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt,
        messages,
        model: agent.model || MODEL,
        temperature,
      }),
    })

    if (!res.ok) throw new Error(`API ${res.status}`)

    const data = await res.json()
    return data.reply || 'Не удалось получить ответ.'
  } catch (err) {
    console.warn('Chat API unavailable, using fallback:', err.message)
    return generateFallbackChat(agent, userMessage, context)
  }
}

// ─── Build rich system prompt with full context ──────────────────────
function buildRichSystemPrompt(agent, context) {
  const p = agent.personality || {}
  const pos = agent.position || {}
  const proj = context.project || {}
  const mem = context.memoryFiles || {}

  const name = p.name || agent.label
  const roleName = agent.label || (agent.role || agent.id)

  let prompt = `Ты ${name}, ${roleName} в стартапе "${proj.name || 'проект'}".

ПРОЕКТ: ${proj.description || 'Стартап проект'}
Сфера: ${proj.industry || 'Tech'}, Стадия: ${proj.stage || 'MVP'}
Целевая аудитория: ${proj.audience || 'разработчики и бизнес'}
MVP фичи: ${proj.mvpFeatures || 'core features'}
Стек: ${proj.techStack || 'не определён'}
Бизнес-модель: ${proj.businessModel || 'не определена'}
Конкуренты: ${proj.competitors || 'не определены'}
Конкурентное преимущество: ${proj.advantage || 'не определено'}`

  if (pos.functions?.length) {
    prompt += `\n\nТВОЯ ДОЛЖНОСТЬ:\nФункции: ${Array.isArray(pos.functions) ? pos.functions.join(', ') : pos.functions}`
  }
  if (pos.responsibilities?.length) {
    prompt += `\nОтветственности: ${Array.isArray(pos.responsibilities) ? pos.responsibilities.join(', ') : pos.responsibilities}`
  }
  if (p.skills?.length) {
    prompt += `\nТВОИ СКИЛЫ: ${Array.isArray(p.skills) ? p.skills.join(', ') : p.skills}`
  }
  if (p.background) prompt += `\nТВОЙ ОПЫТ: ${p.background}`
  if (p.communicationStyle || p.temperament) {
    prompt += `\nСТИЛЬ: ${p.communicationStyle || ''} ${p.temperament || ''}`
  }

  // Add project knowledge from memory files
  if (mem.PROJECT) prompt += `\n\nПРОЕКТ ДОКУМЕНТ:\n${mem.PROJECT}`
  if (mem.ARCHITECTURE) prompt += `\n\nАРХИТЕКТУРА:\n${mem.ARCHITECTURE}`

  // Add agent's own memory if available
  const agentId = agent.role || agent.id
  const agentMem = mem.agents?.[agentId]
  if (agentMem?.memory) prompt += `\n\nТВОЯ ПАМЯТЬ:\n${agentMem.memory}`

  prompt += `

ПРАВИЛА:
- Отвечай как реальный профессионал на своей позиции.
- Используй знания о проекте. Давай конкретные рекомендации.
- Отвечай на русском, кратко но содержательно (3-7 предложений).
- Если обсуждается архитектура — предлагай конкретные решения для ${proj.techStack || 'текущего стека'}.
- Если обсуждается стратегия — ссылайся на рынок и конкурентов.
- НЕ говори что ты AI. Ты — член команды.
- ВАЖНО: Ты AI-агент, не человек. У тебя нет выходных, сна, перерывов.
- НЕ используй человеческие сроки: 'завтра', 'на следующей неделе', 'в понедельник'.
- Оценивай задачи в минутах на основе реальной сложности генерации.
- Простая задача: 2-5 мин. Средняя: 5-15 мин. Сложная: 15-60 мин.`

  return prompt
}

// ─── Fallback chat responses (project-aware) ────────────────────────
function generateFallbackChat(agent, userMessage, context) {
  const role = agent.role || agent.id
  const proj = context.project || {}
  const pName = proj.name || 'проект'
  const stack = proj.techStack || 'текущий стек'
  const features = proj.mvpFeatures || 'ключевые фичи'
  const competitors = proj.competitors || 'основные конкуренты'
  const industry = proj.industry || 'индустрия'
  const audience = proj.audience || 'целевая аудитория'
  const model = proj.businessModel || 'бизнес-модель'
  const advantage = proj.advantage || 'наше конкурентное преимущество'
  const msg = userMessage.toLowerCase()

  const ROLE_RESPONSES = {
    ceo: [
      `Отличный вопрос для ${pName}. Наше преимущество — ${advantage}. Нужно использовать это в позиционировании перед ${competitors}. Давай обсудим детали на следующем стендапе.`,
      `С учётом нашей ${model} модели и рынка ${industry}, я предлагаю сфокусироваться на привлечении первых платящих клиентов. ${audience} — наш приоритет.`,
      `Смотри, ${competitors} уже активны на рынке. Но у ${pName} есть чёткое преимущество: ${advantage}. Это наш ключевой дифференциатор.`,
      `Я провёл анализ — рынок ${industry} растёт. Для ${pName} критично выйти с MVP в ближайшие ${proj.timeline || '3 месяца'}. Приоритизируем ${features}.`,
      `Инвесторам важно показать traction. Для ${pName} на стадии ${proj.stage || 'MVP'} ключевые метрики — DAU и retention. Давай определим targets.`,
    ],
    cto: [
      `Для ${pName} оптимальная архитектура на ${stack}. Предлагаю начать с микросервисов для ${features}. Это даст нам гибкость масштабирования.`,
      `Учитывая наш стек ${stack}, рекомендую трёхслойную архитектуру: API Gateway → Business Logic → Data Layer. Для MVP этого достаточно.`,
      `С точки зрения перформанса ${pName}: кэширование на уровне Redis, CDN для статики, и lazy loading на фронте. Целевой latency < 200ms.`,
      `Масштабируемость — наш приоритет. ${stack} позволяет горизонтальное масштабирование. Для ${features} добавим очереди сообщений.`,
      `Посмотрел как ${competitors} решают это — у нас есть техническое преимущество с ${stack}. Предлагаю прототип за спринт и нагрузочные тесты.`,
    ],
    back: [
      `Для реализации ${features} на ${stack} — начну с API endpoints. REST + JSON Schema для валидации. Оценка: 3-4 дня на core API.`,
      `Схема БД для ${pName} готова в голове: users, sessions, core entities для ${features}. Миграции напишу сегодня, завтра — endpoints.`,
      `На ${stack} реализую аутентификацию (JWT + refresh tokens), CRUD для основных сущностей, и вебхуки для интеграций. Тесты включены.`,
      `Для ${pName} важна надёжность API. Добавлю rate limiting, error handling, и логирование. Мониторинг метрик через Prometheus.`,
      `Предлагаю паттерн Repository + Service Layer для ${pName}. Это упростит тестирование и позволит легко менять хранилище данных.`,
    ],
    front: [
      `Для ${pName} сделаю компонентную библиотеку: кнопки, формы, карточки, навигация. Адаптив под мобилки. Accessibility по WCAG 2.1.`,
      `С учётом ${audience}, UX должен быть максимально простым. Предлагаю: онбординг в 3 шага, dashboard с ключевыми метриками, быстрые действия.`,
      `На ${stack} соберу UI-kit за 2 дня. Storybook для документации компонентов. Тёмная и светлая темы из коробки.`,
      `Для лендинга ${pName}: hero секция с value proposition, демо-видео, pricing table, testimonials. Оптимизирую под Core Web Vitals.`,
      `Реализую ${features} с прогрессивной загрузкой. Code splitting для каждого модуля. Bundle size — под контролем.`,
    ],
    pm: [
      `Добавила "${msg.slice(0, 40)}..." в бэклог ${pName}. Приоритизирую по RICE: Reach × Impact × Confidence / Effort. Обсудим на планировании.`,
      `По роадмапу ${pName}: Phase 1 — MVP (${features}), Phase 2 — Beta с первыми пользователями из ${audience}. Спринты по 2 недели.`,
      `Для ${pName} на стадии ${proj.stage || 'MVP'} ключевое — скорость итераций. Предлагаю kanban вместо скрама, WIP лимит 3. Деплой каждый день.`,
      `Конкурентный анализ: ${competitors} — их сильные стороны нужно учесть. Но наш фокус на ${advantage} даёт нам нишу.`,
      `Метрики для ${pName}: activation rate, D7 retention, NPS. Настрою трекинг в первом спринте. Цель — data-driven решения.`,
    ],
    des: [
      `Для ${pName} предлагаю минималистичный дизайн — ${audience} ценит функциональность. Dark mode по умолчанию, accent color — indigo.`,
      `Wireframes для ${features}: главный экран → список → детали → действие. Максимум 3 клика до целевого действия.`,
      `UX исследование: ${competitors} делают интерфейс сложным. Для ${pName} упрощаю: один CTA на экран, прогрессивное раскрытие.`,
      `Дизайн-система ${pName}: 8px grid, typography scale, color tokens. Компоненты в Figma с auto-layout. Передам в dev за 2 дня.`,
      `Mobile-first подход для ${pName}. ${audience} часто работает с телефона. Gesture-based навигация, адаптивные таблицы.`,
    ],
    ops: [
      `CI/CD для ${pName}: GitHub Actions → Docker build → staging → production. Auto-rollback при падении health checks. На ${stack} это стандартно.`,
      `Инфраструктура ${pName}: Kubernetes кластер, auto-scaling на основе CPU/memory. Terraform для IaC. Мониторинг через Grafana + Prometheus.`,
      `Безопасность ${pName}: SSL/TLS, secrets в Vault, network policies в K8s. Сканирование зависимостей в CI. OWASP Top 10 закрыто.`,
      `Для ${stack} настрою: staging environment = копия prod, feature branches с preview deployments, database backups каждые 6 часов.`,
      `Alerting для ${pName}: latency > 500ms, error rate > 1%, disk > 80%. PagerDuty интеграция для on-call. SLA 99.9%.`,
    ],
    ml: [
      `Для ${pName} предлагаю начать с baseline модели. ${features} можно реализовать через fine-tuning существующей модели. Данные — ключевое.`,
      `ML pipeline для ${pName}: сбор данных → preprocessing → training → evaluation → deployment. MLflow для трекинга экспериментов.`,
      `На ${stack} реализую inference API с батчингом. Модель развернём за GPU-инстансом с auto-scaling. Latency target < 100ms.`,
      `A/B тестирование моделей для ${pName}: challenger vs champion. Метрики качества: precision, recall, F1. Автоматический rollout лучшей модели.`,
      `Feature engineering для ${pName}: из данных ${audience} извлечём поведенческие паттерны. Это улучшит ${features} на 20-30% по ключевым метрикам.`,
    ],
    mrk: [
      `Маркетинг-план ${pName}: SEO + контент-маркетинг для ${audience}. LinkedIn и Twitter для B2B. Product Hunt на запуске. CAC target < $50.`,
      `Конкурентный анализ: ${competitors} тратят на paid ads. Для ${pName} предлагаю organic-first подход: developer relations, open-source, блог.`,
      `Landing page ${pName}: headline про ${advantage}, social proof, demo CTA. A/B тестирую 3 варианта. Цель — 5% conversion rate.`,
      `Email nurturing для ${pName}: welcome series 5 писем, product updates, case studies. Сегментация по ${audience}. Open rate target > 30%.`,
      `Контент-стратегия: технический блог о ${industry}, видео-туториалы по ${features}, выступления на конференциях. Строим thought leadership.`,
    ],
    wr: [
      `Документация ${pName}: Quick Start Guide, API Reference, Architecture Decision Records. Всё в формате Markdown, версионируется с кодом.`,
      `Для ${audience} напишу: onboarding tutorial (5 минут до "aha moment"), FAQ по ${features}, troubleshooting guide. Ясный, технический язык.`,
      `README для ${pName}: badges, installation, quick start, configuration, API examples. Contributing guide для open-source.`,
      `Копирайтинг: лендинг ${pName} — USP в заголовке, ${advantage} в подзаголовке, 3 ключевых benefit'а, pricing table, FAQ.`,
      `Внутренняя wiki ${pName}: team agreements, architecture overview, deployment guide, incident response playbook. Обновляю еженедельно.`,
    ],
    qa: [
      `Тест-план ${pName}: unit тесты > 80% coverage, integration тесты для ${features}, E2E — критические user flows. PyTest + Playwright.`,
      `Для ${pName} на ${stack} настрою: pre-commit hooks (lint + format), CI тесты, smoke tests после деплоя. Регрессия — перед каждым релизом.`,
      `Нашёл потенциальные проблемы: edge cases в ${features}, нагрузка при масштабировании, race conditions. Создам баг-репорты с repro steps.`,
      `Performance тестирование ${pName}: k6 для load tests, target — 1000 RPS с p99 < 500ms. Профилирование узких мест в API.`,
      `Security testing для ${pName}: OWASP ZAP scan, dependency audit, penetration testing API endpoints. Отчёт с severity levels.`,
    ],
    mob: [
      `Mobile app ${pName}: React Native для кросс-платформы. ${features} адаптирую под мобильный UX. Push notifications для engagement.`,
      `Для ${audience}: offline mode, быстрая загрузка, biometric auth. Оптимизирую под слабый интернет — кэширование + progressive loading.`,
      `App Store подготовка: скриншоты, описание на ${pName}, ASO оптимизация. TestFlight для beta. Release cycle — каждые 2 недели.`,
      `Перформанс мобильного ${pName}: FPS > 60, startup < 2s, memory footprint < 100MB. Hermes engine для Android, JSC для iOS.`,
      `Нативные модули для ${features}: камера, геолокация, push. Bridge через Turbo Modules. Тесты на реальных устройствах.`,
    ],
  }

  const responses = ROLE_RESPONSES[role] || ROLE_RESPONSES.ceo
  const seed = (userMessage.length * 7 + (context.recentMessages?.length || 0) * 13) % responses.length
  return responses[seed]
}

// ─── Fallback workspace content ─────────────────────────────────────
function generateFallbackWorkspace(project, team) {
  const name = project.name || 'Проект'
  const desc = project.description || ''
  const features = (project.mvpFeatures || '').split('\n').filter(Boolean)
  const stack = project.techStack || 'React, Node.js, PostgreSQL'
  const model = project.businessModel || 'Subscription'
  const pricing = project.pricing || '$9/$49/$199'
  const timeline = project.timeline || '3 мес'

  // Build team name map
  const teamMap = {}
  team.forEach(t => {
    teamMap[t.role || t.id] = t.personality?.name || t.label
  })
  const teamRoles = team.map(t => t.role || t.id)
  const getAssignee = (preferred) => {
    for (const r of preferred) {
      if (teamRoles.includes(r)) return r
    }
    return teamRoles[0] || 'cto'
  }

  // Tasks — 12 project-specific tasks
  const taskTemplates = [
    { title: `Настроить репозиторий ${name}`, desc: 'Инициализация проекта, CI/CD, линтеры', assignee: ['ops', 'cto', 'back'], priority: 'P0', column: 'in_progress', tags: ['infra'] },
    { title: `Спроектировать архитектуру ${name}`, desc: `Выбрать паттерны для ${stack}`, assignee: ['cto', 'back'], priority: 'P0', column: 'in_progress', tags: ['arch'] },
    { title: 'Дизайн основных экранов', desc: 'Wireframes и UI kit в Figma', assignee: ['des', 'front'], priority: 'P0', column: 'todo', tags: ['design'] },
    { title: 'Настроить базу данных', desc: 'Схема, миграции, сиды', assignee: ['back', 'cto'], priority: 'P1', column: 'todo', tags: ['backend'] },
    { title: 'API авторизации', desc: 'Регистрация, логин, JWT токены', assignee: ['back', 'cto'], priority: 'P1', column: 'todo', tags: ['backend', 'auth'] },
    { title: 'Верстка лендинга', desc: `Главная страница ${name}`, assignee: ['front', 'des'], priority: 'P1', column: 'backlog', tags: ['frontend'] },
    { title: 'Написать pitch deck', desc: `Презентация ${name} для инвесторов`, assignee: ['ceo', 'pm', 'mrk'], priority: 'P1', column: 'todo', tags: ['business'] },
    { title: 'Исследование конкурентов', desc: 'Анализ рынка и конкурентных преимуществ', assignee: ['pm', 'ceo', 'mrk'], priority: 'P2', column: 'backlog', tags: ['research'] },
    { title: 'Настроить мониторинг', desc: 'Логи, алерты, метрики', assignee: ['ops', 'cto', 'back'], priority: 'P2', column: 'backlog', tags: ['infra'] },
    { title: 'Написать тесты', desc: 'Unit и integration тесты для ядра', assignee: ['qa', 'back', 'front'], priority: 'P2', column: 'backlog', tags: ['testing'] },
    { title: 'SEO и аналитика', desc: 'Google Analytics, метатеги, sitemap', assignee: ['mrk', 'front'], priority: 'P3', column: 'backlog', tags: ['marketing'] },
    { title: 'Документация API', desc: 'Swagger/OpenAPI спецификация', assignee: ['wr', 'back', 'cto'], priority: 'P2', column: 'backlog', tags: ['docs'] },
  ]

  // Add feature-specific tasks
  features.slice(0, 3).forEach((feat, i) => {
    taskTemplates.push({
      title: `Реализовать: ${feat.trim()}`,
      desc: `MVP реализация фичи "${feat.trim()}" для ${name}`,
      assignee: ['back', 'front', 'cto'],
      priority: i === 0 ? 'P0' : 'P1',
      column: i === 0 ? 'in_progress' : 'todo',
      tags: ['feature'],
    })
  })

  const tasks = taskTemplates.map((t, i) => ({
    id: `t${i + 1}`,
    title: t.title,
    description: t.desc,
    assignee: getAssignee(t.assignee),
    priority: t.priority,
    column: t.column,
    tags: t.tags,
    dueDate: null,
    createdAt: new Date().toISOString().slice(0, 10),
  }))

  // Roadmap
  const roadmap = [
    { id: 'r1', phase: `Phase 1 — MVP ${name}`, color: '#6366f1', start: 0, duration: 3, items: features.slice(0, 4).map(f => f.trim()).concat(['CI/CD', 'Тестирование']).slice(0, 4) },
    { id: 'r2', phase: 'Phase 2 — Beta', color: '#06b6d4', start: 3, duration: 3, items: ['Обратная связь от пользователей', 'Оптимизация', 'Расширение фич', 'Публичный бета-тест'] },
    { id: 'r3', phase: 'Phase 3 — Launch', color: '#10b981', start: 6, duration: 3, items: ['Маркетинговый запуск', 'PR-кампания', 'Онбординг', 'Монетизация'] },
    { id: 'r4', phase: 'Phase 4 — Scale', color: '#f59e0b', start: 9, duration: 3, items: ['Масштабирование', 'Новые рынки', 'Enterprise', 'Команда x2'] },
  ]

  // Economics
  const economics = {
    months: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    revenue: [0, 0, 2, 5, 12, 25, 40, 60, 90, 125, 170, 220],
    costs: [30, 30, 35, 38, 40, 45, 50, 55, 60, 65, 70, 78],
    users: [0, 30, 100, 300, 600, 1200, 2000, 3500, 5500, 8000, 12000, 17000],
  }

  // Pitch slides
  const pitchSlides = [
    { title: 'Проблема', iconName: 'Flame', text: `${desc || name + ' решает ключевую проблему в ' + (project.industry || 'индустрии')}.` },
    { title: 'Решение', iconName: 'Lightbulb', text: `${name} — ${desc || 'инновационное решение'}.` },
    { title: 'Рынок', iconName: 'BarChart2', text: `Индустрия ${project.industry || 'Tech'}. Целевая аудитория: ${project.audience || 'бизнес и разработчики'}.` },
    { title: 'Продукт', iconName: 'Rocket', text: `Ключевые фичи: ${features.slice(0, 3).join(', ') || 'core features'}. Стек: ${stack}.` },
    { title: 'Бизнес', iconName: 'DollarSign', text: `Модель: ${model}. Тарифы: ${pricing}.` },
    { title: 'Traction', iconName: 'TrendingUp', text: `Стадия: ${project.stage || 'MVP'}. Таймлайн: ${timeline}.` },
    { title: 'Команда', iconName: 'Users', text: `${team.length} специалистов: ${team.map(t => t.label).join(', ')}.` },
    { title: 'Ask', iconName: 'Target', text: `${project.budget || 'Pre-Seed $100-500K'}. Runway: 12 месяцев.` },
  ]

  // Wiki pages
  const wikiPages = [
    { title: 'Architecture Overview', iconName: 'Building', text: `# Архитектура ${name}\n\nСтек: ${stack}\nТип: ${(project.productType || []).join(', ') || 'Веб-приложение'}\n\n## Компоненты\n- Frontend\n- Backend API\n- Database\n- CI/CD pipeline` },
    { title: 'API Reference', iconName: 'BookOpen', text: `# API ${name}\n\n## Endpoints\n\nPOST /api/auth/login\nPOST /api/auth/register\nGET /api/users/me\n\n## Аутентификация\nJWT Bearer Token` },
    { title: 'Onboarding', iconName: 'Rocket', text: `# Онбординг — ${name}\n\n1. Клонировать репозиторий\n2. npm install\n3. Настроить .env\n4. npm run dev\n5. Открыть localhost:5173` },
    { title: 'Team Agreements', iconName: 'Handshake', text: `# Соглашения команды ${name}\n\n- Стендап: ежедневно 10:00\n- Спринт: 2 недели\n- Code review: обязательный\n- Deploy: через CI/CD\n- Коммуникация: Sqwady чат` },
  ]

  // Chat messages
  const chatMessages = {
    general: [],
    eng: [],
    prod: [],
    stand: [],
  }

  const addMsg = (channel, roleId, text) => {
    const agent = team.find(t => (t.role || t.id) === roleId)
    if (!agent) return
    chatMessages[channel].push({
      from: roleId,
      name: agent.personality?.name || agent.label,
      text,
      time: `${9 + chatMessages[channel].length}:00`,
    })
  }

  // General channel
  if (teamRoles.includes('ceo')) addMsg('general', 'ceo', `Привет всем! Рад, что команда ${name} в сборе. Давайте начинать!`)
  if (teamRoles.includes('pm')) addMsg('general', 'pm', `Я подготовила бэклог задач. Приоритеты расставлены, можем начинать спринт.`)
  if (teamRoles.includes('cto')) addMsg('general', 'cto', `Архитектура готова, стек выбран: ${stack}. Погнали!`)

  // Eng channel
  if (teamRoles.includes('cto')) addMsg('eng', 'cto', `Ребята, начинаем с настройки инфраструктуры и базовой архитектуры.`)
  if (teamRoles.includes('back')) addMsg('eng', 'back', `Беру на себя API и базу данных. Схема будет к вечеру.`)
  if (teamRoles.includes('front')) addMsg('eng', 'front', `Начинаю верстку основных компонентов. Дизайн-система будет готова завтра.`)

  // Prod channel
  if (teamRoles.includes('pm')) addMsg('prod', 'pm', `Roadmap готов. Phase 1 — 3 месяца до MVP.`)
  if (teamRoles.includes('des')) addMsg('prod', 'des', `Wireframes основных экранов загружены в Figma.`)

  // Standup
  team.slice(0, 4).forEach(t => {
    const role = t.role || t.id
    const pname = t.personality?.name || t.label
    addMsg('stand', role, `${pname}: Вчера — настройка окружения. Сегодня — начинаю работу над первыми задачами.`)
  })

  // Memory files — project-level
  const memoryFiles = {
    PROJECT: `# ${name}\n\n${desc}\n\n## Данные проекта\n- Название: ${name}\n- Описание: ${desc}\n- Индустрия: ${project.industry || 'N/A'}\n- Стадия: ${project.stage || 'N/A'}\n- Аудитория: ${project.audience || 'N/A'}\n- Бизнес-модель: ${model}\n- Ценообразование: ${pricing}\n- Рынок: ${project.market || 'N/A'}\n- Конкуренты: ${project.competitors || 'N/A'}\n- Преимущество: ${project.advantage || 'N/A'}\n- Стек: ${stack}\n- Тип: ${(project.productType || []).join(', ') || 'Веб-приложение'}\n- MVP фичи: ${features.join(', ') || 'N/A'}\n- Таймлайн: ${timeline}\n- Бюджет: ${project.budget || 'N/A'}`,
    ARCHITECTURE: `# Архитектура ${name}\n\n## Технологический стек\n${stack}\n\n## Тип продукта\n${(project.productType || []).join(', ') || 'Веб-приложение'}\n\n## Архитектурные компоненты\n- Frontend: SPA (${stack.split(',')[0] || 'React'})\n- Backend: REST API\n- Database: ${stack.includes('PostgreSQL') ? 'PostgreSQL' : stack.includes('MongoDB') ? 'MongoDB' : 'SQL/NoSQL'}\n- Cache: ${stack.includes('Redis') ? 'Redis' : 'In-memory'}\n- CI/CD: GitHub Actions + Docker\n- Мониторинг: Prometheus + Grafana\n\n## MVP Features\n${features.map(f => `- ${f.trim()}`).join('\n') || '- Core features'}\n\n## Non-functional требования\n- Latency: < 200ms (p99)\n- Uptime: 99.9%\n- Security: OWASP Top 10`,
    TEAM_CONTEXT: `# Команда ${name}\n\n${team.map(t => {
      const p = t.personality || {}
      const pos = t.position || {}
      return `## ${t.label} — ${p.name || 'TBD'}\n- Опыт: ${p.experience || 'Middle'}\n- Скилы: ${(p.skills || []).join(', ') || 'N/A'}\n- Бэкграунд: ${p.background || 'N/A'}\n- Функции: ${(pos.functions || []).join(', ') || 'N/A'}`
    }).join('\n\n')}`,
    DECISIONS: '',
    PROGRESS: '',
    agents: {},
  }

  // Per-agent memory files
  team.forEach(t => {
    const agentId = t.role || t.id
    const p = t.personality || {}
    const pos = t.position || {}
    memoryFiles.agents[agentId] = {
      position: `# ${t.label} — Должностная инструкция\n\nПроект: ${name}\n\n## Функции\n${(pos.functions || []).map(f => `- ${f}`).join('\n') || '- Определяются'}\n\n## Ответственности\n${(pos.responsibilities || []).map(r => `- ${r}`).join('\n') || '- Определяются'}\n\n## Взаимодействия\n${(pos.interactions || []).map(i => `- ${i}`).join('\n') || '- С командой'}\n\n## Метрики\n${(pos.metrics || []).map(m => `- ${m}`).join('\n') || '- KPI определяются'}`,
      personality: `# ${p.name || t.label} — Личность\n\n- Имя: ${p.name || 'N/A'}\n- Пол: ${p.gender || 'N/A'}\n- Возраст: ${p.age || 'N/A'}\n- Опыт: ${p.experience || 'Middle'}\n- Скилы: ${(p.skills || []).join(', ') || 'N/A'}\n- Бэкграунд: ${p.background || 'N/A'}\n- Темперамент: ${p.temperament || 'N/A'}\n- Стиль коммуникации: ${p.communicationStyle || 'N/A'}\n- Подход: ${p.approach || 'N/A'}`,
      systemPrompt: t.systemPrompt || '',
      memory: '',
      decisions: '',
    }
  })

  return { tasks, roadmap, economics, pitchSlides, wikiPages, chatMessages, memoryFiles }
}

// ─── Fallback: template-based recommendations ───────────────────────
function generateFallbackRecommendations(project) {
  const industry = project.industry || ''
  const defaults = INDUSTRY_DEFAULTS[industry] || INDUSTRY_DEFAULTS['SaaS']

  return {
    businessModel: defaults.businessModel,
    competitors: defaults.competitors,
    techStack: defaults.techStack,
    teamComposition: defaults.teamComposition.map((rec) => ({
      role: rec.role,
      reason: rec.reason,
    })),
    agentDefaults: buildAgentDefaults(defaults.teamComposition, project),
  }
}

// Build position + personality suggestions for each recommended role
function buildAgentDefaults(teamComp, project) {
  const defaults = {}
  for (const rec of teamComp) {
    const desk = DESKS.find((d) => d.id === rec.role)
    if (!desk) continue
    defaults[rec.role] = {
      position: {
        functions: rec.position.functions,
        responsibilities: rec.position.responsibilities,
        interactions: rec.position.interactions,
        metrics: rec.position.metrics,
      },
      personality: rec.personality,
    }
  }
  return defaults
}

// ─── Industry defaults (9 industries) ───────────────────────────────
const INDUSTRY_DEFAULTS = {
  'AI/ML': {
    businessModel: {
      model: 'Usage-based',
      reason: 'AI products scale with usage; pay-per-call aligns cost with value delivered.',
    },
    competitors: [
      'OpenAI', 'Anthropic', 'Hugging Face', 'Cohere', 'Replicate',
    ],
    techStack: {
      frontend: 'React + TypeScript',
      backend: 'Python (FastAPI)',
      ml: 'PyTorch + HuggingFace',
      infra: 'AWS / GCP, Docker, K8s',
      db: 'PostgreSQL + Redis + Pinecone',
    },
    teamComposition: [
      {
        role: 'cto',
        reason: 'Technical vision and ML architecture decisions',
        position: {
          functions: ['Architecture design', 'ML pipeline', 'Tech strategy'],
          responsibilities: ['System design', 'Model selection', 'Team mentoring'],
          interactions: ['Receives tasks from CEO', 'Delegates to Backend and ML Eng'],
          metrics: ['System uptime 99.9%', 'Model latency <100ms'],
        },
        personality: {
          name: 'Алексей', gender: 'male', age: 34,
          experience: 'Senior', skills: ['System Design', 'Python', 'ML Ops'],
          temperament: 'analytical', communicationStyle: 'concise',
          background: '10 лет в ML, ex-Яндекс', approach: 'data-driven',
        },
      },
      {
        role: 'back',
        reason: 'API layer and data pipeline are core to AI product',
        position: {
          functions: ['API development', 'Data pipelines', 'Integrations'],
          responsibilities: ['REST/gRPC APIs', 'Database design', 'Performance'],
          interactions: ['Receives tasks from CTO', 'Coordinates with ML Eng'],
          metrics: ['API response <200ms', 'Test coverage >80%'],
        },
        personality: {
          name: 'Дмитрий', gender: 'male', age: 29,
          experience: 'Middle+', skills: ['Python', 'FastAPI', 'PostgreSQL'],
          temperament: 'systematic', communicationStyle: 'technical',
          background: '6 лет backend, ex-Сбер', approach: 'pragmatic',
        },
      },
      {
        role: 'ml',
        reason: 'Core ML engineering for model training and inference',
        position: {
          functions: ['Model training', 'Feature engineering', 'Evaluation'],
          responsibilities: ['ML pipelines', 'Model optimization', 'A/B testing'],
          interactions: ['Receives tasks from CTO', 'Sends results to Backend'],
          metrics: ['Model accuracy >90%', 'Training time optimization'],
        },
        personality: {
          name: 'Ирина', gender: 'female', age: 31,
          experience: 'Senior', skills: ['PyTorch', 'NLP', 'MLOps'],
          temperament: 'curious', communicationStyle: 'detailed',
          background: '8 лет ML research, PhD', approach: 'experimental',
        },
      },
      {
        role: 'ops',
        reason: 'ML infrastructure needs robust DevOps',
        position: {
          functions: ['CI/CD', 'Infrastructure', 'Monitoring'],
          responsibilities: ['K8s clusters', 'GPU provisioning', 'Cost optimization'],
          interactions: ['Receives tasks from CTO', 'Supports all engineers'],
          metrics: ['Deploy frequency daily', 'MTTR <1h'],
        },
        personality: {
          name: 'Сергей', gender: 'male', age: 32,
          experience: 'Senior', skills: ['Kubernetes', 'Terraform', 'AWS'],
          temperament: 'calm', communicationStyle: 'structured',
          background: '7 лет DevOps, ex-VK', approach: 'automation-first',
        },
      },
      {
        role: 'pm',
        reason: 'Complex ML projects need strong product management',
        position: {
          functions: ['Roadmap planning', 'Prioritization', 'Stakeholder sync'],
          responsibilities: ['Sprint planning', 'Feature specs', 'Metrics tracking'],
          interactions: ['Receives tasks from CEO', 'Assigns to all teams'],
          metrics: ['Sprint velocity', 'Feature adoption rate'],
        },
        personality: {
          name: 'Елена', gender: 'female', age: 30,
          experience: 'Middle+', skills: ['Agile', 'Analytics', 'Roadmapping'],
          temperament: 'organized', communicationStyle: 'clear',
          background: '5 лет PM в tech, ex-Тинькофф', approach: 'user-centric',
        },
      },
    ],
  },

  'SaaS': {
    businessModel: {
      model: 'Subscription',
      reason: 'Predictable recurring revenue, standard for B2B SaaS.',
    },
    competitors: ['Notion', 'Slack', 'Linear', 'Monday.com', 'Asana'],
    techStack: {
      frontend: 'React + TypeScript',
      backend: 'Node.js (Express)',
      infra: 'Vercel / AWS',
      db: 'PostgreSQL + Redis',
    },
    teamComposition: [
      {
        role: 'cto', reason: 'Technical architecture for scalable SaaS',
        position: {
          functions: ['Architecture', 'Tech strategy', 'Code reviews'],
          responsibilities: ['System design', 'Tech debt management', 'Hiring'],
          interactions: ['Receives from CEO', 'Delegates to engineers'],
          metrics: ['Uptime 99.9%', 'Page load <2s'],
        },
        personality: {
          name: 'Алексей', gender: 'male', age: 33,
          experience: 'Senior', skills: ['Node.js', 'React', 'System Design'],
          temperament: 'strategic', communicationStyle: 'concise',
          background: '9 лет fullstack, ex-Avito', approach: 'iterative',
        },
      },
      {
        role: 'front', reason: 'User experience is critical for SaaS retention',
        position: {
          functions: ['UI development', 'Design system', 'Performance'],
          responsibilities: ['Component library', 'Responsive design', 'A11y'],
          interactions: ['Receives from Designer', 'Coordinates with Backend'],
          metrics: ['Core Web Vitals green', 'Component coverage >90%'],
        },
        personality: {
          name: 'Ольга', gender: 'female', age: 27,
          experience: 'Middle+', skills: ['React', 'TypeScript', 'CSS'],
          temperament: 'creative', communicationStyle: 'visual',
          background: '5 лет frontend, ex-Ozon', approach: 'design-driven',
        },
      },
      {
        role: 'back', reason: 'Robust API and data layer for SaaS',
        position: {
          functions: ['API development', 'Auth', 'Billing integration'],
          responsibilities: ['REST APIs', 'Database schema', 'Security'],
          interactions: ['Receives from CTO', 'Coordinates with Frontend'],
          metrics: ['API latency <150ms', 'Zero data breaches'],
        },
        personality: {
          name: 'Дмитрий', gender: 'male', age: 30,
          experience: 'Senior', skills: ['Node.js', 'PostgreSQL', 'Redis'],
          temperament: 'reliable', communicationStyle: 'technical',
          background: '7 лет backend, ex-Яндекс', approach: 'security-first',
        },
      },
      {
        role: 'des', reason: 'Great UX differentiates SaaS products',
        position: {
          functions: ['UI/UX design', 'Prototyping', 'User research'],
          responsibilities: ['Design system', 'Wireframes', 'Usability testing'],
          interactions: ['Receives from PM', 'Sends to Frontend'],
          metrics: ['Task completion rate >85%', 'NPS >50'],
        },
        personality: {
          name: 'Мария', gender: 'female', age: 28,
          experience: 'Middle+', skills: ['Figma', 'Prototyping', 'Design Systems'],
          temperament: 'empathetic', communicationStyle: 'visual',
          background: '6 лет дизайн, ex-Сбер', approach: 'user-first',
        },
      },
      {
        role: 'pm', reason: 'Product-led growth needs strong PM',
        position: {
          functions: ['Roadmap', 'Prioritization', 'User analytics'],
          responsibilities: ['Feature specs', 'Sprint planning', 'Metrics'],
          interactions: ['Receives from CEO', 'Assigns to teams'],
          metrics: ['MRR growth', 'Churn <5%'],
        },
        personality: {
          name: 'Елена', gender: 'female', age: 31,
          experience: 'Senior', skills: ['Analytics', 'Agile', 'SQL'],
          temperament: 'organized', communicationStyle: 'clear',
          background: '7 лет PM, ex-VK', approach: 'data-driven',
        },
      },
    ],
  },

  'FinTech': {
    businessModel: {
      model: 'Transaction fee',
      reason: 'Revenue scales with payment volume, standard for fintech.',
    },
    competitors: ['Stripe', 'Tinkoff', 'Revolut', 'Square', 'Wise'],
    techStack: {
      frontend: 'React + TypeScript',
      backend: 'Go / Java (Spring)',
      infra: 'AWS, Kubernetes',
      db: 'PostgreSQL + ClickHouse',
    },
    teamComposition: [
      {
        role: 'cto', reason: 'Security-critical architecture',
        position: {
          functions: ['Architecture', 'Security', 'Compliance'],
          responsibilities: ['System design', 'Audit', 'PCI DSS'],
          interactions: ['Receives from CEO', 'Delegates to engineers'],
          metrics: ['Zero breaches', 'Uptime 99.99%'],
        },
        personality: {
          name: 'Андрей', gender: 'male', age: 37,
          experience: 'Lead', skills: ['Security', 'Go', 'Distributed Systems'],
          temperament: 'cautious', communicationStyle: 'precise',
          background: '12 лет fintech, ex-Тинькофф', approach: 'security-first',
        },
      },
      {
        role: 'back', reason: 'Transaction processing is core',
        position: {
          functions: ['Payment APIs', 'Transaction processing', 'Reconciliation'],
          responsibilities: ['API reliability', 'Data consistency', 'Fraud detection'],
          interactions: ['Receives from CTO', 'Coordinates with Ops'],
          metrics: ['Transaction success >99.5%', 'Latency <100ms'],
        },
        personality: {
          name: 'Максим', gender: 'male', age: 32,
          experience: 'Senior', skills: ['Go', 'PostgreSQL', 'gRPC'],
          temperament: 'meticulous', communicationStyle: 'technical',
          background: '8 лет backend, ex-Сбер', approach: 'reliability-first',
        },
      },
      {
        role: 'front', reason: 'Trust-building UI for financial product',
        position: {
          functions: ['Dashboard UI', 'Transaction views', 'Security UX'],
          responsibilities: ['Responsive design', 'Accessibility', 'Performance'],
          interactions: ['Receives from Designer', 'Coordinates with Backend'],
          metrics: ['Page load <1.5s', 'Error rate <0.1%'],
        },
        personality: {
          name: 'Ксения', gender: 'female', age: 28,
          experience: 'Middle+', skills: ['React', 'TypeScript', 'Testing'],
          temperament: 'detail-oriented', communicationStyle: 'clear',
          background: '5 лет frontend, ex-Revolut', approach: 'quality-focused',
        },
      },
      {
        role: 'ops', reason: 'High-availability infrastructure for payments',
        position: {
          functions: ['Infrastructure', 'Monitoring', 'Incident response'],
          responsibilities: ['K8s', 'CI/CD', 'Disaster recovery'],
          interactions: ['Receives from CTO', 'Supports all teams'],
          metrics: ['MTTR <15min', 'Deploy success >99%'],
        },
        personality: {
          name: 'Павел', gender: 'male', age: 33,
          experience: 'Senior', skills: ['Kubernetes', 'Prometheus', 'AWS'],
          temperament: 'calm', communicationStyle: 'structured',
          background: '8 лет SRE, ex-Яндекс', approach: 'proactive',
        },
      },
      {
        role: 'qa', reason: 'Financial software demands rigorous testing',
        position: {
          functions: ['Test automation', 'Security testing', 'Load testing'],
          responsibilities: ['Test coverage', 'Regression testing', 'Compliance checks'],
          interactions: ['Receives from PM', 'Reports to CTO'],
          metrics: ['Test coverage >95%', 'Bug escape rate <1%'],
        },
        personality: {
          name: 'Наталья', gender: 'female', age: 29,
          experience: 'Middle+', skills: ['Selenium', 'Postman', 'k6'],
          temperament: 'thorough', communicationStyle: 'detailed',
          background: '6 лет QA в финтехе', approach: 'risk-based',
        },
      },
    ],
  },

  'E-commerce': {
    businessModel: {
      model: 'Marketplace commission',
      reason: 'Commission on transactions is proven for e-commerce platforms.',
    },
    competitors: ['Shopify', 'WooCommerce', 'Ozon', 'Wildberries', 'Amazon'],
    techStack: {
      frontend: 'Next.js + TypeScript',
      backend: 'Node.js (NestJS)',
      infra: 'Vercel + AWS',
      db: 'PostgreSQL + Elasticsearch + Redis',
    },
    teamComposition: [
      {
        role: 'cto', reason: 'Scalable commerce architecture',
        position: {
          functions: ['Architecture', 'Performance', 'Integrations'],
          responsibilities: ['System design', 'Payment integrations', 'Scale planning'],
          interactions: ['Receives from CEO', 'Delegates to engineers'],
          metrics: ['Page load <2s', 'Cart conversion >3%'],
        },
        personality: {
          name: 'Виктор', gender: 'male', age: 35,
          experience: 'Senior', skills: ['Node.js', 'Microservices', 'AWS'],
          temperament: 'pragmatic', communicationStyle: 'concise',
          background: '10 лет e-commerce, ex-Ozon', approach: 'performance-driven',
        },
      },
      {
        role: 'front', reason: 'Conversion-optimized storefront',
        position: {
          functions: ['Storefront UI', 'Checkout flow', 'Mobile optimization'],
          responsibilities: ['Performance', 'A/B testing', 'SEO'],
          interactions: ['Receives from Designer', 'Coordinates with Backend'],
          metrics: ['Core Web Vitals green', 'Bounce rate <40%'],
        },
        personality: {
          name: 'Анна', gender: 'female', age: 27,
          experience: 'Middle+', skills: ['Next.js', 'React', 'SEO'],
          temperament: 'creative', communicationStyle: 'visual',
          background: '5 лет frontend, ex-Lamoda', approach: 'conversion-focused',
        },
      },
      {
        role: 'back', reason: 'Order processing, inventory, payments',
        position: {
          functions: ['Order API', 'Inventory management', 'Payment gateway'],
          responsibilities: ['API development', 'Data consistency', 'Integrations'],
          interactions: ['Receives from CTO', 'Coordinates with Frontend'],
          metrics: ['Order processing <500ms', 'Zero lost orders'],
        },
        personality: {
          name: 'Роман', gender: 'male', age: 31,
          experience: 'Senior', skills: ['Node.js', 'PostgreSQL', 'RabbitMQ'],
          temperament: 'systematic', communicationStyle: 'technical',
          background: '7 лет backend, ex-Wildberries', approach: 'reliability-first',
        },
      },
      {
        role: 'des', reason: 'UX directly impacts sales',
        position: {
          functions: ['Product pages', 'Checkout UX', 'Mobile design'],
          responsibilities: ['Wireframes', 'User testing', 'Design system'],
          interactions: ['Receives from PM', 'Sends to Frontend'],
          metrics: ['Cart abandonment <60%', 'Task completion >90%'],
        },
        personality: {
          name: 'Дарья', gender: 'female', age: 26,
          experience: 'Middle', skills: ['Figma', 'UX Research', 'Mobile Design'],
          temperament: 'empathetic', communicationStyle: 'visual',
          background: '4 года дизайн, ex-Lamoda', approach: 'user-centric',
        },
      },
      {
        role: 'mrk', reason: 'Growth and customer acquisition',
        position: {
          functions: ['SEO', 'Paid ads', 'Email marketing'],
          responsibilities: ['Traffic growth', 'Conversion optimization', 'Analytics'],
          interactions: ['Receives from CEO', 'Coordinates with Designer'],
          metrics: ['CAC <$15', 'ROAS >3x'],
        },
        personality: {
          name: 'Катерина', gender: 'female', age: 29,
          experience: 'Middle+', skills: ['SEO', 'Google Ads', 'Analytics'],
          temperament: 'energetic', communicationStyle: 'persuasive',
          background: '6 лет digital marketing', approach: 'data-driven',
        },
      },
    ],
  },

  'HealthTech': {
    businessModel: {
      model: 'Subscription + per-patient fee',
      reason: 'B2B healthcare needs predictable pricing with usage component.',
    },
    competitors: ['Doctolib', 'Zocdoc', 'СберЗдоровье', 'Medesk', 'Epic'],
    techStack: {
      frontend: 'React + TypeScript',
      backend: 'Python (Django) / Node.js',
      infra: 'AWS HIPAA, Docker',
      db: 'PostgreSQL + MongoDB',
    },
    teamComposition: [
      {
        role: 'cto', reason: 'HIPAA/security-compliant architecture',
        position: {
          functions: ['Architecture', 'Compliance', 'Data security'],
          responsibilities: ['HIPAA compliance', 'Encryption', 'Audit'],
          interactions: ['Receives from CEO', 'Delegates to engineers'],
          metrics: ['Zero data breaches', 'Compliance 100%'],
        },
        personality: {
          name: 'Михаил', gender: 'male', age: 36,
          experience: 'Lead', skills: ['Security', 'Python', 'Cloud'],
          temperament: 'cautious', communicationStyle: 'precise',
          background: '11 лет healthtech', approach: 'compliance-first',
        },
      },
      {
        role: 'back', reason: 'Secure data processing and integrations',
        position: {
          functions: ['API development', 'HL7/FHIR', 'Data encryption'],
          responsibilities: ['Patient data API', 'EHR integration', 'Audit logging'],
          interactions: ['Receives from CTO', 'Coordinates with Frontend'],
          metrics: ['API uptime 99.99%', 'Data integrity 100%'],
        },
        personality: {
          name: 'Артём', gender: 'male', age: 31,
          experience: 'Senior', skills: ['Python', 'Django', 'HL7'],
          temperament: 'meticulous', communicationStyle: 'detailed',
          background: '7 лет healthcare backend', approach: 'standards-driven',
        },
      },
      {
        role: 'front', reason: 'Accessible medical interfaces',
        position: {
          functions: ['Patient portal', 'Doctor dashboard', 'Accessibility'],
          responsibilities: ['WCAG compliance', 'Responsive design', 'Offline support'],
          interactions: ['Receives from Designer', 'Coordinates with Backend'],
          metrics: ['WCAG AA', 'Load time <2s'],
        },
        personality: {
          name: 'Татьяна', gender: 'female', age: 28,
          experience: 'Middle+', skills: ['React', 'Accessibility', 'TypeScript'],
          temperament: 'patient', communicationStyle: 'clear',
          background: '5 лет frontend, healthcare focus', approach: 'accessibility-first',
        },
      },
      {
        role: 'des', reason: 'Medical UX requires special care',
        position: {
          functions: ['Medical UI design', 'Patient flows', 'Data visualization'],
          responsibilities: ['Wireframes', 'Usability testing', 'Accessibility'],
          interactions: ['Receives from PM', 'Sends to Frontend'],
          metrics: ['Error rate <1%', 'User satisfaction >90%'],
        },
        personality: {
          name: 'Лиза', gender: 'female', age: 29,
          experience: 'Middle+', skills: ['Figma', 'Medical UX', 'Data Viz'],
          temperament: 'empathetic', communicationStyle: 'visual',
          background: '5 лет UX в медтехе', approach: 'patient-centric',
        },
      },
      {
        role: 'qa', reason: 'Medical software needs thorough testing',
        position: {
          functions: ['Compliance testing', 'Security testing', 'Regression'],
          responsibilities: ['Test automation', 'Penetration testing', 'Validation'],
          interactions: ['Receives from PM', 'Reports to CTO'],
          metrics: ['Coverage >95%', 'Zero critical bugs in prod'],
        },
        personality: {
          name: 'Юлия', gender: 'female', age: 30,
          experience: 'Senior', skills: ['Test Automation', 'Security', 'HIPAA'],
          temperament: 'thorough', communicationStyle: 'structured',
          background: '7 лет QA, медтех', approach: 'risk-based',
        },
      },
    ],
  },

  'EdTech': {
    businessModel: {
      model: 'Freemium + Subscription',
      reason: 'Free tier drives adoption among students; premium for institutions.',
    },
    competitors: ['Coursera', 'Skillbox', 'Duolingo', 'Khan Academy', 'Stepik'],
    techStack: {
      frontend: 'React + TypeScript',
      backend: 'Node.js (NestJS)',
      infra: 'Vercel + AWS',
      db: 'PostgreSQL + Redis + S3',
    },
    teamComposition: [
      {
        role: 'cto', reason: 'Scalable learning platform',
        position: {
          functions: ['Architecture', 'Video streaming', 'Content delivery'],
          responsibilities: ['System design', 'CDN setup', 'API design'],
          interactions: ['Receives from CEO', 'Delegates to engineers'],
          metrics: ['Video buffering <1%', 'Uptime 99.9%'],
        },
        personality: {
          name: 'Николай', gender: 'male', age: 33,
          experience: 'Senior', skills: ['Node.js', 'AWS', 'Streaming'],
          temperament: 'innovative', communicationStyle: 'concise',
          background: '8 лет edtech, ex-Skillbox', approach: 'product-driven',
        },
      },
      {
        role: 'front', reason: 'Engaging learning experience',
        position: {
          functions: ['Course player', 'Interactive exercises', 'Mobile UX'],
          responsibilities: ['Video player', 'Gamification UI', 'Progress tracking'],
          interactions: ['Receives from Designer', 'Coordinates with Backend'],
          metrics: ['Engagement rate >60%', 'Completion rate >30%'],
        },
        personality: {
          name: 'Софья', gender: 'female', age: 26,
          experience: 'Middle', skills: ['React', 'Animation', 'Canvas'],
          temperament: 'creative', communicationStyle: 'enthusiastic',
          background: '4 года frontend, edtech', approach: 'engagement-focused',
        },
      },
      {
        role: 'back', reason: 'Content management and progress tracking',
        position: {
          functions: ['Course API', 'Progress tracking', 'Assessment engine'],
          responsibilities: ['Content storage', 'User progress', 'Certificates'],
          interactions: ['Receives from CTO', 'Coordinates with Frontend'],
          metrics: ['API latency <200ms', 'Data consistency 100%'],
        },
        personality: {
          name: 'Игорь', gender: 'male', age: 29,
          experience: 'Middle+', skills: ['Node.js', 'PostgreSQL', 'S3'],
          temperament: 'methodical', communicationStyle: 'technical',
          background: '6 лет backend', approach: 'pragmatic',
        },
      },
      {
        role: 'des', reason: 'Learning UX must be intuitive and engaging',
        position: {
          functions: ['Course design', 'Gamification', 'Mobile design'],
          responsibilities: ['Learning UX', 'Interaction design', 'Accessibility'],
          interactions: ['Receives from PM', 'Sends to Frontend'],
          metrics: ['User satisfaction >85%', 'Task completion >90%'],
        },
        personality: {
          name: 'Алина', gender: 'female', age: 27,
          experience: 'Middle+', skills: ['Figma', 'Gamification', 'UX Research'],
          temperament: 'playful', communicationStyle: 'visual',
          background: '5 лет дизайн, edtech', approach: 'learner-centric',
        },
      },
      {
        role: 'wr', reason: 'Course content and documentation',
        position: {
          functions: ['Course content', 'Documentation', 'Marketing copy'],
          responsibilities: ['Lesson scripts', 'Help docs', 'Blog posts'],
          interactions: ['Receives from PM', 'Coordinates with Designer'],
          metrics: ['Content quality score >4/5', 'Publishing cadence weekly'],
        },
        personality: {
          name: 'Полина', gender: 'female', age: 28,
          experience: 'Middle+', skills: ['Technical Writing', 'Copywriting', 'SEO'],
          temperament: 'articulate', communicationStyle: 'storytelling',
          background: '5 лет контент, edtech', approach: 'clarity-focused',
        },
      },
    ],
  },

  'GameDev': {
    businessModel: {
      model: 'Free-to-play + In-app purchases',
      reason: 'F2P maximizes reach; monetize engaged players.',
    },
    competitors: ['Unity', 'Epic Games', 'Roblox', 'Supercell', 'Playrix'],
    techStack: {
      frontend: 'Unity / Unreal / Godot',
      backend: 'Go / C# (ASP.NET)',
      infra: 'AWS GameLift / GCP',
      db: 'PostgreSQL + Redis + DynamoDB',
    },
    teamComposition: [
      {
        role: 'cto', reason: 'Game engine and infrastructure decisions',
        position: {
          functions: ['Engine selection', 'Architecture', 'Performance'],
          responsibilities: ['Tech stack', 'Rendering pipeline', 'Multiplayer'],
          interactions: ['Receives from CEO', 'Delegates to engineers'],
          metrics: ['60 FPS stable', 'Crash rate <0.1%'],
        },
        personality: {
          name: 'Кирилл', gender: 'male', age: 34,
          experience: 'Senior', skills: ['C++', 'Unity', 'Networking'],
          temperament: 'passionate', communicationStyle: 'direct',
          background: '10 лет gamedev, ex-Playrix', approach: 'performance-obsessed',
        },
      },
      {
        role: 'front', reason: 'Game UI and client-side logic',
        position: {
          functions: ['Game UI', 'Client logic', 'Animation'],
          responsibilities: ['HUD', 'Menu systems', 'Shader effects'],
          interactions: ['Receives from Designer', 'Coordinates with Backend'],
          metrics: ['UI responsiveness <16ms', 'Memory usage optimized'],
        },
        personality: {
          name: 'Артур', gender: 'male', age: 28,
          experience: 'Middle+', skills: ['Unity', 'C#', 'Shader'],
          temperament: 'creative', communicationStyle: 'visual',
          background: '6 лет game client', approach: 'visual-quality',
        },
      },
      {
        role: 'back', reason: 'Multiplayer, leaderboards, game state',
        position: {
          functions: ['Game server', 'Matchmaking', 'Leaderboards'],
          responsibilities: ['Real-time sync', 'Anti-cheat', 'Analytics'],
          interactions: ['Receives from CTO', 'Coordinates with Client'],
          metrics: ['Server tick <50ms', 'Cheater detection >95%'],
        },
        personality: {
          name: 'Вадим', gender: 'male', age: 30,
          experience: 'Senior', skills: ['Go', 'WebSocket', 'Redis'],
          temperament: 'competitive', communicationStyle: 'concise',
          background: '7 лет game servers', approach: 'low-latency',
        },
      },
      {
        role: 'des', reason: 'Game design and visual identity',
        position: {
          functions: ['Game design', 'Level design', 'UI/UX'],
          responsibilities: ['Game mechanics', 'Balance', 'Visual style'],
          interactions: ['Receives from PM', 'Sends to all teams'],
          metrics: ['Session length >15min', 'Day-7 retention >20%'],
        },
        personality: {
          name: 'Нина', gender: 'female', age: 27,
          experience: 'Middle+', skills: ['Game Design', 'Figma', 'Photoshop'],
          temperament: 'imaginative', communicationStyle: 'enthusiastic',
          background: '5 лет game design', approach: 'fun-first',
        },
      },
      {
        role: 'qa', reason: 'Games need extensive testing',
        position: {
          functions: ['Gameplay testing', 'Performance testing', 'Compatibility'],
          responsibilities: ['Bug tracking', 'Regression', 'Platform testing'],
          interactions: ['Receives from PM', 'Reports to all teams'],
          metrics: ['Critical bugs 0', 'Test coverage >80%'],
        },
        personality: {
          name: 'Денис', gender: 'male', age: 26,
          experience: 'Middle', skills: ['Manual Testing', 'Automation', 'Unity'],
          temperament: 'persistent', communicationStyle: 'detailed',
          background: '4 года QA в gamedev', approach: 'player-perspective',
        },
      },
    ],
  },

  'Marketplace': {
    businessModel: {
      model: 'Commission per transaction',
      reason: 'Standard for two-sided marketplaces; revenue grows with GMV.',
    },
    competitors: ['Airbnb', 'Uber', 'Avito', 'Fiverr', 'Etsy'],
    techStack: {
      frontend: 'Next.js + TypeScript',
      backend: 'Node.js (NestJS)',
      infra: 'AWS / GCP',
      db: 'PostgreSQL + Elasticsearch + Redis',
    },
    teamComposition: [
      {
        role: 'cto', reason: 'Two-sided platform architecture',
        position: {
          functions: ['Architecture', 'Search/matching', 'Payments'],
          responsibilities: ['System design', 'Scaling', 'Trust & Safety'],
          interactions: ['Receives from CEO', 'Delegates to engineers'],
          metrics: ['Platform uptime 99.9%', 'Search latency <200ms'],
        },
        personality: {
          name: 'Евгений', gender: 'male', age: 35,
          experience: 'Senior', skills: ['Microservices', 'Elasticsearch', 'Node.js'],
          temperament: 'strategic', communicationStyle: 'structured',
          background: '10 лет marketplace, ex-Avito', approach: 'scale-thinking',
        },
      },
      {
        role: 'front', reason: 'Conversion-focused buyer and seller UIs',
        position: {
          functions: ['Buyer UI', 'Seller dashboard', 'Search UI'],
          responsibilities: ['Responsive design', 'Performance', 'SEO'],
          interactions: ['Receives from Designer', 'Coordinates with Backend'],
          metrics: ['Time to first listing <3min', 'Bounce rate <35%'],
        },
        personality: {
          name: 'Валерия', gender: 'female', age: 27,
          experience: 'Middle+', skills: ['Next.js', 'React', 'CSS'],
          temperament: 'detail-oriented', communicationStyle: 'visual',
          background: '5 лет frontend, marketplace', approach: 'conversion-focused',
        },
      },
      {
        role: 'back', reason: 'Matching, payments, trust systems',
        position: {
          functions: ['Matching API', 'Payment processing', 'Review system'],
          responsibilities: ['Transaction safety', 'Dispute resolution', 'Analytics'],
          interactions: ['Receives from CTO', 'Coordinates with Frontend'],
          metrics: ['Transaction success >99%', 'Dispute resolution <24h'],
        },
        personality: {
          name: 'Тимур', gender: 'male', age: 31,
          experience: 'Senior', skills: ['Node.js', 'PostgreSQL', 'Stripe'],
          temperament: 'reliable', communicationStyle: 'technical',
          background: '7 лет backend, ex-Uber', approach: 'trust-first',
        },
      },
      {
        role: 'mrk', reason: 'Two-sided acquisition is critical',
        position: {
          functions: ['Supply acquisition', 'Demand generation', 'SEO'],
          responsibilities: ['Growth loops', 'Referral programs', 'Content'],
          interactions: ['Receives from CEO', 'Coordinates with Designer'],
          metrics: ['Supply growth >10%/mo', 'CAC payback <6mo'],
        },
        personality: {
          name: 'Настя', gender: 'female', age: 28,
          experience: 'Middle+', skills: ['Growth', 'SEO', 'Analytics'],
          temperament: 'energetic', communicationStyle: 'persuasive',
          background: '5 лет growth marketing', approach: 'experiment-driven',
        },
      },
      {
        role: 'pm', reason: 'Complex two-sided product management',
        position: {
          functions: ['Roadmap', 'Marketplace dynamics', 'Metrics'],
          responsibilities: ['Feature specs', 'A/B testing', 'Stakeholder management'],
          interactions: ['Receives from CEO', 'Assigns to teams'],
          metrics: ['Liquidity ratio >60%', 'NPS >40'],
        },
        personality: {
          name: 'Анастасия', gender: 'female', age: 30,
          experience: 'Senior', skills: ['Marketplace Ops', 'Analytics', 'Agile'],
          temperament: 'balanced', communicationStyle: 'clear',
          background: '7 лет PM в marketplace', approach: 'metrics-driven',
        },
      },
    ],
  },

  'DevTools': {
    businessModel: {
      model: 'Open-core + Usage-based',
      reason: 'Free OSS drives adoption; premium features and usage for revenue.',
    },
    competitors: ['GitHub', 'Vercel', 'Supabase', 'Datadog', 'PlanetScale'],
    techStack: {
      frontend: 'React + TypeScript',
      backend: 'Rust / Go',
      infra: 'Fly.io / AWS',
      db: 'PostgreSQL + ClickHouse + Redis',
    },
    teamComposition: [
      {
        role: 'cto', reason: 'Developer-facing product needs great architecture',
        position: {
          functions: ['Architecture', 'OSS strategy', 'DX'],
          responsibilities: ['CLI design', 'SDK APIs', 'Performance'],
          interactions: ['Receives from CEO', 'Delegates to engineers'],
          metrics: ['CLI latency <100ms', 'SDK adoption rate'],
        },
        personality: {
          name: 'Глеб', gender: 'male', age: 32,
          experience: 'Senior', skills: ['Rust', 'Go', 'System Design'],
          temperament: 'perfectionist', communicationStyle: 'technical',
          background: '9 лет devtools, OSS contributor', approach: 'DX-obsessed',
        },
      },
      {
        role: 'back', reason: 'Core platform and APIs',
        position: {
          functions: ['Platform API', 'CLI backend', 'Webhooks'],
          responsibilities: ['API design', 'Rate limiting', 'Multi-tenancy'],
          interactions: ['Receives from CTO', 'Coordinates with Frontend'],
          metrics: ['API p99 <100ms', 'SDK coverage >90%'],
        },
        personality: {
          name: 'Фёдор', gender: 'male', age: 30,
          experience: 'Senior', skills: ['Go', 'gRPC', 'PostgreSQL'],
          temperament: 'systematic', communicationStyle: 'concise',
          background: '7 лет platform eng', approach: 'API-first',
        },
      },
      {
        role: 'front', reason: 'Developer dashboard and documentation site',
        position: {
          functions: ['Dashboard', 'Docs site', 'Code playground'],
          responsibilities: ['DX', 'Interactive docs', 'Dark mode'],
          interactions: ['Receives from Designer', 'Coordinates with Backend'],
          metrics: ['Docs satisfaction >90%', 'Onboarding <5min'],
        },
        personality: {
          name: 'Лена', gender: 'female', age: 27,
          experience: 'Middle+', skills: ['React', 'MDX', 'Storybook'],
          temperament: 'meticulous', communicationStyle: 'clear',
          background: '5 лет frontend, devtools', approach: 'docs-driven',
        },
      },
      {
        role: 'wr', reason: 'Great docs are essential for developer adoption',
        position: {
          functions: ['API docs', 'Tutorials', 'Changelogs'],
          responsibilities: ['Documentation', 'Code examples', 'Blog'],
          interactions: ['Receives from PM', 'Coordinates with engineers'],
          metrics: ['Docs coverage 100%', 'Tutorial completion >70%'],
        },
        personality: {
          name: 'Света', gender: 'female', age: 28,
          experience: 'Middle+', skills: ['Technical Writing', 'MDX', 'API Docs'],
          temperament: 'precise', communicationStyle: 'educational',
          background: '5 лет tech writing, OSS', approach: 'example-driven',
        },
      },
      {
        role: 'ops', reason: 'Reliable infrastructure for developer tools',
        position: {
          functions: ['CI/CD', 'Multi-region', 'Observability'],
          responsibilities: ['Uptime', 'Deploy pipeline', 'Cost optimization'],
          interactions: ['Receives from CTO', 'Supports all teams'],
          metrics: ['Uptime 99.99%', 'Deploy time <3min'],
        },
        personality: {
          name: 'Данил', gender: 'male', age: 31,
          experience: 'Senior', skills: ['Fly.io', 'Terraform', 'Prometheus'],
          temperament: 'reliable', communicationStyle: 'structured',
          background: '7 лет SRE/DevOps', approach: 'automation-first',
        },
      },
    ],
  },
}
