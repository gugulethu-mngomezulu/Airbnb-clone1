import { afterEach, describe, expect, it, vi } from 'vitest'
import { stays } from '../data/stays'
import { defaultFilters } from './stay-filters'
import { buildStayUrl, buildStaysUrl, fetchStay, fetchStays, parseStay, parseStays, stayIdFromHash } from './stays-api'

const signal = () => new AbortController().signal
const listUrl = buildStaysUrl({ ...defaultFilters })

afterEach(() => vi.useRealTimers())

describe('stay API response validation', () => {
  it('accepts every expanded fixture without changing its values', () => {
    expect(parseStays(stays)).toEqual(stays)
    expect(parseStays([])).toEqual([])
  })

  it.each([
    null, [], {}, { ...stays[0], price: '2450' }, { ...stays[0], rating: NaN },
    { ...stays[0], rating: 6 }, { ...stays[0], bathrooms: -1 },
    { ...stays[0], guests: 0 }, { ...stays[0], guests: 1.5 },
    { ...stays[0], beds: 0 }, { ...stays[0], bedrooms: -1 },
    { ...stays[0], reviews: true }, { ...stays[0], category: 'All stays' },
    { ...stays[0], gallery: [null] }, { ...stays[0], amenities: 'Kitchen' },
    { ...stays[0], id: '' }, { ...stays[0], id: 'x'.repeat(101) },
    { ...stays[0], description: null }, { ...stays[0], extra: 'unexpected' },
  ])('rejects malformed stay %# before rendering', (value) => {
    expect(() => parseStay(value)).toThrow('could not be verified')
  })

  it('rejects non-list, invalid-row and duplicate-ID responses', () => {
    for (const value of [{ stays }, [null], [stays[0], stays[0]]]) {
      expect(() => parseStays(value)).toThrow('could not be verified')
    }
  })
})

describe('stay request URLs', () => {
  it('maps server filters and leaves saved-only filtering in the browser', () => {
    const url = buildStaysUrl({ ...defaultFilters, destination: ' Cape Town & coast ', guests: 4, maxPrice: 0, savedOnly: true, sort: 'rating' })
    const parsed = new URL(url, 'http://127.0.0.1')
    expect(parsed.pathname).toBe('/api/stays')
    expect(Object.fromEntries(parsed.searchParams)).toEqual({
      destination: 'Cape Town & coast', guests: '4', category: 'All stays', max_price: '0', sort: 'rating',
    })
    expect(url).not.toContain('savedOnly')
  })

  it('encodes detail IDs so they cannot inject query parameters or another origin', () => {
    expect(buildStayUrl('a/b?sort=rating')).toBe('/api/stays/a%2Fb%3Fsort%3Drating')
  })

  it('decodes direct detail links and rejects malformed or unrelated routes', () => {
    expect(stayIdFromHash('#/stay/atlantic-hideaway')).toBe('atlantic-hideaway')
    expect(stayIdFromHash('#/stay/a%20b')).toBe('a b')
    for (const route of ['#/', '#/about', '#/unknown', '#/stay/', '#/stay/%ZZ', '#/stay/' + 'x'.repeat(101)]) {
      expect(stayIdFromHash(route)).toBeNull()
    }
  })
})

describe('same-origin stay client', () => {
  it('fetches validated list data with a cancellable JSON request', async () => {
    const fetchImpl = vi.fn(async () => Response.json(stays))
    await expect(fetchStays(listUrl, signal(), fetchImpl)).resolves.toEqual(stays)
    expect(fetchImpl).toHaveBeenCalledWith(listUrl, expect.objectContaining({
      headers: { Accept: 'application/json' }, signal: expect.any(AbortSignal),
    }))
  })

  it('fetches a detail response and distinguishes 404 from an API failure', async () => {
    const url = buildStayUrl(stays[0].id)
    await expect(fetchStay(url, signal(), async () => Response.json(stays[0]))).resolves.toEqual(stays[0])
    await expect(fetchStay(url, signal(), async () => new Response('not found', { status: 404 }))).resolves.toBeNull()
    await expect(fetchStays(listUrl, signal(), async () => new Response('not found', { status: 404 }))).rejects.toThrow('could not be loaded')
  })

  it('rejects a detail response for a different ID', async () => {
    await expect(fetchStay(buildStayUrl(stays[1].id), signal(), async () => Response.json(stays[0])))
      .rejects.toThrow('could not be verified')
  })

  it('does not display raw backend or transport errors', async () => {
    for (const fetchImpl of [
      async () => new Response('private backend detail', { status: 500 }),
      async () => { throw new Error('private transport detail') },
    ]) {
      await expect(fetchStays(listUrl, signal(), fetchImpl)).rejects.toThrow('could not be loaded')
      await expect(fetchStays(listUrl, signal(), fetchImpl)).rejects.not.toThrow('private')
    }
  })

  it('rejects HTML and malformed JSON data instead of showing a false empty result', async () => {
    await expect(fetchStays(listUrl, signal(), async () => new Response('<html>not JSON</html>'))).rejects.toThrow('could not be verified')
    await expect(fetchStays(listUrl, signal(), async () => Response.json([{}]))).rejects.toThrow('could not be verified')
  })

  it('does not fetch an already cancelled request', async () => {
    const controller = new AbortController()
    controller.abort()
    const fetchImpl = vi.fn()
    await expect(fetchStays(listUrl, controller.signal, fetchImpl)).rejects.toThrow('cancelled')
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('cancels an in-flight request when its caller aborts', async () => {
    const controller = new AbortController()
    const fetchImpl: typeof fetch = async (_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true })
    })
    const request = fetchStays(listUrl, controller.signal, fetchImpl)
    controller.abort()
    await expect(request).rejects.toThrow('cancelled')
  })

  it('times out a stalled request after ten seconds', async () => {
    vi.useFakeTimers()
    const fetchImpl: typeof fetch = async (_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true })
    })
    const request = fetchStays(listUrl, signal(), fetchImpl)
    const assertion = expect(request).rejects.toThrow('took too long')
    await vi.advanceTimersByTimeAsync(10_000)
    await assertion
    expect(vi.getTimerCount()).toBe(0)
  })
})
