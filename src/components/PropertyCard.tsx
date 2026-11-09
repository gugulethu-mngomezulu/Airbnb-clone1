import type { Stay } from '../types'
import { formatPrice, getEstimate } from '../lib/stays'
import { Icon } from './Icon'
import { StayImage } from './StayImage'

interface PropertyCardProps {
  stay: Stay
  saved: boolean
  onSave: (id: string) => void
  nights: number | null
}

export function PropertyCard({ stay, saved, onSave, nights }: PropertyCardProps) {
  return <article className="property-card group">
    <div className="property-photo">
      <a href={'#/stay/' + stay.id} aria-label={'View ' + stay.name}>
        <StayImage src={stay.image} alt={'Illustrative property photo for ' + stay.name} className="transition-transform duration-300 group-hover:scale-105" />
      </a>
      {stay.tag === 'Guest favourite' && <span className="property-badge">Guest favourite</span>}
      <button className={'save-button ' + (saved ? 'is-saved' : '')} aria-label={(saved ? 'Unsave ' : 'Save ') + stay.name} aria-pressed={saved} onClick={() => onSave(stay.id)}><Icon name="heart" size={23} filled={saved} /></button>
    </div>
    <h3><a href={'#/stay/' + stay.id}>{stay.name}</a></h3>
    <p className="property-location">{stay.location}</p>
    <div className="property-price-row">
      <p className="property-price"><strong>{formatPrice(nights ? getEstimate(stay.price, nights).total : stay.price)}</strong> <span>{nights ? 'for ' + nights + ' night' + (nights !== 1 ? 's' : '') : '/ night'}</span></p>
      <span className="rating"><Icon name="star" size={10} filled />{stay.rating.toFixed(2)}</span>
    </div>
    <p className="property-meta">{nights ? 'Estimate includes example fees' : stay.guests + ' guests · ' + stay.bedrooms + ' bedroom' + (stay.bedrooms > 1 ? 's' : '')}</p>
  </article>
}
