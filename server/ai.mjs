import { createHash } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { OUTPUT_SCHEMA, SYSTEM_PROMPT } from './prompt.mjs'

export class AiError extends Error {
  constructor(status, code, message, retryAfterSeconds) {
    super(message)
    this.status = status
    this.code = code
    this.retryAfterSeconds = retryAfterSeconds
  }
}

const invalidOutput = () => new AiError(502, 'INVALID_AI_RESPONSE', 'Gemini returned an unusable response. Try a simpler request or use regular search.')
const categories = ['Coastal', 'Cabins', 'City escapes', 'Countryside', 'Unique stays']
const hasControl = (text, allowWhitespace = false) => [...text].some((character) => {
  const code = character.charCodeAt(0)
  return code < 32 && (!allowWhitespace || ![9, 10, 13].includes(code))
})

export function validatePrompt(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)
    || Object.keys(payload).length !== 1 || typeof payload.prompt !== 'string') {
    throw new AiError(400, 'INVALID_INPUT', 'Supply only a prompt field containing text.')
  }
  const prompt = payload.prompt.trim()
  if (!prompt || prompt.length > 800 || hasControl(prompt, true)) {
    throw new AiError(400, 'INVALID_INPUT', 'Describe your stay using 1–800 characters, without control characters.')
  }
  return prompt
}

export function validateCriteria(value) {
  const keys = ['destination', 'guests', 'maxPrice', 'category', 'unhandled']
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || Object.keys(value).length !== keys.length || keys.some((key) => !Object.hasOwn(value, key))) throw invalidOutput()
  if (value.destination !== null && (typeof value.destination !== 'string'
    || !value.destination.trim() || value.destination.length > 80 || hasControl(value.destination))) throw invalidOutput()
  if (value.guests !== null && (!Number.isInteger(value.guests) || value.guests < 1 || value.guests > 16)) throw invalidOutput()
  if (value.maxPrice !== null && (!Number.isInteger(value.maxPrice) || value.maxPrice < 1 || value.maxPrice > 100000)) throw invalidOutput()
  if (value.category !== null && !categories.includes(value.category)) throw invalidOutput()
  if (!Array.isArray(value.unhandled) || value.unhandled.length > 4
    || value.unhandled.some((item) => typeof item !== 'string' || !item.trim() || item.length > 160 || hasControl(item))) throw invalidOutput()
  if (value.destination === null && value.guests === null && value.maxPrice === null && value.category === null) {
    throw new AiError(422, 'NO_CRITERIA', 'Describe a destination, guest count, nightly rand budget, or stay category. Dates and other requirements must be checked separately.')
  }
  return {
    destination: value.destination?.trim() ?? null,
    guests: value.guests,
    maxPrice: value.maxPrice,
    category: value.category,
    unhandled: value.unhandled.map((item) => item.trim()),
  }
}

function retryAfter(response) {
  const seconds = Number(response.headers.get('retry-after'))
  return Number.isFinite(seconds) && seconds > 0 ? Math.min(Math.ceil(seconds), 86400) : 60
}

async function readProviderJson(response) {
  // A bounded output token setting is not a substitute for bounding the response body.
  if (Number(response.headers.get('content-length')) > 65536) throw invalidOutput()
  const reader = response.body?.getReader()
  if (!reader) throw invalidOutput()
  const chunks = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 65536) throw invalidOutput()
      chunks.push(Buffer.from(value))
    }
  } finally {
    await reader.cancel().catch(() => {})
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch { throw invalidOutput() }
}

export function createSearchService({
  apiKey = '', model = 'gemini-3.5-flash-lite', enabled = false,
  fetchImpl = globalThis.fetch, now = Date.now, sleep = delay,
  timeoutMs = 10000, dailyLimit = 20, minuteLimit = 5,
} = {}) {
  let busy = false
  let day = ''
  let callsToday = 0
  let requests = []
  const cache = new Map()

  function reserveCall() {
    const currentDay = new Date(now()).toISOString().slice(0, 10)
    if (day !== currentDay) { day = currentDay; callsToday = 0 }
    if (callsToday >= dailyLimit) throw new AiError(429, 'DAILY_LIMIT', 'This local demo reached its daily AI attempt limit. Use regular search or try another day.')
    // Failed attempts and retries count too; this is not a billing cap.
    callsToday += 1
  }

  async function search(payload) {
    const prompt = validatePrompt(payload)
    if (!enabled || !apiKey.trim()) {
      throw new AiError(503, 'AI_NOT_CONFIGURED', 'AI is disabled. Add GEMINI_API_KEY and set GEMINI_ENABLED=true in the server .env, then restart the API.')
    }
    if (!/^gemini-[a-zA-Z0-9._-]{1,70}$/.test(model)) {
      throw new AiError(503, 'AI_NOT_CONFIGURED', 'Choose a valid Gemini model in the server .env and restart the API.')
    }
    const key = createHash('sha256').update(prompt).digest('hex')
    for (const [cachedKey, entry] of cache) if (entry.expires <= now()) cache.delete(cachedKey)
    const cached = cache.get(key)
    if (cached) return { criteria: structuredClone(cached.criteria), cached: true }
    if (busy) throw new AiError(429, 'AI_BUSY', 'Another AI request is running. Please wait before trying again.', 2)
    requests = requests.filter((stamp) => now() - stamp < 60000)
    if (requests.length >= minuteLimit) throw new AiError(429, 'LOCAL_RATE_LIMIT', 'Please wait a minute. This demo allows five new AI requests per minute.', 60)
    requests.push(now())
    busy = true
    try {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        reserveCall()
        const signal = AbortSignal.timeout(timeoutMs)
        let response
        try {
          response = await fetchImpl('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', {
            method: 'POST', redirect: 'error', signal,
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.1, maxOutputTokens: 1024,
                thinkingConfig: { thinkingLevel: 'low' },
                responseFormat: { text: { mimeType: 'APPLICATION_JSON', schema: OUTPUT_SCHEMA } },
              },
            }),
          })
        } catch {
          if (signal.aborted) throw new AiError(504, 'AI_TIMEOUT', 'Gemini took too long. Regular search is still available.')
          throw new AiError(502, 'AI_UNAVAILABLE', 'Could not reach Gemini. Check your connection or use regular search.')
        }
        if (response.status === 429) {
          const wait = retryAfter(response)
          await response.body?.cancel().catch(() => {})
          // Do not retry a possibly exhausted daily quota.
          throw new AiError(429, 'QUOTA_EXCEEDED', 'Gemini quota or rate limit reached. Check Google AI Studio and try later. Regular search still works.', wait)
        }
        if (response.status >= 500 && response.status <= 599) {
          await response.body?.cancel().catch(() => {})
          if (attempt === 0) { await sleep(300); continue }
          throw new AiError(502, 'AI_UNAVAILABLE', 'Gemini is temporarily unavailable. Please use regular search and try later.')
        }
        if (!response.ok) {
          await response.body?.cancel().catch(() => {})
          if ([400, 401, 403, 404].includes(response.status)) {
            throw new AiError(503, 'AI_CONFIGURATION', 'Gemini rejected the configured key, model, or request. Check AI Studio access and the server configuration.')
          }
          throw new AiError(502, 'AI_UNAVAILABLE', 'Gemini could not process this request. Please use regular search.')
        }
        let data
        try { data = await readProviderJson(response) } catch (error) {
          if (signal.aborted) throw new AiError(504, 'AI_TIMEOUT', 'Gemini took too long. Regular search is still available.')
          throw error instanceof AiError ? error : invalidOutput()
        }
        const candidate = data?.candidates?.[0]
        if (data?.promptFeedback?.blockReason || (candidate && ['SAFETY', 'BLOCKLIST', 'PROHIBITED_CONTENT', 'RECITATION'].includes(candidate.finishReason))) {
          throw new AiError(422, 'AI_BLOCKED', 'Gemini could not process that request. Try a neutral description of your stay.')
        }
        if (!candidate || candidate.finishReason !== 'STOP' || !Array.isArray(candidate.content?.parts)) throw invalidOutput()
        const text = candidate.content.parts.filter((part) => part && !part.thought && typeof part.text === 'string').map((part) => part.text).join('')
        let parsed
        try { parsed = JSON.parse(text) } catch { throw invalidOutput() }
        const criteria = validateCriteria(parsed)
        if (cache.size >= 50) cache.delete(cache.keys().next().value)
        cache.set(key, { criteria: structuredClone(criteria), expires: now() + 300000 })
        return { criteria, cached: false }
      }
      throw invalidOutput()
    } finally {
      busy = false
    }
  }
  return { search }
}
