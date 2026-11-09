import { describe, expect, it } from 'vitest'
import { defaultFilters, stays } from '../data/stays'
import { filterStays, formatPrice, getDateError, getEstimate, getNights, groupStaysByProvince, parseSavedIds, todayString } from './stays'

describe('stay browsing', () => {
  it('shows every listing by default', () => {
    expect(filterStays(stays, { ...defaultFilters }, [])).toHaveLength(stays.length)
  })
  it('matches locations without case or surrounding whitespace', () => {
    const results = filterStays(stays, { ...defaultFilters, destination: '  CAPE TOWN ' }, [])
    expect(results.length).toBeGreaterThan(1)
    expect(results.every((stay) => stay.location.includes('Cape Town'))).toBe(true)
  })
  it('searches province and property names', () => {
    expect(filterStays(stays, { ...defaultFilters, destination: 'Gauteng' }, [])).toHaveLength(6)
    expect(filterStays(stays, { ...defaultFilters, destination: 'Sunday' }, [])[0].id).toBe('sandton-penthouse')
  })
  it('combines category, capacity, and budget filters', () => {
    const results = filterStays(stays, { ...defaultFilters, category: 'Cabins', guests: 4, maxPrice: 1800 }, [])
    expect(results.map((stay) => stay.id)).toEqual(['mountain-retreat'])
  })
  it('includes stays exactly on the budget and guest boundaries', () => {
    const results = filterStays(stays, { ...defaultFilters, maxPrice: 950, guests: 2 }, [])
    expect(results.map((stay) => stay.id)).toEqual(['city-loft'])
  })
  it('shows an empty result for an unknown destination', () => {
    expect(filterStays(stays, { ...defaultFilters, destination: 'Mars' }, [])).toEqual([])
  })
  it('shows only saved listings when requested', () => {
    expect(filterStays(stays, { ...defaultFilters, savedOnly: true }, ['city-loft']).map((stay) => stay.id)).toEqual(['city-loft'])
    expect(filterStays(stays, { ...defaultFilters, savedOnly: true }, [])).toEqual([])
  })
  it('combines saved-only with the other filters', () => {
    expect(filterStays(stays, { ...defaultFilters, savedOnly: true, category: 'Coastal' }, ['city-loft'])).toEqual([])
  })
  it('sorts by price and rating without mutating source data', () => {
    const original = stays.map((stay) => stay.id)
    expect(filterStays(stays, { ...defaultFilters, sort: 'price-low' }, [])[0].price).toBe(950)
    expect(filterStays(stays, { ...defaultFilters, sort: 'price-high' }, [])[0].price).toBe(2950)
    expect(filterStays(stays, { ...defaultFilters, sort: 'rating' }, [])[0].rating).toBe(4.98)
    expect(stays.map((stay) => stay.id)).toEqual(original)
  })
  it('uses unique IDs and positive fixture values', () => {
    expect(new Set(stays.map((stay) => stay.id)).size).toBe(stays.length)
    expect(stays.every((stay) => stay.price > 0 && stay.guests > 0 && stay.gallery.length >= 2)).toBe(true)
  })
})

describe('destination collections', () => {
  it('groups every fixture exactly once, without changing its order', () => {
    const groups = groupStaysByProvince(stays)
    expect(groups).toHaveLength(3)
    const ids = groups.flatMap((group) => group.stays.map((stay) => stay.id))
    expect(ids).toHaveLength(stays.length)
    expect(new Set(ids).size).toBe(stays.length)
    expect(groups[0].stays[0].id).toBe('atlantic-hideaway')
  })
  it('omits empty collections', () => {
    expect(groupStaysByProvince([])).toEqual([])
  })
})

describe('shared search and detail date validation', () => {
  it('allows no dates, but requires both when one is selected', () => {
    expect(getDateError('', '', '2027-01-01')).toBeNull()
    expect(getDateError('2027-05-10', '', '2027-01-01')).toContain('both')
    expect(getDateError('', '2027-05-12', '2027-01-01')).toContain('both')
  })
  it('accepts today and exactly thirty nights', () => {
    expect(getDateError('2027-05-01', '2027-05-31', '2027-05-01')).toBeNull()
  })
  it('rejects past, reversed, invalid and overlong dates', () => {
    expect(getDateError('2027-04-30', '2027-05-01', '2027-05-01')).toContain('today')
    expect(getDateError('2027-05-10', '2027-05-09', '2027-05-01')).toContain('checkout')
    expect(getDateError('2027-02-29', '2027-03-02', '2027-01-01')).toContain('valid')
    expect(getDateError('2027-05-01', '2027-06-01', '2027-05-01')).toContain('1–30')
  })
  it('formats a local calendar date consistently', () => {
    expect(todayString(new Date(2027, 0, 2, 23, 30))).toBe('2027-01-02')
  })
})

describe('calendar nights and demo estimates', () => {
  it('counts calendar nights across months and daylight-saving changes', () => {
    expect(getNights('2027-01-31', '2027-02-02')).toBe(2)
    expect(getNights('2027-03-27', '2027-03-29')).toBe(2)
  })
  it('supports a real leap day', () => {
    expect(getNights('2028-02-28', '2028-03-01')).toBe(2)
  })
  it.each([
    ['', '2027-01-02'], ['2027-01-02', ''], ['nope', '2027-01-02'],
    ['2027-02-29', '2027-03-02'], ['2027-01-02', '2027-01-02'],
    ['2027-01-03', '2027-01-02'], ['2027-13-01', '2028-01-02'],
  ])('rejects invalid or reversed dates (%s to %s)', (start, end) => {
    expect(getNights(start, end)).toBeNull()
  })
  it('calculates explicit mock fees and total', () => {
    expect(getEstimate(1000, 3)).toEqual({ subtotal: 3000, cleaning: 250, service: 240, total: 3490 })
  })
  it.each([0, -1, 1.5, 31, Infinity, NaN])('rejects invalid duration %s', (nights) => {
    expect(() => getEstimate(1000, nights)).toThrow()
  })
  it.each([0, -5, Infinity, NaN])('rejects invalid nightly price %s', (price) => {
    expect(() => getEstimate(price, 2)).toThrow()
  })
  it('formats prices in rand', () => {
    expect(formatPrice(2450).replace(/\s/g, '')).toBe('R2450')
  })
})

describe('saved listing data', () => {
  const ids = stays.map((stay) => stay.id)
  it('handles missing, corrupt, and non-array storage', () => {
    for (const value of [null, '', 'broken', '{}', 'null', '4']) expect(parseSavedIds(value, ids)).toEqual([])
  })
  it('discards unknown IDs, non-strings, and duplicates', () => {
    expect(parseSavedIds('["city-loft","missing",3,null,"city-loft","forest-cabin"]', ids)).toEqual(['city-loft', 'forest-cabin'])
  })
})
