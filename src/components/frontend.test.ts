import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { stays } from '../data/stays'
import { formatPrice, getEstimate } from '../lib/stays'
import { Header } from './Header'
import { AiSearch } from './AiSearch'
import { PropertyCard } from './PropertyCard'
import { SearchBar } from './SearchBar'
import { StayDetails } from './StayDetails'

const noop = () => {}
const compact = (html: string) => html.replace(/\s|&nbsp;/g, '')

// Static rendering checks markup and prop wiring; browser checks cover interactions.
describe('Airbnb-inspired frontend components', () => {
  it('labels the branding as an Airbnb clone rather than the official website', () => {
    const html = renderToStaticMarkup(createElement(Header, {
      savedCount: 0, savedOnly: false, onSaved: noop, onExplore: noop,
    }))
    expect(html).toContain('aria-label="Airbnb Clone home"')
    expect(html).toContain('brand-demo-label')
    expect(html).toContain('>clone</span>')
    expect(html).not.toContain('staybnb')
  })

  it('keeps AI opt-in and does not expose a prompt form until expanded', () => {
    const html = renderToStaticMarkup(createElement(AiSearch, { onApply: noop }))
    expect(html).toContain('Try AI search')
    expect(html).toContain('aria-expanded="false"')
    expect(html).not.toContain('<textarea')
  })

  it('shows a nightly rate when no dates have been applied', () => {
    const html = renderToStaticMarkup(createElement(PropertyCard, {
      stay: stays[0], saved: false, onSave: noop, nights: null,
    }))
    expect(compact(html)).toContain(compact(formatPrice(stays[0].price)))
    expect(html).toContain('/ night')
    expect(html).not.toContain('Estimate includes example fees')
  })

  it('uses the same full estimate as details when dates are selected', () => {
    const html = renderToStaticMarkup(createElement(PropertyCard, {
      stay: stays[0], saved: false, onSave: noop, nights: 3,
    }))
    expect(compact(html)).toContain(compact(formatPrice(getEstimate(stays[0].price, 3).total)))
    expect(html).toContain('for 3 nights')
    expect(html).toContain('Estimate includes example fees')
  })

  it('labels a one-night estimate in the singular', () => {
    const html = renderToStaticMarkup(createElement(PropertyCard, {
      stay: stays[0], saved: false, onSave: noop, nights: 1,
    }))
    expect(html).toContain('for 1 night')
    expect(html).not.toContain('for 1 nights')
  })

  it('exposes a saved card as a pressed button with an unsave label', () => {
    const html = renderToStaticMarkup(createElement(PropertyCard, {
      stay: stays[0], saved: true, onSave: noop, nights: null,
    }))
    expect(html).toContain('aria-pressed="true"')
    expect(html).toContain('Unsave The Atlantic Hideaway')
  })

  it('marks unavailable navigation features as disabled', () => {
    const html = renderToStaticMarkup(createElement(Header, {
      savedCount: 2, savedOnly: false, onSaved: noop, onExplore: noop,
    }))
    expect(html.match(/disabled=""/g)).toHaveLength(2)
    expect(html).toContain('Coming soon')
    expect(html).toContain('Open navigation menu')
  })

  it('shows an applied date range in the search summary', () => {
    const html = renderToStaticMarkup(createElement(SearchBar, {
      destination: '', guests: 2, dates: { checkIn: '2099-05-10', checkOut: '2099-05-13' },
      onDestination: noop, onGuests: noop, onDates: noop, onSearch: noop,
    }))
    expect(html).toContain('Choose dates: 10 May – 13 May')
    expect(html).toContain('No live availability')
  })

  it('passes search dates into details and caps guests at listing capacity', () => {
    const html = renderToStaticMarkup(createElement(StayDetails, {
      stay: stays[0], saved: false, onSave: noop,
      initialDates: { checkIn: '2099-05-10', checkOut: '2099-05-13' }, initialGuests: 6,
    }))
    expect(html).toContain('value="2099-05-10"')
    expect(html).toContain('value="2099-05-13"')
    expect(html).toContain('<option value="4" selected="">')
    expect(compact(html)).toContain(compact(formatPrice(getEstimate(stays[0].price, 3).total)))
    expect(html).not.toContain('disabled=""')
    expect(html).toContain('No payment. No booking.')
  })
})
