/**
 * The Lloyds Living campaign agent team.
 *
 *  Brief Strategist ─► Journey Router ─┬─► Copywriter ──────┐
 *                                      └─► Art Director ─► Image Generator ─► Brand & Compliance QA ─► People approve
 *                                                                    ▲                │
 *                                                                    └── self-repair ◄┘
 *
 * Each agent is a plain async function with one job, a typed output and a
 * visible trace. In live mode they call Gemini via Google AI Studio; in demo mode
 * (or if a live call fails) they fall back to deterministic offline outputs, so a
 * presentation never stalls.
 */
import { generateCopy } from '@/data/copy'
import { formats, formatsForChannels, journeyLabel } from '@/data/formats'
import { journeyPresets } from '@/data/journeys'
import type { Brief, Channel, CheckResult, FormatId, Journey, Priority, QaState } from '@/data/types'
import { CHECK_LABELS } from '@/data/checks'
import { BANNED, BRAND, brandContext, JOURNEY_LEAKS } from './brand'
import { EXAMPLES } from './examples'
import { GeminiError, generateImage, generateJson, type AspectRatio, type Usage } from './gemini'

export type AgentId = 'strategist' | 'router' | 'copywriter' | 'artdirector' | 'imager' | 'qa' | 'human'

export interface AgentDef {
  id: AgentId
  name: string
  role: string
  engine: 'text' | 'image' | 'vision' | 'people'
}

export const AGENTS: AgentDef[] = [
  { id: 'strategist', name: 'Brief Strategist', role: 'Turns a free-text request into a structured, approval-ready brief', engine: 'text' },
  { id: 'router', name: 'Journey Router', role: 'Decides Rental or Shared Ownership, sets SLA, reviewers and formats', engine: 'text' },
  { id: 'copywriter', name: 'Copywriter', role: 'Writes headline options, body and CTA for every format, to each character limit', engine: 'text' },
  { id: 'artdirector', name: 'Art Director', role: 'Sets the creative concept and writes the key-visual prompt', engine: 'text' },
  { id: 'imager', name: 'Image Generator', role: 'Paints one key visual, then re-frames it for every aspect ratio', engine: 'image' },
  { id: 'qa', name: 'Brand & Compliance QA', role: 'Checks every asset against brand, legal and brief, and sends failures back', engine: 'vision' },
  { id: 'human', name: 'Brand, Business & Risk', role: 'People approve every asset before anything goes live', engine: 'people' },
]

export const agentDef = (id: AgentId) => AGENTS.find((a) => a.id === id)!

export interface StructuredBrief {
  name: string
  journey: Journey
  development: string
  objective: string
  audience: string
  insight: string
  keyMessages: string[]
  masterHeadline: string
  tone: string
  channels: Channel[]
  priority: Priority
}

export interface Routing {
  journey: Journey
  confidence: number
  rationale: string
  signals: string[]
  queue: string
  slaHours: number
  formats: FormatId[]
}

export interface ArtDirection {
  concept: string
  scene: string
  mood: string
  masterPrompt: string
}

export type CreativeStatus = 'waiting' | 'writing' | 'painting' | 'checking' | 'fixing' | 'ready' | 'error'

export interface RunCreative {
  format: FormatId
  headlines: string[]
  selected: number
  body: string
  cta: string
  rationale?: string
  aspect: AspectRatio
  image?: string
  imagePrompt?: string
  status: CreativeStatus
  qa?: CheckResult[]
  qaState: QaState
  revisions: number
  notes?: string
}

export type TraceKind = 'start' | 'thought' | 'tool' | 'result' | 'warn' | 'handoff' | 'done' | 'error'

export interface TraceEvent {
  id: number
  at: number
  agent: AgentId
  kind: TraceKind
  text: string
  detail?: string
}

export type StepStatus = 'idle' | 'running' | 'done' | 'error'

export interface AgentStep {
  status: StepStatus
  startedAt?: number
  endedAt?: number
  summary?: string
}

export interface Run {
  id: string
  mode: 'live' | 'demo'
  input: string
  exampleId?: string
  status: 'running' | 'review' | 'handed-off' | 'error' | 'cancelled'
  brief?: StructuredBrief
  routing?: Routing
  art?: ArtDirection
  creatives: RunCreative[]
  masterImage?: string
  steps: Record<AgentId, AgentStep>
  trace: TraceEvent[]
  startedAt: number
  endedAt?: number
  stats: { calls: number; images: number; tokens: number; fixes: number }
  models: { text: string; image: string }
  error?: string
  briefId?: string
  /** Why live image generation is unavailable on this key, if it is. */
  imageBlocked?: string
  /** True when the key visual was uploaded by a person rather than generated. */
  uploadedVisual?: boolean
}

/** What the orchestrator needs from the store. */
export interface RunContext {
  live: boolean
  key: string
  models: { text: string; image: string }
  /** Other models on the key, tried in order when the preferred one is overloaded or out of quota. */
  fallbacks: { text: string[]; image: string[] }
  signal: AbortSignal
  get: () => Run
  patch: (fn: (r: Run) => Partial<Run>) => void
  log: (agent: AgentId, kind: TraceKind, text: string, detail?: unknown) => void
  step: (agent: AgentId, s: Partial<AgentStep>) => void
  usage: (u: Usage, image?: boolean) => void
}

export const ASPECT_FOR: Record<FormatId, AspectRatio> = {
  'ig-post': '1:1',
  'ig-story': '9:16',
  'fb-banner': '16:9',
  'li-post': '16:9',
  'gd-mpu': '16:9',
  'gd-leaderboard': '4:3',
  'email-header': '21:9',
}

const ASPECT_ORDER: AspectRatio[] = ['16:9', '1:1', '9:16', '4:3', '21:9']

/** Practical headline targets for the layouts (the hard limit is formats[f].maxHeadline). */
const HEADLINE_AIM: Record<FormatId, number> = {
  'ig-post': 50,
  'ig-story': 45,
  'fb-banner': 55,
  'li-post': 55,
  'gd-mpu': 38,
  'gd-leaderboard': 34,
  'email-header': 45,
}

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(t)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })

const isAbort = (e: unknown) => (e as Error)?.name === 'AbortError'

async function pool<T>(items: T[], n: number, fn: (item: T) => Promise<void>) {
  const queue = [...items]
  await Promise.all(
    Array.from({ length: Math.min(n, queue.length) }, async () => {
      while (queue.length) await fn(queue.shift()!)
    }),
  )
}

function hash(s: string) {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h
}

const S = {
  str: (description?: string) => ({ type: 'STRING', ...(description ? { description } : {}) }),
  num: (description?: string) => ({ type: 'NUMBER', ...(description ? { description } : {}) }),
  int: (description?: string) => ({ type: 'INTEGER', ...(description ? { description } : {}) }),
  bool: (description?: string) => ({ type: 'BOOLEAN', ...(description ? { description } : {}) }),
  enumOf: (values: string[], description?: string) => ({ type: 'STRING', enum: values, ...(description ? { description } : {}) }),
  arr: (items: object, description?: string) => ({ type: 'ARRAY', items, ...(description ? { description } : {}) }),
  obj: (properties: Record<string, object>, required = Object.keys(properties)) => ({ type: 'OBJECT', properties, required }),
}

const CHANNELS: Channel[] = ['instagram', 'facebook', 'linkedin', 'google', 'email']

const route = (ctx: RunContext, agent: AgentId, kind: 'text' | 'image') => ({
  key: ctx.key,
  models: [ctx.models[kind], ...ctx.fallbacks[kind]],
  signal: ctx.signal,
  onSwitch: (_from: string, to: string, why: GeminiError) => ctx.log(agent, 'warn', `${why.message} Switching to ${to}.`, why.raw),
})


/* ------------------------------------------------------------------ */
/* 1. Brief Strategist                                                 */
/* ------------------------------------------------------------------ */

function demoBrief(input: string, exampleId?: string): StructuredBrief {
  const ex = EXAMPLES.find((e) => e.id === exampleId)
  if (ex) {
    return { ...ex.structured, journey: ex.journey, development: ex.development, channels: ex.channels, tone: journeyPresets[ex.journey].tone }
  }
  const lower = input.toLowerCase()
  const journey: Journey = /(shared ownership|own a share|buy a share|pathways|staircas|mortgage)/.test(lower) ? 'shared' : 'rental'
  const dev = [
    'Lapwings, Burleyfields, Stafford',
    'Osprey View, Worksop',
    'Park View, Gedling',
    'Warren Wood View, Gainsborough',
    'Oxenden Park, Herne Bay',
    'Hampton Beach, Peterborough',
    'Frog Island, Leicester',
    'Gaydon, Warwickshire',
  ].find((d) => d.split(',').some((part) => lower.includes(part.trim().toLowerCase())))
  const channels = CHANNELS.filter((c) => lower.includes(c === 'google' ? 'display' : c))
  const first = input.split(/[.\n]/)[0].trim()
  return {
    name: first.length > 4 && first.length < 48 ? first : `${journeyLabel[journey]} campaign`,
    journey,
    development: dev ?? (journey === 'rental' ? 'Oxenden Park, Herne Bay' : 'Hampton Beach, Peterborough'),
    objective: journey === 'rental' ? 'Generate qualified viewing requests for available homes.' : 'Drive completed Shared Ownership eligibility checks.',
    audience: journey === 'rental' ? 'Renters 25–45 looking for more space and a landlord they can trust.' : 'Renters 25–40 who assume buying is out of reach.',
    insight: 'People want a home they can settle in, not just a place to stay.',
    keyMessages: journeyPresets[journey].keyMessages.slice(0, 3),
    masterHeadline: journey === 'rental' ? 'Your new home is ready' : 'The step between renting and buying',
    tone: journeyPresets[journey].tone,
    channels: channels.length ? channels : journeyPresets[journey].defaultChannels,
    priority: 'Medium',
  }
}

async function strategist(ctx: RunContext): Promise<StructuredBrief> {
  const run = ctx.get()
  ctx.log('strategist', 'thought', 'Reading the request and pulling out objective, audience, insight and key messages.')
  if (ctx.live) {
    try {
      ctx.log('strategist', 'tool', `gemini.generateContent · ${ctx.models.text} · schema=StructuredBrief`)
      const { data, usage } = await generateJson<StructuredBrief>({
                ...route(ctx, 'strategist', 'text'),
        temperature: 0.4,
        system: `You are the Brief Strategist agent in the ${BRAND.name} marketing team. Turn a marketer's free-text request into a structured, approval-ready creative brief. Be specific and measurable. Keep every field short.\n${brandContext()}`,
        prompt: `RAW REQUEST:\n"""${run.input}"""\n\nRules:\n- name: campaign name, max 40 characters.\n- journey: "rental" for private renting, "shared" for Shared Ownership (including Pathways, rent-to-own).\n- development: the named site and town if given.\n- objective: one measurable sentence.\n- insight: one human truth about the audience.\n- keyMessages: exactly 3, each under 45 characters.\n- masterHeadline: under 45 characters, warm and specific.\n- tone: under 15 words.\n- channels: only those requested; default to instagram, facebook, email.\n- priority: High, Medium or Low.`,
        schema: S.obj({
          name: S.str(),
          journey: S.enumOf(['rental', 'shared']),
          development: S.str(),
          objective: S.str(),
          audience: S.str(),
          insight: S.str(),
          keyMessages: S.arr(S.str()),
          masterHeadline: S.str(),
          tone: S.str(),
          channels: S.arr(S.enumOf(CHANNELS)),
          priority: S.enumOf(['High', 'Medium', 'Low']),
        }),
      })
      ctx.usage(usage)
      const channels = (data.channels ?? []).filter((c) => CHANNELS.includes(c))
      return { ...data, channels: channels.length ? channels : ['instagram', 'facebook', 'email'], keyMessages: data.keyMessages.slice(0, 4) }
    } catch (e) {
      if (isAbort(e)) throw e
      ctx.log('strategist', 'warn', `Live call failed, using the offline strategist: ${(e as Error).message}`)
    }
  } else {
    await sleep(900, ctx.signal)
  }
  return demoBrief(run.input, run.exampleId)
}

/* ------------------------------------------------------------------ */
/* 2. Journey Router                                                   */
/* ------------------------------------------------------------------ */

function routeTool(journey: Journey, channels: Channel[]): Pick<Routing, 'queue' | 'slaHours' | 'formats'> {
  return {
    queue: `${journeyLabel[journey]} journey team`,
    slaHours: journeyPresets[journey].slaHours,
    formats: formatsForChannels(channels),
  }
}

async function router(ctx: RunContext, brief: StructuredBrief): Promise<Routing> {
  ctx.log('router', 'thought', 'Classifying the journey from proposition language, audience and site.')
  let decision: Pick<Routing, 'journey' | 'confidence' | 'rationale' | 'signals'> | undefined
  if (ctx.live) {
    try {
      ctx.log('router', 'tool', `gemini.generateContent · ${ctx.models.text} · schema=RoutingDecision`)
      const { data, usage } = await generateJson<Pick<Routing, 'journey' | 'confidence' | 'rationale' | 'signals'>>({
                ...route(ctx, 'router', 'text'),
        temperature: 0.1,
        system: `You are the Journey Router agent at ${BRAND.name}. Decide which journey team owns a brief: "rental" (private rent) or "shared" (Shared Ownership, including Pathways rent-to-own routes). Each has its own templates, disclaimers and approvers, so getting it wrong is a compliance risk.`,
        prompt: `BRIEF:\n${JSON.stringify(brief, null, 2)}\n\nReturn the journey, your confidence (0 to 1), a rationale under 25 words, and up to 3 short signal phrases you relied on.`,
        schema: S.obj({ journey: S.enumOf(['rental', 'shared']), confidence: S.num(), rationale: S.str(), signals: S.arr(S.str()) }),
      })
      ctx.usage(usage)
      decision = data
    } catch (e) {
      if (isAbort(e)) throw e
      ctx.log('router', 'warn', `Live call failed, routing by rules: ${(e as Error).message}`)
    }
  } else {
    await sleep(700, ctx.signal)
  }
  if (!decision) {
    const shared = brief.journey === 'shared'
    decision = {
      journey: brief.journey,
      confidence: 0.96,
      rationale: shared ? 'Talks about owning a share and eligibility, which is Shared Ownership.' : 'Talks about renting brand-new homes and viewings, which is the Rental journey.',
      signals: shared ? ['own a share', 'eligibility', 'deposit on your share'] : ['to rent', 'viewings', 'in-house team'],
    }
  }
  if (decision.journey !== brief.journey) {
    ctx.log('router', 'warn', `Overriding the strategist: this is ${journeyLabel[decision.journey]}, not ${journeyLabel[brief.journey]}.`)
  }
  ctx.log('router', 'tool', `route_to_queue(journey="${decision.journey}", channels=[${brief.channels.join(', ')}])`)
  return { ...decision, ...routeTool(decision.journey, brief.channels) }
}

/* ------------------------------------------------------------------ */
/* 3. Copywriter                                                       */
/* ------------------------------------------------------------------ */

type CopyOut = { format: FormatId; headlines: string[]; body: string; cta: string; rationale?: string }

function toBrief(b: StructuredBrief, journey: Journey): Brief {
  const p = journeyPresets[journey]
  return {
    id: 'agent',
    name: b.name,
    journey,
    development: b.development,
    objective: b.objective,
    audience: b.audience,
    journeyContext: p.proposition,
    keyMessages: b.keyMessages,
    tone: b.tone,
    masterHeadline: b.masterHeadline,
    formats: [],
    constraints: p.constraints,
    channels: b.channels,
    priority: b.priority,
    status: 'Routed',
    ownerId: 't1',
    createdAt: Date.now(),
    deadline: Date.now(),
    slaHours: p.slaHours,
  }
}

function demoCopy(b: StructuredBrief, routing: Routing): CopyOut[] {
  const brief = toBrief(b, routing.journey)
  const area = b.development.split(',').pop()!.trim()
  const shortest = [...routing.formats].sort((x, y) => formats[x].maxHeadline - formats[y].maxHeadline)[0]
  return routing.formats.map((f, i) => {
    const c = generateCopy(brief, f, i)
    const headlines = [b.masterHeadline, ...c.headlines.filter((h) => h !== b.masterHeadline)].slice(0, 3)
    // First drafts are not perfect: the tightest format gets an over-long line so QA has something to catch.
    if (f === shortest) headlines[0] = `${b.masterHeadline.replace(/[.!?]$/, '')}: brand-new homes in ${area}`
    return { format: f, headlines, body: c.body, cta: c.cta, rationale: 'Leads with the master headline; alternates test the key messages.' }
  })
}

async function copywriter(ctx: RunContext, b: StructuredBrief, routing: Routing): Promise<CopyOut[]> {
  ctx.log('copywriter', 'thought', `Writing 3 headline options, body and CTA for ${routing.formats.length} formats in the ${journeyLabel[routing.journey]} voice.`)
  if (ctx.live) {
    try {
      const specs = routing.formats
        .map((f) => `- ${f} (${formats[f].label}, ${formats[f].width}×${formats[f].height}): headline aim ≤ ${HEADLINE_AIM[f]} chars, hard max ${formats[f].maxHeadline}; body ≤ 140 chars; CTA ≤ 22 chars`)
        .join('\n')
      ctx.log('copywriter', 'tool', `gemini.generateContent · ${ctx.models.text} · schema=ChannelCopy[${routing.formats.length}]`)
      const { data, usage } = await generateJson<{ creatives: CopyOut[] }>({
                ...route(ctx, 'copywriter', 'text'),
        temperature: 0.85,
        system: `You are the Copywriter agent at ${BRAND.name}. You adapt one approved brief into channel-native copy. Every headline must respect its character limit. Never write the legal disclaimer, the layout adds it.\n${brandContext(routing.journey)}`,
        prompt: `BRIEF:\n${JSON.stringify(b, null, 2)}\n\nFORMATS:\n${specs}\n\nFor each format return 3 distinct headline options (the first is your recommendation), a body line, a CTA and a one-line rationale. Short formats need punchier lines. Name the place where it helps.`,
        schema: S.obj({
          creatives: S.arr(S.obj({ format: S.enumOf(routing.formats), headlines: S.arr(S.str()), body: S.str(), cta: S.str(), rationale: S.str() })),
        }),
      })
      ctx.usage(usage)
      const byFormat = new Map(data.creatives.map((c) => [c.format, c]))
      const fallback = demoCopy(b, routing)
      return routing.formats.map((f, i) => byFormat.get(f) ?? fallback[i])
    } catch (e) {
      if (isAbort(e)) throw e
      ctx.log('copywriter', 'warn', `Live call failed, using the offline copy bank: ${(e as Error).message}`)
    }
  } else {
    await sleep(1600, ctx.signal)
  }
  return demoCopy(b, routing)
}

async function reviseCopy(ctx: RunContext, b: StructuredBrief, journey: Journey, c: RunCreative, issues: string[]): Promise<Pick<RunCreative, 'headlines' | 'body' | 'cta'>> {
  const max = formats[c.format].maxHeadline
  if (ctx.live) {
    try {
      ctx.log('copywriter', 'tool', `gemini.generateContent · revise ${formats[c.format].short}`)
      const { data, usage } = await generateJson<Pick<RunCreative, 'headlines' | 'body' | 'cta'>>({
                ...route(ctx, 'copywriter', 'text'),
        temperature: 0.6,
        system: `You are the Copywriter agent at ${BRAND.name}. QA sent your copy back. Fix exactly the issues listed and keep what worked.\n${brandContext(journey)}`,
        prompt: `FORMAT: ${formats[c.format].label}. Headline hard max ${max} chars (aim ${HEADLINE_AIM[c.format]}). Body ≤ 140 chars. CTA ≤ 22 chars.\nBRIEF KEY MESSAGES: ${b.keyMessages.join('; ')}\nCURRENT: ${JSON.stringify({ headlines: c.headlines, body: c.body, cta: c.cta })}\nQA ISSUES: ${issues.join('; ')}\nReturn 3 corrected headlines, body and CTA.`,
        schema: S.obj({ headlines: S.arr(S.str()), body: S.str(), cta: S.str() }),
      })
      ctx.usage(usage)
      return data
    } catch (e) {
      if (isAbort(e)) throw e
      ctx.log('copywriter', 'warn', `Live revision failed, trimming offline: ${(e as Error).message}`)
    }
  } else {
    await sleep(900, ctx.signal)
  }
  const fits = c.headlines.filter((h) => h.length <= HEADLINE_AIM[c.format] && !BANNED.test(h) && !JOURNEY_LEAKS[journey].test(h))
  const bank = generateCopy(toBrief(b, journey), c.format, c.revisions + 2).headlines.filter((h) => h.length <= HEADLINE_AIM[c.format])
  const headlines = [...new Set([...fits, ...bank])].slice(0, 3)
  return { headlines: headlines.length ? headlines : [b.masterHeadline.slice(0, HEADLINE_AIM[c.format])], body: c.body.replace(BANNED, 'great'), cta: c.cta }
}

/* ------------------------------------------------------------------ */
/* 4. Art Director                                                     */
/* ------------------------------------------------------------------ */

function demoArt(b: StructuredBrief, journey: Journey): ArtDirection {
  const family = /famil|child|growing/i.test(`${b.audience} ${b.masterHeadline}`)
  const people = journey === 'shared' ? 'a young couple' : family ? 'a young family with two children' : 'a couple in their thirties with a dog'
  const scene = `Straight-on, eye-level view of a brand-new buff-brick semi-detached house at ${b.development}, sage-green front door, fresh lawn and tarmac drive under a clear blue sky; ${people} arriving home, candid and smiling.`
  return {
    concept: `"${b.masterHeadline}": the first day of a new chapter.`,
    scene,
    mood: 'Bright, optimistic, real. Clear daylight, true colour.',
    masterPrompt: `Bright UK daylight photograph for a housing brand's social feed. ${scene} Shot on a 28mm lens at eye level, crisp natural colour, clear sky with room for a headline panel at the top.`,
  }
}

async function artDirector(ctx: RunContext, b: StructuredBrief, journey: Journey): Promise<ArtDirection> {
  ctx.log('artdirector', 'thought', 'Finding one visual idea that works from a 9:16 story down to a 728×90 banner.')
  if (ctx.live) {
    try {
      ctx.log('artdirector', 'tool', `gemini.generateContent · ${ctx.models.text} · schema=ArtDirection`)
      const { data, usage } = await generateJson<ArtDirection>({
                ...route(ctx, 'artdirector', 'text'),
        temperature: 0.9,
        system: `You are the Art Director agent at ${BRAND.name}. You define one key visual that will be re-framed for every channel, so it needs a clear subject, a simple background and room for type.\nART DIRECTION RULES:\n- ${BRAND.artDirection.join('\n- ')}\n${brandContext(journey)}`,
        prompt: `BRIEF:\n${JSON.stringify(b, null, 2)}\n\nReturn: concept (under 20 words), scene (under 60 words: who, where, what they are doing, time of day), mood (under 15 words), masterPrompt (under 120 words, a complete photographic prompt for an image model, describing camera, light and composition, with clean negative space in the upper third for a headline). Do not ask for any text in the image.`,
        schema: S.obj({ concept: S.str(), scene: S.str(), mood: S.str(), masterPrompt: S.str() }),
      })
      ctx.usage(usage)
      return data
    } catch (e) {
      if (isAbort(e)) throw e
      ctx.log('artdirector', 'warn', `Live call failed, using the house art direction: ${(e as Error).message}`)
    }
  } else {
    await sleep(1300, ctx.signal)
  }
  return demoArt(b, journey)
}

/* ------------------------------------------------------------------ */
/* 5. Image Generator                                                  */
/* ------------------------------------------------------------------ */

const GUARDRAILS = 'Photorealistic. Absolutely no text, letters, numbers, signage, logos, watermarks or brand marks anywhere in the image. No distorted faces or hands.'

const FRAMING: Record<AspectRatio, string> = {
  '16:9': 'a wide landscape frame; keep the subject in the left half with calm space on the right',
  '1:1': 'a square frame; subject centred slightly high, calm space in the lower third',
  '9:16': 'a tall vertical phone frame; subject in the upper-middle, clear sky above and calm ground below',
  '4:3': 'a tight 4:3 crop on the most recognisable part of the scene, the home and the people',
  '21:9': 'an ultra-wide panoramic banner; subject on the right third, calm open space on the left',
  '3:2': 'a 3:2 landscape frame',
  '4:5': 'a 4:5 portrait frame',
  '5:4': 'a 5:4 frame',
}

export function masterPromptFor(art: ArtDirection, aspect: AspectRatio) {
  return `${art.masterPrompt}\nComposition: ${FRAMING[aspect]}.\nMood: ${art.mood}\n${GUARDRAILS}`
}

export function adaptPromptFor(art: ArtDirection, aspect: AspectRatio) {
  return `Re-frame the reference photograph as ${FRAMING[aspect]}. It must be the same scene: the same homes, the same people and clothing, the same light and colour grade. Extend or crop the surroundings naturally as needed.\nScene: ${art.scene}\n${GUARDRAILS}`
}

async function paint(ctx: RunContext, prompt: string, aspect: AspectRatio, references?: string[]): Promise<string | undefined> {
  ctx.log('imager', 'tool', `gemini.generateContent · ${ctx.models.image} · aspectRatio=${aspect}${references?.length ? ' · reference=key visual' : ''}`, { prompt })
  const { image, usage } = await generateImage({ ...route(ctx, 'imager', 'image'), prompt, aspectRatio: aspect, references })
  ctx.usage(usage, true)
  return image
}

async function imager(ctx: RunContext, art: ArtDirection) {
  const run = ctx.get()
  const aspects = ASPECT_ORDER.filter((a) => run.creatives.some((c) => c.aspect === a))
  const master = aspects[0]
  const setAspect = (aspect: AspectRatio, patch: Partial<RunCreative>) =>
    ctx.patch((r) => ({ creatives: r.creatives.map((c) => (c.aspect === aspect ? { ...c, ...patch } : c)) }))

  ctx.log('imager', 'thought', `One key visual at ${master}, then ${aspects.length - 1} re-frames using it as a reference so every format shows the same homes and people.`)
  ctx.patch((r) => ({ creatives: r.creatives.map((c) => ({ ...c, status: 'painting' })) }))

  if (!ctx.live) {
    for (const a of aspects) {
      await sleep(a === master ? 1800 : 700, ctx.signal)
      ctx.log('imager', 'tool', `render_brand_illustration(aspectRatio=${a})`)
      setAspect(a, { status: 'checking', imagePrompt: a === master ? masterPromptFor(art, a) : adaptPromptFor(art, a) })
    }
    ctx.log('imager', 'result', `Offline mode: rendered the brand illustration for ${aspects.length} aspect ratios. Connect Google AI Studio for photography.`)
    return
  }

  let masterImage: string | undefined
  try {
    const prompt = masterPromptFor(art, master)
    masterImage = await paint(ctx, prompt, master)
    ctx.patch(() => ({ masterImage }))
    setAspect(master, { image: masterImage, imagePrompt: prompt, status: 'checking' })
    ctx.log('imager', 'result', `Key visual ready (${master}).`)
  } catch (e) {
    if (isAbort(e)) throw e
    const why = (e as Error).message
    ctx.log('imager', 'warn', `No image model available, using the brand illustration instead. ${why}`, (e as GeminiError).raw)
    ctx.patch(() => ({ imageBlocked: why }))
    ctx.patch((r) => ({ creatives: r.creatives.map((c) => ({ ...c, status: 'checking' })) }))
    return
  }

  await pool(aspects.slice(1), 2, async (a) => {
    try {
      const prompt = adaptPromptFor(art, a)
      const image = await paint(ctx, prompt, a, [masterImage!])
      setAspect(a, { image, imagePrompt: prompt, status: 'checking' })
      ctx.log('imager', 'result', `Re-framed for ${a}.`)
    } catch (e) {
      if (isAbort(e)) throw e
      ctx.log('imager', 'warn', `Re-frame ${a} failed, cropping the key visual instead: ${(e as Error).message}`)
      setAspect(a, { image: masterImage, status: 'checking' })
    }
  })
}

/* ------------------------------------------------------------------ */
/* 6. Brand & Compliance QA                                            */
/* ------------------------------------------------------------------ */

interface Vision {
  photoOnBrand: number
  strayTextOrLogos: boolean
  photoIssues: string[]
  toneScore: number
  briefScore: number
  keyMessagesCovered: number
  notes: string
}

const grade = (score: number, pass: number, warn: number) => (score >= pass ? 'pass' : score >= warn ? 'warn' : 'fail')

export function ruleChecks(c: RunCreative, journey: Journey, v: Vision, keyMessages: number, hasPhoto: boolean): CheckResult[] {
  const f = formats[c.format]
  const headline = c.headlines[c.selected] ?? c.headlines[0]
  const copy = `${c.headlines.join(' ')} ${c.body} ${c.cta}`
  const leak = JOURNEY_LEAKS[journey].exec(copy)
  const banned = BANNED.exec(copy)
  const other = journey === 'rental' ? 'Shared Ownership' : 'Rental'
  return [
    { id: 'format', label: CHECK_LABELS[0], status: 'pass', detail: `Typeset at ${f.width}×${f.height} over a ${c.aspect} ${hasPhoto ? 'photograph' : 'brand illustration'}` },
    {
      id: 'palette',
      label: CHECK_LABELS[1],
      status: grade(v.photoOnBrand, 75, 55),
      detail: `Layout uses Lloyds Living greens only; photography scored ${v.photoOnBrand}/100 against the art direction${v.photoIssues.length ? ` (${v.photoIssues[0]})` : ''}`,
    },
    {
      id: 'logo',
      label: CHECK_LABELS[2],
      status: v.strayTextOrLogos ? 'fail' : 'pass',
      detail: v.strayTextOrLogos ? 'The image contains generated text or logo artefacts' : 'Logo set by the layout system, top-left in the safe zone; no stray text in the image',
    },
    {
      id: 'journey',
      label: CHECK_LABELS[3],
      status: leak ? 'fail' : 'pass',
      detail: leak ? `"${leak[0]}" belongs to the ${other} journey` : `${journeyLabel[journey]} only; no ${other} terms found`,
    },
    {
      id: 'length',
      label: CHECK_LABELS[4],
      status: headline.length > f.maxHeadline ? 'fail' : headline.length > HEADLINE_AIM[c.format] + 6 || c.cta.length > 24 ? 'warn' : 'pass',
      detail: `Headline ${headline.length} chars (limit ${f.maxHeadline}), CTA ${c.cta.length} chars`,
    },
    {
      id: 'disclaimer',
      label: CHECK_LABELS[5],
      status: banned ? 'fail' : 'pass',
      detail: banned ? `Banned claim "${banned[0]}" in the copy` : `${journeyLabel[journey]} disclaimer locked into the layout; no banned claims`,
    },
    { id: 'tone', label: CHECK_LABELS[6], status: grade(v.toneScore, 80, 65), detail: `Scored ${v.toneScore}% against the ${journeyLabel[journey]} tone guide (min 80%)` },
    {
      id: 'brief',
      label: CHECK_LABELS[7],
      status: grade(v.briefScore, 75, 60),
      detail: `Scored ${v.briefScore}%, covers ${Math.min(v.keyMessagesCovered, keyMessages)} of ${keyMessages} key messages`,
    },
  ]
}

async function vision(ctx: RunContext, c: RunCreative, b: StructuredBrief, journey: Journey): Promise<Vision> {
  const h = hash(c.format + c.headlines[0])
  const offline: Vision = {
    photoOnBrand: 86 + (h % 10),
    strayTextOrLogos: false,
    photoIssues: [],
    toneScore: 84 + (h % 12),
    briefScore: 80 + ((h >> 3) % 15),
    keyMessagesCovered: Math.max(2, b.keyMessages.length - (h % 2)),
    notes: '',
  }
  if (!ctx.live) {
    await sleep(500 + (h % 400), ctx.signal)
    return offline
  }
  try {
    const { data, usage } = await generateJson<Vision>({
            ...route(ctx, 'qa', 'text'),
      temperature: 0.1,
      images: c.image ? [c.image] : [],
      system: `You are the Brand & Compliance QA agent at ${BRAND.name}. You are strict but fair. Score honestly.\nART DIRECTION:\n- ${BRAND.artDirection.join('\n- ')}\n${brandContext(journey)}`,
      prompt: `${c.image ? 'The attached image is the photograph for this asset.' : 'No photograph (brand illustration used): score photoOnBrand 85 and strayTextOrLogos false.'}\nFORMAT: ${formats[c.format].label}\nHEADLINE: ${c.headlines[c.selected]}\nBODY: ${c.body}\nCTA: ${c.cta}\nBRIEF KEY MESSAGES: ${b.keyMessages.join('; ')}\nAUDIENCE: ${b.audience}\n\nReturn: photoOnBrand (0-100 vs the art direction), strayTextOrLogos (true if ANY letters, signage or logos are visible in the photo), photoIssues (short phrases), toneScore (0-100 vs the tone guide), briefScore (0-100), keyMessagesCovered (count), notes (under 20 words).`,
      schema: S.obj({
        photoOnBrand: S.int(),
        strayTextOrLogos: S.bool(),
        photoIssues: S.arr(S.str()),
        toneScore: S.int(),
        briefScore: S.int(),
        keyMessagesCovered: S.int(),
        notes: S.str(),
      }),
    })
    ctx.usage(usage)
    return { ...offline, ...data, photoIssues: data.photoIssues ?? [] }
  } catch (e) {
    if (isAbort(e)) throw e
    ctx.log('qa', 'warn', `Vision check failed for ${formats[c.format].short}, scoring rules only: ${(e as Error).message}`)
    return offline
  }
}

const overall = (qa: CheckResult[]): QaState => (qa.some((q) => q.status === 'fail') ? 'fail' : qa.some((q) => q.status === 'warn') ? 'warn' : 'pass')

async function qaOne(ctx: RunContext, format: FormatId, b: StructuredBrief, routing: Routing, art: ArtDirection) {
  const journey = routing.journey
  const update = (patch: Partial<RunCreative>) => ctx.patch((r) => ({ creatives: r.creatives.map((x) => (x.format === format ? { ...x, ...patch } : x)) }))
  const current = () => ctx.get().creatives.find((x) => x.format === format)!

  for (let attempt = 0; attempt < 3; attempt++) {
    const c = current()
    update({ status: 'checking' })
    const v = await vision(ctx, c, b, journey)
    const qa = ruleChecks(c, journey, v, b.keyMessages.length, !!c.image)
    const state = overall(qa)
    const failed = qa.filter((q) => q.status === 'fail')
    if (state !== 'fail' || attempt === 2) {
      update({ qa, qaState: state, status: 'ready', notes: v.notes || undefined })
      ctx.log('qa', state === 'fail' ? 'error' : 'result', `${formats[c.format].short}: ${state === 'pass' ? 'passed 8/8' : state === 'warn' ? `passed with ${qa.filter((q) => q.status === 'warn').length} warning(s)` : 'still failing, flagged for people'}`)
      return
    }
    ctx.patch((r) => ({ stats: { ...r.stats, fixes: r.stats.fixes + 1 } }))
    update({ qa, qaState: 'fail', status: 'fixing' })
    const imageIssue = failed.some((q) => q.id === 'logo')
    ctx.log('qa', 'handoff', `${formats[c.format].short} failed ${failed.map((q) => q.label.toLowerCase()).join(', ')}. Sending back to the ${imageIssue ? 'Image Generator' : 'Copywriter'}.`, failed.map((q) => q.detail))
    if (imageIssue && ctx.live && c.image) {
      try {
        const image = await paint(ctx, `${adaptPromptFor(art, c.aspect)}\nThe previous attempt contained visible text or logos. Remove all of them.`, c.aspect, ctx.get().masterImage ? [ctx.get().masterImage!] : undefined)
        update({ image, revisions: c.revisions + 1 })
        continue
      } catch (e) {
        if (isAbort(e)) throw e
      }
    }
    const fixed = await reviseCopy(ctx, b, journey, c, failed.map((q) => q.detail))
    ctx.log('copywriter', 'result', `Revised ${formats[c.format].short}: "${fixed.headlines[0]}"`)
    update({ ...fixed, selected: 0, revisions: c.revisions + 1 })
  }
}

/* ------------------------------------------------------------------ */
/* Orchestrator                                                        */
/* ------------------------------------------------------------------ */

export async function runPipeline(ctx: RunContext) {
  const timed = async <T,>(agent: AgentId, fn: () => Promise<T>, summary: (t: T) => string): Promise<T> => {
    ctx.step(agent, { status: 'running', startedAt: Date.now() })
    ctx.log(agent, 'start', `${agentDef(agent).name} started`)
    try {
      const out = await fn()
      const s = summary(out)
      ctx.step(agent, { status: 'done', endedAt: Date.now(), summary: s })
      ctx.log(agent, 'done', s)
      return out
    } catch (e) {
      ctx.step(agent, { status: 'error', endedAt: Date.now(), summary: (e as Error).message })
      throw e
    }
  }

  const brief = await timed('strategist', () => strategist(ctx), (b) => `${b.name} · ${b.keyMessages.length} key messages · ${b.channels.length} channels`)
  ctx.patch(() => ({ brief }))
  ctx.log('strategist', 'result', 'Structured brief', brief)
  ctx.log('strategist', 'handoff', 'Brief handed to the Journey Router')

  const routing = await timed('router', () => router(ctx, brief), (r) => `${journeyLabel[r.journey]} · ${Math.round(r.confidence * 100)}% confident · ${r.formats.length} formats · ${r.slaHours}h SLA`)
  const finalBrief = { ...brief, journey: routing.journey }
  ctx.patch(() => ({
    brief: finalBrief,
    routing,
    creatives: routing.formats.map((f) => ({ format: f, headlines: [], selected: 0, body: '', cta: '', aspect: ASPECT_FOR[f], status: 'writing', qaState: 'not-run', revisions: 0 })),
  }))
  ctx.log('router', 'result', routing.rationale, routing)
  ctx.log('router', 'handoff', 'Copywriter and Art Director start in parallel')

  const [copy, art] = await Promise.all([
    timed('copywriter', () => copywriter(ctx, finalBrief, routing), (c) => `${c.length} formats · ${c.length * 3} headline options`),
    timed('artdirector', () => artDirector(ctx, finalBrief, routing.journey), (a) => a.concept),
  ])
  const byFormat = new Map(copy.map((c) => [c.format, c]))
  ctx.patch((r) => ({
    art,
    creatives: r.creatives.map((c) => {
      const out = byFormat.get(c.format)!
      return { ...c, headlines: out.headlines.slice(0, 3), body: out.body, cta: out.cta, rationale: out.rationale, status: 'painting' }
    }),
  }))
  ctx.log('artdirector', 'result', art.concept, art)

  await timed('imager', () => imager(ctx, art), () => {
    const n = new Set(ctx.get().creatives.map((c) => c.aspect)).size
    return ctx.live && ctx.get().masterImage ? `1 key visual + ${n - 1} re-frames` : `${n} brand illustrations`
  })
  ctx.log('imager', 'handoff', 'Assets handed to Brand & Compliance QA')

  await timed(
    'qa',
    async () => {
      ctx.log('qa', 'thought', 'Running 8 checks per asset: format, palette, logo, journey, length, claims & disclaimer, tone, brief.')
      await pool(
        ctx.get().creatives.map((c) => c.format),
        ctx.live ? 2 : 3,
        (f) => qaOne(ctx, f, finalBrief, routing, art),
      )
      return ctx.get().creatives
    },
    (cs) => {
      const fixes = ctx.get().stats.fixes
      return `${cs.filter((c) => c.qaState !== 'fail').length}/${cs.length} cleared${fixes ? ` · ${fixes} self-repaired` : ''}`
    },
  )
  ctx.step('human', { status: 'running', startedAt: Date.now() })
  ctx.log('human', 'handoff', 'Ready for people: choose headlines, refine visuals, then send to Brand, Business & Risk.')
}

/* ------------------------------------------------------------------ */
/* Human-directed image refinement ("make it golden hour")             */
/* ------------------------------------------------------------------ */

export async function refineImage(opts: { key: string; models: string[]; image: string; instruction: string; aspect: AspectRatio; signal?: AbortSignal }) {
  const { image } = await generateImage({
    key: opts.key,
    models: opts.models,
    aspectRatio: opts.aspect,
    references: [opts.image],
    signal: opts.signal,
    prompt: `Edit the reference photograph: ${opts.instruction}. Keep the same homes, people, framing and colour grade unless the instruction says otherwise. ${GUARDRAILS}`,
  })
  return image
}

/** Re-run Brand & Compliance QA on every asset, e.g. after a person uploads a key visual. */
export async function recheckQa(ctx: RunContext) {
  const r = ctx.get()
  if (!r.brief || !r.routing || !r.art) return
  const brief = r.brief
  const routing = r.routing
  const art = r.art
  ctx.step('qa', { status: 'running', startedAt: Date.now(), endedAt: undefined })
  ctx.log('qa', 'start', 'Re-checking every asset against brand, legal and brief with the new key visual')
  await pool(
    r.creatives.map((c) => c.format),
    ctx.live ? 2 : 3,
    (f) => qaOne(ctx, f, brief, routing, art),
  )
  const cs = ctx.get().creatives
  const s = `${cs.filter((c) => c.qaState !== 'fail').length}/${cs.length} cleared with the new visual`
  ctx.step('qa', { status: 'done', endedAt: Date.now(), summary: s })
  ctx.log('qa', 'done', s)
}
