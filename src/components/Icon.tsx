import type { CSSProperties } from 'react'

export type IconName = 'home' | 'search' | 'heart' | 'arrow' | 'pin' | 'star' | 'sliders' | 'waves' | 'tree' | 'city' | 'sun' | 'spark' | 'check' | 'close' | 'users' | 'bed' | 'bath' | 'wifi' | 'shield' | 'globe' | 'menu' | 'calendar' | 'chevron' | 'coffee' | 'bell'
const paths: Record<IconName, string> = {
  globe: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M3 12h18M12 3a18 18 0 0 1 0 18 18 18 0 0 1 0-18',
  menu: 'M4 6h16M4 12h16M4 18h16',
  calendar: 'M4 5h16v16H4ZM4 10h16M8 3v4m8-4v4',
  chevron: 'm9 5 7 7-7 7',
  coffee: 'M4 8h12v9a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Zm12 1h2a3 3 0 0 1 0 6h-2M7 2v3m5-3v3',
  bell: 'M3 19h18M5 17a7 7 0 0 1 14 0ZM12 4v4m-2-4h4',
  home: 'm3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
  search: 'm21 21-4.5-4.5M19 10.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  arrow: 'M4 12h16m-6-6 6 6-6 6', pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  star: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z',
  sliders: 'M4 7h9m4 0h3M4 17h3m4 0h9M13 4v6M7 14v6',
  waves: 'M2 7c3-4 6 4 10 0s7 4 10 0M2 13c3-4 6 4 10 0s7 4 10 0M2 19c3-4 6 4 10 0s7 4 10 0',
  tree: 'm12 2-7 8h4l-6 7h7v5h4v-5h7l-6-7h4Z',
  city: 'M3 21V8h7v13m0-18h10v18M1 21h22M6 11v1m0 3v1m8-9h2m-2 4h2m-2 4h2',
  sun: 'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0',
  spark: 'm12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z',
  check: 'm5 12 4 4L19 6', close: 'm6 6 12 12M6 18 18 6',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.9M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0m4-3a4 4 0 0 1 0 8',
  bed: 'M3 18V6m0 9h18v5m0-5V9H9v6M3 9h6M3 20v-2',
  bath: 'M3 12h18v4a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4ZM5 12V5a2 2 0 0 1 4 0m-4 15v2m14-2v2',
  wifi: 'M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0m-11 4a6 6 0 0 1 8 0m-4 4h.01',
  shield: 'm12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6Zm-5 10 3 3 7-7',
}

export function Icon({ name, size = 20, filled = false, className, style }: { name: IconName; size?: number; filled?: boolean; className?: string; style?: CSSProperties }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}><path d={paths[name]} /></svg>
}
