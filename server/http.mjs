import { createServer } from 'node:http'
import { AiError } from './ai.mjs'

const origins = new Set([
  'http://127.0.0.1:5173', 'http://localhost:5173',
  'http://127.0.0.1:4173', 'http://localhost:4173',
])
const hosts = new Set(['127.0.0.1:8787', 'localhost:8787'])

function sendJson(response, status, payload, retryAfterSeconds) {
  const body = JSON.stringify(payload)
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
    'Connection': 'close',
    ...(retryAfterSeconds ? { 'Retry-After': String(retryAfterSeconds) } : {}),
  })
  response.end(body)
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    const timer = setTimeout(() => {
      reject(new AiError(408, 'INVALID_INPUT', 'Request body timed out.'))
    }, 5000)
    request.on('data', (chunk) => {
      size += chunk.length
      if (size > 4096) {
        clearTimeout(timer)
        reject(new AiError(413, 'INVALID_INPUT', 'Request body is too large.'))
        return
      }
      chunks.push(chunk)
    })
    request.once('end', () => {
      clearTimeout(timer)
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))) }
      catch { reject(new AiError(400, 'INVALID_INPUT', 'Supply valid JSON containing a prompt.')) }
    })
    request.once('error', () => {
      clearTimeout(timer)
      reject(new AiError(400, 'INVALID_INPUT', 'Request could not be read.'))
    })
    request.once('aborted', () => {
      clearTimeout(timer)
      reject(new AiError(400, 'INVALID_INPUT', 'Request was interrupted.'))
    })
  })
}

export function createApiServer({ service, logger = () => {}, allowedHosts = hosts } = {}) {
  const server = createServer(async (request, response) => {
    try {
      if (!allowedHosts.has(request.headers.host)) {
        throw new AiError(403, 'FORBIDDEN', 'This API is available only through the local demo.')
      }
      if (request.headers.origin && !origins.has(request.headers.origin)) {
        throw new AiError(403, 'FORBIDDEN', 'Requests from this origin are not allowed.')
      }
      if (request.method !== 'POST' || request.url !== '/api/ai-search') {
        throw new AiError(404, 'NOT_FOUND', 'Route not found.')
      }
      if (request.headers['transfer-encoding']) throw new AiError(400, 'INVALID_INPUT', 'Chunked requests are not supported.')
      if (request.headers['content-type']?.split(';')[0].trim() !== 'application/json') {
        throw new AiError(415, 'INVALID_INPUT', 'Use application/json.')
      }
      const length = Number(request.headers['content-length'])
      if (!Number.isInteger(length) || length < 1 || length > 4096) {
        throw new AiError(413, 'INVALID_INPUT', 'Request body must be 1–4096 bytes.')
      }
      const payload = await readBody(request)
      const result = await service.search(payload)
      sendJson(response, 200, result)
    } catch (error) {
      const known = error instanceof AiError
      const status = known ? error.status : 500
      const code = known ? error.code : 'INTERNAL_ERROR'
      // Only fixed status/code metadata. Never log prompt, key, provider body, or raw errors.
      logger({ event: 'ai_request_failed', status, code })
      if (!response.headersSent && !response.destroyed) sendJson(response, status, {
        error: {
          code,
          message: known ? error.message : 'The AI service could not complete this request.',
          ...(known && error.retryAfterSeconds ? { retryAfterSeconds: error.retryAfterSeconds } : {}),
        },
      }, known ? error.retryAfterSeconds : undefined)
    }
  })
  server.requestTimeout = 5000
  server.headersTimeout = 5000
  server.timeout = 25000
  server.maxHeadersCount = 30
  server.maxRequestsPerSocket = 1
  return server
}
