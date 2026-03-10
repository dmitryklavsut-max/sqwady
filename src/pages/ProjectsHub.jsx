import { useState } from 'react'
import { Plus, Trash2, FolderOpen, Users, Clock, CheckCircle, Zap, ArrowRight } from 'lucide-react'
import { listProjects, deleteProject, loadProject, saveCurrentProject } from '../context/AppContext'
import { DESKS } from '../data/constants'

const INDUSTRY_COLORS = {
  'SaaS': '#6366f1', 'FinTech': '#06b6d4', 'HealthTech': '#10b981',
  'EdTech': '#f59e0b', 'E-commerce': '#ec4899', 'GameDev': '#8b5cf6',
  'AI/ML': '#14b8a6', 'Marketplace': '#f97316',
}

const STAGE_LABELS = {
  'idea': 'Идея', 'mvp': 'MVP', 'growth': 'Рост', 'scale': 'Масштаб',
}

function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onCancel}>
      <div
        className="glass-card rounded-2xl p-6 w-[400px] max-w-[90vw]"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-[var(--t)] mb-2">{title}</h3>
        <p className="text-sm text-[var(--t2)] mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--t2)] bg-[var(--bg3)] border border-[var(--bd)] hover:bg-[var(--bg4)] transition-colors cursor-pointer"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors cursor-pointer"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProjectsHub({ onOpenProject, onNewProject, onOpenTeams }) {
  const [projects, setProjects] = useState(() => listProjects())
  const [deleteId, setDeleteId] = useState(null)

  const handleDelete = () => {
    deleteProject(deleteId)
    setProjects(listProjects())
    setDeleteId(null)
  }

  const handleOpen = (id) => {
    onOpenProject(id)
  }

  const deletingProject = deleteId ? projects.find(p => p.id === deleteId) : null

  // Empty state
  if (projects.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--t)] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] radial-glow opacity-40" />
          <div className="absolute inset-0 grid-bg opacity-[0.03]" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-10 animate-fade-up">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}
            >
              <Zap size={24} />
            </div>
            <span className="text-4xl font-bold tracking-tight logo-gradient">Sqwady</span>
          </div>

          <h1
            className="text-3xl md:text-4xl font-extrabold leading-tight tracking-tight mb-4 animate-fade-up"
            style={{ animationDelay: '0.1s' }}
          >
            <span className="text-gradient">Ваши проекты</span>
          </h1>

          <p
            className="text-lg text-[var(--t2)] mb-10 leading-relaxed font-light animate-fade-up"
            style={{ animationDelay: '0.2s' }}
          >
            Создайте первый проект — соберите AI-команду и запустите разработку
          </p>

          <button
            onClick={onNewProject}
            className="inline-flex items-center gap-3 text-white text-base font-semibold py-4 px-10 rounded-xl transition-all hover:-translate-y-0.5 transform animate-fade-up group cursor-pointer"
            style={{
              animationDelay: '0.3s',
              background: 'var(--ac)',
              boxShadow: '0 0 30px -5px rgba(99,102,241,0.4)',
            }}
          >
            <Plus size={20} />
            Новый проект
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    )
  }

  // Project grid
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--t)]">
      {deleteId && (
        <ConfirmModal
          title="Удалить проект?"
          message={`Проект «${deletingProject?.name}» будет удалён безвозвратно.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {/* Header */}
      <header className="border-b border-[var(--card-border)] bg-[var(--bg2)]">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}
            >
              <Zap size={18} />
            </div>
            <span className="text-xl font-bold logo-gradient">Sqwady</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenTeams}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-[var(--t2)] bg-[var(--bg3)] border border-[var(--bd)] hover:bg-[var(--bg4)] hover:text-[var(--t)] transition-colors cursor-pointer"
            >
              <Users size={16} />
              Команды и агенты
            </button>
            <button
              onClick={onNewProject}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-px cursor-pointer"
              style={{ background: 'var(--ac)', boxShadow: '0 0 20px -5px rgba(99,102,241,0.4)' }}
            >
              <Plus size={16} />
              Новый проект
            </button>
          </div>
        </div>
      </header>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold mb-6">Проекты</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => {
            const industryColor = INDUSTRY_COLORS[p.industry] || 'var(--ac)'
            const stageLabel = STAGE_LABELS[p.stage] || p.stage || '—'
            const progress = p.taskStats.total > 0
              ? Math.round((p.taskStats.done / p.taskStats.total) * 100)
              : 0
            const updatedDate = p.updatedAt
              ? new Date(p.updatedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
              : '—'

            return (
              <div
                key={p.id}
                className="glass-card rounded-2xl p-5 border border-[var(--card-border)] hover:border-[var(--bd2)] transition-all duration-200 hover:-translate-y-px cursor-pointer group relative"
                onClick={() => handleOpen(p.id)}
              >
                {/* Delete button */}
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteId(p.id) }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-[var(--t3)] hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  aria-label="Удалить проект"
                >
                  <Trash2 size={14} />
                </button>

                {/* Project name */}
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-sm"
                    style={{ background: `${industryColor}20`, color: industryColor }}
                  >
                    {(p.name || '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-[var(--t)] truncate pr-6">{p.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {p.industry && (
                        <span
                          className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                          style={{ background: `${industryColor}15`, color: industryColor }}
                        >
                          {p.industry}
                        </span>
                      )}
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--bg3)] text-[var(--t3)]">
                        {stageLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-[11px] text-[var(--t3)] mb-1">
                    <span>Прогресс</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--bg3)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${progress}%`, background: 'var(--ac)' }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-[11px] text-[var(--t3)]">
                  <div className="flex items-center gap-1">
                    <Users size={12} />
                    <span>{p.teamSize}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle size={12} />
                    <span>{p.taskStats.done}/{p.taskStats.total}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>{updatedDate}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
