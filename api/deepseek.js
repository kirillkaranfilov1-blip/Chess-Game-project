const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'
const DEEPSEEK_MODEL = 'deepseek-chat'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    return res.status(500).json({
      error: 'DEEPSEEK_API_KEY is not configured in Vercel Environment Variables.',
    })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
    const { messages, temperature = 0.3, response_format, max_tokens } = body

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' })
    }

    const payload = {
      model: DEEPSEEK_MODEL,
      messages,
      temperature,
    }
    if (response_format) payload.response_format = response_format
    if (max_tokens) payload.max_tokens = max_tokens

    const upstream = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await upstream.json().catch(() => ({}))
    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: data?.error?.message || data?.error || 'DeepSeek API error',
      })
    }

    return res.status(200).json(data)
  } catch (err) {
    console.error('[deepseek-vercel-api]', err)
    return res.status(500).json({ error: err.message || 'Proxy error' })
  }
}
