import { useEffect, useRef, useState } from 'react'
import type { AiCriteria, AiResult } from '../types'
import { requestAiSearch } from '../lib/ai'
import { formatPrice } from '../lib/stays'
import { Icon } from './Icon'

const examples = [
  'Coastal stay in Cape Town for 4 guests under R2500 per night',
  'A cabin for 2 guests under R1600 per night',
  'Johannesburg city stay for 2 under R1400 per night',
]

export function AiSearch({ onApply }: { onApply: (criteria: AiCriteria) => void }) {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<AiResult | null>(null)
  const [applied, setApplied] = useState(false)
  const [notice, setNotice] = useState('')
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => () => controllerRef.current?.abort(), [])

  async function search() {
    if (controllerRef.current) return
    const controller = new AbortController()
    controllerRef.current = controller
    setLoading(true)
    setError('')
    setResult(null)
    setApplied(false)
    setNotice('')
    let timedOut = false
    const timer = window.setTimeout(() => { timedOut = true; controller.abort() }, 25000)
    try {
      const response = await requestAiSearch(prompt, controller.signal)
      if (!controller.signal.aborted) setResult(response)
    } catch (failure) {
      if (timedOut) setError('The AI request timed out. Regular search is still available.')
      else if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'AI is unavailable. Use regular search.')
    } finally {
      window.clearTimeout(timer)
      if (controllerRef.current === controller) {
        controllerRef.current = null
        setLoading(false)
      }
    }
  }

  function editPrompt(value: string) {
    setPrompt(value)
    setResult(null)
    setApplied(false)
    setError('')
    setNotice('')
  }

  return <section className="ai-search" aria-labelledby="ai-search-title">
    <div className="ai-search-heading">
      <div><span className="ai-mark"><Icon name="spark" size={20} /></span><div><h2 id="ai-search-title">A little help finding your kind of stay</h2><p>Describe it. Review the filters. Explore the homes.</p></div></div>
      <button className="ai-toggle" aria-expanded={open} aria-controls="ai-search-panel" onClick={() => setOpen(!open)}>{open ? 'Hide AI search' : 'Try AI search'}<Icon name={open ? 'close' : 'spark'} size={15} /></button>
    </div>
    {open && <div id="ai-search-panel" className="ai-search-panel">
      <form onSubmit={(event) => { event.preventDefault(); void search() }} aria-label="AI stay finder">
        <label htmlFor="ai-prompt">Describe your ideal stay</label>
        <textarea id="ai-prompt" value={prompt} maxLength={800} rows={3} required disabled={loading}
          placeholder={examples[0]} onChange={(event) => editPrompt(event.target.value)}
          aria-describedby="ai-privacy ai-capabilities" />
        <div className="ai-form-actions"><span>{prompt.length}/800</span><div>
          {loading && <button type="button" className="text-button" onClick={() => {
            controllerRef.current?.abort()
            controllerRef.current = null
            setLoading(false)
            setNotice('Request cancelled. A request already sent to Google may still use quota.')
          }}>Cancel request</button>}
          <button type="submit" className="primary-button" disabled={loading || !prompt.trim()}><Icon name="spark" size={16} />{loading ? 'Finding filters…' : 'Find with Gemini'}</button>
        </div></div>
      </form>
      <div className="ai-examples" aria-label="Example AI requests">{examples.map((example, index) =>
        <button key={example} disabled={loading} onClick={() => editPrompt(example)}>{['Cape Town by the coast', 'A cosy cabin', 'A city weekend'][index]}<Icon name="arrow" size={13} /></button>)}</div>
      <p id="ai-privacy" className="ai-privacy">When enabled, your description is sent to Google. Don’t enter personal details. Your project’s quota and possible charges apply.</p>
      <p id="ai-capabilities" className="ai-privacy">AI extracts destination, guests, nightly ZAR budget and category only. Dates and amenities are not applied; availability is never checked.</p>
      {loading && <p role="status" className="ai-progress">Asking Gemini for search criteria—not inventing listings.</p>}
      {error && <p role="alert" className="ai-error">{error}</p>}
      {notice && <p role="status" className="ai-notice">{notice}</p>}
      {result && <div className="ai-result" aria-label="Suggested AI filters">
        <h3>Review your suggested filters</h3>
        <div className="ai-filter-chips">
          {result.criteria.destination && <span><Icon name="pin" size={13} />{result.criteria.destination}</span>}
          {result.criteria.guests !== null && <span>{result.criteria.guests} guest{result.criteria.guests !== 1 ? 's' : ''}</span>}
          {result.criteria.maxPrice !== null && <span>Up to {formatPrice(result.criteria.maxPrice)} / night</span>}
          {result.criteria.category && <span>{result.criteria.category}</span>}
        </div>
        {result.criteria.unhandled.length > 0 && <p className="ai-unhandled">Not checked or applied: {result.criteria.unhandled.join('; ')}.</p>}
        <p>These replace the current destination, guests, budget and category. Your date-picker choices stay unchanged.</p>
        {result.cached && <p className="ai-cache">Reused a recent result—no new model call.</p>}
        <button className="dark-button" onClick={() => { onApply(result.criteria); setApplied(true) }}>Apply AI filters<Icon name="arrow" size={16} /></button>
        {applied && <p role="status" className="ai-applied">AI filters applied. Results below come only from the fictional collection.</p>}
      </div>}
    </div>}
  </section>
}
