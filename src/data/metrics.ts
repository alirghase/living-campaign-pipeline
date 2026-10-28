import type { Channel, ReviewType } from './types'

/** Synthetic pre-automation baseline (manual, email-driven process). */
export const BASELINE = {
  briefToLaunchDays: 8.5,
  approvalWaitHours: 2.3 * 24,
  revisionRounds: 3.8,
  approvalRounds: 2.6,
  costPerAsset: 85,
}

/** Quarter-to-date figures the live demo data blends into. */
export const QUARTER_TO_DATE = {
  briefToLaunchDays: 3.2,
  approvalWaitHours: 5.1,
  revisionRounds: 1.4,
  approvalRounds: 1.2,
  reuseRate: 0.34,
  firstPassQa: 0.82,
  routineCaught: 0.94,
  toolRevisions: { Firefly: 1.2, 'Figma AI': 1.6, Copilot: 2.4 },
  reviewHours: { brand: 3.1, business: 4.8, risk: 5.6 } as Record<ReviewType, number>,
  rentalShare: 0.58,
  funnel: [1, 0.98, 0.92, 0.85, 0.79, 0.76],
  library: { published: 98, ready: 42, archived: 16 },
}

/** How many completed assets earlier in the quarter sit behind each average. */
export const HISTORY_WEIGHT = 60

export const REVIEW_TARGET_HOURS: Record<ReviewType, number> = { brand: 4, business: 5, risk: 4 }

/** Cost model: tooling + design time + review time per asset. */
export const COST_MODEL = { fixed: 6.8, perRevision: 4 }

/** Brief-to-launch days for the 11 weeks before the current one. */
export const WEEKLY_LAUNCH_DAYS = [8.5, 8.2, 7.6, 7.1, 6.3, 5.7, 5.1, 4.6, 4.1, 3.7, 3.4]

/** Assets published per channel in the two months before the current one. */
export const MONTHLY_CHANNEL: Record<Channel, number>[] = [
  { facebook: 8, instagram: 12, linkedin: 3, google: 6, email: 5 },
  { facebook: 11, instagram: 15, linkedin: 5, google: 8, email: 7 },
]

export const FUNNEL_STAGES = ['Briefed', 'Routed', 'Created', 'Passed QA', 'Approved', 'Published']
