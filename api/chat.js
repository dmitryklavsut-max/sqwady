// Vercel serverless proxy for Anthropic API — chat with agent
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('Chat proxy: ANTHROPIC_API_KEY is not set')
    return res.status(500).json({ error: 'API key not configured. Set ANTHROPIC_API_KEY in Vercel environment variables.' })
  }

  const { systemPrompt, messages, model, temperature } = req.body
  if (!systemPrompt || !messages) {
    return res.status(400).json({ error: 'Missing systemPrompt or messages' })
  }

  console.log(`Chat proxy: model=${model || 'claude-sonnet-4-20250514'}, systemPrompt=${systemPrompt.length} chars, messages=${messages.length}`)

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
        max_tokens: 2048,
        temperature: temperature ?? 0.5,
        system: systemPrompt,
        messages,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Anthropic API error:', response.status, err)
      return res.status(response.status).json({ error: `Anthropic API error: ${response.status}` })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || ''

    console.log(`Chat proxy success: ${text.substring(0, 80)}...`)

    return res.status(200).json({ reply: text })
  } catch (err) {
    console.error('Chat proxy error:', err)
    return res.status(500).json({ error: err.message })
  }
}
