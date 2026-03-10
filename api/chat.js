// Vercel serverless proxy for Anthropic API — chat with agent
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })
  }

  const { systemPrompt, messages, model, temperature } = req.body
  if (!systemPrompt || !messages) {
    return res.status(400).json({ error: 'Missing systemPrompt or messages' })
  }

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
        max_tokens: 1024,
        temperature: temperature ?? 0.5,
        system: systemPrompt,
        messages,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Anthropic API error:', err)
      return res.status(response.status).json({ error: 'Anthropic API error' })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || ''

    return res.status(200).json({ reply: text })
  } catch (err) {
    console.error('Chat proxy error:', err)
    return res.status(500).json({ error: err.message })
  }
}
