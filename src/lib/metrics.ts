import { assets as seedAssets } from '@/data/assets'
import { briefs as seedBriefs } from '@/data/briefs'
import {
  BASELINE,
  COST_MODEL,
  FUNNEL_STAGES,
  HISTORY_WEIGHT,
  MONTHLY_CHANNEL,
  QUARTER_TO_DATE as Q,
  REVIEW_TARGET_HOURS,
  WEEKLY_LAUNCH_DAYS,
} from '@/data/metrics'
import type { Asset, Brief, Channel, ReviewType, Tool } from '@/data/types'
import { isOverdue } from './selectors'
import { D, H } from './time'

/** Raw observations from the current demo state. */
function observe(briefs: Brief[], assets: Asset[]) {
  const brief = new Map(briefs.map((b) => [b.id, b]))
  const launched = assets.filter((a) => a.stage === 'published' && a.deliveryStatus !== 'Scheduled')
  const approved = assets.filter((a) => a.stage === 'approved' || a.stage === 'published')
  const checked = assets.filter((a) => a.qaAt)
  const reviewHours = (t: ReviewType) =>
    assets.filter((a) => a.reviews[t].status === 'approved' && a.reviews[t].at && a.submittedAt).map((a) => (a.reviews[t].at! - a.submittedAt!) / H)
  const toolRevs = (t: Tool) => approved.filter((a) => a.tool === t).map((a) => a.revisions)
  const auditCount = (re: RegExp) => assets.reduce((n, a) => n + a.audit.filter((e) => re.test(e.action)).length, 0)
  const passedQa = assets.filter((a) => ['approval', 'approved', 'published'].includes(a.stage)).length
  const nonDraft = briefs.filter((b) => b.status !== 'Draft')
  return {
    launchDays: launched.map((a) => (a.publishedAt! - brief.get(a.briefId)!.createdAt) / D),
    approvalWait: approved.filter((a) => a.submittedAt).map((a) => (a.approvedAt! - a.submittedAt!) / H),
    revisions: approved.map((a) => a.revisions),
    approvalRounds: approved.map((a) => a.approvalRounds),
    reused: assets.map((a) => (a.reused ? 1 : 0)),
    firstPass: checked.map((a) => (a.firstPassQa ? 1 : 0)),
    review: { brand: reviewHours('brand'), business: reviewHours('business'), risk: reviewHours('risk') },
    tools: { Firefly: toolRevs('Firefly'), 'Figma AI': toolRevs('Figma AI'), Copilot: toolRevs('Copilot') },
    caught: auditCount(/^Pre-checks (failed|passed with)/),
    missed: auditCount(/(requested changes|rejected)/),
    rental: assets.filter((a) => a.journey === 'rental').length,
    shared: assets.filter((a) => a.journey === 'shared').length,
    funnel: [
      briefs.reduce((n, b) => n + b.formats.length, 0),
      nonDraft.reduce((n, b) => n + b.formats.length, 0),
      assets.length,
      passedQa,
      approved.length,
      launched.length,
    ],
    library: {
      published: assets.filter((a) => a.stage === 'published').length,
      ready: assets.filter((a) => a.stage === 'approved').length,
    },
  }
}

type Obs = ReturnType<typeof observe>
const seed: Obs = observe(seedBriefs, seedAssets)

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

/**
 * Blend live observations into a quarter-to-date average. Calibrated so the
 * untouched demo shows the target figure; every action in the demo then moves it.
 */
function blend(target: number, seedXs: number[], liveXs: number[], weight = HISTORY_WEIGHT) {
  const histSum = target * (weight + seedXs.length) - sum(seedXs)
  return (histSum + sum(liveXs)) / (weight + liveXs.length)
}

function blendCount(target: number, seedCount: number, liveCount: number) {
  return target - seedCount + liveCount
}

export interface Kpi {
  key: string
  label: string
  value: number
  display: string
  baseline?: string
  delta?: number
  better: 'down' | 'up'
}

export function computeInsights(briefs: Brief[], assets: Asset[]) {
  const o = observe(briefs, assets)
  const launch = blend(Q.briefToLaunchDays, seed.launchDays, o.launchDays)
  const wait = blend(Q.approvalWaitHours, seed.approvalWait, o.approvalWait)
  const revisions = blend(Q.revisionRounds, seed.revisions, o.revisions)
  const rounds = blend(Q.approvalRounds, seed.approvalRounds, o.approvalRounds)
  const reuse = blend(Q.reuseRate, seed.reused, o.reused)
  const firstPass = blend(Q.firstPassQa, seed.firstPass, o.firstPass)
  const cost = COST_MODEL.fixed + COST_MODEL.perRevision * revisions
  const tools = Object.fromEntries(
    (Object.keys(Q.toolRevisions) as Tool[]).map((t) => [t, blend(Q.toolRevisions[t], seed.tools[t], o.tools[t], 20)]),
  ) as Record<Tool, number>
  const review = Object.fromEntries(
    (['brand', 'business', 'risk'] as ReviewType[]).map((t) => [t, blend(Q.reviewHours[t], seed.review[t], o.review[t], 40)]),
  ) as Record<ReviewType, number>
  const caughtBase = 47
  const missedBase = Math.round((caughtBase * (1 - Q.routineCaught)) / Q.routineCaught)
  const caught = caughtBase - seed.caught + o.caught
  const missed = missedBase - seed.missed + o.missed
  const routineCaught = caught / (caught + missed)

  const pct = (from: number, to: number) => Math.round(((to - from) / from) * 100)

  const kpis: Kpi[] = [
    { key: 'launch', label: 'Brief to launch', value: launch, display: `${launch.toFixed(1)} days`, baseline: `${BASELINE.briefToLaunchDays} days`, delta: pct(BASELINE.briefToLaunchDays, launch), better: 'down' },
    { key: 'wait', label: 'Waiting for approval', value: wait, display: `${wait.toFixed(1)}h`, baseline: `${(BASELINE.approvalWaitHours / 24).toFixed(1)} days`, delta: pct(BASELINE.approvalWaitHours, wait), better: 'down' },
    { key: 'revisions', label: 'Revision rounds', value: revisions, display: revisions.toFixed(1), baseline: `${BASELINE.revisionRounds}`, delta: pct(BASELINE.revisionRounds, revisions), better: 'down' },
    { key: 'rounds', label: 'Approval rounds', value: rounds, display: rounds.toFixed(1), baseline: `${BASELINE.approvalRounds}`, delta: pct(BASELINE.approvalRounds, rounds), better: 'down' },
    { key: 'reuse', label: 'Asset reuse rate', value: reuse, display: `${Math.round(reuse * 100)}%`, better: 'up' },
    { key: 'cost', label: 'Cost per asset', value: cost, display: `£${cost.toFixed(2)}`, baseline: `£${BASELINE.costPerAsset}`, delta: pct(BASELINE.costPerAsset, cost), better: 'down' },
  ]

  // Charts
  const weekly = [...WEEKLY_LAUNCH_DAYS, launch].map((v, i) => ({ week: `W${i + 1}`, days: Number(v.toFixed(1)), baseline: BASELINE.briefToLaunchDays }))

  const monthNames = [-2, -1, 0].map((off) => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() + off)
    return d.toLocaleDateString('en-GB', { month: 'short' })
  })
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  const thisMonth = (list: Asset[]) => {
    const out: Record<Channel, number> = { facebook: 0, instagram: 0, linkedin: 0, google: 0, email: 0 }
    for (const a of list) if (a.stage === 'published' && a.publishedAt && a.publishedAt >= monthStart.getTime()) out[a.channel]++
    return out
  }
  // Earlier this month (before the demo data) plus everything published live
  const liveMonth = thisMonth(assets)
  const currentMonth = Object.fromEntries(
    (Object.keys(liveMonth) as Channel[]).map((c) => [c, Math.round(MONTHLY_CHANNEL[1][c] * 0.6) + liveMonth[c]]),
  ) as Record<Channel, number>
  const byMonth = [MONTHLY_CHANNEL[0], MONTHLY_CHANNEL[1], currentMonth].map((m, i) => ({ month: monthNames[i], ...m }))

  const total = 200
  const funnelCounts = Q.funnel.map((t, i) => blendCount(Math.round(t * total), seed.funnel[i], o.funnel[i]))
  const funnel = FUNNEL_STAGES.map((stage, i) => ({
    stage,
    count: funnelCounts[i],
    pct: Math.round((funnelCounts[i] / funnelCounts[0]) * 100),
  }))

  const journeyTotal = 150
  const rental = blendCount(Math.round(journeyTotal * Q.rentalShare), seed.rental, o.rental)
  const shared = blendCount(journeyTotal - Math.round(journeyTotal * Q.rentalShare), seed.shared, o.shared)
  const journeys = [
    { name: 'Rental', value: rental, pct: Math.round((rental / (rental + shared)) * 100) },
    { name: 'Shared Ownership', value: shared, pct: Math.round((shared / (rental + shared)) * 100) },
  ]

  const reviewChart = (['brand', 'business', 'risk'] as ReviewType[]).map((t) => ({
    type: t[0].toUpperCase() + t.slice(1),
    hours: Number(review[t].toFixed(1)),
    target: REVIEW_TARGET_HOURS[t],
  }))

  const revisionsByCampaign = briefs
    .map((b) => {
      const own = assets.filter((a) => a.briefId === b.id)
      return { name: b.name, journey: b.journey, revisions: sum(own.map((a) => a.revisions)) }
    })
    .filter((r) => r.revisions > 0)
    .sort((a, b) => b.revisions - a.revisions)
    .slice(0, 10)

  const assumptions = [
    { assumption: 'AI produces near-final assets', evidence: `${Math.round(firstPass * 100)}% pass pre-checks on first attempt`, ok: firstPass >= 0.75 },
    { assumption: 'Specialist tools beat general tools', evidence: `Firefly assets: ${tools.Firefly.toFixed(1)} avg revisions vs Copilot: ${tools.Copilot.toFixed(1)}`, ok: tools.Firefly < tools.Copilot },
    { assumption: 'A standard brief reduces rework', evidence: `Revision rounds down ${Math.round((1 - revisions / BASELINE.revisionRounds) * 100)}%`, ok: revisions < BASELINE.revisionRounds },
    { assumption: 'Pre-checks save approver time', evidence: `Routine issues caught: ${Math.round(routineCaught * 100)}% before human review`, ok: routineCaught >= 0.85 },
    { assumption: 'Parallel approvals shorten the cycle', evidence: `Approval wait down from ${(BASELINE.approvalWaitHours / 24).toFixed(1)} days to ${wait.toFixed(1)}h`, ok: wait < BASELINE.approvalWaitHours },
    { assumption: 'The process is measurably faster', evidence: `Brief to launch: ${launch.toFixed(1)} days (was ${BASELINE.briefToLaunchDays})`, ok: launch < BASELINE.briefToLaunchDays },
  ]

  const health: { text: string; tone: 'red' | 'amber' | 'green' }[] = []
  for (const t of ['brand', 'business', 'risk'] as ReviewType[]) {
    const overdue = assets.filter((a) => isOverdue(a) && a.reviews[t].status !== 'approved').length
    const over = review[t] > REVIEW_TARGET_HOURS[t]
    if (over || overdue)
      health.push({
        text: `${t[0].toUpperCase() + t.slice(1)} review averaging ${review[t].toFixed(1)}h (target: ${REVIEW_TARGET_HOURS[t]}h)${overdue ? ` — ${overdue} asset${overdue > 1 ? 's' : ''} overdue` : ''}`,
        tone: over && overdue ? 'red' : 'amber',
      })
  }
  const fails = assets.filter((a) => a.stage === 'qa' && a.qaState === 'fail').length
  if (fails) health.push({ text: `${fails} asset${fails > 1 ? 's' : ''} blocked at pre-checks — missing regulatory disclaimer`, tone: 'amber' })
  const waiting = briefs.filter((b) => b.status === 'Routed' && !assets.some((a) => a.briefId === b.id)).length
  if (waiting) health.push({ text: `${waiting} routed brief${waiting > 1 ? 's' : ''} waiting for asset generation`, tone: 'amber' })
  if (!health.length) health.push({ text: 'No bottlenecks — every stage within target', tone: 'green' })

  return { kpis, weekly, byMonth, funnel, journeys, reviewChart, revisionsByCampaign, assumptions, health }
}

/** Library header counts: earlier quarters plus everything in the live demo. */
export function libraryTotals(assets: Asset[]) {
  const live = {
    published: assets.filter((a) => a.stage === 'published').length,
    ready: assets.filter((a) => a.stage === 'approved').length,
  }
  const published = blendCount(Q.library.published, seed.library.published, live.published)
  const ready = blendCount(Q.library.ready, seed.library.ready, live.ready)
  const archived = Q.library.archived
  return { total: published + ready + archived, published, ready, archived }
}
