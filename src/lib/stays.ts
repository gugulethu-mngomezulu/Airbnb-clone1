import type { Filters, Stay } from '../types'

export function filterStays(stays: Stay[], filters: Filters, savedIds: string[]): Stay[] {
  const query = filters.destination.trim().toLocaleLowerCase()
  const result = stays.filter((stay) =>
    (!query || `${stay.name} ${stay.location} ${stay.province}`.toLocaleLowerCase().includes(query))
    && stay.guests >= filters.guests
    && stay.price <= filters.maxPrice
    && (filters.category === 'All stays' || stay.category === filters.category)
    && (!filters.savedOnly || savedIds.includes(stay.id)),
  )
  return result.sort((a, b) => {
    if (filters.sort === 'price-low') return a.price - b.price
    if (filters.sort === 'price-high') return b.price - a.price
    if (filters.sort === 'rating') return b.rating - a.rating
    return 0
  })
}

export const formatPrice = (amount: number) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(amount)

function dateNumber(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const stamp = Date.parse(`${value}T00:00:00Z`)
  if (!Number.isFinite(stamp) || new Date(stamp).toISOString().slice(0, 10) !== value) return null
  return stamp
}

// UTC date-only arithmetic avoids daylight-saving differences between calendar days.
export function getNights(checkIn: string, checkOut: string): number | null {
  const start = dateNumber(checkIn)
  const end = dateNumber(checkOut)
  if (start === null || end === null || end <= start) return null
  return (end - start) / 86_400_000
}

export function todayString(today = new Date()): string {
  return [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-')
}

export function getDateError(checkIn: string, checkOut: string, today = todayString()): string | null {
  if (!checkIn && !checkOut) return null
  if (!checkIn || !checkOut) return 'Choose both check-in and checkout dates.'
  const nights = getNights(checkIn, checkOut)
  if (nights === null) return 'Choose valid dates with checkout after check-in.'
  if (checkIn < today) return 'Choose a check-in date today or later.'
  if (nights > 30) return 'Choose a stay of 1–30 nights.'
  return null
}

export function groupStaysByProvince(listings: Stay[]) {
  const groups = [
    { province: 'Western Cape', title: 'Popular homes in the Western Cape' },
    { province: 'Gauteng', title: 'Places to stay in Johannesburg' },
    { province: 'KwaZulu-Natal', title: 'Discover stays in KwaZulu-Natal' },
  ]
  return groups.map((group) => ({
    ...group,
    stays: listings.filter((stay) => stay.province === group.province),
  })).filter((group) => group.stays.length > 0)
}

export function getEstimate(price: number, nights: number) {
  if (!Number.isFinite(price) || price <= 0 || !Number.isInteger(nights) || nights < 1 || nights > 30) {
    throw new Error('Choose a stay of 1–30 nights with a valid nightly price.')
  }
  const subtotal = price * nights
  const cleaning = 250
  const service = Math.round(subtotal * 0.08)
  return { subtotal, cleaning, service, total: subtotal + cleaning + service }
}

export function parseSavedIds(raw: string | null, knownIds: string[]): string[] {
  if (!raw) return []
  try {
    const value: unknown = JSON.parse(raw)
    if (!Array.isArray(value)) return []
    return [...new Set(value.filter((id): id is string => typeof id === 'string' && knownIds.includes(id)))]
  } catch {
    return []
  }
}
