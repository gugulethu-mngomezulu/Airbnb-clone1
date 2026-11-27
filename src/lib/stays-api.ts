import type { Filters, Stay } from '../types'
import { categories } from './stay-filters'

const unavailable = 'Stays could not be loaded. Check that the API is running, then try again.'
const invalidMessage = 'The stay response could not be verified. Please try again.'
const invalidResponse = () => new Error(invalidMessage)

const strings = ['id', 'name', 'location', 'province', 'category', 'description', 'image', 'tag', 'host'] as const
const counts = ['reviews', 'guests', 'bedrooms', 'beds'] as const
const numbers = ['price', 'rating', 'bathrooms', ...counts] as const

export function parseStay(value: unknown): Stay {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalidResponse()
  const row = value as Record<string, unknown>
  if (Object.keys(row).length !== 18
    || strings.some((key) => typeof row[key] !== 'string')
    || numbers.some((key) => typeof row[key] !== 'number' || !Number.isFinite(row[key]))
    || counts.some((key) => !Number.isInteger(row[key]) || (row[key] as number) < 0)
    || !Array.isArray(row.gallery) || row.gallery.some((item) => typeof item !== 'string')
    || !Array.isArray(row.amenities) || row.amenities.some((item) => typeof item !== 'string')
    || !(row.id as string).length || (row.id as string).length > 100
    || (row.price as number) <= 0 || (row.guests as number) < 1 || (row.beds as number) < 1
    || (row.rating as number) < 0 || (row.rating as number) > 5 || (row.bathrooms as number) < 0
    || !categories.some((category) => category !== 'All stays' && category === row.category)) throw invalidResponse()
  return row as unknown as Stay
}

export function parseStays(value: unknown): Stay[] {
  if (!Array.isArray(value)) throw invalidResponse()
  const stays = value.map(parseStay)
  if (new Set(stays.map((stay) => stay.id)).size !== stays.length) throw invalidResponse()
  return stays
}

export function buildStaysUrl(filters: Filters): string {
  const query = new URLSearchParams({
    destination: filters.destination.trim(),
    guests: String(filters.guests),
    category: filters.category,
    max_price: String(filters.maxPrice),
    sort: filters.sort,
  })
  return '/api/stays?' + query.toString()
}

export const buildStayUrl = (id: string) => '/api/stays/' + encodeURIComponent(id)

export function stayIdFromHash(hash: string): string | null {
  if (!hash.startsWith('#/stay/')) return null
  try {
    const id = decodeURIComponent(hash.slice('#/stay/'.length))
    return id.length > 0 && id.length <= 100 ? id : null
  } catch {
    return null
  }
}

async function request<T>(
  url: string, signal: AbortSignal, parse: (value: unknown) => T,
  allowMissing: boolean, fetchImpl: typeof fetch,
): Promise<T | null> {
  if (signal.aborted) throw new Error('Stay request cancelled.')
  const controller = new AbortController()
  const cancel = () => controller.abort()
  signal.addEventListener('abort', cancel, { once: true })
  let timedOut = false
  const timer = setTimeout(() => { timedOut = true; controller.abort() }, 10_000)
  try {
    const response = await fetchImpl(url, { signal: controller.signal, headers: { Accept: 'application/json' } })
    if (allowMissing && response.status === 404) return null
    if (!response.ok) throw new Error(unavailable)
    let payload: unknown
    try { payload = await response.json() } catch { throw invalidResponse() }
    return parse(payload)
  } catch (error) {
    if (signal.aborted) throw new Error('Stay request cancelled.')
    if (timedOut) throw new Error('Loading stays took too long. Please try again.')
    if (error instanceof Error && (error.message === unavailable || error.message === invalidMessage)) throw error
    throw new Error(unavailable)
  } finally {
    clearTimeout(timer)
    signal.removeEventListener('abort', cancel)
  }
}

export async function fetchStays(url: string, signal: AbortSignal, fetchImpl: typeof fetch = fetch): Promise<Stay[]> {
  const result = await request(url, signal, parseStays, false, fetchImpl)
  if (result === null) throw invalidResponse()
  return result
}

export async function fetchStay(url: string, signal: AbortSignal, fetchImpl: typeof fetch = fetch): Promise<Stay | null> {
  const result = await request(url, signal, parseStay, true, fetchImpl)
  if (result !== null && buildStayUrl(result.id) !== url) throw invalidResponse()
  return result
}
