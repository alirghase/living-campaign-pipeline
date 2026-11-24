import type { Channel, Journey, Priority } from '@/data/types'

/**
 * Example briefs written the way a marketer would type them.
 * Each is grounded in public Lloyds Living news so the demo feels real;
 * offers, numbers and audiences are illustrative.
 */
export interface ExampleBrief {
  id: string
  title: string
  journey: Journey
  development: string
  source: string
  channels: Channel[]
  text: string
  /** Used by demo mode, which has no model to parse the free text. */
  structured: {
    name: string
    objective: string
    audience: string
    keyMessages: string[]
    masterHeadline: string
    insight: string
    priority: Priority
  }
}

export const EXAMPLES: ExampleBrief[] = [
  {
    id: 'lapwings',
    title: 'Make your move to Lapwings',
    journey: 'rental',
    development: 'Lapwings, Burleyfields, Stafford',
    source: 'From the @lloydsliving feed: "Make your move to Lapwings, 2 & 3-bedroom rental homes in Burleyfields, Stafford".',
    channels: ['instagram', 'facebook', 'google', 'email'],
    text: `Launch push for Lapwings at Burleyfields, Stafford: brand-new 2 and 3-bedroom rental homes, energy-efficient, with gardens and parking, managed by our own in-house team. Audience: couples and young families renting in Staffordshire who want more space and a landlord they can rely on. Goal: 250 viewing requests in six weeks. Keep it warm and upbeat, like our "Make your move" posts. Channels: Instagram, Facebook, Google display and email.`,
    structured: {
      name: 'Make Your Move to Lapwings',
      objective: 'Generate 250 viewing requests for the 2 and 3-bedroom rental homes at Lapwings within six weeks.',
      audience: 'Couples and young families, 26–42, renting in Staffordshire who want more space.',
      keyMessages: ['2 & 3-bedroom homes with gardens', 'Energy-efficient, lower bills', 'Managed by our own team'],
      masterHeadline: 'Make your move to Lapwings',
      insight: 'Renters ready for more space worry most about who will look after the home.',
      priority: 'High',
    },
  },
  {
    id: 'growing',
    title: 'Growing family? Room for what\u2019s next',
    journey: 'rental',
    development: 'Osprey View, Worksop',
    source: 'From the @lloydsliving feed: "Growing family? Give yourselves room for what\u2019s next" and house-type reels at Osprey View, Worksop.',
    channels: ['instagram', 'facebook', 'email'],
    text: `Family campaign for Osprey View in Worksop. Three-bedroom rental homes like The Coniston, with gardens, driveways and space to grow. Audience: families with young children renting flats or small terraces in north Nottinghamshire. Message: give yourselves room for what's next. Warm, joyful, real family moments. Drive viewing bookings. Instagram, Facebook and email.`,
    structured: {
      name: 'Growing Family? Osprey View',
      objective: 'Book 200 family viewings at Osprey View this quarter.',
      audience: 'Families with young children, 28–45, renting small homes in north Nottinghamshire.',
      keyMessages: ['Three-bedroom homes with gardens', 'Driveways and space to grow', 'Managed by our own team'],
      masterHeadline: 'Growing family? Give yourselves room for what\u2019s next',
      insight: 'Families outgrow their home long before they feel ready to buy.',
      priority: 'High',
    },
  },
  {
    id: 'oxenden',
    title: 'Oxenden Park: first residents',
    journey: 'rental',
    development: 'Oxenden Park, Herne Bay',
    source: 'Lloyds Living bought 100 Bellway homes at Oxenden Park, Herne Bay, in June 2026, for private rent and Shared Ownership.',
    channels: ['instagram', 'facebook', 'linkedin', 'google', 'email'],
    text: `We need a launch campaign for the rental homes at Oxenden Park in Herne Bay, Kent. The first residents move in this month. These are brand-new Bellway two, three and four-bed houses with gardens and parking, energy-efficient, managed by our own in-house team. Audience: couples and young families renting along the north Kent coast who want more space. Goal: 300 viewing requests in six weeks. Feel: fresh start, sea air, room to grow. Use every channel.`,
    structured: {
      name: 'Oxenden Park: First Residents',
      objective: 'Generate 300 viewing requests for the rental homes at Oxenden Park within six weeks of launch.',
      audience: 'Couples and young families, 28–45, renting along the north Kent coast who want more space.',
      keyMessages: ['Brand-new two to four-bed homes with gardens', 'Energy-efficient, lower bills', 'Managed by our in-house team'],
      masterHeadline: 'Your next chapter, by the sea',
      insight: 'Coastal renters are trading small flats for space, but worry about unreliable landlords.',
      priority: 'High',
    },
  },
  {
    id: 'pathways',
    title: 'Pathways: rent now, own later',
    journey: 'shared',
    development: 'Oxenden Park, Herne Bay',
    source: 'Pathways is the Lloyds Living route from renting a home to Shared Ownership; Oxenden Park offers both tenures.',
    channels: ['instagram', 'facebook', 'email'],
    text: `Shared Ownership awareness campaign for Pathways: our customers can rent a home for as long as they want, then move into Shared Ownership when they are ready. Focus on Oxenden Park where we have both tenures. Audience: renters 25 to 40 earning £35k to £80k who think buying is out of reach. Tone must be reassuring and plain English, explain how it works, never overpromise affordability. Drive eligibility checks.`,
    structured: {
      name: 'Pathways: Rent Now, Own Later',
      objective: 'Drive 500 eligibility checks for Pathways from renters who want to own one day.',
      audience: 'Renters 25–40, household income £35k–£80k, who assume buying is out of reach.',
      keyMessages: ['Rent for as long as you like', 'Move into Shared Ownership when ready', 'Check eligibility in two minutes'],
      masterHeadline: 'Rent today. Own a share when you\u2019re ready.',
      insight: 'Renters don\u2019t need a hard sell on owning. They need a route they can see.',
      priority: 'High',
    },
  },
  {
    id: 'stories',
    title: 'Lloyds Living Stories: A Place to Rebuild',
    journey: 'rental',
    development: 'Warren Wood View, Gainsborough',
    source: 'Inspired by the "Lloyds Living Stories" resident series; Warren Wood View appears on the @lloydsliving feed.',
    channels: ['instagram', 'facebook', 'linkedin'],
    text: `Brand storytelling campaign extending our Lloyds Living Stories series. Theme: "A place to rebuild", tied to our line "Built for life's next chapter". Real residents who found a fresh start in a secure, well-managed home after a hard chapter in life. Hero setting: a family home at Warren Wood View, Gainsborough. Emotional, warm and honest, no hard sell. KPI: video completion and brand consideration. Instagram, Facebook and LinkedIn.`,
    structured: {
      name: 'Lloyds Living Stories: A Place to Rebuild',
      objective: 'Lift brand consideration with resident stories about fresh starts in a secure home.',
      audience: 'Renters 25–55 who value security and a landlord that treats them fairly.',
      keyMessages: ['A secure home to start again', 'Repairs handled by our own team', 'Long-term homes, not short lets'],
      masterHeadline: 'Built for life\u2019s next chapter',
      insight: 'After a hard chapter, security matters more than square footage.',
      priority: 'Medium',
    },
  },
  {
    id: 'keyworkers',
    title: 'Key workers: own a share',
    journey: 'shared',
    development: 'Hampton Beach, Peterborough',
    source: 'Shared Ownership homes in the 980-home Barratt Redrow pipeline; key-worker targeting is illustrative.',
    channels: ['facebook', 'instagram', 'linkedin', 'email'],
    text: `Shared Ownership campaign for NHS staff, teachers and emergency workers around Peterborough. Message: buy a share of a brand-new home from 10%, deposit based on your share not the full price, staircase over time. Must be clear and responsible, always explain how Shared Ownership works and carry the risk disclaimer. Goal: 250 eligibility checks.`,
    structured: {
      name: 'Shared Ownership for Key Workers',
      objective: 'Drive 250 eligibility checks from key workers around Peterborough.',
      audience: 'NHS staff, teachers and emergency workers, 25–45, household income under £80k.',
      keyMessages: ['Buy a share from 10%', 'Deposit based on your share', 'Own more over time'],
      masterHeadline: 'You look after us. Let\u2019s help you own a home.',
      insight: 'Key workers feel priced out of the towns they serve.',
      priority: 'High',
    },
  },
]
