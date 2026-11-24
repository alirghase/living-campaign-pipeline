import { create } from 'zustand'
import { DEFAULT_IMAGE_MODEL, DEFAULT_TEXT_MODEL, listModels, pickModels, resetModelHealth } from './gemini'

const STORAGE_KEY = 'lloyds-living-ai-settings'

export type AiMode = 'live' | 'demo'

interface Persisted {
  apiKey: string
  textModel: string
  imageModel: string
  mode: AiMode
  /** Models the key can use, best first. The rest serve as fallbacks. */
  available: { text: string[]; image: string[] }
}

interface AiSettings extends Persisted {
  status: 'unknown' | 'checking' | 'ok' | 'error'
  statusMessage?: string
  save: (p: Partial<Persisted>) => void
  verify: (key?: string) => Promise<boolean>
  clearKey: () => void
}

function load(): Persisted {
  const fallback: Persisted = { apiKey: '', textModel: DEFAULT_TEXT_MODEL, imageModel: DEFAULT_IMAGE_MODEL, mode: 'demo', available: { text: [], image: [] } }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...fallback, ...(JSON.parse(raw) as Partial<Persisted>) } : fallback
  } catch {
    return fallback
  }
}

function persist(p: Persisted) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
  } catch {
    /* private mode: settings last for this tab only */
  }
}

export const useAiSettings = create<AiSettings>((set, get) => ({
  ...load(),
  status: 'unknown',

  save: (p) => {
    set(p)
    const { apiKey, textModel, imageModel, mode, available } = get()
    persist({ apiKey, textModel, imageModel, mode, available })
  },

  verify: async (key) => {
    const apiKey = (key ?? get().apiKey).trim()
    if (!apiKey) {
      set({ status: 'error', statusMessage: 'Paste an API key from Google AI Studio first.' })
      return false
    }
    set({ status: 'checking', statusMessage: undefined })
    resetModelHealth()
    try {
      const models = await listModels(apiKey)
      const picked = pickModels(models)
      const s = get()
      // A new key gets the newest models; re-checking the same key keeps the user's choice.
      const keep = apiKey === s.apiKey
      const textModel = keep && picked.text.includes(s.textModel) ? s.textModel : (picked.text[0] ?? DEFAULT_TEXT_MODEL)
      const imageModel = keep && picked.image.includes(s.imageModel) ? s.imageModel : (picked.image[0] ?? DEFAULT_IMAGE_MODEL)
      set({
        status: 'ok',
        statusMessage: `Connected. ${picked.text.length} text and ${picked.image.length} image models available. If one is busy, the agents switch to the next.`,
      })
      get().save({ apiKey, textModel, imageModel, mode: 'live', available: picked })
      return true
    } catch (e) {
      set({ status: 'error', statusMessage: (e as Error).message })
      return false
    }
  },

  clearKey: () => {
    set({ status: 'unknown', statusMessage: undefined })
    get().save({ apiKey: '', mode: 'demo', available: { text: [], image: [] } })
  },
}))

/** Fallback order for a run: every other model on the key, best first. */
export function fallbacksOf(s: Pick<AiSettings, 'textModel' | 'imageModel' | 'available'>) {
  return {
    text: (s.available.text.length ? s.available.text : [DEFAULT_TEXT_MODEL]).filter((m) => m !== s.textModel),
    image: (s.available.image.length ? s.available.image : [DEFAULT_IMAGE_MODEL]).filter((m) => m !== s.imageModel),
  }
}

export const isLive = (s: Pick<AiSettings, 'apiKey' | 'mode'>) => s.mode === 'live' && !!s.apiKey
