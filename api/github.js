// Vercel serverless proxy for GitHub API
const GITHUB_API = 'https://api.github.com'

async function githubFetch(url, token, options = {}) {
  const res = await fetch(`${GITHUB_API}${url}`, {
    ...options,
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('GitHub API error:', res.status, text)
    throw new Error(`GitHub API ${res.status}: ${text}`)
  }

  return res.json()
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { action, token, owner, repo, ...params } = req.body

  if (!token) {
    return res.status(400).json({ error: 'Missing GitHub token' })
  }

  try {
    switch (action) {
      // ── Validate token ──────────────────────────────────────
      case 'validate': {
        const user = await githubFetch('/user', token)
        return res.status(200).json({ login: user.login, name: user.name, avatar: user.avatar_url })
      }

      // ── List repos ──────────────────────────────────────────
      case 'list_repos': {
        const repos = await githubFetch('/user/repos?sort=updated&per_page=30', token)
        return res.status(200).json(repos.map(r => ({
          name: r.name,
          full_name: r.full_name,
          owner: r.owner.login,
          private: r.private,
          description: r.description,
          default_branch: r.default_branch,
        })))
      }

      // ── Create repo ─────────────────────────────────────────
      case 'create_repo': {
        const { name, description, isPrivate } = params
        const newRepo = await githubFetch('/user/repos', token, {
          method: 'POST',
          body: JSON.stringify({ name, description, private: isPrivate, auto_init: true }),
        })
        return res.status(201).json({
          name: newRepo.name,
          full_name: newRepo.full_name,
          owner: newRepo.owner.login,
          html_url: newRepo.html_url,
        })
      }

      // ── File tree ───────────────────────────────────────────
      case 'file_tree': {
        if (!owner || !repo) return res.status(400).json({ error: 'Missing owner/repo' })
        const branch = params.branch || 'main'
        const tree = await githubFetch(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, token)
        return res.status(200).json(tree.tree.filter(t => t.type === 'blob').map(t => t.path))
      }

      // ── Read file ───────────────────────────────────────────
      case 'read_file': {
        if (!owner || !repo || !params.path) return res.status(400).json({ error: 'Missing params' })
        const file = await githubFetch(`/repos/${owner}/${repo}/contents/${params.path}?ref=${params.branch || 'main'}`, token)
        const content = Buffer.from(file.content, 'base64').toString('utf-8')
        return res.status(200).json({ content, sha: file.sha, path: file.path })
      }

      // ── Commit single file ──────────────────────────────────
      case 'commit_file': {
        if (!owner || !repo || !params.path || !params.content) {
          return res.status(400).json({ error: 'Missing path or content' })
        }

        const encoded = Buffer.from(params.content, 'utf-8').toString('base64')

        // Check if file exists (to get SHA for update)
        let sha
        try {
          const existing = await githubFetch(`/repos/${owner}/${repo}/contents/${params.path}`, token)
          sha = existing.sha
        } catch {
          // File doesn't exist — creating new
        }

        const body = {
          message: params.message || `Update ${params.path}`,
          content: encoded,
        }
        if (sha) body.sha = sha

        const result = await githubFetch(`/repos/${owner}/${repo}/contents/${params.path}`, token, {
          method: 'PUT',
          body: JSON.stringify(body),
        })

        return res.status(200).json({
          commitUrl: result.commit?.html_url,
          sha: result.content?.sha,
          path: params.path,
        })
      }

      // ── Commit multiple files (atomic) ──────────────────────
      case 'commit_multiple': {
        if (!owner || !repo || !params.files?.length) {
          return res.status(400).json({ error: 'Missing files' })
        }
        const branch = params.branch || 'main'

        // 1. Get current ref
        const ref = await githubFetch(`/repos/${owner}/${repo}/git/ref/heads/${branch}`, token)
        const currentSha = ref.object.sha

        // 2. Get current commit's tree
        const currentCommit = await githubFetch(`/repos/${owner}/${repo}/git/commits/${currentSha}`, token)
        const baseTreeSha = currentCommit.tree.sha

        // 3. Create blobs for each file
        const treeItems = []
        for (const file of params.files) {
          const blob = await githubFetch(`/repos/${owner}/${repo}/git/blobs`, token, {
            method: 'POST',
            body: JSON.stringify({ content: file.content, encoding: 'utf-8' }),
          })
          treeItems.push({
            path: file.path,
            mode: '100644',
            type: 'blob',
            sha: blob.sha,
          })
        }

        // 4. Create tree
        const tree = await githubFetch(`/repos/${owner}/${repo}/git/trees`, token, {
          method: 'POST',
          body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
        })

        // 5. Create commit
        const commit = await githubFetch(`/repos/${owner}/${repo}/git/commits`, token, {
          method: 'POST',
          body: JSON.stringify({
            message: params.message || 'Update files',
            tree: tree.sha,
            parents: [currentSha],
          }),
        })

        // 6. Update ref
        await githubFetch(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, token, {
          method: 'PATCH',
          body: JSON.stringify({ sha: commit.sha }),
        })

        return res.status(200).json({
          commitUrl: commit.html_url || `https://github.com/${owner}/${repo}/commit/${commit.sha}`,
          sha: commit.sha,
          filesCommitted: params.files.length,
        })
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` })
    }
  } catch (err) {
    console.error('GitHub proxy error:', err)
    return res.status(500).json({ error: err.message })
  }
}
