import type { AiCriteria, AiResult, Filters } from '../types'
import { categories, defaultFilters } from '../data/stays'

const messages: Record<string, string> = {
  AI_NOT_CONFIGURED: 'AI is disabled. Add your key and enable Gemini in the server .env, then restart the API.',
  AI_CONFIGURATION: 'Check your Gemini key, model access, and server configuration in Google AI Studio.',
  QUOTA_EXCEEDED: 'Gemini quota or rate limit reached. Check Google AI Studio and try later. Regular search still works.',
  LOCAL_RATE_LIMIT: 'Please wait a minute before making another AI request. Regular search still works.',
  DAILY_LIMIT: 'This local demo reached its daily AI attempt limit. Please use regular search.',
  AI_BUSY: 'Another AI request is running. Please wait a moment and try again.',
  AI_TIMEOUT: 'Gemini took too long. Try later or use regular search.',
  AI_UNAVAILABLE: 'AI is temporarily unavailable. Check that the local API is running, or use regular search.',
  INVALID_AI_RESPONSE: 'The AI response could not be verified. Try a simpler description or use regular search.',
  AI_BLOCKED: 'Gemini could not process that request. Try a neutral description of your stay.',
  NO_CRITERIA: 'Include a destination, guest count, nightly rand budget, or stay category. Other requirements cannot be checked by this demo.',
  INVALID_INPUT: 'Describe your stay using 1–800 characters.',
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
const invalidResponse = () => new Error(messages.INVALID_AI_RESPONSE)

export function parseAiResult(value: unknown): AiResult {
  if (!isRecord(value) || Object.keys(value).length !== 2
    || typeof value.cached !== 'boolean' || !isRecord(value.criteria)) throw invalidResponse()
  const criteria = value.criteria
  const keys = ['destination', 'guests', 'maxPrice', 'category', 'unhandled']
  if (Object.keys(criteria).length !== keys.length || keys.some((key) => !Object.hasOwn(criteria, key))) throw invalidResponse()
  const { destination, guests, maxPrice, category, unhandled } = criteria
  if (destination !== null && (typeof destination !== 'string' || !destination.trim() || destination.length > 80)) throw invalidResponse()
  if (guests !== null && (typeof guests !== 'number' || !Number.isInteger(guests) || guests < 1 || guests > 16)) throw invalidResponse()
  if (maxPrice !== null && (typeof maxPrice !== 'number' || !Number.isInteger(maxPrice) || maxPrice < 1 || maxPrice > 100000)) throw invalidResponse()
  if (category !== null && !categories.some((item) => item !== 'All stays' && item === category)) throw invalidResponse()
  if (!Array.isArray(unhandled) || unhandled.length > 4
    || unhandled.some((item) => typeof item !== 'string' || !item.trim() || item.length > 160)) throw invalidResponse()
  if (destination === null && guests === null && maxPrice === null && category === null) throw invalidResponse()
  return {
    criteria: {
      destination: typeof destination === 'string' ? destination.trim() : null,
      guests: typeof guests === 'number' ? guests : null,
      maxPrice: typeof maxPrice === 'number' ? maxPrice : null,
      category: category as AiCriteria['category'],
      unhandled: unhandled.map((item: string) => item.trim()),
    },
    cached: value.cached,
  }
}

export function criteriaToFilters(criteria: AiCriteria): Filters {
  return {
    ...defaultFilters,
    destination: criteria.destination ?? '',
    guests: criteria.guests ?? 1,
    maxPrice: criteria.maxPrice ?? defaultFilters.maxPrice,
    category: criteria.category ?? 'All stays',
  }
}

export async function requestAiSearch(prompt: string, signal: AbortSignal, fetchImpl: typeof fetch = fetch): Promise<AiResult> {
  const trimmed = prompt.trim()
  if (!trimmed || trimmed.length > 800) throw new Error(messages.INVALID_INPUT)
  let response: Response
  try {
    response = await fetchImpl('/api/ai-search', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: trimmed }), signal,
    })
  } catch {
    if (signal.aborted) throw new Error('AI request cancelled.')
    throw new Error(messages.AI_UNAVAILABLE)
  }
  let payload: unknown
  try { payload = await response.json() } catch { throw new Error(messages.AI_UNAVAILABLE) }
  if (!response.ok) {
    const code = isRecord(payload) && isRecord(payload.error) && typeof payload.error.code === 'string' ? payload.error.code : ''
    throw new Error(Object.hasOwn(messages, code) ? messages[code] : messages.AI_UNAVAILABLE)
  }
  return parseAiResult(payload)
}
