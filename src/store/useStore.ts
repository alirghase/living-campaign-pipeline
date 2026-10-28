import { create } from 'zustand'
import { assets as seedAssets, createAsset, REVIEW_TYPES } from '@/data/assets'
import { briefs as seedBriefs, defaultFormats } from '@/data/briefs'
import { overall, runChecks } from '@/data/checks'
import { generateCopy } from '@/data/copy'
import { formats, journeyLabel } from '@/data/formats'
import { journeyPresets } from '@/data/journeys'
import { CURRENT_USER_ID, REVIEWER } from '@/data/team'
import type { Asset, Brief, Channel, CheckStatus, Journey, JourneyFilter, Priority, ReviewType } from '@/data/types'
import { D, H } from '@/lib/time'

export interface NewBriefInput {
  name: string
  journey: Journey
  development: string
  objective: string
  audience: string
  channels: Channel[]
  priority: Priority
  deadline: number
  keyMessages?: string[]
  masterHeadline?: string
}

type Decision = 'approved' | 'changes' | 'rejected'

interface State {
  briefs: Brief[]
  assets: Asset[]
  journey: JourneyFilter
  pilot: boolean
  theme: 'dark' | 'light'
  search: string
  setJourney: (j: JourneyFilter) => void
  setPilot: (p: boolean) => void
  toggleTheme: () => void
  setSearch: (s: string) => void
  createBrief: (input: NewBriefInput, route?: boolean) => string
  routeBrief: (id: string) => void
  generateAssets: (briefId: string) => number
  regenerate: (assetId: string) => void
  sendToQa: (assetIds: string[]) => void
  recordChecks: (assetId: string) => CheckStatus
  sendBack: (assetId: string) => void
  submitForApproval: (assetIds: string[]) => void
  startReview: (assetId: string, type: ReviewType) => void
  decide: (assetId: string, type: ReviewType, decision: Decision, comment?: string) => void
  publish: (assetIds: string[]) => void
  toggleDelivery: (assetId: string) => void
  reuse: (assetId: string) => string
  reset: () => void
}

const OUTCOMES: CheckStatus[] = ['pass', 'pass', 'warn', 'pass', 'pass', 'pass', 'fail', 'pass', 'pass', 'warn']
let outcomeCursor = 0

const cap = (t: string) => t[0].toUpperCase() + t.slice(1)

function patchAsset(assets: Asset[], id: string, fn: (a: Asset) => Asset) {
  return assets.map((a) => (a.id === id ? fn(a) : a))
}

function log(a: Asset, action: string, actorId = CURRENT_USER_ID): Asset['audit'] {
  return [...a.audit, { at: Date.now(), actorId, action }]
}

export const useStore = create<State>((set, get) => ({
  briefs: seedBriefs,
  assets: seedAssets,
  journey: 'all',
  pilot: false,
  theme: 'dark',
  search: '',

  setJourney: (journey) => set({ journey }),
  setPilot: (pilot) => set({ pilot }),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
  setSearch: (search) => set({ search }),

  createBrief: (input, route = true) => {
    const now = Date.now()
    const preset = journeyPresets[input.journey]
    const id = `c-new-${now.toString(36)}`
    const brief: Brief = {
      id,
      name: input.name,
      journey: input.journey,
      development: input.development,
      objective: input.objective,
      audience: input.audience,
      journeyContext: preset.proposition,
      keyMessages: input.keyMessages?.length ? input.keyMessages : preset.keyMessages.slice(0, 3),
      tone: preset.tone,
      masterHeadline: input.masterHeadline || (input.journey === 'rental' ? 'Your next home is waiting' : 'The step between renting and buying'),
      formats: defaultFormats(input.channels),
      constraints: preset.constraints,
      channels: input.channels,
      priority: input.priority,
      status: route ? 'Routed' : 'Draft',
      ownerId: CURRENT_USER_ID,
      createdAt: now,
      routedAt: route ? now : undefined,
      deadline: input.deadline,
      slaHours: preset.slaHours,
    }
    set((s) => ({ briefs: [brief, ...s.briefs] }))
    return id
  },

  routeBrief: (id) =>
    set((s) => ({ briefs: s.briefs.map((b) => (b.id === id ? { ...b, status: 'Routed', routedAt: Date.now() } : b)) })),

  generateAssets: (briefId) => {
    const brief = get().briefs.find((b) => b.id === briefId)
    if (!brief) return 0
    const now = Date.now()
    const created = brief.formats.map((f, i) =>
      createAsset(brief, f, i, now + i, OUTCOMES[outcomeCursor++ % OUTCOMES.length]),
    )
    set((s) => ({
      assets: [...created, ...s.assets],
      briefs: s.briefs.map((b) => (b.id === briefId ? { ...b, status: 'In Production' } : b)),
    }))
    return created.length
  },

  regenerate: (assetId) =>
    set((s) => ({
      assets: patchAsset(s.assets, assetId, (a) => {
        const brief = s.briefs.find((b) => b.id === a.briefId)!
        const variant = a.variant + 1
        const fixed = a.qaState === 'fail' || a.qaState === 'warn'
        return {
          ...a,
          ...generateCopy(brief, a.format, variant),
          variant,
          version: a.version + 1,
          revisions: a.qa ? a.revisions + 1 : a.revisions,
          qaOutcome: fixed ? 'pass' : a.qaOutcome,
          qaState: 'not-run',
          qa: null,
          audit: log(a, `Regenerated v${a.version + 1} with ${a.tool}${fixed ? ' (issue fixed)' : ''}`, 't5'),
        }
      }),
    })),

  sendToQa: (assetIds) =>
    set((s) => ({
      assets: s.assets.map((a) =>
        assetIds.includes(a.id) && a.stage === 'creation'
          ? { ...a, stage: 'qa', qaState: 'not-run', qa: null, audit: log(a, 'Sent to automated pre-checks', 't5') }
          : a,
      ),
    })),

  recordChecks: (assetId) => {
    const s = get()
    const asset = s.assets.find((a) => a.id === assetId)!
    const brief = s.briefs.find((b) => b.id === asset.briefId)!
    const qa = runChecks(asset, brief)
    const result = overall(qa)
    const firstRun = asset.revisions === 0 && !asset.qaAt
    const action =
      result === 'fail'
        ? `Pre-checks failed: ${qa.find((c) => c.status === 'fail')!.label.toLowerCase()}`
        : result === 'warn'
          ? 'Pre-checks passed with 1 warning'
          : 'Pre-checks passed 8/8'
    set({
      assets: patchAsset(s.assets, assetId, (a) => ({
        ...a,
        qa,
        qaState: result,
        qaAt: Date.now(),
        firstPassQa: firstRun ? result === 'pass' : a.firstPassQa,
        audit: log(a, action, 'system'),
      })),
    })
    return result
  },

  sendBack: (assetId) =>
    set((s) => ({
      assets: patchAsset(s.assets, assetId, (a) => ({
        ...a,
        stage: 'creation',
        audit: log(a, 'Sent back to creation from pre-checks'),
      })),
    })),

  submitForApproval: (assetIds) =>
    set((s) => ({
      assets: s.assets.map((a) => {
        if (!assetIds.includes(a.id)) return a
        const brief = s.briefs.find((b) => b.id === a.briefId)!
        const now = Date.now()
        return {
          ...a,
          stage: 'approval',
          submittedAt: now,
          submittedBy: CURRENT_USER_ID,
          slaDue: now + brief.slaHours * H,
          approvalRounds: a.approvalRounds + 1,
          reviews: {
            brand: { status: 'pending', reviewerId: REVIEWER.brand },
            business: { status: 'pending', reviewerId: REVIEWER.business },
            risk: { status: 'pending', reviewerId: REVIEWER.risk },
          },
          audit: log(a, 'Submitted for brand, business & risk approval'),
        }
      }),
    })),

  startReview: (assetId, type) =>
    set((s) => ({
      assets: patchAsset(s.assets, assetId, (a) =>
        a.reviews[type].status !== 'pending'
          ? a
          : {
              ...a,
              reviews: { ...a.reviews, [type]: { ...a.reviews[type], status: 'in-review', startedAt: Date.now() } },
              audit: log(a, `${cap(type)} review started`, REVIEWER[type]),
            },
      ),
    })),

  decide: (assetId, type, decision, comment) =>
    set((s) => ({
      assets: patchAsset(s.assets, assetId, (a) => {
        const now = Date.now()
        const reviewerId = REVIEWER[type]
        const reviews = {
          ...a.reviews,
          [type]: { ...a.reviews[type], status: decision, at: now, comment, startedAt: a.reviews[type].startedAt ?? now },
        }
        const verb = decision === 'approved' ? 'approved' : decision === 'changes' ? 'requested changes' : 'rejected'
        let audit = log(a, `${cap(type)} ${verb}${comment ? `: "${comment}"` : ''}`, reviewerId)
        if (decision !== 'approved') {
          return { ...a, reviews, stage: 'creation', qaState: 'not-run', qa: null, revisions: a.revisions + 1, audit }
        }
        if (REVIEW_TYPES.every((t) => reviews[t].status === 'approved')) {
          audit = [...audit, { at: now + 1, actorId: 'system', action: 'All approvals complete — added to campaign package' }]
          return { ...a, reviews, stage: 'approved', approvedAt: now, approvedBy: reviewerId, audit }
        }
        return { ...a, reviews, audit }
      }),
    })),

  publish: (assetIds) =>
    set((s) => ({
      assets: s.assets.map((a) =>
        assetIds.includes(a.id)
          ? {
              ...a,
              stage: 'published',
              publishedAt: Date.now(),
              deliveryStatus: 'Live',
              audit: log(a, `Published to ${formats[a.format].label}`),
            }
          : a,
      ),
    })),

  toggleDelivery: (assetId) =>
    set((s) => ({
      assets: patchAsset(s.assets, assetId, (a) => {
        const next = a.deliveryStatus === 'Paused' ? 'Live' : 'Paused'
        return { ...a, deliveryStatus: next, audit: log(a, next === 'Paused' ? 'Delivery paused' : 'Delivery resumed') }
      }),
    })),

  reuse: (assetId) => {
    const s = get()
    const asset = s.assets.find((a) => a.id === assetId)!
    const src = s.briefs.find((b) => b.id === asset.briefId)!
    const now = Date.now()
    const id = `c-reuse-${now.toString(36)}`
    const brief: Brief = {
      ...src,
      id,
      name: `${src.name} (Reuse)`,
      status: 'Draft',
      ownerId: CURRENT_USER_ID,
      createdAt: now,
      routedAt: undefined,
      deadline: now + 7 * D,
      reusedFrom: src.id,
      masterHeadline: asset.headlines[0],
      objective: `Reuse approved ${formats[asset.format].label} from "${src.name}". ${src.objective}`,
    }
    set({ briefs: [brief, ...s.briefs] })
    return id
  },

  reset: () => set({ briefs: seedBriefs, assets: seedAssets, journey: 'all', pilot: false, search: '' }),
}))

export const routeMessage = (j: Journey) => `Auto-routed to the ${journeyLabel[j]} queue`
