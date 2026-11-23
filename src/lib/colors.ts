import type { Journey } from '@/data/types'

export const JOURNEY_HEX: Record<Journey, string> = { rental: '#6fa800', shared: '#2178b0' }

export const journeyClass: Record<Journey, { pill: string; text: string; ring: string; soft: string }> = {
  rental: {
    pill: 'bg-rental-500/12 text-rental-700 ring-1 ring-rental-500/30 dark:text-rental-300',
    text: 'text-rental-600 dark:text-rental-300',
    ring: 'ring-rental-500/40',
    soft: 'bg-rental-500/8',
  },
  shared: {
    pill: 'bg-shared-500/12 text-shared-700 ring-1 ring-shared-500/30 dark:text-shared-300',
    text: 'text-shared-600 dark:text-shared-300',
    ring: 'ring-shared-500/40',
    soft: 'bg-shared-500/8',
  },
}

export const GRADIENTS: Record<Journey, string[]> = {
  rental: [
    'linear-gradient(135deg, #8cc61a 0%, #00864f 55%, #003d2d 100%)',
    'linear-gradient(160deg, #cde5a0 0%, #6fa800 40%, #004a36 100%)',
    'linear-gradient(120deg, #004a36 0%, #00864f 55%, #a9d262 100%)',
    'linear-gradient(145deg, #e6f2cf 0%, #22a774 50%, #00261c 100%)',
  ],
  shared: [
    'linear-gradient(135deg, #72b0d9 0%, #2178b0 45%, #0f3a57 100%)',
    'linear-gradient(160deg, #a8cfe9 0%, #2178b0 40%, #004a36 100%)',
    'linear-gradient(120deg, #155784 0%, #2178b0 55%, #5ec59a 100%)',
    'linear-gradient(145deg, #d4e7f4 0%, #1b6aa0 50%, #0a2538 100%)',
  ],
}

/** Chart colours. Channel order validated for colourblind separation (adjacent pairs, light + dark). */
export const CHART = {
  indigo: '#00864f',
  muted: '#94a3b8',
  journey: { rental: '#6fa800', shared: '#2178b0' },
  channel: {
    facebook: '#3987e5',
    instagram: '#d95926',
    linkedin: '#9085e9',
    google: '#c98500',
    email: '#d55181',
  },
}
