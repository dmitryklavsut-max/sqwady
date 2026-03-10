import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { generateRecommendations } from '../services/ai'
import Button from '../components/Button'
import { ChevronLeft, ChevronRight, Loader2, Lightbulb } from 'lucide-react'

const INDUSTRIES = ['SaaS', 'FinTech', 'HealthTech', 'EdTech', 'E-commerce', 'AI/ML', 'Marketplace', 'GameDev', 'Другое']
const STAGES = ['Идея', 'MVP', 'Бета', 'Запущен']
const BIZ_MODELS = ['Подписка', 'Freemium', 'Usage-based', 'Marketplace', 'Рекламная', 'Другое']
const PRODUCT_TYPES = ['Веб-приложение', 'Мобильное', 'API/SDK', 'Десктоп']
const TIMELINES = ['1 мес', '3 мес', '6 мес', '12 мес']
const BUDGETS = ['Bootstrapping', 'Pre-seed $100-500K', 'Seed $500K-2M', 'Не определено']

const inputClass = 'w-full px-4 py-3 bg-[var(--bg2)] border-2 border-[var(--bd)] rounded-xl text-[var(--t)] text-sm outline-none focus:border-[var(--ac)] transition-colors'
const selectClass = 'w-full px-4 py-3 bg-[var(--bg2)] border-2 border-[var(--bd)] rounded-xl text-[var(--t)] text-sm outline-none focus:border-[var(--ac)] transition-colors appearance-none cursor-pointer'
const labelClass = 'text-xs font-semibold text-[var(--t2)] uppercase tracking-wide'

function Hint() {
  return <span className="text-[var(--t3)] text-xs font-normal normal-case tracking-normal ml-1">необязательно</span>
}

function AiHint({ children, loading }) {
  if (loading) {
    return (
      <div className="flex items-center gap-1.5 mt-1 animate-fade-in">
        <Loader2 size={12} className="text-[var(--ac)] animate-spin" />
        <span className="text-xs text-[var(--ac)] italic">AI анализирует...</span>
      </div>
    )
  }
  if (!children) return null
  return (
    <div className="flex items-start gap-1.5 mt-1 animate-fade-in">
      <Lightbulb size={12} className="text-[var(--ac)] mt-0.5 shrink-0" />
      <span className="text-xs text-[var(--ac)] italic">{children}</span>
    </div>
  )
}

export default function ProjectSetup({ onNext }) {
  const { state, dispatch } = useApp()
  const [step, setStep] = useState(1)
  const [recsLoading, setRecsLoading] = useState(false)
  const prefilled = useRef(false)

  const recs = state.recommendations
  const saved = state.project || {}
  const [form, setForm] = useState({
    name: saved.name || '',
    description: saved.description || '',
    industry: saved.industry || '',
    stage: saved.stage || '',
    audience: saved.audience || '',
    businessModel: saved.businessModel || '',
    pricing: saved.pricing || '',
    market: saved.market || '',
    competitors: saved.competitors || '',
    advantage: saved.advantage || '',
    productType: saved.productType || [],
    techStack: saved.techStack || '',
    mvpFeatures: saved.mvpFeatures || '',
    timeline: saved.timeline || '',
    budget: saved.budget || '',
  })

  // Pre-fill empty fields when recommendations arrive
  useEffect(() => {
    if (!recs || prefilled.current) return
    prefilled.current = true
    setForm((f) => {
      const updates = {}
      if (!f.competitors && recs.competitors) {
        updates.competitors = Array.isArray(recs.competitors)
          ? recs.competitors.join(', ')
          : recs.competitors
      }
      if (!f.techStack && recs.techStack) {
        const ts = recs.techStack
        updates.techStack = typeof ts === 'string'
          ? ts
          : Object.values(ts).filter(Boolean).join(', ')
      }
      return Object.keys(updates).length ? { ...f, ...updates } : f
    })
  }, [recs])

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const toggleProductType = (type) => {
    setForm((f) => ({
      ...f,
      productType: f.productType.includes(type)
        ? f.productType.filter((t) => t !== type)
        : [...f.productType, type],
    }))
  }

  const save = () => {
    dispatch({ type: 'SET_PROJECT', payload: { ...form } })
  }

  const canNext = () => {
    if (step === 1) return form.name.trim() && form.description.trim()
    if (step === 2) return true
    if (step === 3) return form.mvpFeatures.trim()
    return false
  }

  const goNext = () => {
    save()
    if (step === 1) {
      // Trigger AI recommendations when leaving step 1
      if (!recs && !recsLoading) {
        setRecsLoading(true)
        prefilled.current = false
        generateRecommendations({
          name: form.name,
          description: form.description,
          industry: form.industry,
          stage: form.stage,
          audience: form.audience,
        }).then((result) => {
          dispatch({ type: 'SET_RECOMMENDATIONS', payload: result })
          setRecsLoading(false)
        }).catch(() => setRecsLoading(false))
      }
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    } else {
      onNext()
    }
  }

  const goBack = () => {
    save()
    setStep(step - 1)
  }

  const progress = (step / 3) * 100

  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <div className="animate-fade-up w-full max-w-[520px]">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--ac)] tracking-widest uppercase">
              Шаг {step} из 3
            </span>
            <span className="text-xs text-[var(--t3)]">
              {step === 1 ? 'Проект' : step === 2 ? 'Бизнес' : 'Технологии'}
            </span>
          </div>
          <div className="w-full h-1.5 bg-[var(--bg2)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--ac)] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <div className="text-[24px] font-extrabold text-[var(--t)]">
            {step === 1 && 'Опиши проект'}
            {step === 2 && 'Бизнес-модель'}
            {step === 3 && 'Технологии и MVP'}
          </div>
        </div>

        {/* Step 1 — Project */}
        {step === 1 && (
          <div className="flex flex-col gap-4 text-left">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Название проекта</label>
              <input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Например: Sqwady"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Описание</label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={3}
                placeholder="Кратко опиши идею и цели проекта"
                className={`${inputClass} resize-y`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Индустрия</label>
              <select value={form.industry} onChange={(e) => set('industry', e.target.value)} className={selectClass}>
                <option value="">Выбери индустрию</option>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Стадия</label>
              <select value={form.stage} onChange={(e) => set('stage', e.target.value)} className={selectClass}>
                <option value="">Выбери стадию</option>
                {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Целевая аудитория <Hint /></label>
              <input
                value={form.audience}
                onChange={(e) => set('audience', e.target.value)}
                placeholder="Для кого этот продукт?"
                className={inputClass}
              />
            </div>
          </div>
        )}

        {/* Step 2 — Business */}
        {step === 2 && (
          <div className="flex flex-col gap-4 text-left">
            {recsLoading && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--ac)]/10 border border-[var(--ac)]/20 animate-fade-in">
                <Loader2 size={14} className="text-[var(--ac)] animate-spin" />
                <span className="text-xs text-[var(--ac)] font-medium">AI анализирует проект...</span>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Бизнес-модель</label>
              <select value={form.businessModel} onChange={(e) => set('businessModel', e.target.value)} className={selectClass}>
                <option value="">Выбери модель</option>
                {BIZ_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <AiHint loading={recsLoading}>
                {recs?.businessModel && `Рекомендуем: ${recs.businessModel.model} — ${recs.businessModel.reason}`}
              </AiHint>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Ценообразование <Hint /></label>
              <input
                value={form.pricing}
                onChange={(e) => set('pricing', e.target.value)}
                placeholder="Например: $9/мес, $49/мес, $199/мес"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Рынок <Hint /></label>
              <input
                value={form.market}
                onChange={(e) => set('market', e.target.value)}
                placeholder="Размер рынка, тренды"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Конкуренты <Hint /></label>
              <textarea
                value={form.competitors}
                onChange={(e) => set('competitors', e.target.value)}
                rows={2}
                placeholder="Основные конкуренты и их слабые стороны"
                className={`${inputClass} resize-y`}
              />
              <AiHint loading={recsLoading}>
                {recs?.competitors && `Возможные конкуренты: ${Array.isArray(recs.competitors) ? recs.competitors.join(', ') : recs.competitors}`}
              </AiHint>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Конкурентное преимущество <Hint /></label>
              <textarea
                value={form.advantage}
                onChange={(e) => set('advantage', e.target.value)}
                rows={2}
                placeholder="Чем вы лучше конкурентов?"
                className={`${inputClass} resize-y`}
              />
            </div>
          </div>
        )}

        {/* Step 3 — Tech */}
        {step === 3 && (
          <div className="flex flex-col gap-4 text-left">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Тип продукта</label>
              <div className="flex flex-wrap gap-2">
                {PRODUCT_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleProductType(type)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer border ${
                      form.productType.includes(type)
                        ? 'bg-[var(--ac)] text-white border-[var(--ac)]'
                        : 'bg-[var(--bg2)] text-[var(--t2)] border-[var(--bd)] hover:border-[var(--ac)]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Технологический стек <Hint /></label>
              <input
                value={form.techStack}
                onChange={(e) => set('techStack', e.target.value)}
                placeholder="React, Node.js, PostgreSQL..."
                className={inputClass}
              />
              <AiHint loading={recsLoading}>
                {recs?.techStack && `Рекомендуемый стек: ${typeof recs.techStack === 'string' ? recs.techStack : Object.values(recs.techStack).filter(Boolean).join(', ')}`}
              </AiHint>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Ключевые фичи MVP</label>
              <textarea
                value={form.mvpFeatures}
                onChange={(e) => set('mvpFeatures', e.target.value)}
                rows={3}
                placeholder="Перечисли основные функции для первой версии"
                className={`${inputClass} resize-y`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Таймлайн <Hint /></label>
              <select value={form.timeline} onChange={(e) => set('timeline', e.target.value)} className={selectClass}>
                <option value="">Выбери срок</option>
                {TIMELINES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <AiHint>
                {recs?.teamComposition && form.mvpFeatures && `При ${form.mvpFeatures.split('\n').filter(Boolean).length || 1} фичах и команде из ${recs.teamComposition.length} человек — рекомендуем ${form.stage === 'Идея' ? '3-6 мес' : '1-3 мес'}`}
              </AiHint>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Бюджет <Hint /></label>
              <select value={form.budget} onChange={(e) => set('budget', e.target.value)} className={selectClass}>
                <option value="">Выбери бюджет</option>
                {BUDGETS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8">
          {step > 1 ? (
            <Button variant="ghost" onClick={goBack}>
              <ChevronLeft size={16} /> Назад
            </Button>
          ) : (
            <div />
          )}
          <Button onClick={goNext} disabled={!canNext()}>
            {step < 3 ? 'Далее' : 'Собрать команду'} <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}
