import { chatWithAgent } from './ai'
import { DESKS, timestamp, resolveRoleId, normalizeAssignee } from '../data/constants'
import { GitHubService, getArtifactFilePath, isComplexTask } from './github'
import { generateClaudeCodePrompt } from './claudeCodePrompts'
import { promptBuilder, processMemoryTags } from './promptBuilder'

// ── Artifact type mapping by role ───────────────────────────────────
const ROLE_ARTIFACT_MAP = {
  // Legacy + new IDs
  ceo: { types: ['strategy', 'decision', 'okr'], label: 'document' },
  coo: { types: ['process', 'operations', 'kpi'], label: 'document' },
  cfo: { types: ['financial-model', 'budget', 'report'], label: 'document' },
  cmo: { types: ['marketing-strategy', 'brand', 'campaign'], label: 'document' },
  cpo: { types: ['product-strategy', 'roadmap', 'research'], label: 'spec' },
  cto: { types: ['architecture', 'tech-decision', 'system-design'], label: 'spec' },
  tech_lead: { types: ['architecture', 'code-review', 'standards'], label: 'spec' },
  back: { types: ['api-spec', 'endpoint', 'schema', 'data-model'], label: 'code' },
  backend: { types: ['api-spec', 'endpoint', 'schema', 'data-model'], label: 'code' },
  front: { types: ['component', 'ui-spec', 'page-layout'], label: 'code' },
  frontend: { types: ['component', 'ui-spec', 'page-layout'], label: 'code' },
  fullstack: { types: ['feature', 'api-spec', 'component'], label: 'code' },
  mob: { types: ['screen', 'mobile-component', 'navigation'], label: 'code' },
  mobile: { types: ['screen', 'mobile-component', 'navigation'], label: 'code' },
  ml: { types: ['model-spec', 'pipeline', 'evaluation'], label: 'spec' },
  ml_eng: { types: ['model-spec', 'pipeline', 'evaluation'], label: 'spec' },
  ops: { types: ['ci-cd', 'dockerfile', 'infra-spec'], label: 'code' },
  devops: { types: ['ci-cd', 'dockerfile', 'infra-spec'], label: 'code' },
  des: { types: ['wireframe', 'design-system', 'user-flow'], label: 'design' },
  designer: { types: ['wireframe', 'design-system', 'user-flow'], label: 'design' },
  ux_designer: { types: ['wireframe', 'user-flow', 'ia'], label: 'design' },
  graphic_designer: { types: ['visual', 'branding', 'illustration'], label: 'design' },
  motion_designer: { types: ['animation', 'motion', 'video'], label: 'design' },
  mrk: { types: ['content-plan', 'seo-analysis', 'landing-copy'], label: 'document' },
  marketer: { types: ['content-plan', 'seo-analysis', 'landing-copy'], label: 'document' },
  wr: { types: ['documentation', 'readme', 'user-guide'], label: 'document' },
  writer: { types: ['documentation', 'readme', 'user-guide'], label: 'document' },
  pm: { types: ['prd', 'user-stories', 'acceptance-criteria'], label: 'spec' },
  po: { types: ['backlog', 'sprint-plan', 'acceptance'], label: 'spec' },
  ba: { types: ['requirements', 'process', 'analysis'], label: 'spec' },
  qa: { types: ['test-plan', 'test-cases', 'bug-report'], label: 'spec' },
  security: { types: ['audit', 'vulnerability', 'compliance'], label: 'spec' },
  data_scientist: { types: ['analysis', 'model', 'experiment'], label: 'analysis' },
  data_engineer: { types: ['pipeline', 'schema', 'etl'], label: 'code' },
  ai_researcher: { types: ['research', 'experiment', 'paper'], label: 'analysis' },
  sales_manager: { types: ['proposal', 'pipeline', 'deal'], label: 'document' },
  bdr: { types: ['outreach', 'lead-list', 'cadence'], label: 'document' },
  account_manager: { types: ['account-plan', 'review', 'upsell'], label: 'document' },
  partnerships: { types: ['partnership-plan', 'proposal', 'agreement'], label: 'document' },
  hr_manager: { types: ['job-desc', 'culture', 'review'], label: 'document' },
  recruiter: { types: ['candidate-profile', 'interview', 'scorecard'], label: 'document' },
  lawyer: { types: ['contract', 'compliance', 'policy'], label: 'document' },
  support_manager: { types: ['knowledge-base', 'sla', 'process'], label: 'document' },
  support_agent: { types: ['ticket-response', 'faq', 'guide'], label: 'document' },
  copywriter: { types: ['copy', 'landing', 'email'], label: 'document' },
  content_manager: { types: ['content-plan', 'article', 'calendar'], label: 'document' },
  video_producer: { types: ['script', 'storyboard', 'video'], label: 'document' },
  smm: { types: ['social-plan', 'post', 'campaign'], label: 'document' },
  seo: { types: ['seo-audit', 'keywords', 'optimization'], label: 'analysis' },
  pr: { types: ['press-release', 'media-plan', 'pitch'], label: 'document' },
  email_marketer: { types: ['email-sequence', 'template', 'automation'], label: 'document' },
  accountant: { types: ['report', 'tax', 'reconciliation'], label: 'document' },
  financial_analyst: { types: ['model', 'forecast', 'valuation'], label: 'analysis' },
  ops_manager: { types: ['process', 'kpi', 'optimization'], label: 'document' },
  project_manager: { types: ['plan', 'wbs', 'risk'], label: 'document' },
  secretary: { types: ['minutes', 'schedule', 'memo'], label: 'document' },
  office_manager: { types: ['inventory', 'budget', 'event'], label: 'document' },
  ux_researcher: { types: ['research', 'personas', 'insights'], label: 'analysis' },
}

// ── Reviewer assignment logic ───────────────────────────────────────
function getReviewerRole(task, authorRole) {
  const tags = (task.tags || []).map(t => t.toLowerCase())
  const title = (task.title || '').toLowerCase()

  // Technical tasks → CTO reviews
  const techKeywords = ['api', 'backend', 'frontend', 'code', 'architecture', 'database', 'deploy', 'ci/cd', 'test']
  if (techKeywords.some(k => title.includes(k) || tags.includes(k))) {
    return authorRole === 'cto' ? 'ceo' : 'cto'
  }

  // Strategic tasks → CEO reviews
  const stratKeywords = ['strategy', 'business', 'investor', 'pitch', 'okr', 'roadmap']
  if (stratKeywords.some(k => title.includes(k) || tags.includes(k))) {
    return authorRole === 'ceo' ? 'cto' : 'ceo'
  }

  // Product tasks → PM reviews
  const prodKeywords = ['prd', 'user stor', 'feature', 'requirement', 'sprint']
  if (prodKeywords.some(k => title.includes(k) || tags.includes(k))) {
    return authorRole === 'pm' ? 'ceo' : 'pm'
  }

  // Default: CTO for tech roles, CEO for others
  const techRoles = ['back', 'front', 'mob', 'ml', 'ops', 'qa']
  if (techRoles.includes(authorRole)) {
    return authorRole === 'cto' ? 'ceo' : 'cto'
  }
  return authorRole === 'ceo' ? 'cto' : 'ceo'
}

// ── Parse artifact from AI response ─────────────────────────────────
function parseArtifact(responseText) {
  const titleMatch = responseText.match(/ARTIFACT_TITLE:\s*(.+?)(?:\n|$)/i)
  const typeMatch = responseText.match(/ARTIFACT_TYPE:\s*(.+?)(?:\n|$)/i)
  const contentMatch = responseText.match(/CONTENT:\s*\n?([\s\S]+)/i)

  if (titleMatch && contentMatch) {
    return {
      title: titleMatch[1].trim(),
      type: typeMatch ? typeMatch[1].trim().toLowerCase() : 'document',
      content: contentMatch[1].trim(),
    }
  }

  // Fallback: treat entire response as content
  const firstLine = responseText.split('\n')[0]?.trim() || 'Артефакт'
  return {
    title: firstLine.length > 80 ? firstLine.slice(0, 80) + '...' : firstLine,
    type: 'document',
    content: responseText.trim(),
  }
}

// ── Mock artifact generation (without API) ──────────────────────────
function generateMockArtifact(task, agent, project) {
  const role = agent.role || agent.id
  const agentName = agent.personality?.name || agent.label
  const pName = project?.name || 'Проект'
  const stack = project?.techStack || 'React + Node.js'
  const features = project?.mvpFeatures || 'core features'
  const audience = project?.audience || 'целевая аудитория'

  const TEMPLATES = {
    ceo: {
      title: `Стратегический документ: ${task.title}`,
      type: 'document',
      content: `# ${task.title}

## Контекст
Проект ${pName} находится на стадии ${project?.stage || 'MVP'}. Данный документ определяет стратегические решения по задаче.

## Анализ
### Текущая ситуация
- Целевая аудитория: ${audience}
- Бизнес-модель: ${project?.businessModel || 'SaaS'}
- Конкурентное преимущество: ${project?.advantage || 'инновационный подход'}

### Ключевые метрики
| Метрика | Текущее | Цель (3 мес) | Цель (6 мес) |
|---------|---------|--------------|--------------|
| MRR | $0 | $5,000 | $25,000 |
| Пользователи | 0 | 100 | 500 |
| Retention | - | 60% | 75% |
| NPS | - | 30 | 50 |

## Решение
${task.description || 'Реализовать задачу в соответствии с стратегией проекта.'}

## Следующие шаги
1. Согласовать с командой план реализации
2. Определить KPI и метрики успеха
3. Запустить в рамках текущего спринта
4. Провести ревью через 2 недели

---
*Подготовлено: ${agentName}, CEO*`,
    },
    cto: {
      title: `Техническая спецификация: ${task.title}`,
      type: 'spec',
      content: `# ${task.title} — Техническая спецификация

## Обзор
Техническое решение для задачи в рамках проекта ${pName}.

## Архитектура
\`\`\`
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client     │───▶│   API GW    │───▶│  Services   │
│   (${stack.split('+')[0]?.trim() || 'React'})   │    │   (REST)    │    │  (${stack.split('+')[1]?.trim() || 'Node.js'})  │
└─────────────┘    └─────────────┘    └──────┬──────┘
                                              │
                                     ┌────────▼────────┐
                                     │    Database      │
                                     │   (PostgreSQL)   │
                                     └─────────────────┘
\`\`\`

## Технические требования
- Стек: ${stack}
- Latency: < 200ms p95
- Availability: 99.9%
- Масштабируемость: до 10K RPS

## Компоненты
1. **API Layer** — REST endpoints, валидация, авторизация
2. **Business Logic** — core domain, бизнес-правила
3. **Data Layer** — ORM, миграции, кеширование

## Риски
- Сложность интеграции: средняя
- Технический долг: минимальный при соблюдении стандартов

## План реализации
| Этап | Срок | Ответственный |
|------|------|---------------|
| Проектирование | 2 дня | CTO |
| Реализация | 5 дней | Backend + Frontend |
| Тестирование | 2 дня | QA |
| Деплой | 1 день | DevOps |

---
*Подготовлено: ${agentName}, CTO*`,
    },
    back: {
      title: `API спецификация: ${task.title}`,
      type: 'code',
      content: `# ${task.title} — Backend Implementation

## API Endpoints

### POST /api/v1/resource
\`\`\`javascript
// Route handler
router.post('/api/v1/resource', auth, validate(schema), async (req, res) => {
  try {
    const { name, description, config } = req.body

    const resource = await ResourceService.create({
      name,
      description,
      config,
      createdBy: req.user.id,
    })

    res.status(201).json({
      success: true,
      data: resource,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})
\`\`\`

### GET /api/v1/resource/:id
\`\`\`javascript
router.get('/api/v1/resource/:id', auth, async (req, res) => {
  const resource = await ResourceService.findById(req.params.id)
  if (!resource) return res.status(404).json({ error: 'Not found' })
  res.json({ success: true, data: resource })
})
\`\`\`

### Data Model
\`\`\`sql
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  config JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_resources_status ON resources(status);
CREATE INDEX idx_resources_created_by ON resources(created_by);
\`\`\`

### Validation Schema
\`\`\`javascript
const schema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(2000).optional(),
  config: Joi.object().optional(),
})
\`\`\`

---
*Реализовано: ${agentName}, Backend*`,
    },
    front: {
      title: `UI компонент: ${task.title}`,
      type: 'code',
      content: `# ${task.title} — Frontend Component

## Component Implementation

\`\`\`jsx
import { useState, useEffect } from 'react'

export function ResourceView({ resourceId, onUpdate }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const res = await fetch(\`/api/v1/resource/\${resourceId}\`)
        if (!res.ok) throw new Error('Failed to fetch')
        const json = await res.json()
        setData(json.data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [resourceId])

  if (loading) return <div className="animate-pulse p-4">Загрузка...</div>
  if (error) return <div className="text-red-500 p-4">{error}</div>

  return (
    <div className="glass-card p-6 rounded-2xl">
      <h2 className="text-xl font-semibold mb-4">{data?.name}</h2>
      <p className="text-[var(--tx2)] mb-4">{data?.description}</p>
      <div className="flex gap-2">
        <button
          onClick={() => onUpdate?.(data)}
          className="px-4 py-2 bg-[var(--ac)] text-white rounded-xl hover:opacity-90"
        >
          Редактировать
        </button>
      </div>
    </div>
  )
}
\`\`\`

## Стили
- glass-card с backdrop-blur
- Адаптивная верстка (мобильные breakpoints)
- Accessibility: focus ring, aria-labels

---
*Реализовано: ${agentName}, Frontend*`,
    },
    pm: {
      title: `PRD: ${task.title}`,
      type: 'spec',
      content: `# ${task.title} — Product Requirements Document

## Обзор
**Проект:** ${pName}
**Приоритет:** ${task.priority || 'P1'}
**Целевая аудитория:** ${audience}

## Проблема
Пользователям необходима функциональность для решения ключевой задачи в рамках ${pName}.

## User Stories

### US-1: Основной сценарий
**Как** пользователь ${pName},
**Я хочу** ${task.title.toLowerCase()},
**Чтобы** повысить эффективность работы.

**Acceptance Criteria:**
- [ ] Пользователь может выполнить основное действие
- [ ] Система корректно обрабатывает ошибки
- [ ] UI отзывчивый (< 200ms)
- [ ] Работает на мобильных устройствах

### US-2: Альтернативный сценарий
**Как** администратор,
**Я хочу** управлять настройками,
**Чтобы** контролировать поведение системы.

**Acceptance Criteria:**
- [ ] Админ-панель доступна авторизованным пользователям
- [ ] Изменения применяются в реальном времени
- [ ] Есть аудит-лог изменений

## Метрики успеха
| Метрика | Текущее | Цель |
|---------|---------|------|
| Adoption | 0% | 60% за 1 мес |
| Task completion | - | > 90% |
| User satisfaction | - | > 4.0/5.0 |

## Зависимости
- Backend API (endpoint)
- UI компоненты (Frontend)
- Тест-кейсы (QA)

---
*Подготовлено: ${agentName}, Product Manager*`,
    },
    des: {
      title: `Дизайн: ${task.title}`,
      type: 'design',
      content: `# ${task.title} — Design Specification

## Wireframe

\`\`\`
┌──────────────────────────────────────────┐
│  Header: Logo + Navigation + User Menu   │
├──────────────────────────────────────────┤
│ ┌────────┐  ┌────────────────────────┐   │
│ │ Sidebar │  │  Main Content Area     │   │
│ │         │  │                        │   │
│ │ - Nav 1 │  │  ┌──────┐ ┌──────┐    │   │
│ │ - Nav 2 │  │  │Card 1│ │Card 2│    │   │
│ │ - Nav 3 │  │  └──────┘ └──────┘    │   │
│ │         │  │  ┌──────┐ ┌──────┐    │   │
│ │         │  │  │Card 3│ │Card 4│    │   │
│ │         │  │  └──────┘ └──────┘    │   │
│ └────────┘  └────────────────────────┘   │
├──────────────────────────────────────────┤
│  Footer: Links + Copyright               │
└──────────────────────────────────────────┘
\`\`\`

## Design Tokens
- **Primary:** #6366f1 (Indigo)
- **Background:** #09090b (Dark) / #f8fafc (Light)
- **Cards:** glass-card with backdrop-blur(10px)
- **Border radius:** 16px cards, 12px buttons
- **Typography:** Outfit 300-800
- **Shadows:** 0 0 40px -10px rgba(99,102,241,0.3)

## Состояния компонентов
| Состояние | Визуал |
|-----------|--------|
| Default | Стандартные цвета |
| Hover | translateY(-1px), border glow |
| Active | Scale(0.98), darker bg |
| Disabled | Opacity 0.5, no pointer |
| Loading | Skeleton animation |

## Адаптивность
- Desktop: >= 1024px — полный layout
- Tablet: 768-1023px — collapsed sidebar
- Mobile: < 768px — bottom nav, stacked cards

---
*Подготовлено: ${agentName}, Designer*`,
    },
    qa: {
      title: `Тест-план: ${task.title}`,
      type: 'spec',
      content: `# ${task.title} — Test Plan

## Обзор
**Проект:** ${pName}
**Область тестирования:** ${task.description || task.title}

## Test Cases

### TC-001: Позитивный сценарий
**Предусловия:** Пользователь авторизован
**Шаги:**
1. Открыть страницу
2. Заполнить обязательные поля
3. Нажать "Сохранить"
**Ожидаемый результат:** Данные сохранены, отображается уведомление об успехе

### TC-002: Валидация полей
**Предусловия:** Пользователь на странице формы
**Шаги:**
1. Оставить обязательные поля пустыми
2. Нажать "Сохранить"
**Ожидаемый результат:** Отображаются сообщения об ошибках валидации

### TC-003: Обработка ошибок сервера
**Предусловия:** API недоступен
**Шаги:**
1. Заполнить форму корректными данными
2. Нажать "Сохранить"
**Ожидаемый результат:** Отображается пользователю понятное сообщение об ошибке

### TC-004: Производительность
**Шаги:**
1. Загрузить страницу
2. Измерить время отклика
**Ожидаемый результат:** Страница загружается < 2с, действия < 200ms

### TC-005: Мобильная совместимость
**Шаги:**
1. Открыть на мобильном устройстве (375px)
2. Проверить все элементы
**Ожидаемый результат:** Все элементы видимы и функциональны

## Автоматизация
\`\`\`javascript
describe('${task.title}', () => {
  it('should complete the main flow', async () => {
    // Navigate to page
    // Fill form
    // Submit
    // Assert success
  })

  it('should validate required fields', async () => {
    // Submit empty form
    // Assert error messages
  })
})
\`\`\`

---
*Подготовлено: ${agentName}, QA*`,
    },
    ops: {
      title: `Инфраструктура: ${task.title}`,
      type: 'code',
      content: `# ${task.title} — Infrastructure Specification

## Dockerfile
\`\`\`dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/server.js"]
\`\`\`

## CI/CD Pipeline
\`\`\`yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test
      - run: npm run build
      - name: Deploy
        run: |
          # Deploy to production
          echo "Deploying to production..."
\`\`\`

## Мониторинг
- Health check: GET /health (30s interval)
- Metrics: Prometheus + Grafana
- Alerts: CPU > 80%, Memory > 85%, Error rate > 1%
- Logs: structured JSON → ELK stack

---
*Подготовлено: ${agentName}, DevOps*`,
    },
    mrk: {
      title: `Маркетинг: ${task.title}`,
      type: 'document',
      content: `# ${task.title} — Marketing Plan

## Целевая аудитория
${audience}

## Каналы привлечения
| Канал | Бюджет | Ожидаемый CAC | Приоритет |
|-------|--------|---------------|-----------|
| Content Marketing | $500/мес | $15 | Высокий |
| SEO | $300/мес | $10 | Высокий |
| Social Media | $400/мес | $20 | Средний |
| Paid Ads | $1000/мес | $25 | Средний |
| Partnerships | $0 | $5 | Высокий |

## Контент-план (месяц 1)
1. **Неделя 1:** Анонс продукта, landing page, press release
2. **Неделя 2:** Technical blog post, tutorial video
3. **Неделя 3:** Case study, social proof, testimonials
4. **Неделя 4:** Webinar, community engagement, metrics review

## SEO стратегия
- Target keywords: ${pName}, ${project?.industry || 'AI'}, ${features}
- Content pillars: tutorials, comparisons, use cases
- Link building: guest posts, partnerships

## Метрики
- Traffic: 1K → 10K/month (6 мес)
- Conversion: 2% → 5%
- CAC: < $20
- LTV/CAC: > 3x

---
*Подготовлено: ${agentName}, Marketing*`,
    },
    wr: {
      title: `Документация: ${task.title}`,
      type: 'document',
      content: `# ${task.title}

## Введение
Данный документ описывает ${task.title.toLowerCase()} для проекта ${pName}.

## Обзор
${pName} — ${project?.description || 'инновационный продукт'} для ${audience}.

### Ключевые возможности
${(features || '').split(',').map(f => `- ${f.trim()}`).join('\n') || '- Core features\n- API integration\n- Dashboard'}

## Начало работы

### Установка
\`\`\`bash
npm install ${pName.toLowerCase().replace(/\s+/g, '-')}
\`\`\`

### Быстрый старт
\`\`\`javascript
import { init } from '${pName.toLowerCase().replace(/\s+/g, '-')}'

const client = init({
  apiKey: process.env.API_KEY,
})

const result = await client.process({
  input: 'your data',
})

console.log(result)
\`\`\`

## API Reference
See API documentation for detailed endpoint descriptions.

## FAQ
**Q: Как начать?**
A: Зарегистрируйтесь, получите API key, установите SDK.

**Q: Какие языки поддерживаются?**
A: JavaScript/TypeScript, Python, Go (скоро).

---
*Подготовлено: ${agentName}, Technical Writer*`,
    },
    ml: {
      title: `ML спецификация: ${task.title}`,
      type: 'spec',
      content: `# ${task.title} — ML Pipeline Specification

## Обзор
Machine Learning компонент для ${pName}.

## Архитектура модели
\`\`\`
Input → Preprocessing → Feature Extraction → Model → Post-processing → Output
\`\`\`

## Данные
| Датасет | Размер | Формат | Источник |
|---------|--------|--------|----------|
| Training | 10K+ samples | JSON | Internal API |
| Validation | 2K samples | JSON | Holdout |
| Test | 1K samples | JSON | Holdout |

## Модель
- **Тип:** Transformer-based classifier
- **Framework:** PyTorch / HuggingFace
- **Метрики:** Accuracy > 90%, F1 > 0.85, Latency < 100ms

## Pipeline
\`\`\`python
from pipeline import DataLoader, Model, Evaluator

# Load and preprocess
loader = DataLoader(source='api', batch_size=32)
data = loader.load()

# Train
model = Model(architecture='transformer', hidden_dim=256)
model.train(data.train, epochs=10, lr=1e-4)

# Evaluate
evaluator = Evaluator(metrics=['accuracy', 'f1', 'latency'])
results = evaluator.run(model, data.test)
print(results)
\`\`\`

---
*Подготовлено: ${agentName}, ML Engineer*`,
    },
    mob: {
      title: `Mobile: ${task.title}`,
      type: 'code',
      content: `# ${task.title} — Mobile Implementation

## Screen Component
\`\`\`jsx
import { View, Text, StyleSheet, ScrollView } from 'react-native'

export function ResourceScreen({ route, navigation }) {
  const { id } = route.params
  const [data, setData] = useState(null)

  useEffect(() => {
    fetchResource(id).then(setData)
  }, [id])

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{data?.name}</Text>
      <Text style={styles.description}>{data?.description}</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>Назад</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#09090b' },
  title: { fontSize: 24, fontWeight: '700', color: '#fafafa', marginBottom: 8 },
  description: { fontSize: 16, color: '#a1a1aa', lineHeight: 24 },
  button: { backgroundColor: '#6366f1', padding: 12, borderRadius: 12, marginTop: 16 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
})
\`\`\`

---
*Подготовлено: ${agentName}, Mobile Developer*`,
    },
  }

  const template = TEMPLATES[role] || TEMPLATES.pm
  return template
}

// ── TaskExecutor class ──────────────────────────────────────────────
export class TaskExecutor {
  constructor(getState, dispatch) {
    this.getState = getState
    this.dispatch = dispatch
  }

  get state() {
    return this.getState()
  }

  // Execute a task: agent produces real output
  async executeTask(task, agent, onProgress) {
    console.log(`executeTask START: ${task.id} "${task.title}" assignee: ${task.assignee} column: ${task.column}`)
    const role = agent.role || agent.id
    const agentName = agent.personality?.name || agent.label
    const desk = DESKS.find(d => d.id === role)
    const { project, memoryFiles } = this.state

    if (onProgress) onProgress({ taskId: task.id, agentId: role, status: 'starting' })

    const startedAt = Date.now()
    const progressSteps = []

    const emitProgress = (phase, percent, stepText) => {
      if (stepText) {
        // Mark previous active steps as done
        progressSteps.forEach(s => { if (s.status === 'active') s.status = 'done' })
        progressSteps.push({ text: stepText, timestamp: new Date().toISOString(), status: 'active' })
      }
      this.dispatch({
        type: 'SET_AGENT_PROGRESS',
        payload: {
          agentId: role,
          taskId: task.id,
          taskTitle: task.title,
          phase,
          percent,
          steps: [...progressSteps],
          currentStep: progressSteps.length - 1,
          startedAt: new Date(startedAt).toISOString(),
          estimatedMinutes: task.estimatedMinutes || 10,
          priority: task.priority || 'P1',
        },
      })
    }

    // 1. Move task to "In Progress"
    console.log(`executeTask [${task.id}]: Moving to in_progress`)
    emitProgress('analyzing', 0, `Анализ задачи: "${task.title}"`)

    this.dispatch({
      type: 'UPDATE_TASK',
      payload: { id: task.id, column: 'in_progress' },
    })

    if (onProgress) onProgress({ taskId: task.id, agentId: role, status: 'in_progress' })

    // 2. PLAN phase — agent creates execution plan (PromptBuilder provides base system prompt via chatWithAgent)
    const planPrompt = `Задача: "${task.title}". ${task.description || ''}

Создай план выполнения по SOP своей роли:
PLAN:
- Шаг 1: {описание} (~{минуты} мин)
- Шаг 2: {описание} (~{минуты} мин)
- Шаг 3: {описание} (~{минуты} мин)
TOTAL_ESTIMATE: {общее количество минут} мин
DEPENDENCIES: {что нужно от других агентов, или 'none'}
ARTIFACT_TYPE: {code|document|spec|design|analysis}

Основывай оценку на реальной сложности:
- Простой конфиг/документ: 2-5 мин
- API спецификация или компонент: 5-15 мин
- Полный модуль или архитектура: 15-30 мин
- Сложная многокомпонентная фича: 30-60 мин`

    let plan = null
    let estimatedMinutes = 10
    try {
      console.log(`executeTask [${task.id}]: Calling API for plan...`)
      const planContext = { recentMessages: [], project: project || {}, memoryFiles: memoryFiles || {} }
      const planText = await chatWithAgent(agent, planPrompt, planContext)
      console.log(`executeTask [${task.id}]: Plan received:`, planText?.substring(0, 100))

      // Parse plan
      const planSteps = []
      const stepMatches = planText.matchAll(/[-•]\s*(?:Шаг\s*\d+[:.]\s*)?(.+?)(?:\(~?(\d+)\s*мин\))?$/gm)
      for (const m of stepMatches) {
        planSteps.push({ step: m[1].trim(), minutes: parseInt(m[2]) || 5 })
      }
      const totalMatch = planText.match(/TOTAL_ESTIMATE:\s*(\d+)/i)
      const depsMatch = planText.match(/DEPENDENCIES:\s*(.+?)(?:\n|$)/i)
      const typeMatch = planText.match(/ARTIFACT_TYPE:\s*(\w+)/i)

      estimatedMinutes = totalMatch ? parseInt(totalMatch[1]) : planSteps.reduce((s, p) => s + p.minutes, 0) || 10
      plan = {
        steps: planSteps.length > 0 ? planSteps : [{ step: 'Выполнить задачу', minutes: estimatedMinutes }],
        totalMinutes: estimatedMinutes,
        dependencies: depsMatch && !/none|нет/i.test(depsMatch[1]) ? depsMatch[1].trim() : null,
        artifactType: typeMatch ? typeMatch[1].trim().toLowerCase() : null,
      }
    } catch (planErr) {
      console.error(`executeTask [${task.id}] ERROR at step: plan API call`, planErr.message)
      // Mock plan based on role
      const ROLE_ESTIMATES = { ceo: 8, cto: 15, back: 12, front: 10, mob: 12, ml: 20, ops: 8, des: 10, mrk: 8, wr: 6, pm: 8, qa: 10 }
      estimatedMinutes = ROLE_ESTIMATES[role] || 10
      plan = {
        steps: [
          { step: 'Анализ требований', minutes: Math.ceil(estimatedMinutes * 0.2) },
          { step: 'Разработка решения', minutes: Math.ceil(estimatedMinutes * 0.6) },
          { step: 'Финализация и проверка', minutes: Math.ceil(estimatedMinutes * 0.2) },
        ],
        totalMinutes: estimatedMinutes,
        dependencies: null,
        artifactType: null,
      }
    }

    // Save plan to task
    this.dispatch({
      type: 'UPDATE_TASK',
      payload: { id: task.id, plan, estimatedMinutes, startedAt: new Date(startedAt).toISOString() },
    })

    // Post plan to Meeting Room
    const planStepsText = plan.steps.map((s, i) => `${i + 1}. ${s.step} (~${s.minutes} мин)`).join('\n')
    this.dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        channel: 'meeting',
        message: {
          id: `plan-${Date.now()}-${role}`,
          from: role,
          name: agentName,
          text: `Взял задачу "${task.title}".\nПлан:\n${planStepsText}\nОценка: ${estimatedMinutes} мин.${plan.dependencies ? `\nЗависимости: ${plan.dependencies}` : ''}`,
          time: timestamp(),
          taskExecution: true,
        },
      },
    })

    if (onProgress) onProgress({ taskId: task.id, agentId: role, status: 'planned', plan, estimatedMinutes })

    // Emit plan steps to progress
    emitProgress('planning', 15, `План создан: ${plan.steps.length} шагов, ~${estimatedMinutes} мин`)
    for (let i = 0; i < plan.steps.length; i++) {
      const stepPercent = 20 + Math.round((60 / plan.steps.length) * i)
      emitProgress('executing', stepPercent, plan.steps[i].step)
      // Brief pause so UI can render each step
      await new Promise(r => setTimeout(r, 200))
    }

    // 3. Determine artifact type
    const roleMap = ROLE_ARTIFACT_MAP[role] || ROLE_ARTIFACT_MAP.pm
    const expectedType = plan.artifactType || roleMap.label

    // 4. Build execution prompt with full project context
    const projectMd = memoryFiles?.PROJECT || ''
    const archMd = memoryFiles?.ARCHITECTURE || ''
    const agentMemory = memoryFiles?.agents?.[role]?.memory || ''

    const executionPrompt = `Выполни задачу и создай ПОЛНЫЙ артефакт.

ЗАДАЧА:
Название: ${task.title}
Описание: ${task.description || 'Нет описания'}
Приоритет: ${task.priority || 'P1'}

КОНТЕКСТ ПРОЕКТА:
${projectMd ? projectMd.slice(0, 1500) : `Проект: ${project?.name || 'Проект'}, стадия: ${project?.stage || 'MVP'}, стек: ${project?.techStack || ''}, аудитория: ${project?.audience || ''}, бизнес-модель: ${project?.businessModel || ''}`}

${archMd ? `АРХИТЕКТУРА:\n${archMd.slice(0, 1000)}` : ''}

${agentMemory ? `ТВОЯ ПРЕДЫДУЩАЯ РАБОТА:\n${agentMemory.slice(-500)}` : ''}

ИНСТРУКЦИЯ:
Создай ПОЛНЫЙ, ДЕТАЛЬНЫЙ артефакт. НЕ резюме, НЕ план, НЕ статус-отчёт — а РЕАЛЬНЫЙ результат работы.
Минимум 200 слов содержательного контента.
Для кода — пиши реальный работающий код с комментариями.
Для документов — пиши полный документ со всеми разделами.
Для спецификаций — пиши детальную спецификацию с примерами.
Для дизайна — пиши детальное описание wireframe и design tokens.
Для анализа — пиши аналитику с данными и выводами.

Формат ответа СТРОГО:
ARTIFACT_TITLE: {описательное название артефакта}
ARTIFACT_TYPE: {code|document|spec|design|analysis}
CONTENT:
{ПОЛНЫЙ АРТЕФАКТ — это главный результат твоей работы}`

    // 5. Call API or generate mock
    console.log(`executeTask [${task.id}]: Calling API for artifact...`)
    emitProgress('executing', 70, 'Генерация артефакта...')
    let artifact
    try {
      const context = { recentMessages: [], project: project || {}, memoryFiles: memoryFiles || {} }
      const responseText = await chatWithAgent(agent, executionPrompt, context)
      console.log(`executeTask [${task.id}]: Artifact response received, length: ${responseText?.length}`)
      artifact = parseArtifact(responseText)
      console.log(`executeTask [${task.id}]: Artifact parsed: title="${artifact.title}" type=${artifact.type} content.length=${artifact.content?.length}`)
    } catch (artErr) {
      console.error(`executeTask [${task.id}] ERROR at step: artifact API call`, artErr.message)
      // Fallback: generate template artifact
      artifact = generateMockArtifact(task, agent, project || {})
      console.log(`executeTask [${task.id}]: Using mock artifact: "${artifact.title}"`)
    }

    // Ensure artifact has valid type
    if (!['code', 'document', 'spec', 'design', 'analysis'].includes(artifact.type)) {
      artifact.type = expectedType
    }

    // Record actual execution time
    const finishedAt = Date.now()
    const actualMinutes = Math.round((finishedAt - startedAt) / 60000) || 1

    emitProgress('validating', 80, `Артефакт создан: "${artifact.title}" (${artifact.type})`)

    if (onProgress) onProgress({ taskId: task.id, agentId: role, status: 'artifact_created', artifact })

    // 6. Save artifact to state
    const artifactRecord = {
      id: `ART-${Date.now()}-${role}`,
      taskId: task.id,
      agentId: role,
      agentName,
      title: artifact.title,
      type: artifact.type,
      content: artifact.content,
      createdAt: new Date().toISOString(),
      status: 'pending_review',
      actualMinutes,
      estimatedMinutes,
    }

    // Update task with timing info
    this.dispatch({
      type: 'UPDATE_TASK',
      payload: { id: task.id, actualMinutes, finishedAt: new Date(finishedAt).toISOString() },
    })

    this.dispatch({ type: 'ADD_ARTIFACT', payload: artifactRecord })

    console.log(`executeTask [${task.id}]: Saving to Wiki...`)
    emitProgress('saving', 90, 'Сохранение артефакта в Wiki и память...')

    // 6. Add as Wiki page
    const currentPages = this.state.wikiPages || []
    this.dispatch({
      type: 'SET_WIKI_PAGES',
      payload: [
        ...currentPages,
        {
          title: `[${artifact.type.toUpperCase()}] ${artifact.title}`,
          iconName: artifact.type === 'code' ? 'Code' : artifact.type === 'design' ? 'Palette' : 'FileText',
          text: artifact.content,
          artifactId: artifactRecord.id,
          agentId: role,
          taskId: task.id,
          createdAt: artifactRecord.createdAt,
        },
      ],
    })

    // 7. Update agent memory
    const currentAgents = this.state.memoryFiles?.agents || {}
    const currentAgentMem = currentAgents[role] || {}
    this.dispatch({
      type: 'UPDATE_MEMORY_FILE',
      payload: {
        key: 'agents',
        value: {
          ...currentAgents,
          [role]: {
            ...currentAgentMem,
            memory: `${currentAgentMem.memory || ''}\n[${new Date().toLocaleString('ru-RU')}] Завершено: "${task.title}". Создан артефакт: "${artifact.title}" (${artifact.type})`.trim(),
          },
        },
      },
    })

    // 8. Update PROGRESS.md
    const currentProgress = this.state.memoryFiles?.PROGRESS || ''
    this.dispatch({
      type: 'UPDATE_MEMORY_FILE',
      payload: {
        key: 'PROGRESS',
        value: `## Задача выполнена — ${new Date().toLocaleString('ru-RU')}
Агент: ${agentName} (${desk?.label || role})
Задача: ${task.title} (${task.id})
Артефакт: ${artifact.title} (${artifact.type})
\n${currentProgress}`,
      },
    })

    // 9. GitHub auto-commit (if connected)
    let commitUrl = null
    const github = this.state.github
    if (github?.connected && github.token && github.owner && github.repo) {
      try {
        const ghService = new GitHubService(github.token, github.owner, github.repo)
        const filePath = getArtifactFilePath(artifactRecord, role)
        const commitMsg = `${artifact.type === 'code' ? 'feat' : 'docs'}: ${task.title}`
        const result = await ghService.commitFile(filePath, artifact.content, commitMsg)
        commitUrl = result.commitUrl
        artifactRecord.commitUrl = commitUrl
        artifactRecord.filePath = filePath
        this.dispatch({ type: 'UPDATE_ARTIFACT', payload: { id: artifactRecord.id, commitUrl, filePath } })

        this.dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            channel: 'meeting',
            message: {
              id: `gh-${Date.now()}-${role}`,
              from: role,
              name: agentName,
              text: `GitHub: ${filePath} — ${commitMsg}`,
              time: timestamp(),
              taskExecution: true,
            },
          },
        })
      } catch (err) {
        console.warn('GitHub commit failed:', err.message)
      }
    }

    // 10. Claude Code prompt for complex tasks
    let claudeCodePrompt = null
    const complex = isComplexTask(task)
    if (complex) {
      const promptData = generateClaudeCodePrompt(task, artifactRecord, {
        project: project || {},
        memoryFiles: memoryFiles || {},
        team: this.state.team || [],
      })
      claudeCodePrompt = promptData
      artifactRecord.claudeCodePrompt = promptData.prompt
      artifactRecord.estimatedComplexity = promptData.estimatedComplexity
      this.dispatch({
        type: 'UPDATE_ARTIFACT',
        payload: {
          id: artifactRecord.id,
          claudeCodePrompt: promptData.prompt,
          estimatedComplexity: promptData.estimatedComplexity,
          needsClaudeCode: true,
        },
      })
    }

    // 11. Move task to "Review"
    console.log(`executeTask [${task.id}]: Moving to review`)
    const reviewerRole = getReviewerRole(task, role)
    this.dispatch({
      type: 'UPDATE_TASK',
      payload: {
        id: task.id,
        column: 'review',
        artifactId: artifactRecord.id,
        reviewerRole,
        commitUrl,
        needsClaudeCode: complex,
        claudeCodePrompt: claudeCodePrompt?.prompt || null,
      },
    })

    // 12. Post to Meeting Room
    const meetingParts = [
      `**Задача выполнена:** ${task.title}`,
      `Артефакт: "${artifact.title}" (${artifact.type})`,
      `Время: ${actualMinutes} мин (оценка: ${estimatedMinutes} мин)`,
      `Ревью: ${DESKS.find(d => d.id === reviewerRole)?.label || reviewerRole}`,
    ]
    if (commitUrl) meetingParts.push(`GitHub: ${commitUrl}`)
    if (complex) meetingParts.push(`Требуется Claude Code`)

    this.dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        channel: 'meeting',
        message: {
          id: `exec-${Date.now()}-${role}`,
          from: role,
          name: agentName,
          text: meetingParts.join('\n'),
          time: timestamp(),
          taskExecution: true,
        },
      },
    })

    // Mark all steps done and set complete
    emitProgress('complete', 100, `Отправлено на ревью → ${DESKS.find(d => d.id === reviewerRole)?.label || reviewerRole}`)
    // Clear progress after short delay so UI shows the 100% state briefly
    setTimeout(() => {
      this.dispatch({
        type: 'SET_AGENT_PROGRESS',
        payload: { agentId: role, taskId: null, taskTitle: null, phase: 'idle', percent: 0, steps: [], currentStep: -1, startedAt: null },
      })
    }, 3000)

    if (onProgress) onProgress({ taskId: task.id, agentId: role, status: 'review', reviewerRole })

    console.log(`executeTask COMPLETE: ${task.id} "${task.title}" → review (reviewer: ${reviewerRole})`)
    return { task, artifact: artifactRecord, reviewerRole, commitUrl, claudeCodePrompt }

  }

  // Request user to connect an integration if not connected
  _requestIntegration(integrationName, reason) {
    const tasks = this.state.tasks || []
    // Check if we already have a pending integration request
    const existing = tasks.find(t =>
      t.assignee === 'user' && t.column !== 'done' &&
      t.title.includes(integrationName)
    )
    if (existing) return

    const taskId = `T-${String(tasks.length + 1).padStart(3, '0')}`
    this.dispatch({
      type: 'ADD_TASK',
      payload: {
        id: taskId,
        title: `Подключить интеграцию: ${integrationName}`,
        description: `${reason}\nПерейдите в боковую панель → кнопка настроек → подключите ${integrationName}.`,
        assignee: 'user',
        priority: 'P0',
        column: 'todo',
        tags: ['integration', 'user-action'],
        dueDate: null,
        createdAt: new Date().toISOString().slice(0, 10),
        isUserTask: true,
      },
    })

    this.dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        channel: 'meeting',
        message: {
          id: `int-req-${Date.now()}`,
          from: 'system',
          name: 'Система',
          text: `Требуется ваше действие: подключить ${integrationName}.\n${reason}`,
          time: timestamp(),
        },
      },
    })
  }

  // Review a task: another agent reviews the artifact
  async reviewTask(task, reviewer, artifact, onProgress) {
    const reviewerRole = reviewer.role || reviewer.id
    const reviewerName = reviewer.personality?.name || reviewer.label
    const desk = DESKS.find(d => d.id === reviewerRole)
    const { project, memoryFiles } = this.state

    if (onProgress) onProgress({ taskId: task.id, reviewerId: reviewerRole, status: 'reviewing' })

    const reviewPrompt = `Ты ${reviewerName} (${desk?.label || reviewerRole}). Проведи ревью артефакта.

ЗАДАЧА: ${task.title}
ОПИСАНИЕ: ${task.description || 'Нет описания'}
АВТОР: ${artifact.agentName} (${DESKS.find(d => d.id === artifact.agentId)?.label || artifact.agentId})

АРТЕФАКТ:
Название: ${artifact.title}
Тип: ${artifact.type}
Содержимое:
${(artifact.content || '').slice(0, 2000)}

ПРОЕКТ: ${project?.name || 'Проект'} (${project?.stage || 'MVP'})
Стек: ${project?.techStack || ''}

ИНСТРУКЦИЯ:
Оцени артефакт по критериям: полнота, качество, соответствие целям проекта.
Ответь СТРОГО в формате:

VERDICT: APPROVED или CHANGES_NEEDED
FEEDBACK: {детальный отзыв на русском, 3-5 предложений}
SCORE: {число от 1 до 10}`

    let verdict = 'APPROVED'
    let feedback = ''
    let score = 8

    try {
      const context = { recentMessages: [], project: project || {}, memoryFiles: memoryFiles || {} }
      const responseText = await chatWithAgent(reviewer, reviewPrompt, context)

      const verdictMatch = responseText.match(/VERDICT:\s*(APPROVED|CHANGES_NEEDED)/i)
      const feedbackMatch = responseText.match(/FEEDBACK:\s*(.+?)(?:\nSCORE:|$)/is)
      const scoreMatch = responseText.match(/SCORE:\s*(\d+)/i)

      if (verdictMatch) verdict = verdictMatch[1].toUpperCase()
      if (feedbackMatch) feedback = feedbackMatch[1].trim()
      if (scoreMatch) score = Math.min(10, Math.max(1, parseInt(scoreMatch[1])))
    } catch {
      // Mock review: 80% approval rate
      const approved = Math.random() > 0.2
      verdict = approved ? 'APPROVED' : 'CHANGES_NEEDED'
      feedback = approved
        ? `Артефакт "${artifact.title}" соответствует требованиям. Качественная реализация, рекомендую принять.`
        : `Артефакт "${artifact.title}" требует доработки. Необходимо добавить больше деталей и учесть edge cases.`
      score = approved ? Math.floor(7 + Math.random() * 3) : Math.floor(4 + Math.random() * 3)
    }

    if (verdict === 'APPROVED') {
      // Move to Done
      this.dispatch({
        type: 'UPDATE_TASK',
        payload: { id: task.id, column: 'done', reviewFeedback: feedback, reviewScore: score },
      })

      // Update artifact status
      this.dispatch({
        type: 'UPDATE_ARTIFACT',
        payload: { id: artifact.id, status: 'approved', reviewFeedback: feedback, reviewScore: score },
      })

      // Post approval to Meeting Room
      this.dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          channel: 'meeting',
          message: {
            id: `review-${Date.now()}-${reviewerRole}`,
            from: reviewerRole,
            name: reviewerName,
            text: `✅ **Ревью пройдено** (${score}/10): "${task.title}"\n${feedback}`,
            time: timestamp(),
            taskExecution: true,
          },
        },
      })

      // Update reviewer memory
      const currentAgents = this.state.memoryFiles?.agents || {}
      const reviewerMem = currentAgents[reviewerRole] || {}
      this.dispatch({
        type: 'UPDATE_MEMORY_FILE',
        payload: {
          key: 'agents',
          value: {
            ...currentAgents,
            [reviewerRole]: {
              ...reviewerMem,
              memory: `${reviewerMem.memory || ''}\n[${new Date().toLocaleString('ru-RU')}] Ревью: "${task.title}" — APPROVED (${score}/10)`.trim(),
            },
          },
        },
      })

      if (onProgress) onProgress({ taskId: task.id, reviewerId: reviewerRole, status: 'approved', score })

      return { verdict: 'APPROVED', feedback, score, taskId: task.id }
    } else {
      // Changes needed — move back to In Progress
      this.dispatch({
        type: 'UPDATE_TASK',
        payload: {
          id: task.id,
          column: 'in_progress',
          reviewFeedback: feedback,
          reviewScore: score,
          returnCount: (task.returnCount || 0) + 1,
        },
      })

      this.dispatch({
        type: 'UPDATE_ARTIFACT',
        payload: { id: artifact.id, status: 'needs_changes', reviewFeedback: feedback, reviewScore: score },
      })

      // Post feedback to Meeting Room
      this.dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          channel: 'meeting',
          message: {
            id: `review-${Date.now()}-${reviewerRole}`,
            from: reviewerRole,
            name: reviewerName,
            text: `🔄 **Требуются доработки** (${score}/10): "${task.title}"\n${feedback}`,
            time: timestamp(),
            taskExecution: true,
          },
        },
      })

      if (onProgress) onProgress({ taskId: task.id, reviewerId: reviewerRole, status: 'changes_needed', feedback })

      return { verdict: 'CHANGES_NEEDED', feedback, score, taskId: task.id }
    }
  }

  // Build set of all IDs that match this agent role (handles legacy/new ID mismatch)
  _buildRoleIds(agentRole) {
    const ids = new Set([agentRole])
    // Add resolved new ID (e.g., 'back' → 'backend')
    const resolved = resolveRoleId(agentRole)
    if (resolved !== agentRole) ids.add(resolved)
    // Add reverse: if agentRole is a new ID, find old alias
    const REVERSE_MAP = { backend: 'back', frontend: 'front', mobile: 'mob', ml_eng: 'ml', devops: 'ops', designer: 'des', marketer: 'mrk', writer: 'wr' }
    if (REVERSE_MAP[agentRole]) ids.add(REVERSE_MAP[agentRole])
    // Also add the agent label from DESKS (e.g., 'Backend Developer')
    const desk = DESKS.find(d => d.id === agentRole || d.id === resolved)
    if (desk?.label) {
      ids.add(desk.label.toLowerCase())
      // Add snake_case version of label: "Backend Developer" → "backend_developer"
      ids.add(desk.label.toLowerCase().replace(/[\/\s]+/g, '_'))
      // Also clean version: "UI/UX Designer" → "ui_ux_designer"
      ids.add(desk.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''))
    }
    // Also check team for personality name
    const team = this.state.team || []
    const agent = team.find(t => (t.role || t.id) === agentRole)
    if (agent?.personality?.name) ids.add(agent.personality.name.toLowerCase())
    if (agent?.label) {
      ids.add(agent.label.toLowerCase())
      ids.add(agent.label.toLowerCase().replace(/[\/\s]+/g, '_'))
      ids.add(agent.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''))
    }
    return ids
  }

  // Check if a task is assigned to the given agent (handles all ID formats)
  _isTaskForAgent(task, roleIds) {
    if (!task.assignee) return false
    const assignee = task.assignee.toLowerCase().trim()
    // Direct match against all role ID variants
    for (const id of roleIds) {
      if (assignee === id) return true
    }
    // Fallback: normalize the assignee to a canonical role ID and check
    const normalized = normalizeAssignee(assignee)
    if (normalized !== assignee) {
      for (const id of roleIds) {
        if (normalized === id) return true
      }
    }
    return false
  }

  // Find the next task for an agent to work on
  // Priority: in_progress first (continue work), then todo by priority
  pickNextTask(agentRole) {
    const tasks = this.state.tasks || []
    const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 }

    const roleIds = this._buildRoleIds(agentRole)
    console.log(`pickNextTask for role: ${agentRole} | matching IDs: [${[...roleIds].join(', ')}]`)

    const allForAgent = tasks.filter(t => this._isTaskForAgent(t, roleIds))
    const todoCount = allForAgent.filter(t => t.column === 'todo' && !t.frozen).length
    const ipCount = allForAgent.filter(t => t.column === 'in_progress' && !t.frozen).length
    const reviewCount = allForAgent.filter(t => t.column === 'review').length
    const doneCount = allForAgent.filter(t => t.column === 'done').length
    const frozenCount = allForAgent.filter(t => t.frozen).length
    console.log(`pickNextTask for role: ${agentRole} | total: ${allForAgent.length} | todo: ${todoCount}, in_progress: ${ipCount}, review: ${reviewCount}, done: ${doneCount}, frozen: ${frozenCount}`)
    if (allForAgent.length === 0) {
      // Debug: log a sample of task assignees to diagnose mismatches
      const sample = tasks.slice(0, 5).map(t => `${t.id}:assignee="${t.assignee}"`)
      console.log(`pickNextTask DEBUG: no tasks matched. Sample assignees: [${sample.join(', ')}]`)
    }

    // First: continue in_progress tasks (already started, needs to finish)
    const inProgress = allForAgent
      .filter(t => t.column === 'in_progress' && !t.frozen)
      .sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9))
    if (inProgress.length > 0) {
      console.log(`pickNextTask for role: ${agentRole} found in_progress: ${inProgress[0].id} "${inProgress[0].title}"`)
      return inProgress[0]
    }

    // Second: pick from todo by priority
    const todo = allForAgent
      .filter(t => t.column === 'todo' && !t.frozen)
      .sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9))

    const picked = todo[0] || null
    console.log(`pickNextTask for role: ${agentRole} found: ${picked?.id || 'NONE'}${picked ? ` "${picked.title}"` : ''}`)
    return picked
  }

  // Find tasks ready for review
  findReviewableTasks() {
    const tasks = this.state.tasks || []
    const artifacts = this.state.artifacts || []
    return tasks
      .filter(t => t.column === 'review' && !t.frozen)
      .map(t => {
        const artifact = artifacts.find(a => a.id === t.artifactId)
        return { task: t, artifact }
      })
      .filter(item => item.artifact)
  }
}
