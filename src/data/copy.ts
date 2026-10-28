import { formats } from './formats'
import type { Brief, FormatId, Journey } from './types'

interface CopyBank {
  long: string[]
  short: string[]
  body: string[]
  cta: string[]
}

const banks: Record<Journey, CopyBank> = {
  rental: {
    long: [
      'Your next home is waiting in {area}',
      'Pet-friendly rentals in {area}',
      'Move in this month — no hidden fees',
      'Rent direct from Living. No agency fees, ever.',
      'Brand-new homes in {area}, ready when you are',
      'Longer tenancies, fair rent reviews, zero surprises',
      'Bring the dog. Bring the cat. Bring the plants.',
      'Your own front door, five minutes from the station',
      'On-site team, gym and roof terrace — all in the rent',
    ],
    short: [
      'Your next home is waiting',
      'No agency fees, ever',
      'Move in this month',
      'Pet-friendly homes in {area}',
      'New homes in {area}',
      'Rent direct. No surprises.',
    ],
    body: [
      'Studios to three-bed homes in {area}. No agency fees, a team on site seven days a week, and pets welcome.',
      'Choose a 1–3 year tenancy with rent reviews you can plan for. Viewings available this weekend.',
      'Furnished or unfurnished, ready from this month. Bills set up for you on day one.',
    ],
    cta: ['Book a viewing', 'See available homes', 'Check availability', 'Register interest'],
  },
  shared: {
    long: [
      'Own your first home from £{price}/month',
      'The step between renting and buying',
      'Shared Ownership in {area} — find out if you qualify',
      'Buy a share from 10%. Grow it over time.',
      'Deposits from £{deposit}. Keys in weeks, not years.',
      'Stop renting. Start owning — one share at a time.',
      'Two-bed homes in {area} with a smaller deposit',
      'Key worker? See what you could own in {area}',
    ],
    short: [
      'Own from £{price}/month',
      'Buy a share from 10%',
      'Check if you qualify',
      'Own in {area}',
      'Smaller deposit. Real home.',
      'Rent less. Own more.',
    ],
    body: [
      'Buy a 25–75% share of a new home in {area} and pay a reduced rent on the rest. Check your eligibility in two minutes.',
      'With Shared Ownership your deposit is based on your share, not the full price. Buy more shares whenever you are ready.',
      'Typical monthly cost includes mortgage, rent and service charge, shown upfront so there are no surprises.',
    ],
    cta: ['Check eligibility', 'Find your home', 'Book an appointment', 'Download the guide'],
  },
}

const SHORT_FORMATS: FormatId[] = ['gd-leaderboard', 'gd-mpu', 'ig-story']

export function areaOf(brief: Pick<Brief, 'development'>) {
  return brief.development.replace(/^Living\s+/, '')
}

function fill(text: string, brief: Brief) {
  const area = areaOf(brief)
  const seed = area.length
  return text
    .replaceAll('{area}', area)
    .replaceAll('{price}', String(780 + seed * 23))
    .replaceAll('{deposit}', (4200 + seed * 310).toLocaleString('en-GB'))
}

/** Synthetic "AI" copy: 2–3 headlines, body and CTA for one channel adaptation. */
export function generateCopy(brief: Brief, format: FormatId, variant: number) {
  const bank = banks[brief.journey]
  const isShort = SHORT_FORMATS.includes(format)
  const pool = isShort ? bank.short : bank.long
  const offset = variant * 3 + format.length + brief.name.length
  const count = format === 'gd-leaderboard' ? 2 : 3
  const headlines = Array.from({ length: count }, (_, i) => fill(pool[(offset + i * 2) % pool.length], brief))
  const max = formats[format].maxHeadline
  return {
    headlines: headlines.map((h) => (h.length > max ? h.slice(0, max - 1).trimEnd() + '…' : h)),
    body: fill(bank.body[(offset + variant) % bank.body.length], brief),
    cta: bank.cta[(offset + variant) % bank.cta.length],
  }
}
