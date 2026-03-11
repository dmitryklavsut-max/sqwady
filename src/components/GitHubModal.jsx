import { useState, useEffect } from 'react'
import { X, Check, Github, Loader2, Plus, AlertCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { GitHubService } from '../services/github'
import Button from './Button'

const inputClass = 'w-full px-3 py-2.5 rounded-lg text-sm text-[var(--t)] bg-[var(--bg)] border border-[var(--bd)] outline-none focus:border-[var(--ac)] transition-colors'

export default function GitHubModal({ onClose }) {
  const { state, dispatch } = useApp()
  const gh = state.github || {}

  const [token, setToken] = useState(gh.token || '')
  const [owner, setOwner] = useState(gh.owner || '')
  const [repo, setRepo] = useState(gh.repo || '')
  const [repos, setRepos] = useState([])
  const [userName, setUserName] = useState('')
  const [status, setStatus] = useState(gh.connected ? 'connected' : 'idle') // idle | validating | validated | connected | error
  const [error, setError] = useState('')
  const [newRepoName, setNewRepoName] = useState('')
  const [showNewRepo, setShowNewRepo] = useState(false)

  // Validate token on paste/change
  const validateToken = async () => {
    if (!token.trim()) return
    setStatus('validating')
    setError('')

    try {
      const svc = new GitHubService(token.trim(), '', '')
      const user = await svc.validateToken()
      setUserName(user.login)
      setOwner(user.login)

      // Fetch repos
      const repoList = await svc.listRepos()
      setRepos(repoList)
      setStatus('validated')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  const handleConnect = () => {
    if (!token.trim() || !owner.trim() || !repo.trim()) return

    dispatch({
      type: 'SET_GITHUB',
      payload: { connected: true, token: token.trim(), owner: owner.trim(), repo: repo.trim() },
    })
    setStatus('connected')
  }

  const handleDisconnect = () => {
    dispatch({
      type: 'SET_GITHUB',
      payload: { connected: false, token: '', owner: '', repo: '' },
    })
    setToken('')
    setOwner('')
    setRepo('')
    setRepos([])
    setUserName('')
    setStatus('idle')
  }

  const handleCreateRepo = async () => {
    if (!newRepoName.trim()) return
    setStatus('validating')
    try {
      const svc = new GitHubService(token.trim(), '', '')
      const newRepo = await svc.createRepo(newRepoName.trim(), `Created by Sqwady for ${state.project?.name || 'project'}`, true)
      setRepo(newRepo.name)
      setOwner(newRepo.owner)
      setRepos(prev => [{ name: newRepo.name, full_name: newRepo.full_name, owner: newRepo.owner }, ...prev])
      setShowNewRepo(false)
      setNewRepoName('')
      setStatus('validated')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[999] animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="animate-pop rounded-2xl p-6 w-[460px] border border-[var(--card-border)] bg-[var(--bg2)]"
        style={{ boxShadow: 'var(--shadow-lg)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--bg3)]">
              <Github size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">GitHub</h2>
              <p className="text-[12px] text-[var(--t3)]">
                {status === 'connected' ? `${owner}/${repo}` : 'Подключите репозиторий'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--t3)] hover:text-[var(--t)] cursor-pointer bg-transparent border-none">
            <X size={18} />
          </button>
        </div>

        {/* Status indicator */}
        {status === 'connected' && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[13px] text-emerald-400 font-medium">
              Подключено: {owner}/{repo}
            </span>
            <button
              onClick={handleDisconnect}
              className="ml-auto text-[11px] text-emerald-400 hover:text-red-400 cursor-pointer bg-transparent border-none"
              style={{ fontFamily: 'inherit' }}
            >
              Отключить
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertCircle size={14} className="text-red-400 shrink-0" />
            <span className="text-[12px] text-red-400">{error}</span>
          </div>
        )}

        {/* Token input */}
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-[var(--t2)] uppercase tracking-wide">Personal Access Token</label>
            <div className="flex gap-2 mt-1">
              <input
                type="password"
                value={token}
                onChange={e => { setToken(e.target.value); setStatus('idle') }}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className={`${inputClass} flex-1`}
              />
              <Button
                onClick={validateToken}
                small
                disabled={!token.trim() || status === 'validating'}
              >
                {status === 'validating' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {status === 'validating' ? '' : 'Проверить'}
              </Button>
            </div>
            <p className="text-[11px] text-[var(--t3)] mt-1">
              Нужны права: repo (Full control). Settings → Developer settings → Tokens
            </p>
          </div>

          {/* Repo selection (after token validated) */}
          {(status === 'validated' || status === 'connected') && (
            <>
              <div>
                <label className="text-xs font-semibold text-[var(--t2)] uppercase tracking-wide">Владелец</label>
                <input
                  value={owner}
                  onChange={e => setOwner(e.target.value)}
                  className={`${inputClass} mt-1`}
                  readOnly={!!userName}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--t2)] uppercase tracking-wide">Репозиторий</label>
                <div className="flex gap-2 mt-1">
                  <select
                    value={repo}
                    onChange={e => setRepo(e.target.value)}
                    className={`${inputClass} flex-1 cursor-pointer`}
                  >
                    <option value="">Выберите репозиторий</option>
                    {repos.map(r => (
                      <option key={r.full_name} value={r.name}>{r.name} {r.private ? '(private)' : ''}</option>
                    ))}
                  </select>
                  <Button onClick={() => setShowNewRepo(!showNewRepo)} small variant="ghost">
                    <Plus size={14} />
                  </Button>
                </div>
              </div>

              {/* Create new repo */}
              {showNewRepo && (
                <div className="flex gap-2">
                  <input
                    value={newRepoName}
                    onChange={e => setNewRepoName(e.target.value)}
                    placeholder="Имя нового репозитория"
                    className={`${inputClass} flex-1`}
                    autoFocus
                  />
                  <Button onClick={handleCreateRepo} small disabled={!newRepoName.trim()}>
                    Создать
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end mt-6 gap-3">
          <Button onClick={onClose} variant="ghost" small>
            Закрыть
          </Button>
          {status === 'validated' && repo && (
            <Button onClick={handleConnect} small>
              <Github size={14} /> Подключить
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
