import { D, H, NOW } from '@/lib/time'
import { journeyPresets } from './journeys'
import type {
  AssetStage,
  Brief,
  Channel,
  CheckStatus,
  DeliveryStatus,
  FormatId,
  Journey,
  Priority,
  ReviewStatus,
  ReviewType,
} from './types'
import { formats } from './formats'

export interface AssetPlan {
  format: FormatId
  stage: AssetStage
  /** Seeded pre-check outcome. */
  qa?: CheckStatus
  /** For assets sitting in pre-checks: has the scan already run? */
  qaRun?: boolean
  reviews?: Partial<Record<ReviewType, ReviewStatus>>
  submittedHoursAgo?: number
  /** Negative values schedule the post in the future. */
  publishedHoursAgo?: number
  delivery?: DeliveryStatus
}

interface BriefSeed {
  id: string
  name: string
  journey: Journey
  development: string
  objective: string
  audience: string
  keyMessages: string[]
  masterHeadline: string
  priority: Priority
  status: Brief['status']
  ownerId: string
  daysAgo: number
  deadlineDays: number
  reusedFrom?: string
  channels?: Channel[]
  plan: AssetPlan[]
}

const P = (format: FormatId, stage: AssetStage, extra: Omit<AssetPlan, 'format' | 'stage'> = {}): AssetPlan => ({
  format,
  stage,
  ...extra,
})

const seeds: BriefSeed[] = [
  {
    id: 'c-r1',
    name: 'Oxenden Park Launch',
    journey: 'rental',
    development: 'Oxenden Park, Herne Bay',
    objective: 'Let the first 60 rental homes at Oxenden Park as the first residents move in this month.',
    audience: 'Couples and young families, 28–45, renting along the north Kent coast.',
    keyMessages: ['Brand-new, energy-efficient homes', 'Managed by our in-house team', 'Gardens and parking', 'Pets considered'],
    masterHeadline: 'Your new home on the Kent coast',
    priority: 'High',
    status: 'In Review',
    ownerId: 't1',
    daysAgo: 4,
    deadlineDays: 3,
    plan: [
      P('ig-post', 'published', { publishedHoursAgo: 3, delivery: 'Live' }),
      P('ig-story', 'published', { publishedHoursAgo: 30, delivery: 'Live' }),
      P('fb-banner', 'approved'),
      P('li-post', 'approval', { reviews: { brand: 'approved', risk: 'in-review' }, submittedHoursAgo: 3 }),
      P('gd-mpu', 'qa', { qa: 'warn', qaRun: true }),
      P('email-header', 'creation'),
    ],
  },
  {
    id: 'c-r2',
    name: 'Pet-Friendly Family Homes',
    journey: 'rental',
    development: 'Lapwings, Burleyfields, Stafford',
    objective: 'Position Lloyds Living as the pet-friendly rental choice for families in Staffordshire.',
    audience: 'Renters with pets, 28–45, frustrated by "no pets" listings.',
    keyMessages: ['Pets considered, every request', 'Private gardens', 'No agency fees'],
    masterHeadline: 'Room for the whole family. Including the dog.',
    priority: 'Medium',
    status: 'Live',
    ownerId: 't7',
    daysAgo: 41,
    deadlineDays: -36,
    plan: [
      P('ig-post', 'published', { delivery: 'Live' }),
      P('ig-story', 'published', { delivery: 'Live' }),
      P('fb-banner', 'published', { delivery: 'Live' }),
      P('gd-mpu', 'published', { delivery: 'Paused' }),
      P('email-header', 'published', { delivery: 'Live' }),
    ],
  },
  {
    id: 'c-r3',
    name: 'Gaydon: 21 New Apartments',
    journey: 'rental',
    development: 'Gaydon',
    objective: 'Let all 21 brand-new apartments at Gaydon within six weeks of completion.',
    audience: 'Engineers and professionals working at nearby Warwickshire employers, 24–40.',
    keyMessages: ['21 brand-new apartments', 'Ready to move in now', 'Professionally managed'],
    masterHeadline: '21 brand-new apartments. Ready when you are.',
    priority: 'High',
    status: 'Approved',
    ownerId: 't7',
    daysAgo: 6,
    deadlineDays: 1,
    plan: [
      P('ig-post', 'approved'),
      P('fb-banner', 'approved'),
      P('li-post', 'approved'),
      P('gd-leaderboard', 'approved'),
      P('email-header', 'approved'),
    ],
  },
  {
    id: 'c-r4',
    name: 'Hampton Beach Autumn Launch',
    journey: 'rental',
    development: 'Hampton Beach, Peterborough',
    objective: 'Launch the first Barratt Redrow homes at Hampton Beach and reach 300 registrations before first move-ins.',
    audience: 'Peterborough renters 25–40 commuting to Cambridge and London.',
    keyMessages: ['First homes available from autumn', 'Energy-efficient new builds', 'Rent direct from Lloyds Living'],
    masterHeadline: 'New homes at Hampton Beach, ready this autumn',
    priority: 'High',
    status: 'In Review',
    ownerId: 't1',
    daysAgo: 3,
    deadlineDays: 2,
    plan: [
      P('ig-post', 'approval', { reviews: { brand: 'in-review', risk: 'in-review' }, submittedHoursAgo: 5 }),
      P('fb-banner', 'approval', { submittedHoursAgo: 1 }),
      P('li-post', 'approval', { reviews: { brand: 'approved', business: 'in-review', risk: 'approved' }, submittedHoursAgo: 11 }),
      P('gd-mpu', 'approved'),
      P('email-header', 'approved'),
    ],
  },
  {
    id: 'c-r5',
    name: 'Rent Direct, No Surprises',
    journey: 'rental',
    development: 'Osprey View, Worksop',
    objective: 'Lift enquiry-to-viewing conversion by leading with transparency and in-house management.',
    audience: 'Worksop renters comparing agency listings, 23–38.',
    keyMessages: ['No agency fees', 'Rent reviews you can plan for', 'Repairs handled by our own team'],
    masterHeadline: 'Rent direct from Lloyds Living. No surprises.',
    priority: 'Medium',
    status: 'In Production',
    ownerId: 't5',
    daysAgo: 1,
    deadlineDays: 5,
    plan: [
      P('ig-post', 'creation'),
      P('ig-story', 'creation'),
      P('fb-banner', 'creation'),
      P('gd-leaderboard', 'qa', { qa: 'pass' }),
      P('email-header', 'qa', { qa: 'pass' }),
    ],
  },
  {
    id: 'c-r6',
    name: 'First Homes in Gedling',
    journey: 'rental',
    development: 'Park View, Gedling',
    objective: 'Build a waiting list of 200 households for the 69 new homes in Gedling, Nottinghamshire.',
    audience: 'Nottingham renters 25–40 looking for more space.',
    keyMessages: ['69 new family homes', 'Energy-efficient, lower bills', 'Gardens and parking'],
    masterHeadline: 'More space, lower bills, brand-new home',
    priority: 'Medium',
    status: 'In Review',
    ownerId: 't5',
    daysAgo: 2,
    deadlineDays: 4,
    plan: [
      P('ig-post', 'qa', { qa: 'pass', qaRun: true }),
      P('ig-story', 'qa', { qa: 'warn', qaRun: true }),
      P('fb-banner', 'qa', { qa: 'pass', qaRun: true }),
      P('li-post', 'qa', { qa: 'pass' }),
      P('gd-mpu', 'qa', { qa: 'fail', qaRun: true }),
    ],
  },
  {
    id: 'c-r7',
    name: 'Family Homes Gainsborough',
    journey: 'rental',
    development: 'Warren Wood View, Gainsborough',
    objective: 'Re-use the pet-friendly creative to promote three-bed family homes at Warren Wood.',
    audience: 'Families renting in Lincolnshire who need space and good schools nearby.',
    keyMessages: ['Three-bed family homes', 'Pets considered', 'Longer tenancies for stability'],
    masterHeadline: 'Your own front door, and a garden to go with it',
    priority: 'Low',
    status: 'Live',
    ownerId: 't7',
    daysAgo: 5,
    deadlineDays: 0,
    reusedFrom: 'c-r2',
    plan: [
      P('ig-post', 'published', { publishedHoursAgo: 2, delivery: 'Live' }),
      P('fb-banner', 'published', { publishedHoursAgo: 5, delivery: 'Live' }),
      P('email-header', 'published', { publishedHoursAgo: 7, delivery: 'Live' }),
      P('gd-mpu', 'published', { publishedHoursAgo: -20, delivery: 'Scheduled' }),
      P('li-post', 'published', { publishedHoursAgo: -44, delivery: 'Scheduled' }),
    ],
  },
  {
    id: 'c-s1',
    name: 'Pathways: Rent Now, Own Later',
    journey: 'shared',
    development: 'Oxenden Park, Herne Bay',
    objective: 'Drive 500 eligibility checks for Pathways, our route from renting to Shared Ownership.',
    audience: 'Renters 25–40 in Kent, household income £35k–£80k, who want to own one day.',
    keyMessages: ['Rent for as long as you like', 'A route to Shared Ownership', 'Check eligibility in 2 minutes'],
    masterHeadline: 'Rent today. Own a share tomorrow.',
    priority: 'High',
    status: 'Live',
    ownerId: 't8',
    daysAgo: 55,
    deadlineDays: -50,
    plan: [
      P('ig-post', 'published', { delivery: 'Live' }),
      P('ig-story', 'published', { delivery: 'Live' }),
      P('fb-banner', 'published', { delivery: 'Live' }),
      P('li-post', 'published', { delivery: 'Live' }),
      P('email-header', 'published', { delivery: 'Paused' }),
    ],
  },
  {
    id: 'c-s2',
    name: 'Shared Ownership Autumn Awareness',
    journey: 'shared',
    development: 'Hampton Beach, Peterborough',
    objective: 'Raise awareness of Shared Ownership as the step between renting and buying.',
    audience: 'Renters 25–45 in Peterborough who assume buying is out of reach.',
    keyMessages: ['The step between renting and buying', 'Buy a share, rent the rest', 'Staircase to 100%'],
    masterHeadline: 'The step between renting and buying',
    priority: 'High',
    status: 'In Review',
    ownerId: 't8',
    daysAgo: 3,
    deadlineDays: 2,
    plan: [
      P('ig-post', 'approval', { reviews: { brand: 'in-review', risk: 'approved' }, submittedHoursAgo: 14 }),
      P('fb-banner', 'approval', { reviews: { brand: 'approved', business: 'approved', risk: 'in-review' }, submittedHoursAgo: 13 }),
      P('li-post', 'approval', { submittedHoursAgo: 2 }),
      P('gd-mpu', 'qa', { qa: 'fail', qaRun: true }),
      P('email-header', 'approved'),
    ],
  },
  {
    id: 'c-s3',
    name: 'Shared Ownership Explained',
    journey: 'shared',
    development: 'Lapwings, Burleyfields, Stafford',
    objective: 'Answer the top five Shared Ownership questions to reduce drop-off at the eligibility step.',
    audience: 'Eligibility-check starters who did not complete, 25–40.',
    keyMessages: ['How rent on the unowned share works', 'Deposits based on your share', 'You can buy more shares later'],
    masterHeadline: 'Buy a share from 10%. Grow it over time.',
    priority: 'Medium',
    status: 'In Production',
    ownerId: 't5',
    daysAgo: 1,
    deadlineDays: 6,
    plan: [P('ig-post', 'creation'), P('fb-banner', 'creation'), P('li-post', 'creation'), P('email-header', 'qa', { qa: 'pass' })],
  },
  {
    id: 'c-s4',
    name: 'Staircasing: Own More Over Time',
    journey: 'shared',
    development: 'Osprey View, Worksop',
    objective: 'Re-use Pathways creative to show prospective owners how staircasing works.',
    audience: 'Prospective buyers worried about being "stuck" at a small share.',
    keyMessages: ['Staircase to 100%', 'Pay less rent as you own more', 'Free valuation guide'],
    masterHeadline: 'Stop renting. Start owning — one share at a time.',
    priority: 'Low',
    status: 'Approved',
    ownerId: 't8',
    daysAgo: 8,
    deadlineDays: 2,
    reusedFrom: 'c-s1',
    plan: [P('ig-post', 'approved'), P('fb-banner', 'approved'), P('li-post', 'approved'), P('gd-leaderboard', 'approved')],
  },
  {
    id: 'c-s5',
    name: 'Shared Ownership Key Workers',
    journey: 'shared',
    development: 'Park View, Gedling',
    objective: 'Reach NHS, education and emergency-service workers in Nottinghamshire with Shared Ownership homes.',
    audience: 'Key workers 25–45 in Nottingham, household income under £80k.',
    keyMessages: ['Homes near major hospitals', 'Deposits from 5% of your share', 'Two and three-bed homes'],
    masterHeadline: 'Key worker? See what you could own in Gedling',
    priority: 'High',
    status: 'In Review',
    ownerId: 't1',
    daysAgo: 2,
    deadlineDays: 3,
    plan: [
      P('ig-post', 'qa', { qa: 'pass', qaRun: true }),
      P('fb-banner', 'qa', { qa: 'pass', qaRun: true }),
      P('li-post', 'qa', { qa: 'warn', qaRun: true }),
      P('email-header', 'qa', { qa: 'pass' }),
      P('gd-mpu', 'qa', { qa: 'pass', qaRun: true }),
    ],
  },
  {
    id: 'c-r8',
    name: 'Winter Move-In',
    journey: 'rental',
    development: 'Warren Wood View, Gainsborough',
    objective: 'Fill December void periods with a move-before-Christmas campaign.',
    audience: 'Renters with tenancies ending Dec–Jan in Lincolnshire.',
    keyMessages: ['Move in before Christmas', 'Brand-new, warm, energy-efficient', 'No agency fees'],
    masterHeadline: 'Home for Christmas. Brand-new and warm.',
    priority: 'Medium',
    status: 'Routed',
    ownerId: 't7',
    daysAgo: 0.3,
    deadlineDays: 6,
    channels: ['facebook', 'instagram', 'google', 'email'],
    plan: [],
  },
  {
    id: 'c-s6',
    name: 'Oxenden Park Open House Weekend',
    journey: 'shared',
    development: 'Oxenden Park, Herne Bay',
    objective: 'Book 120 appointments for the Oxenden Park open-house weekend.',
    audience: 'First-time buyers within 30 minutes of Herne Bay, 25–40.',
    keyMessages: ['Tour the show home', 'Mortgage adviser on site', 'Check eligibility on the day'],
    masterHeadline: 'Shared Ownership in Herne Bay — find out if you qualify',
    priority: 'Medium',
    status: 'Routed',
    ownerId: 't8',
    daysAgo: 0.5,
    deadlineDays: 7,
    channels: ['facebook', 'instagram', 'linkedin', 'email'],
    plan: [],
  },
  {
    id: 'c-s7',
    name: 'Shared Ownership Mortgage Explainer',
    journey: 'shared',
    development: 'Hampton Beach, Peterborough',
    objective: 'Explain Shared Ownership mortgages in plain English to reduce adviser call volume.',
    audience: 'Applicants who have passed eligibility but not booked a mortgage appointment.',
    keyMessages: ['Mortgage only on your share', 'Lenders that support Shared Ownership', 'Free adviser call'],
    masterHeadline: 'The step between renting and buying',
    priority: 'Low',
    status: 'Draft',
    ownerId: 't5',
    daysAgo: 0.1,
    deadlineDays: 10,
    channels: ['facebook', 'email'],
    plan: [],
  },
]

const channelsOf = (plan: AssetPlan[]) => [...new Set(plan.map((p) => formats[p.format].channel))]

export const briefs: Brief[] = seeds.map((s) => {
  const preset = journeyPresets[s.journey]
  const createdAt = NOW - s.daysAgo * D
  const channels = s.channels ?? channelsOf(s.plan)
  return {
    id: s.id,
    name: s.name,
    journey: s.journey,
    development: s.development,
    objective: s.objective,
    audience: s.audience,
    journeyContext: preset.proposition,
    keyMessages: s.keyMessages,
    tone: preset.tone,
    masterHeadline: s.masterHeadline,
    formats: s.plan.length ? s.plan.map((p) => p.format) : defaultFormats(channels),
    constraints: preset.constraints,
    channels,
    priority: s.priority,
    status: s.status,
    ownerId: s.ownerId,
    createdAt,
    routedAt: s.status === 'Draft' ? undefined : createdAt + 0.2 * H,
    deadline: NOW + s.deadlineDays * D + 17 * H - (new Date(NOW).getHours() * H),
    slaHours: preset.slaHours,
    reusedFrom: s.reusedFrom,
  }
})

export const assetPlans: Record<string, AssetPlan[]> = Object.fromEntries(seeds.map((s) => [s.id, s.plan]))

export const PILOT_BRIEF_ID = 'c-r1'

export function defaultFormats(channels: Channel[]): FormatId[] {
  const pick: Record<Channel, FormatId> = {
    instagram: 'ig-post',
    facebook: 'fb-banner',
    linkedin: 'li-post',
    google: 'gd-mpu',
    email: 'email-header',
  }
  const out = channels.map((c) => pick[c])
  if (channels.includes('instagram')) out.splice(1, 0, 'ig-story')
  return out
}
