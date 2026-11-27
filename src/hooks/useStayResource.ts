import { useEffect, useState } from 'react'

type Resource<T> =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string }

export function useStayResource<T>(
  url: string | null,
  load: (url: string, signal: AbortSignal) => Promise<T>,
) {
  const [attempt, setAttempt] = useState(0)
  const [response, setResponse] = useState<{ key: string; result: Resource<T> } | null>(null)
  const key = JSON.stringify([url, attempt])

  useEffect(() => {
    if (!url) return
    const controller = new AbortController()
    load(url, controller.signal).then((data) => {
      if (!controller.signal.aborted) setResponse({ key, result: { status: 'success', data } })
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setResponse({
        key, result: {
          status: 'error',
          message: error instanceof Error ? error.message : 'Stays could not be loaded. Please try again.',
        },
      })
    })
    return () => controller.abort()
  }, [url, key, load])

  const result: Resource<T> = !url ? { status: 'idle' }
    : response?.key === key ? response.result : { status: 'loading' }
  return { ...result, retry: () => setAttempt((value) => value + 1) }
}
