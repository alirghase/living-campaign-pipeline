import type { Journey } from '@/data/types'

/**
 * Procedural illustration of a UK new-build street, in the Lloyds Living palette.
 * Used as the creative background in demo mode (no API key) and for seeded assets,
 * so every screen shows a designed visual rather than a flat gradient.
 */

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

function rng(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Bright blue-sky daylight, as in the brand's development photography.
const SKIES = [
  ['#3f8fe0', '#78b4ee', '#cfe5f7'],
  ['#4a97e6', '#8cc0f0', '#dcecf8'],
  ['#3a86d8', '#6aaae9', '#c4def4'],
]
const BRICKS = ['#c99a6b', '#d4a676', '#b8714f', '#a65f49', '#c7895f', '#bf9466']
const ROOFS = ['#3f474d', '#55463f', '#394343', '#4a4f57']
const DOORS: Record<Journey, string[]> = {
  rental: ['#7fb5a0', '#5f9e98', '#1c1c1c', '#006c4e', '#8fbfa4'],
  shared: ['#7fb5a0', '#5f9e98', '#1c1c1c', '#5a57a3', '#8fbfa4'],
}
const LEAVES = ['#4f9a4a', '#5aa84f', '#3f8a45', '#6cb85a', '#478f46']

const cache = new Map<string, string>()

export function sceneUrl(seed: string, journey: Journey, aspect: number): string {
  const key = `${seed}|${journey}|${aspect.toFixed(3)}`
  const hit = cache.get(key)
  if (hit) return hit
  const svg = sceneSvg(seed, journey, aspect)
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  cache.set(key, url)
  return url
}

export function sceneSvg(seed: string, journey: Journey, aspect: number): string {
  const r = rng(hash(seed))
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)]
  const H = 1000
  const W = Math.round(H * Math.min(Math.max(aspect, 0.4), 4))
  const ground = H * 0.8
  const sky = pick(SKIES)
  const out: string[] = []

  out.push(`<defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset=".6" stop-color="${sky[1]}"/><stop offset="1" stop-color="${sky[2]}"/></linearGradient>
    <radialGradient id="sun"><stop offset="0" stop-color="#ffffff" stop-opacity=".7"/><stop offset=".35" stop-color="#ffffff" stop-opacity=".2"/><stop offset="1" stop-color="#ffe7b0" stop-opacity="0"/></radialGradient>
    <linearGradient id="lawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fbf4f"/><stop offset="1" stop-color="#4f9a3f"/></linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#dcecf2"/><stop offset=".55" stop-color="#b8d4e0"/><stop offset="1" stop-color="#fff0c8"/></linearGradient>
  </defs>`)
  out.push(`<rect width="${W}" height="${H}" fill="url(#sky)"/>`)

  const sunX = W * (0.15 + r() * 0.7)
  out.push(`<circle cx="${sunX}" cy="${H * 0.2}" r="${H * 0.32}" fill="url(#sun)"/><circle cx="${sunX}" cy="${H * 0.2}" r="${H * 0.05}" fill="#fff8e6"/>`)

  for (let i = 0; i < Math.max(2, W / 450); i++) {
    const cx = r() * W
    const cy = H * (0.1 + r() * 0.2)
    const s = 0.6 + r() * 0.8
    out.push(
      `<g fill="#fff" opacity=".75"><ellipse cx="${cx}" cy="${cy}" rx="${70 * s}" ry="${22 * s}"/><ellipse cx="${cx + 40 * s}" cy="${cy - 14 * s}" rx="${45 * s}" ry="${24 * s}"/><ellipse cx="${cx - 38 * s}" cy="${cy - 6 * s}" rx="${36 * s}" ry="${18 * s}"/></g>`,
    )
  }

  const hill = (y: number, amp: number, fill: string) => {
    let d = `M0 ${H} L0 ${y}`
    const n = Math.ceil(W / 200) + 1
    for (let i = 0; i <= n; i++) d += ` Q${i * 200 + 100} ${y - amp * (0.4 + r())} ${(i + 1) * 200} ${y + amp * (r() - 0.5) * 0.4}`
    return `<path d="${d} L${W} ${H} Z" fill="${fill}"/>`
  }
  out.push(hill(H * 0.62, 40, '#9fc98f'))
  out.push(hill(H * 0.68, 30, '#7fb86e'))
  out.push(`<rect y="${ground}" width="${W}" height="${H - ground}" fill="url(#lawn)"/>`)

  // Houses
  const houseW = Math.min(330, W * 0.62)
  const gap = houseW * 0.12
  const count = Math.max(1, Math.floor((W + gap) / (houseW + gap)))
  const total = count * houseW + (count - 1) * gap
  let x = (W - total) / 2
  const doorPalette = DOORS[journey]
  const trees: string[] = []
  for (let i = 0; i < count; i++) {
    const bw = houseW * (0.92 + r() * 0.08)
    const bh = houseW * (0.78 + r() * 0.14)
    const top = ground - bh
    const brick = pick(BRICKS)
    const roof = pick(ROOFS)
    const door = pick(doorPalette)
    const roofH = bw * (0.34 + r() * 0.08)
    const gable = r() > 0.5
    out.push(`<g>`)
    out.push(`<rect x="${x + 4}" y="${top + 8}" width="${bw}" height="${bh}" fill="#000" opacity=".06"/>`)
    out.push(`<rect x="${x}" y="${top}" width="${bw}" height="${bh}" fill="${brick}"/>`)
    if (r() > 0.45) {
      const cx = x + bw * (0.18 + r() * 0.6)
      out.push(`<rect x="${cx}" y="${top - roofH * 0.9}" width="${bw * 0.07}" height="${roofH * 0.7}" fill="${brick}"/><rect x="${cx - 3}" y="${top - roofH * 0.92}" width="${bw * 0.07 + 6}" height="8" fill="${roof}"/>`)
    }
    out.push(
      gable
        ? `<path d="M${x - 10} ${top + 2} L${x + bw / 2} ${top - roofH} L${x + bw + 10} ${top + 2} Z" fill="${roof}"/>`
        : `<path d="M${x - 12} ${top + 2} L${x + bw * 0.18} ${top - roofH * 0.85} L${x + bw * 0.82} ${top - roofH * 0.85} L${x + bw + 12} ${top + 2} Z" fill="${roof}"/>`,
    )
    out.push(`<rect x="${x - 10}" y="${top}" width="${bw + 20}" height="6" fill="#fff" opacity=".55"/>`)
    // windows
    const ww = bw * 0.24
    const wh = bh * 0.26
    const win = (wx: number, wy: number) =>
      `<rect x="${wx - 4}" y="${wy - 4}" width="${ww + 8}" height="${wh + 8}" fill="#f7f5f0"/><rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="url(#glass)"/><rect x="${wx + ww / 2 - 2}" y="${wy}" width="4" height="${wh}" fill="#f7f5f0"/><rect x="${wx - 8}" y="${wy + wh + 4}" width="${ww + 16}" height="7" fill="#e9e5dc"/>`
    out.push(win(x + bw * 0.14, top + bh * 0.14), win(x + bw * 0.62, top + bh * 0.14), win(x + bw * 0.62, top + bh * 0.56))
    // door + canopy
    const dw = bw * 0.2
    const dh = bh * 0.36
    const dx = x + bw * 0.2
    out.push(`<rect x="${dx - 6}" y="${ground - dh - 6}" width="${dw + 12}" height="${dh + 6}" fill="#f7f5f0"/><rect x="${dx}" y="${ground - dh}" width="${dw}" height="${dh}" rx="3" fill="${door}"/><circle cx="${dx + dw * 0.8}" cy="${ground - dh * 0.48}" r="4" fill="#e9c46a"/><path d="M${dx - 18} ${ground - dh - 10} L${dx + dw / 2} ${ground - dh - 34} L${dx + dw + 18} ${ground - dh - 10} Z" fill="${roof}"/>`)
    // path + hedge
    out.push(`<path d="M${dx - 10} ${ground} L${dx + dw + 10} ${ground} L${dx + dw + 60} ${H} L${dx - 60} ${H} Z" fill="#4a4b4e"/>`)
    out.push(`<rect x="${x + bw * 0.48}" y="${ground - 26}" width="${bw * 0.5}" height="34" rx="17" fill="${pick(LEAVES)}"/>`)
    out.push(`</g>`)
    if (i < count - 1 || count === 1) {
      const tx = count === 1 ? x + bw + gap * 1.4 : x + bw + gap / 2
      const th = houseW * (0.55 + r() * 0.3)
      const leaf = pick(LEAVES)
      trees.push(
        `<rect x="${tx - 5}" y="${ground - th * 0.45}" width="10" height="${th * 0.45}" fill="#6b5442"/><circle cx="${tx}" cy="${ground - th * 0.62}" r="${th * 0.26}" fill="${leaf}"/><circle cx="${tx - th * 0.14}" cy="${ground - th * 0.5}" r="${th * 0.18}" fill="${leaf}" opacity=".9"/><circle cx="${tx + th * 0.14}" cy="${ground - th * 0.52}" r="${th * 0.17}" fill="${leaf}" opacity=".85"/>`,
      )
    }
    x += bw + gap
  }
  out.push(...trees)
  out.push(`<rect y="${ground + (H - ground) * 0.55}" width="${W}" height="${(H - ground) * 0.45}" fill="#4f8c4a" opacity=".25"/>`)

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${out.join('')}</svg>`
}
