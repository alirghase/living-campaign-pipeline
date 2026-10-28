export const H = 3_600_000
export const D = 24 * H

/** Fixed at load so the synthetic timeline stays consistent during a demo. */
export const NOW = Date.now()

export function startOfToday(t = Date.now()) {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function isToday(t: number | undefined) {
  return t !== undefined && t >= startOfToday() && t < startOfToday() + D
}

export function fmtDate(t: number | undefined) {
  if (t === undefined) return '—'
  return new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function fmtDateTime(t: number | undefined) {
  if (t === undefined) return '—'
  return new Date(t).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function fmtDuration(ms: number) {
  const abs = Math.abs(ms)
  const d = Math.floor(abs / D)
  const h = Math.floor((abs % D) / H)
  const m = Math.floor((abs % H) / 60_000)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function fmtAgo(t: number | undefined, now = Date.now()) {
  if (t === undefined) return '—'
  const diff = now - t
  if (diff < 60_000) return 'just now'
  return diff > 0 ? `${fmtDuration(diff)} ago` : `in ${fmtDuration(diff)}`
}
