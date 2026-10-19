import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'
const DEEPSEEK_MODEL = 'deepseek-chat'

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve(raw ? JSON.parse(raw) : {})
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res, status, data) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

function createDeepseekHandler(apiKey) {
  return async (req, res, next) => {
    if (req.url?.split('?')[0] !== '/api/deepseek') {
      return next()
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return sendJson(res, 405, { error: 'Method not allowed' })
    }

    if (!apiKey) {
      return sendJson(res, 500, {
        error: 'DEEPSEEK_API_KEY is not configured. Add it to .env and restart the server.',
      })
    }

    try {
      const body = await readBody(req)
      const { messages, temperature = 0.3, response_format, max_tokens } = body

      if (!Array.isArray(messages) || messages.length === 0) {
        return sendJson(res, 400, { error: 'messages array is required' })
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
        return sendJson(res, upstream.status, {
          error: data?.error?.message || data?.error || 'DeepSeek API error',
        })
      }

      return sendJson(res, 200, data)
    } catch (err) {
      console.error('[deepseek-proxy]', err)
      return sendJson(res, 500, { error: err.message || 'Proxy error' })
    }
  }
}

function deepseekProxy(apiKey) {
  const handler = createDeepseekHandler(apiKey)
  return {
    name: 'deepseek-proxy',
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.DEEPSEEK_API_KEY || ''

  return {
    plugins: [
      react(),
      tailwindcss(),
      deepseekProxy(apiKey),
    ],
    server: {
      host: true,
      port: 5173,
    },
  }
})
