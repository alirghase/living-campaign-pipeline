import { useMemo } from 'react'
import { PILOT_BRIEF_ID } from '@/data/briefs'
import { formats } from '@/data/formats'
import type { Asset, Brief, BriefStatus, ReviewType } from '@/data/types'
import { useStore } from '@/store/useStore'
import { isToday } from './time'

export function briefStatus(brief: Brief, assets: Asset[]): BriefStatus {
  const own = assets.filter((a) => a.briefId === brief.id)
  if (!own.length) return brief.status
  if (own.every((a) => a.stage === 'published')) return 'Live'
  if (own.every((a) => a.stage === 'approved' || a.stage === 'published')) return 'Approved'
  if (own.some((a) => a.stage === 'qa' || a.stage === 'approval')) return 'In Review'
  return 'In Production'
}

export function matchesSearch(q: string, asset: Asset, brief: Brief | undefined) {
  if (!q) return true
  const hay = [brief?.name, brief?.development, formats[asset.format].label, asset.channel, asset.tool, ...asset.headlines]
    .join(' ')
    .toLowerCase()
  return hay.includes(q.toLowerCase())
}

/** Briefs and assets after the Pilot scope and global search are applied. */
export function useScoped() {
  const briefs = useStore((s) => s.briefs)
  const assets = useStore((s) => s.assets)
  const pilot = useStore((s) => s.pilot)
  const search = useStore((s) => s.search)
  return useMemo(() => {
    const byId = new Map(briefs.map((b) => [b.id, b]))
    const scopedBriefs = pilot ? briefs.filter((b) => b.id === PILOT_BRIEF_ID) : briefs
    const scopedAssets = assets.filter(
      (a) => (!pilot || a.briefId === PILOT_BRIEF_ID) && matchesSearch(search, a, byId.get(a.briefId)),
    )
    const searchedBriefs = search
      ? scopedBriefs.filter(
          (b) =>
            `${b.name} ${b.development}`.toLowerCase().includes(search.toLowerCase()) ||
            scopedAssets.some((a) => a.briefId === b.id),
        )
      : scopedBriefs
    return { briefs: searchedBriefs, assets: scopedAssets, briefById: byId, allBriefs: briefs, allAssets: assets }
  }, [briefs, assets, pilot, search])
}

export const isOverdue = (a: Asset, now = Date.now()) => a.stage === 'approval' && !!a.slaDue && a.slaDue < now

export function pendingTypes(a: Asset): ReviewType[] {
  return (['brand', 'business', 'risk'] as ReviewType[]).filter((t) => a.reviews[t].status !== 'approved')
}

export interface StageInfo {
  key: string
  label: string
  path: string
  count: number
  unit: string
  health: 'green' | 'amber' | 'red'
  note: string
}

export function stageInfo(briefs: Brief[], assets: Asset[]): StageInfo[] {
  const by = (stage: Asset['stage']) => assets.filter((a) => a.stage === stage)
  const drafts = briefs.filter((b) => b.status === 'Draft').length
  const routed = briefs.filter((b) => b.status === 'Routed' && !assets.some((a) => a.briefId === b.id)).length
  const creation = by('creation')
  const returned = creation.filter((a) => a.qaState === 'fail').length
  const qa = by('qa')
  const fails = qa.filter((a) => a.qaState === 'fail').length
  const warns = qa.filter((a) => a.qaState === 'warn').length
  const approval = by('approval')
  const overdue = approval.filter((a) => isOverdue(a)).length
  const published = by('published')
  const scheduled = published.filter((a) => a.deliveryStatus === 'Scheduled').length
  const paused = published.filter((a) => a.deliveryStatus === 'Paused').length
  const live = published.filter((a) => a.deliveryStatus === 'Live').length
  return [
    { key: 'brief', label: 'Structured Brief', path: '/briefs', count: drafts, unit: 'drafts', health: drafts > 2 ? 'amber' : 'green', note: drafts ? `${drafts} awaiting routing` : 'All briefs routed' },
    { key: 'routing', label: 'Journey Routing', path: '/routing', count: routed, unit: 'briefs', health: routed > 2 ? 'amber' : 'green', note: routed ? `${routed} ready to generate` : 'Queues clear' },
    { key: 'creation', label: 'AI Content & Assets', path: '/studio', count: creation.length, unit: 'assets', health: returned ? 'amber' : 'green', note: returned ? `${returned} returned from QA` : 'Generating on brief' },
    { key: 'qa', label: 'Automated Pre-Checks', path: '/checks', count: qa.length, unit: 'assets', health: fails > 1 ? 'red' : fails || warns ? 'amber' : 'green', note: fails ? `${fails} blocked, ${warns} warnings` : warns ? `${warns} warnings` : 'All clear' },
    { key: 'approval', label: 'Brand, Business & Risk', path: '/approvals', count: approval.length, unit: 'assets', health: overdue > 2 ? 'red' : overdue ? 'amber' : 'green', note: overdue ? `${overdue} past SLA` : 'Within SLA' },
    { key: 'package', label: 'Approved Package', path: '/library', count: by('approved').length, unit: 'ready', health: 'green', note: 'Single source of truth' },
    { key: 'delivery', label: 'Channel Delivery', path: '/delivery', count: live + scheduled, unit: 'live/scheduled', health: paused ? 'amber' : 'green', note: paused ? `${paused} paused` : `${scheduled} scheduled` },
    { key: 'insights', label: 'Measurement & Insights', path: '/insights', count: live, unit: 'measured', health: 'green', note: 'Tracking live assets' },
  ]
}

export function summary(briefs: Brief[], assets: Asset[]) {
  return {
    campaigns: briefs.filter((b) => b.status !== 'Draft').length,
    inPipeline: assets.filter((a) => a.stage !== 'published').length,
    awaitingApproval: assets.filter((a) => a.stage === 'approval').length,
    publishedToday: assets.filter((a) => a.stage === 'published' && a.deliveryStatus !== 'Scheduled' && isToday(a.publishedAt)).length,
  }
}

export interface Attention {
  id: string
  text: string
  path: string
  tone: 'red' | 'amber'
}

export function attentionItems(briefs: Brief[], assets: Asset[]): Attention[] {
  const name = (id: string) => briefs.find((b) => b.id === id)?.name ?? ''
  const items: Attention[] = []
  for (const a of assets.filter((x) => isOverdue(x)))
    items.push({ id: `o-${a.id}`, text: `${formats[a.format].short} for ${name(a.briefId)} is past its approval SLA`, path: '/approvals', tone: 'red' })
  for (const a of assets.filter((x) => x.stage === 'qa' && x.qaState === 'fail'))
    items.push({ id: `f-${a.id}`, text: `${formats[a.format].short} for ${name(a.briefId)} failed pre-checks`, path: '/checks', tone: 'red' })
  for (const b of briefs.filter((x) => x.status === 'Routed' && !assets.some((a) => a.briefId === x.id)))
    items.push({ id: `r-${b.id}`, text: `${b.name} is routed and ready to generate`, path: '/routing', tone: 'amber' })
  for (const b of briefs.filter((x) => x.status === 'Draft'))
    items.push({ id: `d-${b.id}`, text: `${b.name} is a draft awaiting routing`, path: '/briefs', tone: 'amber' })
  return items
}
