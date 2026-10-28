import { formats, journeyLabel } from './formats'
import type { Asset, Brief, CheckResult } from './types'

export const CHECK_LABELS = [
  'Format compliance',
  'Brand colour palette',
  'Logo placement & safe zone',
  'Journey proposition alignment',
  'Copy length',
  'Regulatory disclaimer',
  'Tone of voice consistency',
  'Brief alignment',
]

function hash(s: string) {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h
}

/** Deterministic synthetic QA scan. The asset's seeded outcome decides warn/fail. */
export function runChecks(asset: Asset, brief: Brief): CheckResult[] {
  const f = formats[asset.format]
  const h = hash(asset.id + asset.version)
  const other = asset.journey === 'rental' ? 'Shared Ownership' : 'Rental'
  const palette = asset.journey === 'rental' ? 'Rental teal' : 'Shared Ownership purple'
  const primary = asset.headlines[0].length + 1 + asset.cta.length
  const tone = 86 + (h % 11)
  const align = 82 + ((h >> 3) % 14)
  const messages = brief.keyMessages.length
  const covered = Math.max(2, messages - (h % 2))

  const results: CheckResult[] = [
    { id: 'format', label: CHECK_LABELS[0], status: 'pass', detail: `${f.width}×${f.height} matches the ${f.label} spec` },
    { id: 'palette', label: CHECK_LABELS[1], status: 'pass', detail: `All colours within the ${palette} palette (ΔE < 2)` },
    { id: 'logo', label: CHECK_LABELS[2], status: 'pass', detail: 'Logo top-left, inside the 8% safe zone' },
    { id: 'journey', label: CHECK_LABELS[3], status: 'pass', detail: `${journeyLabel[asset.journey]} only — no ${other} terms found` },
    { id: 'length', label: CHECK_LABELS[4], status: 'pass', detail: `Primary text ${primary} chars (limit ${f.maxHeadline})` },
    {
      id: 'disclaimer',
      label: CHECK_LABELS[5],
      status: 'pass',
      detail: asset.journey === 'shared' ? 'Leasehold & repossession disclaimer present' : 'Holding-deposit line present',
    },
    { id: 'tone', label: CHECK_LABELS[6], status: 'pass', detail: `Score ${tone}% against the ${journeyLabel[asset.journey]} tone guide (min 80%)` },
    { id: 'brief', label: CHECK_LABELS[7], status: 'pass', detail: `Score ${align}% — covers ${covered} of ${messages} key messages` },
  ]

  if (asset.qaOutcome === 'warn') {
    results[4] = {
      ...results[4],
      status: 'warn',
      detail: `Primary text ${f.maxHeadline + 6 + (h % 20)} chars — exceeds the ${f.maxHeadline}-char limit for ${f.short}`,
    }
  }
  if (asset.qaOutcome === 'fail') {
    results[5] = {
      ...results[5],
      status: 'fail',
      detail:
        asset.journey === 'shared'
          ? 'Missing Shared Ownership repossession risk disclaimer'
          : 'Missing holding-deposit and referencing disclaimer',
    }
    results[6] = { ...results[6], detail: `Score ${tone - 4}% against the ${journeyLabel[asset.journey]} tone guide (min 80%)` }
  }
  return results
}

export function overall(results: CheckResult[]): CheckResult['status'] {
  if (results.some((r) => r.status === 'fail')) return 'fail'
  if (results.some((r) => r.status === 'warn')) return 'warn'
  return 'pass'
}
