import assert from 'node:assert/strict'
import test from 'node:test'
import { once } from 'node:events'
import { request as httpRequest } from 'node:http'
import { AiError } from './ai.mjs'
import { createApiServer } from './http.mjs'

async function withServer(service, run) {
  const allowedHosts = new Set(), logs = []
  const server = createApiServer({ service, allowedHosts, logger: (entry) => logs.push(entry) })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const host = '127.0.0.1:' + server.address().port
  allowedHosts.add(host)
  try { await run('http://' + host, logs) }
  finally { await new Promise((resolve) => server.close(resolve)) }
}
const post = (base, options = {}) => fetch(base + '/api/ai-search', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: 'Cape Town' }), ...options,
})

test('API returns sanitized JSON with no-store and no-sniff headers', async () => {
  await withServer({ search: async (payload) => ({ criteria: { destination: payload.prompt }, cached: false }) }, async (base) => {
    const response = await post(base)
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
    assert.equal((await response.json()).criteria.destination, 'Cape Town')
  })
})

test('API rejects foreign origins before reaching the service', async () => {
  await withServer({ search: async () => assert.fail('must not call AI') }, async (base) => {
    const response = await post(base, { headers: { 'Content-Type': 'application/json', Origin: 'https://attacker.example' } })
    assert.equal(response.status, 403)
    assert.equal(response.headers.get('access-control-allow-origin'), null)
  })
})

test('API rejects an unexpected Host header', async () => {
  await withServer({ search: async () => assert.fail('must not call AI') }, async (base) => {
    // Node fetch normalizes Host; use a raw local HTTP request for this security check.
    const status = await new Promise((resolve, reject) => {
      const body = JSON.stringify({ prompt: 'Cape Town' })
      const request = httpRequest(base + '/api/ai-search', {
        method: 'POST', headers: { Host: 'attacker.example', 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      }, (response) => { response.resume(); resolve(response.statusCode) })
      request.on('error', reject)
      request.end(body)
    })
    assert.equal(status, 403)
  })
})

test('API rejects malformed JSON, content types, oversized bodies and routes', async () => {
  await withServer({ search: async () => assert.fail('must not call AI') }, async (base) => {
    assert.equal((await post(base, { body: 'not JSON' })).status, 400)
    assert.equal((await post(base, { headers: { 'Content-Type': 'text/plain' } })).status, 415)
    assert.equal((await post(base, { body: 'x'.repeat(4097) })).status, 413)
    assert.equal((await fetch(base + '/other')).status, 404)
  })
})

test('API preserves quota codes and retry headers without logging prompts', async () => {
  await withServer({ search: async () => { throw new AiError(429, 'QUOTA_EXCEEDED', 'Quota reached.', 120) } }, async (base, logs) => {
    const response = await post(base)
    assert.equal(response.status, 429)
    assert.equal(response.headers.get('retry-after'), '120')
    assert.equal((await response.json()).error.code, 'QUOTA_EXCEEDED')
    assert.deepEqual(logs, [{ event: 'ai_request_failed', status: 429, code: 'QUOTA_EXCEEDED' }])
    assert.equal(JSON.stringify(logs).includes('Cape Town'), false)
  })
})

test('API hides unexpected exception details', async () => {
  await withServer({ search: async () => { throw new Error('private internal information') } }, async (base, logs) => {
    const response = await post(base)
    const text = await response.text()
    assert.equal(response.status, 500)
    assert.equal(text.includes('private'), false)
    assert.equal(JSON.stringify(logs).includes('private'), false)
  })
})
