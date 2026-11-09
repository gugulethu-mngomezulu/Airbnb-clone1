export function StayImage({ src, alt, className = '', eager = false }: { src: string; alt: string; className?: string; eager?: boolean }) {
  return <img src={src} alt={alt} className={className} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={(event) => {
    event.currentTarget.onerror = null
    event.currentTarget.src = '/stay-placeholder.svg'
  }} />
}
