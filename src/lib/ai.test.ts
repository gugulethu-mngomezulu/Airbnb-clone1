import { describe, expect, it, vi } from 'vitest'
import { criteriaToFilters, parseAiResult, requestAiSearch } from './ai'
import { filterStays } from './stays'
import { stays } from '../data/stays'

const criteria = { destination: 'Cape Town', guests: 4, maxPrice: 2500, category: 'Coastal' as const, unhandled: [] }
const result = { criteria, cached: false }
const signal = () => new AbortController().signal

describe('AI response validation and filter application', () => {
  it('accepts only a valid structured result', () => {
    expect(parseAiResult(result)).toEqual(result)
  })

  it.each([
    null, [], {}, { ...result, cached: 'yes' }, { ...result, extra: true },
    { ...result, criteria: { ...criteria, guests: 100 } },
    { ...result, criteria: { ...criteria, category: 'Luxury' } },
    { ...result, criteria: { ...criteria, maxPrice: -1 } },
    { ...result, criteria: { ...criteria, destination: '' } },
    { ...result, criteria: { ...criteria, unhandled: [4] } },
    { ...result, criteria: { ...criteria, shell: 'do something' } },
    { ...result, criteria: { destination: null, guests: null, maxPrice: null, category: null, unhandled: [] } },
  ])('rejects an unsafe or malformed response %#', (value) => {
    expect(() => parseAiResult(value)).toThrow('could not be verified')
  })

  it('creates explicit defaults rather than retaining stale filters', () => {
    expect(criteriaToFilters({ destination: null, guests: 2, maxPrice: null, category: null, unhandled: ['quietness'] }))
      .toEqual({ destination: '', guests: 2, maxPrice: 3500, category: 'All stays', savedOnly: false, sort: 'recommended' })
  })

  it('only returns existing mock stays after applying validated AI criteria', () => {
    expect(filterStays(stays, criteriaToFilters(criteria), []).map((stay) => stay.id)).toEqual(['atlantic-hideaway'])
  })

  it('does not silently reduce a group larger than the collection supports', () => {
    const filters = criteriaToFilters({ ...criteria, guests: 16 })
    expect(filters.guests).toBe(16)
    expect(filterStays(stays, filters, [])).toEqual([])
  })

  it('preserves low and high budgets exactly', () => {
    expect(criteriaToFilters({ ...criteria, maxPrice: 200 }).maxPrice).toBe(200)
    expect(criteriaToFilters({ ...criteria, maxPrice: 100000 }).maxPrice).toBe(100000)
  })
})

describe('same-origin AI client', () => {
  it('sends only the trimmed description, never model configuration or credentials', async () => {
    const fetchImpl = vi.fn(async () => Response.json(result))
    await expect(requestAiSearch(' Cape Town ', signal(), fetchImpl)).resolves.toEqual(result)
    expect(fetchImpl).toHaveBeenCalledWith('/api/ai-search', expect.objectContaining({
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: 'Cape Town' }),
    }))
  })

  it('rejects blank and overlong prompts without making a request', async () => {
    const fetchImpl = vi.fn()
    for (const prompt of [' ', 'x'.repeat(801)]) await expect(requestAiSearch(prompt, signal(), fetchImpl)).rejects.toThrow('1–800')
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('uses a fixed quota message rather than exposing raw provider errors', async () => {
    const fetchImpl = async () => Response.json({ error: { code: 'QUOTA_EXCEEDED', message: 'private provider detail' } }, { status: 429 })
    await expect(requestAiSearch('Cape Town', signal(), fetchImpl)).rejects.toThrow('quota or rate limit')
    await expect(requestAiSearch('Cape Town', signal(), fetchImpl)).rejects.not.toThrow('private')
  })

  it('handles a stopped API or non-JSON Vite proxy response', async () => {
    const fetchImpl = async () => new Response('bad gateway', { status: 502 })
    await expect(requestAiSearch('Cape Town', signal(), fetchImpl)).rejects.toThrow('local API')
  })

  it('sanitizes connection failures', async () => {
    const fetchImpl = async () => { throw new Error('private network detail') }
    await expect(requestAiSearch('Cape Town', signal(), fetchImpl)).rejects.toThrow('temporarily unavailable')
  })

  it('handles unknown error codes without trusting arbitrary message text', async () => {
    const fetchImpl = async () => Response.json({ error: { code: '__proto__', message: 'private detail' } }, { status: 500 })
    await expect(requestAiSearch('Cape Town', signal(), fetchImpl)).rejects.toThrow('temporarily unavailable')
  })

  it('reports cancelled requests without interpreting them as model output', async () => {
    const controller = new AbortController()
    controller.abort()
    const fetchImpl = async () => { throw new Error('cancelled by fetch') }
    await expect(requestAiSearch('Cape Town', controller.signal, fetchImpl)).rejects.toThrow('cancelled')
  })
})
