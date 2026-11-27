import type { Category } from '../types'

export const categories: Category[] = ['All stays', 'Coastal', 'Cabins', 'City escapes', 'Countryside', 'Unique stays']

export const defaultFilters = {
  destination: '', guests: 1, maxPrice: 3500, category: 'All stays', savedOnly: false, sort: 'recommended',
} as const
