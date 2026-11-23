import { create } from 'zustand'
import { DEFAULT_IMAGE_MODEL, DEFAULT_TEXT_MODEL, listModels, pickModels } from './gemini'

const STORAGE_KEY = 'lloyds-living-ai-settings'

export type AiMode = 'live' | 'demo'

interface Persisted {
  apiKey: string
  textModel: string
  imageModel: string
  mode: AiMode
}

interface AiSettings extends Persisted {
  available: { text: string[]; image: string[] }
  status: 'unknown' | 'checking' | 'ok' | 'error'
  statusMessage?: string
  save: (p: Partial<Persisted>) => void
  verify: (key?: string) => Promise<boolean>
  clearKey: () => void
}

function load(): Persisted {
  const fallback: Persisted = { apiKey: '', textModel: DEFAULT_TEXT_MODEL, imageModel: DEFAULT_IMAGE_MODEL, mode: 'demo' }
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
  available: { text: [], image: [] },
  status: 'unknown',

  save: (p) => {
    set(p)
    const { apiKey, textModel, imageModel, mode } = get()
    persist({ apiKey, textModel, imageModel, mode })
  },

  verify: async (key) => {
    const apiKey = (key ?? get().apiKey).trim()
    if (!apiKey) {
      set({ status: 'error', statusMessage: 'Paste an API key from Google AI Studio first.' })
      return false
    }
    set({ status: 'checking', statusMessage: undefined })
    try {
      const models = await listModels(apiKey)
      const picked = pickModels(models)
      const s = get()
      // A new key gets the newest models; re-checking the same key keeps the user's choice.
      const keep = apiKey === s.apiKey
      const textModel = keep && picked.text.includes(s.textModel) ? s.textModel : (picked.text[0] ?? DEFAULT_TEXT_MODEL)
      const imageModel = keep && picked.image.includes(s.imageModel) ? s.imageModel : (picked.image[0] ?? DEFAULT_IMAGE_MODEL)
      set({
        available: picked,
        status: 'ok',
        statusMessage: `Connected. ${picked.text.length} text and ${picked.image.length} image models available.`,
      })
      get().save({ apiKey, textModel, imageModel, mode: 'live' })
      return true
    } catch (e) {
      set({ status: 'error', statusMessage: (e as Error).message })
      return false
    }
  },

  clearKey: () => {
    set({ status: 'unknown', statusMessage: undefined, available: { text: [], image: [] } })
    get().save({ apiKey: '', mode: 'demo' })
  },
}))

export const isLive = (s: Pick<AiSettings, 'apiKey' | 'mode'>) => s.mode === 'live' && !!s.apiKey
