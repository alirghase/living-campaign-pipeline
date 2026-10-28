import type { Channel, Journey } from './types'

export interface JourneyPreset {
  proposition: string
  templates: string[]
  tone: string
  toneGuidance: string[]
  constraints: string[]
  keyMessages: string[]
  disclaimer: string
  defaultChannels: Channel[]
  slaHours: number
  ownerId: string
}

export const journeyPresets: Record<Journey, JourneyPreset> = {
  rental: {
    proposition:
      'Professionally managed build-to-rent homes. No agency fees, longer tenancies, transparent annual rent reviews and on-site teams.',
    templates: ['Rental Social Kit v4', 'Rental Display Pack v2', 'Rental Email Header v3'],
    tone: 'Warm, direct, confident. Talk about the home and the lifestyle, never the paperwork.',
    toneGuidance: ['Lead with the home, not the landlord', 'Short sentences, second person', 'Name the neighbourhood', 'No "luxury" or "exclusive"'],
    constraints: ['Rental teal palette only', 'Logo top-left, 8% safe zone', 'Show real availability dates', 'Include holding-deposit line'],
    keyMessages: ['No agency fees', 'Pet-friendly homes', 'Move in this month', 'On-site team 7 days a week'],
    disclaimer: "Holding deposit equal to one week's rent. Subject to referencing and availability.",
    defaultChannels: ['facebook', 'instagram', 'google', 'email'],
    slaHours: 8,
    ownerId: 't7',
  },
  shared: {
    proposition:
      'Buy a share of a new home (10–75%) and pay rent on the rest. Smaller deposit, lower monthly cost, staircase to full ownership over time.',
    templates: ['Shared Ownership Social Kit v3', 'SO Display Pack v2', 'SO Email Header v2'],
    tone: 'Reassuring, clear, plain English. Explain before you sell; never overpromise affordability.',
    toneGuidance: ['Explain how it works in one line', 'Always show the full monthly cost', 'Avoid "free" or "guaranteed"', 'Plain English over jargon'],
    constraints: ['Shared Ownership purple palette only', 'Logo top-left, 8% safe zone', 'Eligibility line on every asset', 'Repossession risk disclaimer required'],
    keyMessages: ['Buy a share from 10%', 'Deposits from 5% of your share', 'Staircase to 100%', 'Check eligibility in 2 minutes'],
    disclaimer:
      'Shared Ownership homes are leasehold. Your home may be repossessed if you do not keep up repayments on your mortgage or rent. Eligibility criteria apply.',
    defaultChannels: ['facebook', 'instagram', 'linkedin', 'email'],
    slaHours: 12,
    ownerId: 't8',
  },
}
