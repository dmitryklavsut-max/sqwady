import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { generateWorkspaceContent } from '../services/ai'
import { generateSprints } from '../services/sprintPlanner'
import { Loader2, Check, Rocket } from 'lucide-react'

const STEPS = [
  'Создание файлов проекта...',
  'Настройка AI-агентов...',
  'Генерация задач...',
  'Подготовка roadmap...',
  'Планирование спринтов...',
  'Генерация pitch-деки...',
  'Наполнение базы знаний...',
  'Готово! Запускаем workspace...',
]

export default function GenerationScreen({ onDone }) {
  const { state, dispatch } = useApp()
  const [currentStep, setCurrentStep] = useState(0)
  const [apiDone, setApiDone] = useState(false)
  const [animDone, setAnimDone] = useState(false)
  const started = useRef(false)

  // Run API call once
  useEffect(() => {
    if (started.current) return
    started.current = true

    generateWorkspaceContent(state.project, state.team)
      .then((data) => {
        if (data.tasks) dispatch({ type: 'SET_TASKS', payload: data.tasks })
        if (data.roadmap) dispatch({ type: 'SET_ROADMAP', payload: data.roadmap })
        // Generate sprints from roadmap + tasks
        if (data.roadmap && data.tasks) {
          const { sprints, currentSprintId } = generateSprints(data.roadmap, data.tasks, state.team)
          dispatch({ type: 'SET_SPRINTS', payload: sprints })
          dispatch({ type: 'SET_CURRENT_SPRINT', payload: currentSprintId })
        }
        if (data.economics) dispatch({ type: 'SET_ECONOMICS', payload: data.economics })
        if (data.pitchSlides) dispatch({ type: 'SET_PITCH_SLIDES', payload: data.pitchSlides })
        if (data.wikiPages) dispatch({ type: 'SET_WIKI_PAGES', payload: data.wikiPages })
        if (data.chatMessages) dispatch({ type: 'SET_MESSAGES', payload: data.chatMessages })
        if (data.memoryFiles) {
          dispatch({
            type: 'SET_MEMORY_FILES',
            payload: {
              PROJECT: data.memoryFiles.PROJECT || '',
              ARCHITECTURE: data.memoryFiles.ARCHITECTURE || '',
              TEAM_CONTEXT: data.memoryFiles.TEAM_CONTEXT || '',
              DECISIONS: data.memoryFiles.DECISIONS || '',
              PROGRESS: data.memoryFiles.PROGRESS || '',
              agents: data.memoryFiles.agents || {},
            },
          })
        }
        setApiDone(true)
      })
      .catch(() => setApiDone(true))
  }, [state.project, state.team, dispatch])

  // Animate steps
  useEffect(() => {
    if (currentStep >= STEPS.length) {
      setAnimDone(true)
      return
    }
    const delay = currentStep === STEPS.length - 1 ? 600 : 800
    const timer = setTimeout(() => setCurrentStep((s) => s + 1), delay)
    return () => clearTimeout(timer)
  }, [currentStep])

  // Navigate when both done
  useEffect(() => {
    if (apiDone && animDone) {
      const timer = setTimeout(onDone, 500)
      return () => clearTimeout(timer)
    }
  }, [apiDone, animDone, onDone])

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center animate-fade-up">
        {/* Logo */}
        <div className="text-3xl font-extrabold logo-gradient mb-2">Sqwady</div>
        <h2 className="text-lg font-bold text-[var(--t)] mb-1">
          Создаём рабочую среду...
        </h2>
        <p className="text-sm text-[var(--t3)] mb-8">
          Это займёт несколько секунд
        </p>

        {/* Steps */}
        <div className="flex flex-col gap-3 text-left">
          {STEPS.map((label, i) => {
            const isLast = i === STEPS.length - 1
            const isDone = i < currentStep
            const isActive = i === currentStep

            if (i > currentStep) return null

            return (
              <div
                key={i}
                className="flex items-center gap-3 animate-fade-in"
              >
                {isDone ? (
                  isLast ? (
                    <div className="w-6 h-6 rounded-full bg-[var(--gn)]/20 flex items-center justify-center shrink-0">
                      <Rocket size={14} className="text-[var(--gn)]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[var(--gn)]/20 flex items-center justify-center shrink-0">
                      <Check size={14} className="text-[var(--gn)]" />
                    </div>
                  )
                ) : (
                  <div className="w-6 h-6 flex items-center justify-center shrink-0">
                    <Loader2 size={16} className="text-[var(--ac)] animate-spin" />
                  </div>
                )}
                <span
                  className={`text-sm font-medium ${
                    isDone
                      ? isLast
                        ? 'text-[var(--gn)]'
                        : 'text-[var(--t2)]'
                      : isActive
                        ? 'text-[var(--t)]'
                        : 'text-[var(--t3)]'
                  }`}
                >
                  {label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-8 w-full h-1 bg-[var(--bg2)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--ac)] rounded-full transition-all duration-700"
            style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
