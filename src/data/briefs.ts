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
    name: 'Rental Q1 London',
    journey: 'rental',
    development: 'Living Stratford',
    objective: 'Fill 40 newly completed homes at Living Stratford ahead of Q1 with qualified viewings.',
    audience: 'Young professionals and couples, 24–35, currently renting within 5 miles of E20.',
    keyMessages: ['No agency fees', 'Move in this month', 'Pet-friendly homes', 'On-site team 7 days a week'],
    masterHeadline: 'Your next home is waiting in Stratford',
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
    name: 'Rental Pet-Friendly Homes',
    journey: 'rental',
    development: 'Living Wembley Park',
    objective: 'Position Living as the pet-friendly rental choice in north-west London.',
    audience: 'Renters with pets, 25–40, frustrated by "no pets" listings.',
    keyMessages: ['Pets welcome, no extra deposit', 'Dog-wash station and parks nearby', 'No agency fees'],
    masterHeadline: 'Pet-friendly rentals in London',
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
    name: 'Move-In Ready Manchester',
    journey: 'rental',
    development: 'Living Ancoats',
    objective: 'Convert waiting-list leads into lets for 25 furnished apartments available now.',
    audience: 'Relocating professionals and graduates moving to Manchester.',
    keyMessages: ['Furnished and ready now', 'Bills set up on day one', 'Flexible 1–3 year tenancies'],
    masterHeadline: 'Move in this month — no hidden fees',
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
    name: 'Rental Build-to-Rent Birmingham',
    journey: 'rental',
    development: 'Living Digbeth',
    objective: 'Launch the Digbeth scheme and reach 300 registrations before first completions.',
    audience: 'Birmingham renters 22–35 working in the city centre.',
    keyMessages: ['Brand-new homes', 'Rent direct from Living', 'Roof terrace and co-working'],
    masterHeadline: 'Brand-new homes in Digbeth, ready when you are',
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
    name: 'Rental No Hidden Fees',
    journey: 'rental',
    development: 'Living Lewisham',
    objective: 'Lift enquiry-to-viewing conversion by leading with fee transparency.',
    audience: 'South-east London renters comparing agency listings.',
    keyMessages: ['No agency fees, ever', 'Rent reviews you can plan for', 'Holding deposit of one week'],
    masterHeadline: 'Rent direct from Living. No agency fees, ever.',
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
    name: 'Rental Young Professionals Leeds',
    journey: 'rental',
    development: 'Living Leeds Dock',
    objective: 'Build a waiting list of 200 young professionals for Leeds Dock phase two.',
    audience: 'Graduates and young professionals 22–30 in Leeds.',
    keyMessages: ['Co-working lounge included', 'Gym and roof terrace in the rent', '10 minutes to the station'],
    masterHeadline: 'On-site team, gym and roof terrace — all in the rent',
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
    name: 'Rental Family Homes Bristol',
    journey: 'rental',
    development: 'Living Temple Quarter',
    objective: 'Re-use the pet-friendly creative to promote three-bed family homes in Bristol.',
    audience: 'Families renting in Bristol who need space and good schools nearby.',
    keyMessages: ['Three-bed family homes', 'Pets welcome', 'Longer tenancies for stability'],
    masterHeadline: 'Your own front door, five minutes from the station',
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
    name: 'First-Time Buyer Spring Push',
    journey: 'shared',
    development: 'Living Barking Riverside',
    objective: 'Drive 500 eligibility checks from first-time buyers priced out of open-market purchase.',
    audience: 'First-time buyers 25–40, household income £35k–£80k, renting in east London.',
    keyMessages: ['Buy a share from 10%', 'Smaller deposit', 'Check eligibility in 2 minutes'],
    masterHeadline: 'Own your first home from £1,010/month',
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
    development: 'Living Croydon',
    objective: 'Raise awareness of Shared Ownership as the step between renting and buying.',
    audience: 'Renters 25–45 in south London who assume buying is out of reach.',
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
    development: 'Living Milton Keynes',
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
    development: 'Living Reading',
    objective: 'Re-use spring creative to show existing and prospective owners how staircasing works.',
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
    development: 'Living Ealing',
    objective: 'Reach NHS, education and emergency-service workers with priority-allocation homes.',
    audience: 'Key workers 25–45 in west London, household income under £80k.',
    keyMessages: ['Priority for key workers', 'Deposits from 5% of your share', 'Two-bed homes near hospitals'],
    masterHeadline: 'Key worker? See what you could own in Ealing',
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
    name: 'Rental Winter Move-In Offer',
    journey: 'rental',
    development: 'Living Salford Quays',
    objective: 'Fill December void periods with a first-month-half-rent offer.',
    audience: 'Renters with tenancies ending Dec–Jan in Greater Manchester.',
    keyMessages: ['Half rent for your first month', 'Move in before Christmas', 'No agency fees'],
    masterHeadline: 'Move in this month — no hidden fees',
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
    name: 'Shared Ownership Open House Weekend',
    journey: 'shared',
    development: 'Living Harlow',
    objective: 'Book 120 appointments for the Harlow open-house weekend.',
    audience: 'First-time buyers within 30 minutes of Harlow, 25–40.',
    keyMessages: ['Tour the show home', 'Mortgage adviser on site', 'Check eligibility on the day'],
    masterHeadline: 'Shared Ownership in Harlow — find out if you qualify',
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
    development: 'Living Stevenage',
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
