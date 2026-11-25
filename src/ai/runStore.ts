import { create } from 'zustand'
import { createAsset } from '@/data/assets'
import { formats } from '@/data/formats'
import { journeyPresets } from '@/data/journeys'
import { CURRENT_USER_ID, REVIEWER } from '@/data/team'
import type { Asset, Brief } from '@/data/types'
import { D, H } from '@/lib/time'
import { useStore } from '@/store/useStore'
import { AGENTS, recheckQa, refineImage, runPipeline, type AgentId, type AgentStep, type Run, type RunContext, type TraceEvent } from './agents'
import { sceneUrl } from './scene'
import { fallbacksOf, isLive, useAiSettings } from './settings'

const idleSteps = () => Object.fromEntries(AGENTS.map((a) => [a.id, { status: 'idle' } as AgentStep])) as Record<AgentId, AgentStep>

interface RunState {
  run: Run | null
  refining: string | null
  start: (input: string, exampleId?: string) => Promise<void>
  cancel: () => void
  clear: () => void
  selectHeadline: (format: string, index: number) => void
  editCopy: (format: string, patch: { headline?: string; body?: string; cta?: string }) => void
  refine: (format: string, instruction: string) => Promise<void>
  /** Use a person-supplied key visual (e.g. made free in the Gemini app) for every format, then re-run QA. */
  uploadVisual: (file: File) => Promise<void>
  /** Make the key visual with the free Pollinations service (one request), then apply it and re-run QA. */
  generateFreeVisual: () => Promise<void>
  handoff: () => string | null
  exportRun: () => void
  importRun: (file: File) => Promise<void>
}

let controller: AbortController | null = null
let seq = 0

export const useRun = create<RunState>((set, get) => {
  const patch = (fn: (r: Run) => Partial<Run>) =>
    set((s) => (s.run ? { run: { ...s.run, ...fn(s.run) } } : s))

  const log = (agent: AgentId, kind: TraceEvent['kind'], text: string, detail?: unknown) =>
    patch((r) => ({
      trace: [
        ...r.trace,
        {
          id: ++seq,
          at: Date.now(),
          agent,
          kind,
          text,
          detail: detail === undefined ? undefined : typeof detail === 'string' ? detail : JSON.stringify(detail, null, 2),
        },
      ],
    }))

  const makeCtx = (live: boolean, signal: AbortSignal): RunContext => {
    const settings = useAiSettings.getState()
    const r = get().run!
    return {
      live,
      key: settings.apiKey,
      models: r.models,
      fallbacks: fallbacksOf(settings),
      signal,
      get: () => get().run!,
      patch,
      log,
      step: (agent, s) => patch((x) => ({ steps: { ...x.steps, [agent]: { ...x.steps[agent], ...s } } })),
      usage: (u, image) =>
        patch((x) => ({
          stats: { ...x.stats, calls: x.stats.calls + 1, images: x.stats.images + (image ? 1 : 0), tokens: x.stats.tokens + u.promptTokens + u.outputTokens },
        })),
    }
  }

  /** Put one key visual on every format, then have the QA agent check them again. */
  const applyVisual = async (image: string, source: 'upload' | 'pollinations', note: string) => {
    const r = get().run
    if (!r) return
    log('human', 'result', `${note} Applying it to all ${r.creatives.length} formats.`)
    patch((x) => ({
      masterImage: image,
      uploadedVisual: true,
      visualSource: source,
      status: 'running',
      creatives: x.creatives.map((c) => ({ ...c, image, status: 'checking' })),
    }))
    controller = new AbortController()
    const settings = useAiSettings.getState()
    try {
      await recheckQa(makeCtx(isLive(settings), controller.signal))
    } finally {
      patch(() => ({ status: 'review', endedAt: Date.now() }))
    }
  }

  return {
    run: null,
    refining: null,

    start: async (input, exampleId) => {
      controller?.abort()
      controller = new AbortController()
      const settings = useAiSettings.getState()
      const live = isLive(settings)
      const run: Run = {
        id: `run-${Date.now().toString(36)}`,
        mode: live ? 'live' : 'demo',
        input,
        exampleId,
        status: 'running',
        creatives: [],
        steps: idleSteps(),
        trace: [],
        startedAt: Date.now(),
        stats: { calls: 0, images: 0, tokens: 0, fixes: 0 },
        models: { text: settings.textModel, image: settings.imageModel },
      }
      set({ run })
      const ctx = makeCtx(live, controller.signal)
      try {
        await runPipeline(ctx)
        patch(() => ({ status: 'review', endedAt: Date.now() }))
      } catch (e) {
        if ((e as Error).name === 'AbortError') {
          patch(() => ({ status: 'cancelled', endedAt: Date.now() }))
          log('human', 'warn', 'Run cancelled')
        } else {
          patch(() => ({ status: 'error', error: (e as Error).message, endedAt: Date.now() }))
          log('human', 'error', (e as Error).message)
        }
      }
    },

    cancel: () => controller?.abort(),
    clear: () => {
      controller?.abort()
      set({ run: null })
    },

    selectHeadline: (format, index) =>
      patch((r) => ({ creatives: r.creatives.map((c) => (c.format === format ? { ...c, selected: index } : c)) })),

    editCopy: (format, p) =>
      patch((r) => ({
        creatives: r.creatives.map((c) => {
          if (c.format !== format) return c
          const headlines = [...c.headlines]
          if (p.headline !== undefined) headlines[c.selected] = p.headline
          return { ...c, headlines, body: p.body ?? c.body, cta: p.cta ?? c.cta }
        }),
      })),

    refine: async (format, instruction) => {
      const r = get().run
      const c = r?.creatives.find((x) => x.format === format)
      if (!r || !c) return
      const settings = useAiSettings.getState()
      set({ refining: format })
      log('human', 'thought', `Direction for ${formats[c.format].short}: "${instruction}"`)
      try {
        if (isLive(settings) && c.image && r.imageBlocked) {
          throw new Error(`Image editing isn't available right now: ${r.imageBlocked} You can make the edit in the Gemini app and upload the result.`)
        }
        if (isLive(settings) && c.image) {
          log('imager', 'tool', `gemini.generateContent · ${settings.imageModel} · edit with reference`, { instruction })
          const image = await refineImage({ key: settings.apiKey, models: [settings.imageModel, ...fallbacksOf(settings).image], image: c.image, instruction, aspect: c.aspect })
          patch((run) => ({
            creatives: run.creatives.map((x) => (x.format === format ? { ...x, image, revisions: x.revisions + 1 } : x)),
            stats: { ...run.stats, calls: run.stats.calls + 1, images: run.stats.images + 1 },
          }))
          log('imager', 'result', `Edited ${formats[c.format].short} as directed`)
        } else {
          await new Promise((res) => setTimeout(res, 900))
          patch((run) => ({ creatives: run.creatives.map((x) => (x.format === format ? { ...x, revisions: x.revisions + 1 } : x)) }))
          log('imager', 'result', `Offline mode: re-rendered the illustration. With Google AI Studio connected, Gemini edits the photo itself.`)
        }
      } catch (e) {
        log('imager', 'error', `Edit failed: ${(e as Error).message}`)
        throw e
      } finally {
        set({ refining: null })
      }
    },

    uploadVisual: async (file) => {
      const r = get().run
      if (!r || r.status === 'running') return
      const image = await downscale(file, 1600)
      await applyVisual(image, 'upload', `Key visual supplied by a person (${file.name}).`)
    },

    generateFreeVisual: async () => {
      const r = get().run
      if (!r?.art || r.status === 'running') return
      const prompt = freePrompt(r.art)
      log('imager', 'tool', 'image.pollinations.ai · free image service · 1 request', { sent: prompt })
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 110_000)
      try {
        // Called directly: the short pollinations.ai/p/ address redirects without CORS headers, which browsers block.
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=720&seed=${Math.floor(Math.random() * 1e6)}`
        let blob: Blob | undefined
        for (let attempt = 1; attempt <= 5 && !blob; attempt++) {
          const res = await fetch(url, { signal: ctrl.signal })
          if (res.ok) {
            const b = await res.blob()
            if (!b.type.startsWith('image/')) throw new Error('The free image service did not return an image. Try again in a minute.')
            blob = b
          } else if (res.status === 503 || res.status === 429) {
            if (attempt === 5) throw new Error('The free image service is busy right now. Try again in a minute.')
            log('imager', 'warn', `The free image service is busy. Retrying in 10s (attempt ${attempt + 1} of 5).`)
            await new Promise((r) => setTimeout(r, 10_500))
          } else if (res.status === 403) {
            throw new Error('The free image service only accepts requests from approved web addresses, such as the published site. It does not work from a local or unlisted address.')
          } else {
            throw new Error(`The free image service answered ${res.status}. Try again in a minute.`)
          }
        }
        const image = await downscale(new File([blob!], 'pollinations.jpg', { type: blob!.type }), 1600)
        await applyVisual(image, 'pollinations', 'Key visual generated with the free Pollinations service.')
      } catch (e) {
        const msg = (e as Error).name === 'AbortError' ? 'The free image service took too long. Try again.' : (e as Error).message
        log('imager', 'error', msg)
        throw new Error(msg)
      } finally {
        clearTimeout(timer)
      }
    },

    handoff: () => {
      const r = get().run
      if (!r?.brief || !r.routing) return null
      const now = Date.now()
      const preset = journeyPresets[r.routing.journey]
      const id = `c-agent-${now.toString(36)}`
      const brief: Brief = {
        id,
        name: r.brief.name,
        journey: r.routing.journey,
        development: r.brief.development,
        objective: r.brief.objective,
        audience: r.brief.audience,
        journeyContext: preset.proposition,
        keyMessages: r.brief.keyMessages,
        tone: r.brief.tone || preset.tone,
        masterHeadline: r.brief.masterHeadline,
        formats: r.creatives.map((c) => c.format),
        constraints: preset.constraints,
        channels: r.brief.channels,
        priority: r.brief.priority,
        status: 'In Review',
        ownerId: CURRENT_USER_ID,
        createdAt: r.startedAt,
        routedAt: r.steps.router.endedAt ?? r.startedAt,
        deadline: now + 7 * D,
        slaHours: r.routing.slaHours,
      }
      const assets: Asset[] = r.creatives.map((c, i) => {
        const base = createAsset(brief, c.format, i, r.startedAt + i, 'pass')
        const f = formats[c.format]
        const headlines = [c.headlines[c.selected], ...c.headlines.filter((_, j) => j !== c.selected)]
        const qaAt = r.steps.qa.endedAt ?? now
        return {
          ...base,
          id: `${id}-${c.format}`,
          headlines,
          body: c.body,
          cta: c.cta,
          tool: 'Gemini',
          image: c.image ?? sceneUrl(`${r.id}-${c.revisions}`, brief.journey, f.width / f.height),
          imagePrompt: c.imagePrompt,
          runId: r.id,
          stage: 'approval',
          qa: c.qa ?? null,
          qaState: c.qaState === 'not-run' ? 'pass' : c.qaState,
          qaOutcome: 'pass',
          qaAt,
          firstPassQa: c.revisions === 0,
          revisions: c.revisions,
          approvalRounds: 1,
          submittedAt: now,
          submittedBy: CURRENT_USER_ID,
          slaDue: now + brief.slaHours * H,
          reviews: {
            brand: { status: 'pending', reviewerId: REVIEWER.brand },
            business: { status: 'pending', reviewerId: REVIEWER.business },
            risk: { status: 'pending', reviewerId: REVIEWER.risk },
          },
          audit: [
            { at: r.startedAt, actorId: CURRENT_USER_ID, action: 'Campaign request sent to the agent team' },
            { at: r.steps.strategist.endedAt ?? r.startedAt, actorId: 'system', action: 'Brief Strategist structured the brief' },
            { at: r.steps.router.endedAt ?? r.startedAt, actorId: 'system', action: `Journey Router routed to ${brief.journey === 'rental' ? 'Rental' : 'Shared Ownership'}` },
            { at: r.steps.imager.endedAt ?? r.startedAt, actorId: 'system', action: `Copy & visual generated with Gemini (${r.mode === 'live' ? r.models.image : 'offline'})` },
            ...(c.revisions ? [{ at: qaAt - 1, actorId: 'system', action: `QA agent sent it back ${c.revisions}× and it was repaired` }] : []),
            { at: qaAt, actorId: 'system', action: `Pre-checks ${c.qaState === 'warn' ? 'passed with warnings' : c.qaState === 'fail' ? 'flagged for people' : 'passed 8/8'}` },
            { at: now, actorId: CURRENT_USER_ID, action: 'Submitted for brand, business & risk approval' },
          ],
        }
      })
      useStore.getState().importCampaign(brief, assets)
      patch((run) => ({
        status: 'handed-off',
        briefId: id,
        steps: { ...run.steps, human: { ...run.steps.human, status: 'done', endedAt: now, summary: 'Sent to Brand, Business & Risk' } },
      }))
      log('human', 'done', `${assets.length} assets sent to Brand, Business & Risk in parallel`)
      return id
    },

    exportRun: () => {
      const r = get().run
      if (!r) return
      const blob = new Blob([JSON.stringify(r)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `lloyds-living-run-${(r.brief?.name ?? r.id).toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 2000)
    },

    importRun: async (file) => {
      const r = JSON.parse(await file.text()) as Run
      if (!r?.id || !Array.isArray(r.creatives) || !r.steps) throw new Error('That file is not a saved agent run')
      controller?.abort()
      set({ run: { ...r, status: r.status === 'handed-off' ? 'review' : r.status, briefId: undefined } })
    },
  }
})

/** Read an image file as a JPEG data URL no larger than `max` px on its long side. */
async function downscale(file: File, max: number): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file (PNG, JPEG or WebP).')
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error('That image could not be read.'))
      i.src = url
    })
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.naturalWidth * k)
    canvas.height = Math.round(img.naturalHeight * k)
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.9)
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** The prompt sent to the free service: the scene and style only, no brief, names or numbers. */
function freePrompt(art: { scene: string; mood: string }) {
  return `Bright UK daylight photograph for a housing brand. ${art.scene} ${art.mood} Photorealistic, wide landscape frame, clear space at the top. No text, letters, signs or logos.`.slice(0, 700)
}
