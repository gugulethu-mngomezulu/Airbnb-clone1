export type Category = 'All stays' | 'Coastal' | 'Cabins' | 'City escapes' | 'Countryside' | 'Unique stays'
export type SortOrder = 'recommended' | 'price-low' | 'price-high' | 'rating'

export interface Stay {
  id: string
  name: string
  location: string
  province: string
  category: Exclude<Category, 'All stays'>
  description: string
  price: number
  rating: number
  reviews: number
  guests: number
  bedrooms: number
  beds: number
  bathrooms: number
  image: string
  gallery: string[]
  tag: string
  host: string
  amenities: string[]
}

export interface StayDates {
  checkIn: string
  checkOut: string
}

export interface AiCriteria {
  destination: string | null
  guests: number | null
  maxPrice: number | null
  category: Exclude<Category, 'All stays'> | null
  unhandled: string[]
}

export interface AiResult {
  criteria: AiCriteria
  cached: boolean
}

export interface Filters {
  destination: string
  guests: number
  maxPrice: number
  category: Category
  savedOnly: boolean
  sort: SortOrder
}
