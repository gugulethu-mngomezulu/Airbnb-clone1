import { createSearchService } from './ai.mjs'
import { createApiServer } from './http.mjs'

const service = createSearchService({
  apiKey: process.env.GEMINI_API_KEY ?? '',
  model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
  enabled: process.env.GEMINI_ENABLED === 'true',
})
const server = createApiServer({
  service,
  logger: (entry) => console.info(JSON.stringify(entry)),
})
server.on('error', () => {
  console.error('The local AI API could not start. Check that port 8787 is available.')
  process.exitCode = 1
})
server.listen(8787, '127.0.0.1', () => {
  console.info('Local AI API: http://127.0.0.1:8787 (no API key or prompt is logged)')
})
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close())
