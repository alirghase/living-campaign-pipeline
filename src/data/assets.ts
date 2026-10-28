import { H, NOW, startOfToday } from '@/lib/time'
import { assetPlans, briefs } from './briefs'
import { runChecks } from './checks'
import { generateCopy } from './copy'
import { formats } from './formats'
import { REVIEWER } from './team'
import type { Asset, AuditEntry, Brief, CheckStatus, FormatId, Review, ReviewType, Tool } from './types'

const TOOLS: Tool[] = ['Firefly', 'Firefly', 'Figma AI', 'Copilot', 'Firefly', 'Figma AI']
const REVISIONS: Record<Tool, number[]> = { Firefly: [1, 0, 2, 1, 1], 'Figma AI': [1, 2, 1], Copilot: [2, 3, 2] }
const REVIEW_GAP: Record<ReviewType, number> = { brand: 2.6, business: 4.2, risk: 5.1 }
export const REVIEW_TYPES: ReviewType[] = ['brand', 'business', 'risk']

const pendingReviews = (): Record<ReviewType, Review> => ({
  brand: { status: 'pending', reviewerId: REVIEWER.brand },
  business: { status: 'pending', reviewerId: REVIEWER.business },
  risk: { status: 'pending', reviewerId: REVIEWER.risk },
})

export function toolFor(index: number): Tool {
  return TOOLS[index % TOOLS.length]
}

/** One channel adaptation of a brief, fresh out of the AI studio. */
export function createAsset(brief: Brief, format: FormatId, index: number, createdAt: number, outcome: CheckStatus): Asset {
  const copy = generateCopy(brief, format, 0)
  const tool = toolFor(index + brief.name.length)
  return {
    id: `${brief.id}-${format}-${createdAt.toString(36).slice(-4)}`,
    briefId: brief.id,
    journey: brief.journey,
    format,
    channel: formats[format].channel,
    ...copy,
    variant: 0,
    version: 1,
    tool,
    stage: 'creation',
    qaState: 'not-run',
    qa: null,
    qaOutcome: outcome,
    firstPassQa: outcome === 'pass',
    revisions: 0,
    approvalRounds: 0,
    createdAt,
    reviews: pendingReviews(),
    reused: !!brief.reusedFrom,
    audit: [{ at: createdAt, actorId: 't5', action: `Generated ${formats[format].label} with ${tool}` }],
  }
}

function seedAssets(): Asset[] {
  const out: Asset[] = []
  briefs.forEach((brief, bi) => {
    assetPlans[brief.id].forEach((plan, i) => {
      const created = brief.routedAt! + 6 * H + i * 0.4 * H
      const asset = createAsset(brief, plan.format, bi + i, created, plan.qa ?? 'pass')
      asset.id = `${brief.id}-${plan.format}`
      asset.stage = plan.stage
      const audit: AuditEntry[] = [
        { at: brief.createdAt, actorId: brief.ownerId, action: 'Brief created' },
        { at: brief.routedAt!, actorId: 'system', action: `Auto-routed to ${brief.journey === 'rental' ? 'Rental' : 'Shared Ownership'} queue` },
        ...asset.audit,
      ]
      const past = plan.stage !== 'creation' && plan.stage !== 'qa'
      const tool = asset.tool
      const rev = REVISIONS[tool][(bi + i) % REVISIONS[tool].length]

      if (plan.stage === 'qa' && plan.qaRun) {
        asset.qaAt = created + 2 * H
      }
      if (past) {
        asset.qaAt = created + 2 * H
        asset.revisions = rev
        asset.version = 1 + Math.min(rev, 2)
        asset.firstPassQa = (bi + i) % 7 !== 0
        asset.submittedAt = plan.submittedHoursAgo ? NOW - plan.submittedHoursAgo * H : asset.qaAt + H
        asset.submittedBy = brief.ownerId
        asset.slaDue = asset.submittedAt + brief.slaHours * H
        asset.approvalRounds = (bi + i) % 5 === 0 ? 2 : 1
      }
      if (asset.qaAt) {
        asset.qa = runChecks(asset, brief)
        asset.qaState = past ? 'pass' : asset.qaOutcome
        audit.push({
          at: asset.qaAt,
          actorId: 'system',
          action: asset.qaState === 'fail' ? 'Pre-checks failed: regulatory disclaimer' : `Pre-checks ${asset.qaState === 'warn' ? 'passed with 1 warning' : 'passed 8/8'}`,
        })
      }
      if (asset.submittedAt) {
        audit.push({ at: asset.submittedAt, actorId: brief.ownerId, action: 'Submitted for brand, business & risk approval' })
        for (const type of REVIEW_TYPES) {
          const status = plan.stage === 'approval' ? (plan.reviews?.[type] ?? 'pending') : 'approved'
          const r: Review = { status, reviewerId: REVIEWER[type] }
          if (status !== 'pending') r.startedAt = asset.submittedAt + 0.4 * H
          if (status === 'approved') r.at = Math.min(asset.submittedAt + REVIEW_GAP[type] * H * (0.8 + ((bi + i) % 4) * 0.15), NOW - 0.2 * H)
          asset.reviews[type] = r
        }
        const events = REVIEW_TYPES.map((t) => ({ t, r: asset.reviews[t] }))
          .filter((e) => e.r.at)
          .sort((a, b) => a.r.at! - b.r.at!)
        for (const { t, r } of events) audit.push({ at: r.at!, actorId: r.reviewerId, action: `${t[0].toUpperCase() + t.slice(1)} approved` })
      }
      if (plan.stage === 'approved' || plan.stage === 'published') {
        const last = Math.max(...REVIEW_TYPES.map((t) => asset.reviews[t].at!))
        asset.approvedAt = last
        asset.approvedBy = REVIEWER[REVIEW_TYPES.find((t) => asset.reviews[t].at === last)!]
        audit.push({ at: last + 60_000, actorId: 'system', action: 'Added to approved campaign package' })
      }
      if (plan.stage === 'published') {
        const h = plan.publishedHoursAgo
        let at = h === undefined ? asset.approvedAt! + 30 * H : NOW - h * H
        if (h !== undefined && h > 0 && h < 12) at = Math.max(at, startOfToday(NOW) + 5 * 60_000)
        asset.publishedAt = at
        asset.deliveryStatus = plan.delivery ?? 'Live'
        audit.push({
          at: asset.deliveryStatus === 'Scheduled' ? asset.approvedAt! + H : at,
          actorId: 'system',
          action: asset.deliveryStatus === 'Scheduled' ? `Scheduled for ${formats[plan.format].label}` : `Published to ${formats[plan.format].label}`,
        })
      }
      asset.audit = audit.sort((a, b) => a.at - b.at)
      out.push(asset)
    })
  })
  return out
}

export const assets: Asset[] = seedAssets()
