// Vercel serverless proxy for Anthropic API — recommendations
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })
  }

  const { project, model } = req.body
  if (!project) {
    return res.status(400).json({ error: 'Missing project data' })
  }

  const prompt = `You are a startup advisor. Based on this project, provide recommendations in JSON format.

Project:
- Name: ${project.name || 'Unnamed'}
- Description: ${project.description || 'No description'}
- Industry: ${project.industry || 'General'}
- Stage: ${project.stage || 'Idea'}
- Target audience: ${project.audience || 'Not specified'}

Return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "businessModel": {
    "model": "recommended model name",
    "reason": "why this model fits"
  },
  "competitors": ["competitor1", "competitor2", "competitor3", "competitor4", "competitor5"],
  "techStack": {
    "frontend": "recommended frontend",
    "backend": "recommended backend",
    "infra": "recommended infrastructure",
    "db": "recommended databases"
  },
  "teamComposition": [
    {
      "role": "role_id from [ceo, cto, back, front, mob, ml, ops, des, mrk, wr, pm, qa]",
      "reason": "why this role is needed"
    }
  ],
  "agentDefaults": {
    "role_id": {
      "position": {
        "functions": ["function1", "function2", "function3"],
        "responsibilities": ["resp1", "resp2", "resp3"],
        "interactions": ["interaction1", "interaction2"],
        "metrics": ["metric1", "metric2"]
      },
      "personality": {
        "name": "Russian first name",
        "gender": "male or female",
        "age": 25-40,
        "experience": "Junior/Middle/Middle+/Senior/Lead",
        "skills": ["skill1", "skill2", "skill3"],
        "temperament": "one word",
        "communicationStyle": "one word",
        "background": "brief background in Russian",
        "approach": "one-two words"
      }
    }
  }
}

Recommend 4-6 roles. For each role in teamComposition, include a matching entry in agentDefaults.`

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
        max_tokens: 4096,
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

    // Parse JSON from response (handle possible markdown wrapping)
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
    console.error('Recommend proxy error:', err)
    return res.status(500).json({ error: err.message })
  }
}
