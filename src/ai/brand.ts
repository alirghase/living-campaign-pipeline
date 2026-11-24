import { journeyPresets } from '@/data/journeys'
import type { Journey } from '@/data/types'

/**
 * Lloyds Living brand book, condensed into something agents can follow.
 * Every agent prompt embeds the relevant slice so the outputs stay on brand.
 */
export const BRAND = {
  name: 'Lloyds Living',
  parent: 'Lloyds Banking Group',
  tagline: 'Built for life\u2019s next chapter.',
  bio: 'Modern homes for renters and shared ownership buyers. Built for life\u2019s next chapter.',
  about:
    'Lloyds Living is the private rental and Shared Ownership business of Lloyds Banking Group, launched in 2021 as Citra Living. It owns and manages thousands of brand-new, energy-efficient homes across the UK, bought from housebuilders such as Barratt Redrow, Bellway and Keepmoat, and looks after residents with its own in-house team.',
  palette: {
    'Bright green (panels, location pills)': '#11b67a',
    'Dark green': '#006c4e',
    'Neon mint (highlights)': '#6cf579',
    'Pale mint (swooshes)': '#c8ffc5',
    'Lavender (icons)': '#9e9ce1',
    Ink: '#000d04',
  },
  voice: [
    'Warm, upbeat and a little playful. Sounds like a friendly neighbour, never an estate agent.',
    'Short, punchy sentence-case headlines, often a question or an invitation: "Growing family?", "Make your move to Lapwings".',
    'Talk about life moments and what comes next, not the paperwork. Second person. Name the place.',
    'Be specific: bedrooms, gardens, parking, energy-efficient, managed by our own team.',
  ],
  examples: [
    'Growing family? Give yourselves room for what\u2019s next',
    'Find a home with space for your future with Lloyds Living',
    'Make your move to Lapwings: 2 & 3-bedroom rental homes in Burleyfields, Stafford',
    'Meet the other Lloyds Living team: the furry colleagues keeping our humans in line',
    'Built for life\u2019s next chapter.',
  ],
  avoid: ['luxury', 'exclusive', 'guaranteed', 'free', 'dream home', 'once in a lifetime', 'hurry', 'act now'],
  artDirection: [
    'Bright, true-to-life UK daylight photography. For exteriors: clear blue sky, straight-on eye-level view of a brand-new brick semi-detached or detached house (buff or red brick, white windows, a sage-green or teal front door), fresh lawn, tidy tarmac drive.',
    'For lifestyle: real, diverse people (young families, couples, people with dogs) laughing together at home, candid and warm, never posing at the camera; bright modern interiors with pale walls and soft furnishings.',
    'Simple composition with clear space for a headline panel and a location label.',
    'Natural colour, crisp and optimistic; nothing moody, nothing neon in the photo itself.',
    'Absolutely no text, letters, signage, logos, watermarks or brand marks anywhere in the image.',
  ],
}

export function brandContext(journey?: Journey) {
  const j = journey ? journeyPresets[journey] : undefined
  return [
    `BRAND: ${BRAND.name} (${BRAND.parent}). ${BRAND.about} Brand line: "${BRAND.tagline}"`,
    `VOICE: ${BRAND.voice.join(' ')}`,
    `REAL LINES FROM THE BRAND'S SOCIAL FEED (match this voice, don't copy): ${BRAND.examples.map((e) => `"${e}"`).join('; ')}`,
    `NEVER USE: ${BRAND.avoid.join(', ')}.`,
    j && `JOURNEY PROPOSITION: ${j.proposition}`,
    j && `JOURNEY TONE: ${j.tone} ${j.toneGuidance.join('; ')}.`,
    j && `MANDATORY DISCLAIMER (added by the layout system, do not repeat in copy): ${j.disclaimer}`,
  ]
    .filter(Boolean)
    .join('\n')
}

/** Words that must not appear in the other journey's copy. */
export const JOURNEY_LEAKS: Record<Journey, RegExp> = {
  rental: /\b(shared ownership|buy a share|staircas\w*|mortgage|deposit from|own a share)\b/i,
  shared: /\b(no agency fees|tenancy|tenancies|rent direct)\b/i,
}

export const BANNED = new RegExp(`\\b(${BRAND.avoid.join('|')})\\b`, 'i')
