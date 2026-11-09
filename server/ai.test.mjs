import assert from 'node:assert/strict'
import test from 'node:test'
import { setTimeout as delay } from 'node:timers/promises'
import { AiError, createSearchService, validateCriteria, validatePrompt } from './ai.mjs'

const criteria = { destination: 'Cape Town', guests: 4, maxPrice: 2500, category: 'Coastal', unhandled: [] }
const output = (value = criteria) => new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(value) }] } }] }))
const config = { enabled: true, apiKey: 'unit-test-placeholder', sleep: async () => {} }
const errorCode = (code) => (error) => error instanceof AiError && error.code === code

// Every provider response is mocked. Tests never read .env or call Google.
test('prompt validation trims input and rejects unsupported payloads', () => {
  assert.equal(validatePrompt({ prompt: ' Cape Town ' }), 'Cape Town')
  for (const payload of [null, [], {}, { prompt: 3 }, { prompt: '' }, { prompt: 'x'.repeat(801) }, { prompt: '\u0000test' }, { prompt: 'stay', model: 'other' }]) {
    assert.throws(() => validatePrompt(payload), errorCode('INVALID_INPUT'))
  }
})

test('criteria validator accepts explicit schema and normalizes whitespace', () => {
  assert.deepEqual(validateCriteria({ ...criteria, destination: ' Cape Town ', unhandled: [' quietness '] }), { ...criteria, unhandled: ['quietness'] })
  assert.deepEqual(validateCriteria({ destination: null, guests: 16, maxPrice: 1, category: null, unhandled: [] }).guests, 16)
})

test('criteria validator rejects invented fields, categories, limits and malformed data', () => {
  for (const value of [null, [], { ...criteria, shell: 'run something' }, { ...criteria, category: 'Luxury' }, { ...criteria, guests: 0 }, { ...criteria, guests: 17 }, { ...criteria, guests: 1.5 }, { ...criteria, maxPrice: -1 }, { ...criteria, maxPrice: 100001 }, { ...criteria, destination: '' }, { ...criteria, destination: 'x'.repeat(81) }, { ...criteria, unhandled: [4] }, { ...criteria, unhandled: Array(5).fill('extra') }]) {
    assert.throws(() => validateCriteria(value), errorCode('INVALID_AI_RESPONSE'))
  }
})

test('unactionable requests do not silently clear search filters', () => {
  assert.throws(() => validateCriteria({ destination: null, guests: null, maxPrice: null, category: null, unhandled: ['dates'] }), errorCode('NO_CRITERIA'))
})

test('disabled and missing-key configurations never call the provider', async () => {
  let calls = 0
  const fetchImpl = async () => { calls++; return output() }
  for (const options of [{ enabled: false, apiKey: 'unit-test-placeholder' }, { enabled: true, apiKey: '' }]) {
    await assert.rejects(createSearchService({ ...options, fetchImpl }).search({ prompt: 'Cape Town' }), errorCode('AI_NOT_CONFIGURED'))
  }
  assert.equal(calls, 0)
})

test('rejects unsafe model configuration without making a call', async () => {
  const service = createSearchService({ ...config, model: '../other', fetchImpl: async () => assert.fail('must not fetch') })
  await assert.rejects(service.search({ prompt: 'Cape Town' }), errorCode('AI_NOT_CONFIGURED'))
})

test('sends a fixed endpoint, server-side key, separate instructions and bounded schema', async () => {
  const service = createSearchService({ ...config, fetchImpl: async (url, options) => {
    assert.equal(url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent')
    assert.equal(options.headers['x-goog-api-key'], 'unit-test-placeholder')
    assert.equal(options.redirect, 'error')
    const body = JSON.parse(options.body)
    assert.equal(body.contents[0].parts[0].text, 'Find a coastal stay')
    assert.match(body.systemInstruction.parts[0].text, /untrusted/)
    assert.equal(body.generationConfig.maxOutputTokens, 1024)
    assert.equal(body.generationConfig.responseFormat.text.mimeType, 'APPLICATION_JSON')
    assert.equal(body.generationConfig.responseFormat.text.schema.additionalProperties, false)
    return output()
  } })
  assert.deepEqual(await service.search({ prompt: 'Find a coastal stay' }), { criteria, cached: false })
})

test('identical requests reuse an in-memory result without consuming another call', async () => {
  let calls = 0
  const service = createSearchService({ ...config, fetchImpl: async () => { calls++; return output() } })
  const first = await service.search({ prompt: 'Cape Town' })
  first.criteria.destination = 'changed externally'
  const cached = await service.search({ prompt: ' Cape Town ' })
  assert.equal(cached.cached, true)
  assert.equal(cached.criteria.destination, 'Cape Town')
  assert.equal(calls, 1)
})

test('cache expires after five minutes', async () => {
  let now = Date.UTC(2027, 0, 1), calls = 0
  const service = createSearchService({ ...config, now: () => now, fetchImpl: async () => { calls++; return output() } })
  await service.search({ prompt: 'Cape Town' })
  now += 300001
  assert.equal((await service.search({ prompt: 'Cape Town' })).cached, false)
  assert.equal(calls, 2)
})

test('provider 429 stops immediately and never retries exhausted quota', async () => {
  let calls = 0
  const service = createSearchService({ ...config, fetchImpl: async () => { calls++; return new Response('private provider detail', { status: 429, headers: { 'Retry-After': '120' } }) } })
  await assert.rejects(service.search({ prompt: 'Cape Town' }), (error) => error.code === 'QUOTA_EXCEEDED' && error.retryAfterSeconds === 120 && !error.message.includes('private'))
  assert.equal(calls, 1)
})

test('transient 5xx retries once and succeeds', async () => {
  let calls = 0
  const service = createSearchService({ ...config, fetchImpl: async () => ++calls === 1 ? new Response('', { status: 503 }) : output() })
  assert.equal((await service.search({ prompt: 'Cape Town' })).criteria.destination, 'Cape Town')
  assert.equal(calls, 2)
})

test('retries are bounded at two provider calls', async () => {
  let calls = 0
  const service = createSearchService({ ...config, fetchImpl: async () => { calls++; return new Response('', { status: 500 }) } })
  await assert.rejects(service.search({ prompt: 'Cape Town' }), errorCode('AI_UNAVAILABLE'))
  assert.equal(calls, 2)
})

test('failed attempts and retries count toward the daily ceiling', async () => {
  let calls = 0
  const service = createSearchService({ ...config, dailyLimit: 1, fetchImpl: async () => { calls++; return new Response('', { status: 503 }) } })
  await assert.rejects(service.search({ prompt: 'Cape Town' }), errorCode('DAILY_LIMIT'))
  assert.equal(calls, 1)
})

test('daily ceiling resets on a new UTC day', async () => {
  let now = Date.UTC(2027, 0, 1)
  const service = createSearchService({ ...config, dailyLimit: 1, now: () => now, fetchImpl: async () => output() })
  await service.search({ prompt: 'first' })
  await assert.rejects(service.search({ prompt: 'second' }), errorCode('DAILY_LIMIT'))
  now += 86400000
  assert.equal((await service.search({ prompt: 'second' })).cached, false)
})

test('local minute limit prevents further new provider calls', async () => {
  let calls = 0
  const service = createSearchService({ ...config, minuteLimit: 1, fetchImpl: async () => { calls++; return output() } })
  await service.search({ prompt: 'first' })
  await assert.rejects(service.search({ prompt: 'second' }), errorCode('LOCAL_RATE_LIMIT'))
  assert.equal(calls, 1)
})

test('only one provider request can be in flight', async () => {
  let finish
  const service = createSearchService({ ...config, fetchImpl: () => new Promise((resolve) => { finish = resolve }) })
  const first = service.search({ prompt: 'first' })
  await assert.rejects(service.search({ prompt: 'second' }), errorCode('AI_BUSY'))
  finish(output())
  await first
})

test('timeouts and connection errors are sanitized and not retried', async () => {
  const timed = createSearchService({ ...config, timeoutMs: 1, fetchImpl: async () => { await delay(10); throw new Error('private timeout detail') } })
  await assert.rejects(timed.search({ prompt: 'Cape Town' }), errorCode('AI_TIMEOUT'))
  const disconnected = createSearchService({ ...config, fetchImpl: async () => { throw new Error('private connection detail') } })
  await assert.rejects(disconnected.search({ prompt: 'Cape Town' }), (error) => error.code === 'AI_UNAVAILABLE' && !error.message.includes('private'))
})

test('safety blocks produce clear errors', async () => {
  const service = createSearchService({ ...config, fetchImpl: async () => Response.json({ promptFeedback: { blockReason: 'SAFETY' } }) })
  await assert.rejects(service.search({ prompt: 'Cape Town' }), errorCode('AI_BLOCKED'))
})

test('malformed, oversized, truncated and invalid-schema provider output is rejected', async () => {
  const responses = [
    () => new Response('not JSON'), () => new Response('x'.repeat(65537)),
    () => Response.json(null), () => Response.json({}),
    () => Response.json({ candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: '{}' }] } }] }),
    () => output({ ...criteria, guests: 400 }),
  ]
  for (const fetchImpl of responses) {
    await assert.rejects(createSearchService({ ...config, fetchImpl }).search({ prompt: 'Cape Town' }), errorCode('INVALID_AI_RESPONSE'))
  }
})

test('key and model rejection errors do not expose raw provider messages', async () => {
  const service = createSearchService({ ...config, fetchImpl: async () => new Response('private key information', { status: 403 }) })
  await assert.rejects(service.search({ prompt: 'Cape Town' }), (error) => error.code === 'AI_CONFIGURATION' && !error.message.includes('private'))
})
