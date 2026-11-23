/**
 * Minimal Google AI Studio (Gemini API) client.
 *
 * Calls the public REST endpoint straight from the browser with the user's own
 * API key (sent in the `x-goog-api-key` header, never in the URL). No SDK, so the
 * request shapes below are exactly what Google documents for `generateContent`.
 */

const BASE = 'https://generativelanguage.googleapis.com/v1beta'

/** Fallbacks when model discovery is unavailable. Both are long-lived GA model ids. */
export const DEFAULT_TEXT_MODEL = 'gemini-2.5-flash'
export const DEFAULT_IMAGE_MODEL = 'gemini-2.5-flash-image'

export type AspectRatio = '1:1' | '9:16' | '16:9' | '4:3' | '5:4' | '21:9' | '3:2' | '4:5'

export interface Usage {
  promptTokens: number
  outputTokens: number
}

export class GeminiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function request<T>(key: string, path: string, init: RequestInit = {}, signal?: AbortSignal): Promise<T> {
  let lastErr: unknown
  for (let attempt = 0; attempt < 3; attempt++) {
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
      await sleep(800 * (attempt + 1))
      continue
    }
    if (res.ok) return (await res.json()) as T
    const body = await res.text()
    let message = body
    try {
      message = (JSON.parse(body) as { error?: { message?: string } }).error?.message ?? body
    } catch {
      /* keep raw body */
    }
    const err = new GeminiError(message || res.statusText, res.status)
    // Retry only transient failures.
    if (res.status === 429 || res.status >= 500) {
      lastErr = err
      await sleep(1500 * (attempt + 1))
      continue
    }
    throw err
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

/** Pick the newest fast text model and the newest image model the key can use. */
export function pickModels(models: ModelInfo[]) {
  const gen = models.filter((m) => m.methods.includes('generateContent'))
  const text = gen
    .filter((m) => /^gemini-[\d.]+-flash/.test(m.id) && !NOT_TEXT.test(m.id))
    .sort((a, b) => {
      const penalty = (id: string) => (id.includes('preview') || id.includes('exp') ? 1 : 0) + (id.includes('lite') ? 2 : 0)
      return versionOf(b.id) - versionOf(a.id) || penalty(a.id) - penalty(b.id)
    })
  const image = gen
    .filter((m) => /(flash-image|pro-image|nano-banana)/i.test(m.id))
    .sort((a, b) => {
      const flash = (id: string) => (/flash|nano-banana/.test(id) ? 1 : 0)
      return flash(b.id) - flash(a.id) || versionOf(b.id) - versionOf(a.id)
    })
  return {
    text: text.map((m) => m.id),
    image: image.map((m) => m.id),
  }
}

export interface JsonCall<T> {
  key: string
  model: string
  system: string
  prompt: string
  schema?: Record<string, unknown>
  images?: string[]
  temperature?: number
  signal?: AbortSignal
  /** Only for typing. */
  _t?: T
}

/** Structured generation: returns parsed JSON plus token usage. */
export async function generateJson<T>(c: JsonCall<T>): Promise<{ data: T; usage: Usage }> {
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
  let r: GenerateResponse
  try {
    r = await request<GenerateResponse>(c.key, `/models/${c.model}:generateContent`, { method: 'POST', body: JSON.stringify(body(true)) }, c.signal)
  } catch (e) {
    // Some models reject responseSchema; retry once relying on the prompt alone.
    if (e instanceof GeminiError && e.status === 400 && /schema/i.test(e.message)) {
      r = await request<GenerateResponse>(c.key, `/models/${c.model}:generateContent`, { method: 'POST', body: JSON.stringify(body(false)) }, c.signal)
    } else throw e
  }
  const text = partsOf(r)
    .map((p) => p.text ?? '')
    .join('')
  return { data: parseJson<T>(text), usage: usageOf(r) }
}

export interface ImageCall {
  key: string
  model: string
  prompt: string
  aspectRatio: AspectRatio
  /** Reference images (data URLs) so adaptations stay consistent with the key visual. */
  references?: string[]
  signal?: AbortSignal
}

/** Image generation ("Nano Banana" family). Returns a data: URL. */
export async function generateImage(c: ImageCall): Promise<{ image: string; note?: string; usage: Usage }> {
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
  let r: GenerateResponse
  try {
    r = await request<GenerateResponse>(c.key, `/models/${c.model}:generateContent`, { method: 'POST', body: JSON.stringify(body(true)) }, c.signal)
  } catch (e) {
    if (e instanceof GeminiError && e.status === 400 && /(imageConfig|aspect)/i.test(e.message)) {
      r = await request<GenerateResponse>(c.key, `/models/${c.model}:generateContent`, { method: 'POST', body: JSON.stringify(body(false)) }, c.signal)
    } else throw e
  }
  const ps = partsOf(r)
  const img = ps.find((p) => p.inlineData?.data || p.inline_data?.data)
  const note = ps
    .map((p) => p.text ?? '')
    .join(' ')
    .trim()
  if (!img) throw new GeminiError(`No image returned${note ? `: ${note.slice(0, 160)}` : ''}`, 200)
  const mime = img.inlineData?.mimeType ?? img.inline_data?.mime_type ?? 'image/png'
  const data = img.inlineData?.data ?? img.inline_data?.data
  return { image: `data:${mime};base64,${data}`, note: note || undefined, usage: usageOf(r) }
}
