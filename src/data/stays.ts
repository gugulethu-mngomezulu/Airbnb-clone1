import type { Category, Stay } from '../types'

const photo = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=85`

export const categories: Category[] = ['All stays', 'Coastal', 'Cabins', 'City escapes', 'Countryside', 'Unique stays']

// Fictional listings and example photography: not live inventory or verified reviews.
export const stays: Stay[] = [
  {
    id: 'atlantic-hideaway', name: 'The Atlantic Hideaway', location: 'Camps Bay, Cape Town', province: 'Western Cape', category: 'Coastal',
    description: 'Slow mornings, ocean air, and a terrace made for sunset. This light-filled coastal home is a peaceful base for exploring Cape Town, with a spacious living area and room to settle in.',
    price: 2450, rating: 4.98, reviews: 84, guests: 4, bedrooms: 2, beds: 2, bathrooms: 2,
    image: photo('photo-1613490493576-7fde63acd811'), gallery: [photo('photo-1600210492486-724fe5c67fb0'), photo('photo-1600607687920-4e2a09cf159d')],
    tag: 'Guest favourite', host: 'Lerato', amenities: ['Ocean views', 'Wi-Fi', 'Kitchen', 'Free parking', 'Pool', 'Workspace'],
  },
  {
    id: 'forest-cabin', name: 'A Little Cabin in the Woods', location: 'Knysna, Garden Route', province: 'Western Cape', category: 'Cabins',
    description: 'Switch off among the trees in this cosy timber cabin. Read by the window, make a slow breakfast, and explore the surrounding forest trails. A little less rush, a little more nature.',
    price: 1350, rating: 4.95, reviews: 62, guests: 2, bedrooms: 1, beds: 1, bathrooms: 1,
    image: photo('photo-1449158743715-0a90ebb6d2d8'), gallery: [photo('photo-1449844908441-8829872d2607'), photo('photo-1449247709967-d4461a6a6103')],
    tag: 'Rare find', host: 'Thando', amenities: ['Forest views', 'Wi-Fi', 'Kitchen', 'Free parking', 'Fireplace', 'Patio'],
  },
  {
    id: 'winelands-cottage', name: 'The Olive Grove Cottage', location: 'Franschhoek, Winelands', province: 'Western Cape', category: 'Countryside',
    description: 'An easy-going countryside retreat with mountain views and thoughtful little details. Spend your days exploring nearby cafés and your evenings enjoying a meal on the patio.',
    price: 1850, rating: 4.97, reviews: 103, guests: 4, bedrooms: 2, beds: 3, bathrooms: 1,
    image: photo('photo-1449844908441-8829872d2607'), gallery: [photo('photo-1600210492486-724fe5c67fb0'), photo('photo-1600047509807-ba8f99d2cdde')],
    tag: 'Guest favourite', host: 'Amina', amenities: ['Mountain views', 'Wi-Fi', 'Kitchen', 'Free parking', 'Garden', 'Patio'],
  },
  {
    id: 'city-loft', name: 'A Loft Above the City', location: 'Maboneng, Johannesburg', province: 'Gauteng', category: 'City escapes',
    description: 'A bright, design-led loft with room to work and space to unwind. Discover neighbourhood coffee shops, galleries, and creative spaces from your own comfortable city base.',
    price: 950, rating: 4.89, reviews: 57, guests: 2, bedrooms: 1, beds: 1, bathrooms: 1,
    image: photo('photo-1502672260266-1c1ef2d93688'), gallery: [photo('photo-1522708323590-d24dbb6b0267'), photo('photo-1600210492486-724fe5c67fb0')],
    tag: 'Design lover’s pick', host: 'Sipho', amenities: ['City views', 'Wi-Fi', 'Kitchen', 'Workspace', 'Lift', 'Air conditioning'],
  },
  {
    id: 'mountain-retreat', name: 'The Mountain Slowdown', location: 'Underberg, Drakensberg', province: 'KwaZulu-Natal', category: 'Cabins',
    description: 'Trade notifications for mountain mornings. This comfortable retreat offers big skies, generous living spaces, and an inviting fireplace for chilly evenings after a day outside.',
    price: 1650, rating: 4.96, reviews: 76, guests: 6, bedrooms: 3, beds: 4, bathrooms: 2,
    image: photo('photo-1510798831971-661eb04b3739'), gallery: [photo('photo-1449158743715-0a90ebb6d2d8'), photo('photo-1600210492486-724fe5c67fb0')],
    tag: 'Guest favourite', host: 'Nandi', amenities: ['Mountain views', 'Kitchen', 'Free parking', 'Fireplace', 'Garden', 'Patio'],
  },
  {
    id: 'seaside-studio', name: 'Saltwater & Sunshine', location: 'Ballito, Dolphin Coast', province: 'KwaZulu-Natal', category: 'Coastal',
    description: 'A breezy studio for a simple coastal escape. Walk along the shoreline, find a new breakfast spot, and come home to a comfortable space with plenty of natural light.',
    price: 1100, rating: 4.91, reviews: 45, guests: 2, bedrooms: 1, beds: 1, bathrooms: 1,
    image: photo('photo-1600607687920-4e2a09cf159d'), gallery: [photo('photo-1613490493576-7fde63acd811'), photo('photo-1522708323590-d24dbb6b0267')],
    tag: 'Steps from the sea', host: 'Zola', amenities: ['Wi-Fi', 'Kitchen', 'Free parking', 'Balcony', 'Air conditioning', 'Workspace'],
  },
  {
    id: 'karoo-hideout', name: 'The Karoo Hideout', location: 'Prince Albert, Karoo', province: 'Western Cape', category: 'Unique stays',
    description: 'A characterful hideout under wide Karoo skies. Enjoy quiet corners, warm textures, and evenings on the patio. Made for slowing down and seeing a different side of South Africa.',
    price: 1450, rating: 4.94, reviews: 38, guests: 3, bedrooms: 1, beds: 2, bathrooms: 1,
    image: photo('photo-1600047509807-ba8f99d2cdde'), gallery: [photo('photo-1449844908441-8829872d2607'), photo('photo-1600210492486-724fe5c67fb0')],
    tag: 'Something different', host: 'Karabo', amenities: ['Garden', 'Kitchen', 'Free parking', 'Patio', 'Fireplace', 'Wi-Fi'],
  },
  {
    id: 'sandton-penthouse', name: 'The Sunday Penthouse', location: 'Sandton, Johannesburg', province: 'Gauteng', category: 'City escapes',
    description: 'A polished city apartment with a spacious terrace and a relaxed feel. A convenient base for exploring Johannesburg, with room for family dinners and unhurried Sunday mornings.',
    price: 2850, rating: 4.93, reviews: 91, guests: 4, bedrooms: 2, beds: 2, bathrooms: 2,
    image: photo('photo-1600210492486-724fe5c67fb0'), gallery: [photo('photo-1502672260266-1c1ef2d93688'), photo('photo-1600607687920-4e2a09cf159d')],
    tag: 'Guest favourite', host: 'Lungi', amenities: ['City views', 'Wi-Fi', 'Kitchen', 'Free parking', 'Workspace', 'Balcony'],
  },
]

// More fictional inventory keeps destination rows useful across screen sizes.
const extraStays: Array<Pick<Stay, 'id' | 'name' | 'location' | 'province' | 'category' | 'price' | 'guests' | 'image'>> = [
  { id: 'sea-point-apartment', name: 'Promenade Apartment', location: 'Sea Point, Cape Town', province: 'Western Cape', category: 'Coastal', price: 1750, guests: 2, image: photo('photo-1522708323590-d24dbb6b0267') },
  { id: 'city-bowl-studio', name: 'City Bowl Studio', location: 'Gardens, Cape Town', province: 'Western Cape', category: 'City escapes', price: 1250, guests: 2, image: photo('photo-1502672260266-1c1ef2d93688') },
  { id: 'hout-bay-home', name: 'Hout Bay Family Home', location: 'Hout Bay, Cape Town', province: 'Western Cape', category: 'Coastal', price: 2950, guests: 6, image: photo('photo-1600047509807-ba8f99d2cdde') },
  { id: 'stellenbosch-cottage', name: 'Oak Lane Cottage', location: 'Stellenbosch, Winelands', province: 'Western Cape', category: 'Countryside', price: 1550, guests: 3, image: photo('photo-1449247709967-d4461a6a6103') },
  { id: 'rosebank-retreat', name: 'Rosebank Retreat', location: 'Rosebank, Johannesburg', province: 'Gauteng', category: 'City escapes', price: 1400, guests: 2, image: photo('photo-1600210492486-724fe5c67fb0') },
  { id: 'melville-garden', name: 'The Melville Garden Flat', location: 'Melville, Johannesburg', province: 'Gauteng', category: 'City escapes', price: 1050, guests: 2, image: photo('photo-1600607687920-4e2a09cf159d') },
  { id: 'midrand-home', name: 'Midrand Courtyard Home', location: 'Midrand, Johannesburg', province: 'Gauteng', category: 'City escapes', price: 2200, guests: 6, image: photo('photo-1613490493576-7fde63acd811') },
  { id: 'parkhurst-loft', name: 'Parkhurst Design Loft', location: 'Parkhurst, Johannesburg', province: 'Gauteng', category: 'Unique stays', price: 1800, guests: 3, image: photo('photo-1522708323590-d24dbb6b0267') },
  { id: 'umhlanga-apartment', name: 'The Umhlanga Apartment', location: 'Umhlanga, Durban', province: 'KwaZulu-Natal', category: 'Coastal', price: 1950, guests: 4, image: photo('photo-1502672260266-1c1ef2d93688') },
  { id: 'durban-north-suite', name: 'Durban North Garden Suite', location: 'Durban North, Durban', province: 'KwaZulu-Natal', category: 'City escapes', price: 1150, guests: 2, image: photo('photo-1449844908441-8829872d2607') },
  { id: 'ballito-family', name: 'Ballito Beach House', location: 'Ballito, Dolphin Coast', province: 'KwaZulu-Natal', category: 'Coastal', price: 2750, guests: 6, image: photo('photo-1600047509807-ba8f99d2cdde') },
  { id: 'midlands-cabin', name: 'Midlands Meadow Cabin', location: 'Nottingham Road, Midlands', province: 'KwaZulu-Natal', category: 'Cabins', price: 1500, guests: 2, image: photo('photo-1510798831971-661eb04b3739') },
]

extraStays.forEach((stay) => stays.push({
  ...stay,
  description: 'A welcoming space to settle in and explore the neighbourhood. This fictional stay is part of our South African demo collection, with illustrative photography and example amenities.',
  rating: 4.92, reviews: 42, bedrooms: stay.guests > 3 ? 3 : 1,
  beds: stay.guests > 3 ? 3 : 1, bathrooms: stay.guests > 3 ? 2 : 1,
  gallery: [photo('photo-1600210492486-724fe5c67fb0'), photo('photo-1600607687920-4e2a09cf159d')],
  tag: 'Guest favourite', host: 'Alex',
  amenities: ['Wi-Fi', 'Kitchen', 'Free parking', 'Workspace'],
}))

export const defaultFilters = {
  destination: '', guests: 1, maxPrice: 3500, category: 'All stays', savedOnly: false, sort: 'recommended',
} as const
