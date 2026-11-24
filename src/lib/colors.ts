import type { Journey } from '@/data/types'

export const JOURNEY_HEX: Record<Journey, string> = { rental: '#11b67a', shared: '#8280d2' }

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


/** Chart colours. Channel order validated for colourblind separation (adjacent pairs, light + dark). */
export const CHART = {
  indigo: '#006c4e',
  muted: '#94a3b8',
  journey: { rental: '#11b67a', shared: '#8280d2' },
  channel: {
    facebook: '#3987e5',
    instagram: '#d95926',
    linkedin: '#9085e9',
    google: '#c98500',
    email: '#d55181',
  },
}
