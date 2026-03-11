// ── GitHub API Service ────────────────────────────────────────────
const GITHUB_PROXY = '/api/github'

export class GitHubService {
  constructor(token, owner, repo) {
    this.token = token
    this.owner = owner
    this.repo = repo
  }

  get connected() {
    return !!(this.token && this.owner && this.repo)
  }

  // ── Core API call ─────────────────────────────────────────────
  async _call(action, params = {}) {
    const res = await fetch(GITHUB_PROXY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        token: this.token,
        owner: this.owner,
        repo: this.repo,
        ...params,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
      throw new Error(err.error || `GitHub API error: ${res.status}`)
    }

    return res.json()
  }

  // ── Validate token & get user info ────────────────────────────
  async validateToken() {
    return this._call('validate')
  }

  // ── List user repos ───────────────────────────────────────────
  async listRepos() {
    return this._call('list_repos')
  }

  // ── Create a new repository ───────────────────────────────────
  async createRepo(name, description, isPrivate = true) {
    return this._call('create_repo', { name, description, isPrivate })
  }

  // ── Get repo file tree ────────────────────────────────────────
  async getFileTree(branch = 'main') {
    return this._call('file_tree', { branch })
  }

  // ── Read a file from repo ─────────────────────────────────────
  async readFile(path, branch = 'main') {
    return this._call('read_file', { path, branch })
  }

  // ── Create or update a single file ────────────────────────────
  async commitFile(path, content, message) {
    return this._call('commit_file', { path, content, message })
  }

  // ── Commit multiple files atomically ──────────────────────────
  async commitMultipleFiles(files, message, branch = 'main') {
    return this._call('commit_multiple', { files, message, branch })
  }
}

// ── Determine file path for artifact ──────────────────────────────
export function getArtifactFilePath(artifact, agentRole) {
  const safeName = (artifact.title || 'artifact')
    .toLowerCase()
    .replace(/[^a-zA-Zа-яА-Я0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60)

  const type = artifact.type || 'document'

  if (type === 'code') {
    const PATH_MAP = {
      back: `src/backend/${safeName}.js`,
      front: `src/frontend/${safeName}.jsx`,
      mob: `src/mobile/${safeName}.jsx`,
      ml: `src/ml/${safeName}.py`,
      ops: safeName.includes('docker') ? 'Dockerfile' : safeName.includes('ci') ? `.github/workflows/${safeName}.yml` : `infra/${safeName}.yml`,
      qa: `tests/${safeName}.test.js`,
    }
    return PATH_MAP[agentRole] || `src/${safeName}.js`
  }

  if (type === 'design') {
    return `docs/design/${safeName}.md`
  }

  // document, spec, analysis
  return `docs/${safeName}.md`
}

// ── Check if task is complex (needs Claude Code) ────────────────
export function isComplexTask(task) {
  const tags = (task.tags || []).map(t => t.toLowerCase())
  const title = (task.title || '').toLowerCase()
  const desc = (task.description || '').toLowerCase()
  const combined = `${title} ${desc} ${tags.join(' ')}`

  const complexKeywords = [
    'refactor', 'migrate', 'redesign', 'full feature', 'multi-file',
    'integration', 'full module', 'overhaul', 'rewrite', 'architecture change',
    'рефакторинг', 'миграция', 'полная фича', 'модуль целиком', 'переписать',
  ]

  if (complexKeywords.some(k => combined.includes(k))) return true
  if (tags.includes('complex') || tags.includes('claude-code')) return true

  return false
}
