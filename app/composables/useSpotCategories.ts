export const SPOT_CATEGORIES = [
  { key: 'food',          label: '美食', icon: '🍽️' },
  { key: 'landmark',      label: '景點', icon: '🏛️' },
  { key: 'entertainment', label: '娛樂', icon: '🎮' },
] as const

export type SpotCategoryKey = typeof SPOT_CATEGORIES[number]['key']
