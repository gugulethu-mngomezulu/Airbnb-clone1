import { useEffect, useRef, useState } from 'react'
import type { Stay } from '../types'
import { Icon } from './Icon'
import { PropertyCard } from './PropertyCard'

interface PropertySectionProps {
  title: string
  province: string
  stays: Stay[]
  savedIds: string[]
  nights: number | null
  onSave: (id: string) => void
  onSeeAll: (province: string) => void
}

export function PropertySection({ title, province, stays, savedIds, nights, onSave, onSeeAll }: PropertySectionProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoNext, setCanGoNext] = useState(false)
  const headingId = 'collection-' + province.toLowerCase().replaceAll(' ', '-')

  useEffect(() => {
    const row = rowRef.current
    if (!row) return
    const update = () => {
      setCanGoBack(row.scrollLeft > 2)
      setCanGoNext(row.scrollLeft + row.clientWidth < row.scrollWidth - 2)
    }
    const observer = new ResizeObserver(update)
    observer.observe(row)
    row.addEventListener('scroll', update, { passive: true })
    const frame = requestAnimationFrame(update)
    return () => {
      observer.disconnect()
      row.removeEventListener('scroll', update)
      cancelAnimationFrame(frame)
    }
  }, [stays.length])

  function scroll(direction: number) {
    const row = rowRef.current
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    row?.scrollBy({ left: direction * row.clientWidth * 0.85, behavior: reducedMotion ? 'instant' : 'smooth' })
  }

  return <section className="destination-section" aria-labelledby={headingId}>
    <div className="section-heading">
      <h2 id={headingId}><button onClick={() => onSeeAll(province)}>{title}<span className="section-heading-arrow"><Icon name="chevron" size={15} /></span></button></h2>
      <div className="carousel-controls">
        <button className="carousel-button" aria-label={'Previous stays in ' + province} disabled={!canGoBack} onClick={() => scroll(-1)}><Icon name="chevron" size={15} className="rotate-180" /></button>
        <button className="carousel-button" aria-label={'Next stays in ' + province} disabled={!canGoNext} onClick={() => scroll(1)}><Icon name="chevron" size={15} /></button>
      </div>
    </div>
    <div className="property-row" ref={rowRef} tabIndex={0} aria-label={title + ' — scroll for more homes'}>
      {stays.map((stay) => <PropertyCard key={stay.id} stay={stay} saved={savedIds.includes(stay.id)} onSave={onSave} nights={nights} />)}
    </div>
  </section>
}
