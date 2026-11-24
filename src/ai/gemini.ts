/**
 * Minimal Google AI Studio (Gemini API) client.
 *
 * Calls the public REST endpoint straight from the browser with the user's own
 * API key (sent in the `x-goog-api-key` header, never in the URL). No SDK, so the
 * request shapes below are exactly what Google documents for `generateContent`.
 */

const BASE = 'https://generativelanguage.googleapis.com/v1beta'

/** Fallbacks when model discovery is unavailable. `gemini-flash-latest` is Google's rolling alias. */
export const DEFAULT_TEXT_MODEL = 'gemini-flash-latest'
export const DEFAULT_IMAGE_MODEL = 'gemini-2.5-flash-image'

export type AspectRatio = '1:1' | '9:16' | '16:9' | '4:3' | '5:4' | '21:9' | '3:2' | '4:5'

export interface Usage {
  promptTokens: number
  outputTokens: number
}

export class GeminiError extends Error {
  status: number
  /** Seconds Google asked us to wait (429 RetryInfo). */
  retryAfter?: number
  /** The model's quota is used up for the day, or is zero on this tier. Retrying soon won't help. */
  quotaExhausted?: boolean
  /** Full error text from Google, for the trace. */
  raw?: string
  constructor(message: string, status: number, extra: Partial<Pick<GeminiError, 'retryAfter' | 'quotaExhausted' | 'raw'>> = {}) {
    super(message)
    this.status = status
    Object.assign(this, extra)
  }
}

interface Part {
  text?: string
  inlineData?: { mimeType: string; data: string }
  inline_data?: { mime_type: string; data: string }
}

interface GenerateResponse {
  candidates?: { content?: { parts?: Part[] }; finishReason?: string }[]
  promptFeedback?: { blockReason?: string }
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number }
}

interface ApiError {
  error?: { message?: string; details?: { '@type'?: string; retryDelay?: string }[] }
}

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(t)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })

function toError(status: number, body: string, model?: string): GeminiError {
  let raw = body
  let retryAfter: number | undefined
  try {
    const e = (JSON.parse(body) as ApiError).error
    raw = e?.message ?? body
    const delay = e?.details?.find((d) => d['@type']?.endsWith('RetryInfo'))?.retryDelay
    if (delay) retryAfter = parseFloat(delay)
  } catch {
    /* keep raw body */
  }
  const on = model ? ` on ${model}` : ''
  if (status === 429) {
    const zero = /limit: 0\b/.test(raw)
    const daily = /per day/i.test(raw) && (retryAfter ?? 0) > 120
    const quotaExhausted = zero || daily || (retryAfter ?? 0) > 120
    const message = zero
      ? `Not included in this key's tier${on} (quota 0). Enable billing in Google AI Studio to use it.`
      : quotaExhausted
        ? `Daily quota used up${on}. It resets in about ${Math.round((retryAfter ?? 0) / 3600)}h, or enable billing.`
        : `Rate limited${on} (free tier). Retry in ${Math.ceil(retryAfter ?? 20)}s.`
    return new GeminiError(message, status, { retryAfter, quotaExhausted, raw })
  }
  if (status === 503) return new GeminiError(`Google reports high demand${on}. Try again shortly or use another model.`, status, { raw })
  if (status === 404) return new GeminiError(`Model not available${on} for this key.`, status, { raw })
  if (status === 400 && /API key not valid/i.test(raw)) return new GeminiError('API key not valid. Check it in Google AI Studio.', status, { raw })
  return new GeminiError(raw || `HTTP ${status}`, status, { raw })
}

async function request<T>(key: string, path: string, init: RequestInit = {}, signal?: AbortSignal, model?: string): Promise<T> {
  let lastErr: unknown
  for (let attempt = 0; attempt < 2; attempt++) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    let res: Response
    try {
      res = await fetch(`${BASE}${path}`, {
        ...init,
        signal,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key, ...(init.headers ?? {}) },
      })
    } catch (e) {
      if ((e as Error).name === 'AbortError') throw e
      lastErr = new GeminiError(`Network error reaching Google AI Studio: ${(e as Error).message}`, 0)
      await sleep(800 * (attempt + 1), signal)
      continue
    }
    if (res.ok) return (await res.json()) as T
    const err = toError(res.status, await res.text(), model)
    // One quick retry for a plain server error. Overload (503), rate limits and quota go
    // straight back to the caller, which switches model instead of waiting.
    if (res.status === 500 && attempt === 0) {
      lastErr = err
      await sleep(1200, signal)
      continue
    }
    throw err
  }
  throw lastErr
}

/*
 * Model health for this browser: when a model is overloaded, rate-limited, out of quota
 * or retired, it sits out until it is likely to work again, so later calls go straight
 * to a model that answers. Persisted so a daily quota stays remembered across reloads.
 */
const HEALTH_KEY = 'lloyds-living-model-health'
const health: Map<string, number> = (() => {
  try {
    const raw = JSON.parse(localStorage.getItem(HEALTH_KEY) ?? '{}') as Record<string, number>
    return new Map(Object.entries(raw).filter(([, until]) => until > Date.now()))
  } catch {
    return new Map()
  }
})()

function benchModel(model: string, e: GeminiError) {
  const sec = e.status === 404 ? 6 * 3600 : e.status === 429 ? (e.quotaExhausted ? Math.max(e.retryAfter ?? 0, 3600) : (e.retryAfter ?? 20)) : 90
  health.set(model, Date.now() + sec * 1000)
  try {
    localStorage.setItem(HEALTH_KEY, JSON.stringify(Object.fromEntries(health)))
  } catch {
    /* private mode */
  }
}

/** Forget remembered model problems (e.g. after enabling billing). */
export function resetModelHealth() {
  health.clear()
  try {
    localStorage.removeItem(HEALTH_KEY)
  } catch {
    /* ignore */
  }
}

/** Healthy models first, in preference order; briefly benched ones after; long-benched ones only as a last resort. */
function healthOrder(models: string[]) {
  const now = Date.now()
  const until = (m: string) => health.get(m) ?? 0
  const ok = models.filter((m) => until(m) <= now)
  const soon = models.filter((m) => until(m) > now && until(m) - now < 60_000).sort((a, b) => until(a) - until(b))
  const later = models.filter((m) => until(m) - now >= 60_000)
  return ok.length + soon.length ? [...ok, ...soon] : later
}

/** Errors worth trying the next model for. Bad requests and bad keys are not. */
const switchable = (e: unknown) => e instanceof GeminiError && (e.status === 429 || e.status === 404 || e.status >= 500 || e.status === 0)

/**
 * Try each model in turn. Free-tier quotas are per model, so rotating spreads the
 * load. If every model is only briefly rate-limited, wait as long as Google asks
 * (capped) and go round once more.
 */
export async function withModels<T>(
  models: string[],
  fn: (model: string) => Promise<T>,
  opts: { signal?: AbortSignal; onSwitch?: (from: string, to: string, why: GeminiError) => void } = {},
): Promise<{ result: T; model: string }> {
  let lastErr: unknown
  for (let round = 0; round < 2; round++) {
    const list = healthOrder([...new Set(models.filter(Boolean))])
    let wait = 0
    for (let i = 0; i < list.length; i++) {
      try {
        return { result: await fn(list[i]), model: list[i] }
      } catch (e) {
        if (!switchable(e)) throw e
        lastErr = e
        const ge = e as GeminiError
        benchModel(list[i], ge)
        if (ge.status === 429 && !ge.quotaExhausted) wait = Math.max(wait, ge.retryAfter ?? 20)
        if (i + 1 < list.length) opts.onSwitch?.(list[i], list[i + 1], ge)
      }
    }
    if (!wait) break
    await sleep(Math.min(wait, 30) * 1000, opts.signal)
  }
  throw lastErr
}

function partsOf(r: GenerateResponse): Part[] {
  const parts = r.candidates?.[0]?.content?.parts ?? []
  if (!parts.length) {
    const reason = r.promptFeedback?.blockReason ?? r.candidates?.[0]?.finishReason ?? 'empty response'
    throw new GeminiError(`Gemini returned no content (${reason})`, 200)
  }
  return parts
}

const usageOf = (r: GenerateResponse): Usage => ({
  promptTokens: r.usageMetadata?.promptTokenCount ?? 0,
  outputTokens: r.usageMetadata?.candidatesTokenCount ?? 0,
})

function parseJson<T>(text: string): T {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim()
  try {
    return JSON.parse(cleaned) as T
  } catch {
    const start = cleaned.search(/[[{]/)
    const end = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'))
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1)) as T
    throw new GeminiError('Gemini did not return valid JSON', 200)
  }
}

/** A data: URL split into the inline_data shape Gemini expects. */
export function toInlineData(dataUrl: string): Part | null {
  const m = /^data:([^;]+);base64,(.*)$/.exec(dataUrl)
  if (!m || m[1] === 'image/svg+xml') return null
  return { inlineData: { mimeType: m[1], data: m[2] } }
}

export interface ModelInfo {
  id: string
  displayName: string
  methods: string[]
}

export async function listModels(key: string, signal?: AbortSignal): Promise<ModelInfo[]> {
  const r = await request<{ models?: { name: string; displayName?: string; supportedGenerationMethods?: string[] }[] }>(
    key,
    '/models?pageSize=1000',
    { method: 'GET' },
    signal,
  )
  return (r.models ?? []).map((m) => ({
    id: m.name.replace(/^models\//, ''),
    displayName: m.displayName ?? m.name,
    methods: m.supportedGenerationMethods ?? [],
  }))
}

const versionOf = (id: string) => {
  const m = /gemini-(\d+(?:\.\d+)?)/.exec(id)
  return m ? parseFloat(m[1]) : 0
}

const NOT_TEXT = /(image|tts|audio|live|embedding|vision|aqa|learnlm|robotics|computer|native|thinking-exp|lite-preview-0|gemma|veo|imagen|nano-banana)/i

const isPreview = (id: string) => /preview|exp/.test(id)

/** Rank the text and image models the key can use: newest first, stable before preview. */
export function pickModels(models: ModelInfo[]) {
  const gen = models.filter((m) => m.methods.includes('generateContent'))
  const text = gen
    .filter((m) => /^gemini-[\d.]+-flash/.test(m.id) && !NOT_TEXT.test(m.id))
    .sort((a, b) => {
      const penalty = (id: string) => (isPreview(id) ? 1 : 0) + (id.includes('lite') ? 2 : 0)
      return versionOf(b.id) - versionOf(a.id) || penalty(a.id) - penalty(b.id)
    })
    .map((m) => m.id)
  if (gen.some((m) => m.id === 'gemini-flash-latest')) text.push('gemini-flash-latest')
  const image = gen
    .filter((m) => /(flash-image|pro-image|nano-banana)/i.test(m.id) && !/lite/.test(m.id))
    .sort((a, b) => {
      const flash = (id: string) => (/flash|nano-banana-2/.test(id) ? 1 : 0)
      return Number(isPreview(a.id)) - Number(isPreview(b.id)) || flash(b.id) - flash(a.id) || versionOf(b.id) - versionOf(a.id)
    })
    .map((m) => m.id)
  return { text, image }
}

interface Rotation {
  key: string
  /** Preferred model first; the rest are tried in order if it is overloaded, retired or rate-limited. */
  models: string[]
  signal?: AbortSignal
  onSwitch?: (from: string, to: string, why: GeminiError) => void
}

export interface JsonCall<T> extends Rotation {
  system: string
  prompt: string
  schema?: Record<string, unknown>
  images?: string[]
  temperature?: number
  /** Only for typing. */
  _t?: T
}

/** Structured generation: returns parsed JSON, token usage and the model that answered. */
export async function generateJson<T>(c: JsonCall<T>): Promise<{ data: T; usage: Usage; model: string }> {
  const parts: Part[] = [{ text: c.prompt }]
  for (const img of c.images ?? []) {
    const p = toInlineData(img)
    if (p) parts.push(p)
  }
  const body = (withSchema: boolean) => ({
    systemInstruction: { parts: [{ text: c.system }] },
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: c.temperature ?? 0.7,
      responseMimeType: 'application/json',
      ...(withSchema && c.schema ? { responseSchema: c.schema } : {}),
    },
  })
  const call = async (model: string) => {
    const post = (withSchema: boolean) =>
      request<GenerateResponse>(c.key, `/models/${model}:generateContent`, { method: 'POST', body: JSON.stringify(body(withSchema)) }, c.signal, model)
    try {
      return await post(true)
    } catch (e) {
      // Some models reject responseSchema; retry once relying on the prompt alone.
      if (e instanceof GeminiError && e.status === 400 && /schema/i.test(e.raw ?? e.message)) return post(false)
      throw e
    }
  }
  const { result: r, model } = await withModels(c.models, call, c)
  const text = partsOf(r)
    .map((p) => p.text ?? '')
    .join('')
  return { data: parseJson<T>(text), usage: usageOf(r), model }
}

export interface ImageCall extends Rotation {
  prompt: string
  aspectRatio: AspectRatio
  /** Reference images (data URLs) so adaptations stay consistent with the key visual. */
  references?: string[]
}

/** Image generation ("Nano Banana" family). Returns a data: URL and the model that answered. */
export async function generateImage(c: ImageCall): Promise<{ image: string; note?: string; usage: Usage; model: string }> {
  const parts: Part[] = [{ text: c.prompt }]
  for (const ref of c.references ?? []) {
    const p = toInlineData(ref)
    if (p) parts.push(p)
  }
  const body = (withRatio: boolean) => ({
    contents: [{ role: 'user', parts: withRatio ? parts : [{ text: `${c.prompt}\nAspect ratio: ${c.aspectRatio}.` }, ...parts.slice(1)] }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      ...(withRatio ? { imageConfig: { aspectRatio: c.aspectRatio } } : {}),
    },
  })
  const call = async (model: string) => {
    const post = (withRatio: boolean) =>
      request<GenerateResponse>(c.key, `/models/${model}:generateContent`, { method: 'POST', body: JSON.stringify(body(withRatio)) }, c.signal, model)
    try {
      return await post(true)
    } catch (e) {
      if (e instanceof GeminiError && e.status === 400 && /(imageConfig|aspect)/i.test(e.raw ?? e.message)) return post(false)
      throw e
    }
  }
  const { result: r, model } = await withModels(c.models, call, c)
  const ps = partsOf(r)
  const img = ps.find((p) => p.inlineData?.data || p.inline_data?.data)
  const note = ps
    .map((p) => p.text ?? '')
    .join(' ')
    .trim()
  if (!img) throw new GeminiError(`No image returned${note ? `: ${note.slice(0, 160)}` : ''}`, 200)
  const mime = img.inlineData?.mimeType ?? img.inline_data?.mime_type ?? 'image/png'
  const data = img.inlineData?.data ?? img.inline_data?.data
  return { image: `data:${mime};base64,${data}`, note: note || undefined, usage: usageOf(r), model }
}
