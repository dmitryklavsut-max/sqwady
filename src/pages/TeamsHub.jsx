import { useState } from 'react'
import { ArrowLeft, Plus, Trash2, Users, Bot, Copy, X, Check } from 'lucide-react'
import { listTeamTemplates, deleteTeamTemplate, saveTeamTemplate, listAgentConfigs, deleteAgentConfig, saveAgentConfig } from '../context/AppContext'
import { DESKS, MODELS } from '../data/constants'
import RoleIcon from '../components/RoleIcon'

const inputClass = 'w-full px-3 py-2 rounded-lg text-sm text-[var(--t)] bg-[var(--bg)] border border-[var(--bd)] outline-none focus:border-[var(--ac)] transition-colors'
const labelClass = 'text-xs font-semibold text-[var(--t2)] uppercase tracking-wide'

function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onCancel}>
      <div className="glass-card rounded-2xl p-6 w-[400px] max-w-[90vw]" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-[var(--t)] mb-2">{title}</h3>
        <p className="text-sm text-[var(--t2)] mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--t2)] bg-[var(--bg3)] border border-[var(--bd)] hover:bg-[var(--bg4)] transition-colors cursor-pointer">Отмена</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors cursor-pointer">Удалить</button>
        </div>
      </div>
    </div>
  )
}

function TeamEditorModal({ onSave, onClose, existingTeam }) {
  const [name, setName] = useState(existingTeam?.name || '')
  const [description, setDescription] = useState(existingTeam?.description || '')
  const [roles, setRoles] = useState(existingTeam?.roles || [])

  const addRole = (deskId) => {
    const desk = DESKS.find(d => d.id === deskId)
    if (!desk || roles.some(r => r.role === deskId)) return
    setRoles([...roles, { id: deskId, role: deskId, label: desk.label, color: desk.color }])
  }

  const removeRole = (roleId) => {
    setRoles(roles.filter(r => r.role !== roleId))
  }

  const usedRoles = new Set(roles.map(r => r.role))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="glass-card rounded-2xl p-6 w-[520px] max-w-[90vw] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-[var(--t)]">
            {existingTeam ? 'Редактировать команду' : 'Новая команда'}
          </h3>
          <button onClick={onClose} className="text-[var(--t3)] hover:text-[var(--t)] cursor-pointer"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>Название</label>
            <input value={name} onChange={e => setName(e.target.value)} className={inputClass} placeholder="Например: AI-команда для SaaS" />
          </div>
          <div>
            <label className={labelClass}>Описание</label>
            <input value={description} onChange={e => setDescription(e.target.value)} className={inputClass} placeholder="Короткое описание назначения команды" />
          </div>

          {/* Selected roles */}
          <div>
            <label className={labelClass}>Роли в команде ({roles.length})</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {roles.map(r => {
                const desk = DESKS.find(d => d.id === r.role)
                return (
                  <div key={r.role} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg3)] border border-[var(--bd)]">
                    <RoleIcon name={desk?.iconName} size={14} color={desk?.color} />
                    <span className="text-xs font-medium text-[var(--t)]">{r.label}</span>
                    <button onClick={() => removeRole(r.role)} className="text-[var(--t3)] hover:text-red-400 cursor-pointer"><X size={12} /></button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Available roles */}
          <div>
            <label className={labelClass}>Добавить роль</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {DESKS.filter(d => !usedRoles.has(d.id)).map(desk => (
                <button
                  key={desk.id}
                  onClick={() => addRole(desk.id)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--bd)] bg-[var(--bg2)] hover:border-[var(--bd2)] transition-colors cursor-pointer text-left"
                >
                  <RoleIcon name={desk.iconName} size={14} color={desk.color} />
                  <span className="text-xs font-medium text-[var(--t2)]">{desk.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--t2)] bg-[var(--bg3)] border border-[var(--bd)] hover:bg-[var(--bg4)] transition-colors cursor-pointer">
            Отмена
          </button>
          <button
            onClick={() => { if (name.trim() && roles.length > 0) { onSave(roles, name.trim(), description.trim()); onClose() } }}
            disabled={!name.trim() || roles.length === 0}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--ac)' }}
          >
            <Check size={14} className="inline mr-1" />
            Сохранить
          </button>
        </div>
      </div>
    </div>
  )
}

function AgentEditorModal({ onSave, onClose }) {
  const [role, setRole] = useState('')
  const [name, setName] = useState('')
  const [skills, setSkills] = useState('')
  const [experience, setExperience] = useState('')
  const [model, setModel] = useState('claude-sonnet-4-6')

  const desk = DESKS.find(d => d.id === role)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="glass-card rounded-2xl p-6 w-[480px] max-w-[90vw] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-[var(--t)]">Новый агент</h3>
          <button onClick={onClose} className="text-[var(--t3)] hover:text-[var(--t)] cursor-pointer"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>Роль</label>
            <select value={role} onChange={e => setRole(e.target.value)} className={inputClass}>
              <option value="">Выберите роль...</option>
              {DESKS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Имя</label>
            <input value={name} onChange={e => setName(e.target.value)} className={inputClass} placeholder="Имя агента" />
          </div>
          <div>
            <label className={labelClass}>Навыки</label>
            <input value={skills} onChange={e => setSkills(e.target.value)} className={inputClass} placeholder="React, Node.js, TypeScript..." />
          </div>
          <div>
            <label className={labelClass}>Опыт</label>
            <input value={experience} onChange={e => setExperience(e.target.value)} className={inputClass} placeholder="Senior (6-10)" />
          </div>
          <div>
            <label className={labelClass}>Модель</label>
            <select value={model} onChange={e => setModel(e.target.value)} className={inputClass}>
              {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--t2)] bg-[var(--bg3)] border border-[var(--bd)] hover:bg-[var(--bg4)] transition-colors cursor-pointer">
            Отмена
          </button>
          <button
            onClick={() => {
              if (role && name.trim()) {
                onSave({
                  role, label: desk?.label, color: desk?.color,
                  personality: { name: name.trim(), skills, experience },
                  model,
                })
                onClose()
              }
            }}
            disabled={!role || !name.trim()}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--ac)' }}
          >
            <Check size={14} className="inline mr-1" />
            Сохранить
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TeamsHub({ onBack }) {
  const [tab, setTab] = useState('teams')
  const [teams, setTeams] = useState(() => listTeamTemplates())
  const [agents, setAgents] = useState(() => listAgentConfigs())
  const [showTeamEditor, setShowTeamEditor] = useState(false)
  const [showAgentEditor, setShowAgentEditor] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null) // { type, id, name }

  const handleDeleteConfirm = () => {
    if (deleteTarget.type === 'team') {
      deleteTeamTemplate(deleteTarget.id)
      setTeams(listTeamTemplates())
    } else {
      deleteAgentConfig(deleteTarget.id)
      setAgents(listAgentConfigs())
    }
    setDeleteTarget(null)
  }

  const handleSaveTeam = (roles, name, description) => {
    saveTeamTemplate(roles, name, description)
    setTeams(listTeamTemplates())
  }

  const handleSaveAgent = (agent) => {
    saveAgentConfig(agent)
    setAgents(listAgentConfigs())
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--t)]">
      {deleteTarget && (
        <ConfirmModal
          title={`Удалить ${deleteTarget.type === 'team' ? 'команду' : 'агента'}?`}
          message={`«${deleteTarget.name}» будет удалён безвозвратно.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {showTeamEditor && <TeamEditorModal onSave={handleSaveTeam} onClose={() => setShowTeamEditor(false)} />}
      {showAgentEditor && <AgentEditorModal onSave={handleSaveAgent} onClose={() => setShowAgentEditor(false)} />}

      {/* Header */}
      <header className="border-b border-[var(--card-border)] bg-[var(--bg2)]">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm text-[var(--t2)] hover:text-[var(--t)] transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} />
              Проекты
            </button>
            <h1 className="text-xl font-bold">Команды и агенты</h1>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-6 pt-6">
        <div className="flex gap-1 p-1 rounded-xl bg-[var(--bg2)] border border-[var(--card-border)] w-fit mb-6">
          {[
            { id: 'teams', label: 'Команды', icon: Users },
            { id: 'agents', label: 'Агенты', icon: Bot },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                tab === t.id
                  ? 'bg-[var(--ac)] text-white'
                  : 'text-[var(--t2)] hover:text-[var(--t)] hover:bg-[var(--bg3)]'
              }`}
            >
              <t.icon size={15} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Teams tab */}
        {tab === 'teams' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* New team card */}
            <button
              onClick={() => setShowTeamEditor(true)}
              className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed border-[var(--bd)] hover:border-[var(--ac)] text-[var(--t3)] hover:text-[var(--ac)] transition-all cursor-pointer min-h-[180px]"
            >
              <Plus size={28} />
              <span className="text-sm font-medium">Новая команда</span>
            </button>

            {teams.map(team => (
              <div key={team.id} className="glass-card rounded-2xl p-5 border border-[var(--card-border)] hover:border-[var(--bd2)] transition-all group relative">
                <button
                  onClick={() => setDeleteTarget({ type: 'team', id: team.id, name: team.name })}
                  className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-[var(--t3)] hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>

                <h3 className="text-base font-semibold text-[var(--t)] mb-1 pr-8">{team.name}</h3>
                {team.description && <p className="text-xs text-[var(--t3)] mb-3">{team.description}</p>}

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {team.roles.map(r => {
                    const desk = DESKS.find(d => d.id === r.role)
                    return (
                      <div key={r.role} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--bg3)]">
                        <RoleIcon name={desk?.iconName} size={12} color={desk?.color} />
                        <span className="text-[11px] text-[var(--t2)]">{r.label}</span>
                      </div>
                    )
                  })}
                </div>

                <div className="text-[11px] text-[var(--t3)]">
                  {new Date(team.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Agents tab */}
        {tab === 'agents' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* New agent card */}
            <button
              onClick={() => setShowAgentEditor(true)}
              className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed border-[var(--bd)] hover:border-[var(--ac)] text-[var(--t3)] hover:text-[var(--ac)] transition-all cursor-pointer min-h-[180px]"
            >
              <Plus size={28} />
              <span className="text-sm font-medium">Новый агент</span>
            </button>

            {agents.map(agent => {
              const desk = DESKS.find(d => d.id === agent.role)
              const modelLabel = MODELS.find(m => m.id === agent.model)?.label || agent.model
              return (
                <div key={agent.id} className="glass-card rounded-2xl p-5 border border-[var(--card-border)] hover:border-[var(--bd2)] transition-all group relative">
                  <button
                    onClick={() => setDeleteTarget({ type: 'agent', id: agent.id, name: agent.name })}
                    className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-[var(--t3)] hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>

                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${desk?.color || 'var(--ac)'}18` }}
                    >
                      <RoleIcon name={desk?.iconName} size={18} color={desk?.color} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[var(--t)] pr-8">{agent.name}</h3>
                      <span className="text-xs text-[var(--t3)]">{agent.label || desk?.label}</span>
                    </div>
                  </div>

                  {agent.personality?.skills && (
                    <p className="text-xs text-[var(--t2)] mb-2 line-clamp-2">{agent.personality.skills}</p>
                  )}

                  <div className="flex items-center gap-2 text-[11px] text-[var(--t3)]">
                    <span className="px-2 py-0.5 rounded-full bg-[var(--bg3)]">{modelLabel}</span>
                    {agent.personality?.experience && (
                      <span className="px-2 py-0.5 rounded-full bg-[var(--bg3)]">{agent.personality.experience}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
