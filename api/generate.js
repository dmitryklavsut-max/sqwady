// Vercel serverless proxy for Anthropic API — workspace content generation
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })
  }

  const { project, team, model } = req.body
  if (!project || !team) {
    return res.status(400).json({ error: 'Missing project or team data' })
  }

  const teamDesc = team.map(t => `${t.label} (${t.personality?.name || 'unnamed'})`).join(', ')
  const features = project.mvpFeatures || 'core features'

  const prompt = `You are Sqwady AI. Given a startup project and team, generate initial workspace content.

Project:
- Name: ${project.name || 'Startup'}
- Description: ${project.description || ''}
- Industry: ${project.industry || 'Tech'}
- Stage: ${project.stage || 'MVP'}
- Business model: ${project.businessModel || 'Subscription'}
- Pricing: ${project.pricing || 'TBD'}
- MVP features: ${features}
- Timeline: ${project.timeline || '3 мес'}
- Tech stack: ${project.techStack || 'React, Node.js'}

Team: ${teamDesc}

Return ONLY valid JSON (no markdown, no explanation) with this structure:
{
  "tasks": [
    { "id": "t1", "title": "task title in Russian", "description": "brief description", "assignee": "role_id", "priority": "P0|P1|P2|P3", "column": "backlog|todo|in_progress", "tags": ["tag1"], "dueDate": null, "createdAt": "2024-01-01" }
  ],
  "roadmap": [
    { "id": "r1", "phase": "Phase 1 — MVP", "color": "#6366f1", "start": 0, "duration": 3, "items": ["milestone1", "milestone2"] }
  ],
  "economics": {
    "months": ["1","2","3","4","5","6","7","8","9","10","11","12"],
    "revenue": [12 numbers],
    "costs": [12 numbers],
    "users": [12 numbers]
  },
  "pitchSlides": [
    { "title": "slide title", "iconName": "lucide-icon-name", "text": "slide content in Russian" }
  ],
  "wikiPages": [
    { "title": "page title", "iconName": "lucide-icon-name", "text": "page content" }
  ],
  "chatMessages": {
    "general": [{ "from": "role_id", "name": "person name", "text": "message in Russian", "time": "09:00" }],
    "eng": [],
    "prod": [],
    "stand": []
  },
  "memoryFiles": {
    "PROJECT": "markdown project passport",
    "ARCHITECTURE": "markdown architecture doc",
    "TEAM_CONTEXT": "markdown team description"
  }
}

Generate 12-15 tasks, 4 roadmap phases, 8 pitch slides (Проблема, Решение, Рынок, Продукт, Бизнес, Traction, Команда, Ask), 4 wiki pages, 2-3 messages per chat channel. All content must be specific to this project, not generic.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Anthropic API error:', err)
      return res.status(response.status).json({ error: 'Anthropic API error' })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || ''

    let json
    try {
      json = JSON.parse(text)
    } catch {
      const match = text.match(/\{[\s\S]*\}/)
      if (match) {
        json = JSON.parse(match[0])
      } else {
        throw new Error('Failed to parse AI response as JSON')
      }
    }

    return res.status(200).json(json)
  } catch (err) {
    console.error('Generate proxy error:', err)
    return res.status(500).json({ error: err.message })
  }
}
