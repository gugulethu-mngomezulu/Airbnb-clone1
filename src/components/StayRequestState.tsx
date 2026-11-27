interface StayRequestStateProps {
  loading: boolean
  detail?: boolean
  message?: string
  onRetry: () => void
}

export function StayRequestState({ loading, detail = false, message, onRetry }: StayRequestStateProps) {
  return <section className="empty-state" aria-busy={loading}>
    {loading ? <p role="status">{detail ? 'Loading stay...' : 'Loading stays...'}</p> : <>
      <h2>{detail ? "We couldn't load this stay" : "We couldn't load stays"}</h2>
      <p role="alert">{message}</p>
      <button className="dark-button" onClick={onRetry}>Try again</button>
    </>}
  </section>
}
