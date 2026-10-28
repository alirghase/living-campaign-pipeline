import type { Journey } from '@/data/types'

export const JOURNEY_HEX: Record<Journey, string> = { rental: '#14b8a6', shared: '#a855f7' }

export const journeyClass: Record<Journey, { pill: string; text: string; ring: string; soft: string }> = {
  rental: {
    pill: 'bg-teal-500/12 text-teal-700 ring-1 ring-teal-500/30 dark:text-teal-300',
    text: 'text-teal-600 dark:text-teal-300',
    ring: 'ring-teal-500/40',
    soft: 'bg-teal-500/8',
  },
  shared: {
    pill: 'bg-purple-500/12 text-purple-700 ring-1 ring-purple-500/30 dark:text-purple-300',
    text: 'text-purple-600 dark:text-purple-300',
    ring: 'ring-purple-500/40',
    soft: 'bg-purple-500/8',
  },
}

export const GRADIENTS: Record<Journey, string[]> = {
  rental: [
    'linear-gradient(135deg, #2dd4bf 0%, #0d9488 45%, #134e4a 100%)',
    'linear-gradient(160deg, #5eead4 0%, #14b8a6 40%, #155e75 100%)',
    'linear-gradient(120deg, #0f766e 0%, #14b8a6 55%, #67e8f9 100%)',
    'linear-gradient(145deg, #99f6e4 0%, #0d9488 50%, #042f2e 100%)',
  ],
  shared: [
    'linear-gradient(135deg, #c084fc 0%, #9333ea 45%, #3b0764 100%)',
    'linear-gradient(160deg, #d8b4fe 0%, #a855f7 40%, #4c1d95 100%)',
    'linear-gradient(120deg, #6b21a8 0%, #a855f7 55%, #f0abfc 100%)',
    'linear-gradient(145deg, #e9d5ff 0%, #7e22ce 50%, #2e1065 100%)',
  ],
}

/** Chart colours. Channel order validated for colourblind separation (adjacent pairs, light + dark). */
export const CHART = {
  indigo: '#6366f1',
  muted: '#94a3b8',
  journey: { rental: '#0d9488', shared: '#a855f7' },
  channel: {
    facebook: '#3987e5',
    instagram: '#d95926',
    linkedin: '#9085e9',
    google: '#c98500',
    email: '#d55181',
  },
}
