import { journeyPresets } from '@/data/journeys'
import type { Journey } from '@/data/types'

/**
 * Lloyds Living brand book, condensed into something agents can follow.
 * Every agent prompt embeds the relevant slice so the outputs stay on brand.
 */
export const BRAND = {
  name: 'Lloyds Living',
  parent: 'Lloyds Banking Group',
  about:
    'Lloyds Living is the private rental and Shared Ownership business of Lloyds Banking Group, launched in 2021 as Citra Living. It owns and manages thousands of brand-new, energy-efficient homes across the UK, bought from housebuilders such as Barratt Redrow, Bellway and Keepmoat, and looks after residents with its own in-house team.',
  palette: {
    'Lloyds green': '#00864f',
    'Deep green': '#004a36',
    Lime: '#77ba00',
    'Lloyds blue (Shared Ownership)': '#2178b0',
    'Warm stone': '#efedea',
    Ink: '#1a1a1a',
  },
  voice: [
    'Warm, plain-spoken and confident. Sounds like a good neighbour, not an estate agent.',
    'Lead with the home and the life in it, not the landlord or the paperwork.',
    'Short sentences. Second person. Name the place.',
    'Be specific: energy-efficient, garden, parking, in-house team, no agency fees.',
  ],
  avoid: ['luxury', 'exclusive', 'guaranteed', 'free', 'dream home', 'once in a lifetime', 'hurry', 'act now'],
  artDirection: [
    'Photographic, natural daylight, warm late-afternoon or soft morning light, true-to-life colour.',
    'Brand-new UK suburban homes: red or buff brick semis and terraces, pitched roofs, small front gardens, tidy paths, young trees.',
    'Real, diverse people (couples, young families, key workers, people with dogs) mid-moment, candid, never posing at camera.',
    'Calm, uncluttered composition with clean negative space for headline and logo placement.',
    'Subtle greens in planting, doors or clothing; nothing neon, nothing oversaturated.',
    'Absolutely no text, letters, signage, logos, watermarks or brand marks anywhere in the image.',
  ],
}

export function brandContext(journey?: Journey) {
  const j = journey ? journeyPresets[journey] : undefined
  return [
    `BRAND: ${BRAND.name} (${BRAND.parent}). ${BRAND.about}`,
    `VOICE: ${BRAND.voice.join(' ')}`,
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
