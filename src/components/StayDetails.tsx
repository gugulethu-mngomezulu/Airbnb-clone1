import { useState } from 'react'
import type { Stay, StayDates } from '../types'
import { formatPrice, getDateError, getEstimate, getNights, todayString } from '../lib/stays'
import { Icon } from './Icon'
import { StayImage } from './StayImage'

interface StayDetailsProps {
  stay: Stay
  saved: boolean
  onSave: (id: string) => void
  initialDates: StayDates
  initialGuests: number
}

export function StayDetails({ stay, saved, onSave, initialDates, initialGuests }: StayDetailsProps) {
  const [checkIn, setCheckIn] = useState(initialDates.checkIn)
  const [checkOut, setCheckOut] = useState(initialDates.checkOut)
  const [guests, setGuests] = useState(Math.min(initialGuests, stay.guests))
  const [preview, setPreview] = useState(false)
  const nights = getNights(checkIn, checkOut)
  const dateError = getDateError(checkIn, checkOut)
  const estimate = nights !== null && !dateError ? getEstimate(stay.price, nights) : null

  return <main id="main-content" className="page-width detail-page">
    <a className="back-link" href="#/"><Icon name="arrow" size={17} className="rotate-180" /> Back to exploring</a>
    <div className="detail-heading"><div><span className="detail-category">{stay.category} · South Africa</span><h1>{stay.name}</h1><p className="flex items-center gap-2 flex-wrap"><Icon name="pin" size={16} />{stay.location}<span>·</span><Icon name="star" size={14} filled />{stay.rating.toFixed(2)} <span className="muted">({stay.reviews} example reviews)</span></p></div><button className="outline-button" onClick={() => onSave(stay.id)} aria-pressed={saved}><Icon name="heart" size={18} filled={saved} />{saved ? 'Saved' : 'Save stay'}</button></div>
    <div className="detail-gallery"><StayImage src={stay.image} alt={'Example exterior for ' + stay.name} eager />{stay.gallery.map((image, index) => <StayImage key={image} src={image} alt={'Example interior ' + (index + 1) + ' for ' + stay.name} />)}</div>
    <p className="photo-disclaimer">Illustrative photography · Fictional listing, host, ratings, and amenities</p>
    <div className="detail-layout">
      <div>
        <div className="host-heading"><div><h2>Entire place in {stay.location.split(',')[0]}</h2><p className="muted">{stay.guests} guests · {stay.bedrooms} bedrooms · {stay.beds} beds · {stay.bathrooms} bathrooms</p></div><span className="host-avatar" aria-label={'Example host ' + stay.host}>{stay.host.slice(0, 1)}</span></div>
        <div className="detail-benefits"><div><Icon name="home" /><span><strong>Room to make yourself at home</strong><small>A thoughtful space for a change of pace.</small></span></div><div><Icon name="shield" /><span><strong>A frontend you can explore</strong><small>Mock data only. No reservations or charges.</small></span></div></div>
        <section className="detail-section"><h2>About this space</h2><p>{stay.description}</p><p className="host-note">Hosted in this demo by {stay.host}.</p></section>
        <section className="detail-section"><h2>What this place offers</h2><div className="amenities-grid">{stay.amenities.map((amenity) => <span key={amenity}><Icon name={amenity === 'Wi-Fi' ? 'wifi' : 'check'} size={20} />{amenity}</span>)}</div></section>
      </div>
      <aside className="estimate-card" aria-label="Demo stay cost estimator">
        <div className="flex justify-between items-center gap-3"><p><strong className="estimate-price">{formatPrice(stay.price)}</strong><span className="muted"> / night</span></p><span className="demo-pill">DEMO</span></div>
        <h2>Your stay, at a glance</h2><p className="muted text-sm">Choose dates for a demo price estimate.</p>
        <div className="date-fields"><label>CHECK-IN<input type="date" aria-label="Check-in" min={todayString()} value={checkIn} onChange={(event) => { setCheckIn(event.target.value); setPreview(false) }} /></label><label>CHECKOUT<input type="date" aria-label="Checkout" min={checkIn || todayString()} value={checkOut} onChange={(event) => { setCheckOut(event.target.value); setPreview(false) }} /></label></div>
        <label className="guest-field">GUESTS<select value={guests} onChange={(event) => { setGuests(Number(event.target.value)); setPreview(false) }}>{Array.from({ length: stay.guests }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1} guest{i > 0 ? 's' : ''}</option>)}</select></label>
        {dateError && <p role="alert" className="date-error">{dateError}</p>}
        {estimate && <dl className="price-breakdown"><div><dt>{formatPrice(stay.price)} × {nights} night{nights !== 1 ? 's' : ''}</dt><dd>{formatPrice(estimate.subtotal)}</dd></div><div><dt>Example cleaning fee</dt><dd>{formatPrice(estimate.cleaning)}</dd></div><div><dt>Example service fee (8%)</dt><dd>{formatPrice(estimate.service)}</dd></div><div className="estimate-total"><dt>Estimated total</dt><dd>{formatPrice(estimate.total)}</dd></div></dl>}
        <button className="primary-button w-full justify-center" disabled={!estimate} onClick={() => setPreview(true)}>Preview your stay <Icon name="arrow" size={18} /></button>
        <p className="estimate-note">No payment. No booking. Just exploring.</p>
        {preview && estimate && <p role="status" className="preview-message">Your demo plan: {nights} nights for {guests} guest{guests !== 1 ? 's' : ''}, estimated at {formatPrice(estimate.total)}. Availability is not checked and nothing has been reserved.</p>}
      </aside>
    </div>
  </main>
}
