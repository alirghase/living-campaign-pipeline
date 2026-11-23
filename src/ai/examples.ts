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
    id: 'oxenden',
    title: 'Oxenden Park: first residents',
    journey: 'rental',
    development: 'Oxenden Park, Herne Bay',
    source: 'Lloyds Living bought 100 Bellway homes at Oxenden Park, Herne Bay, in June 2026, for private rent and Shared Ownership.',
    channels: ['instagram', 'facebook', 'google', 'email'],
    text: `We need a launch campaign for the rental homes at Oxenden Park in Herne Bay, Kent. The first residents move in this month. These are brand-new Bellway two, three and four-bed houses with gardens and parking, energy-efficient, managed by our own in-house team. Audience: couples and young families renting along the north Kent coast who want more space and a landlord they can trust. Goal: 300 viewing requests in six weeks. Feel: fresh start, sea air, room to grow. Channels: Instagram, Facebook, Google display and email.`,
    structured: {
      name: 'Oxenden Park: First Residents',
      objective: 'Generate 300 viewing requests for the rental homes at Oxenden Park within six weeks of launch.',
      audience: 'Couples and young families, 28–45, renting along the north Kent coast who want more space.',
      keyMessages: ['Brand-new two to four-bed homes with gardens', 'Energy-efficient, lower bills', 'Managed by our in-house team'],
      masterHeadline: 'Room to grow on the Kent coast',
      insight: 'Coastal renters are trading small flats for space, but worry about unreliable landlords.',
      priority: 'High',
    },
  },
  {
    id: 'hampton',
    title: 'Hampton Beach: autumn launch',
    journey: 'rental',
    development: 'Hampton Beach, Peterborough',
    source: 'Part of the 980-home Barratt Redrow deal (July 2026); first homes to rent from autumn 2026.',
    channels: ['instagram', 'facebook', 'linkedin', 'google', 'email'],
    text: `Launch brief: Hampton Beach, Peterborough. Part of our 980-home deal with Barratt Redrow, the first homes are available to rent from this autumn. Target commuters (Peterborough to Cambridge and London are under an hour) aged 25 to 40, often moving out of a city flat. We want registrations of interest before first move-ins. Messages: brand-new energy-efficient homes, rent direct from Lloyds Living, lakeside walks on the doorstep. Use every channel including LinkedIn for the commuter angle.`,
    structured: {
      name: 'Hampton Beach Autumn Launch',
      objective: 'Reach 300 registrations of interest before the first move-ins this autumn.',
      audience: 'Commuters aged 25–40 moving out of city flats, working in Cambridge or London.',
      keyMessages: ['First homes ready this autumn', 'Energy-efficient new builds', 'Rent direct from Lloyds Living'],
      masterHeadline: 'Swap the city flat for a lakeside home',
      insight: 'Hybrid workers will commute twice a week if home means space and calm.',
      priority: 'High',
    },
  },
  {
    id: 'pathways',
    title: 'Pathways: rent now, own later',
    journey: 'shared',
    development: 'Oxenden Park, Herne Bay',
    source: 'Pathways is the Lloyds Living route from renting a home to Shared Ownership.',
    channels: ['instagram', 'facebook', 'email'],
    text: `Shared Ownership awareness campaign for Pathways: our customers can rent a home for as long as they want, then move into Shared Ownership when they are ready. Focus on Oxenden Park where we have both tenures. Audience: renters 25 to 40 earning £35k to £80k who think buying is out of reach. Tone must be reassuring and plain English, explain how it works, never overpromise affordability. Drive eligibility checks.`,
    structured: {
      name: 'Pathways: Rent Now, Own Later',
      objective: 'Drive 500 eligibility checks for Pathways from renters who want to own one day.',
      audience: 'Renters 25–40, household income £35k–£80k, who assume buying is out of reach.',
      keyMessages: ['Rent for as long as you like', 'Move into Shared Ownership when ready', 'Check eligibility in two minutes'],
      masterHeadline: 'Rent today. Own a share when you’re ready.',
      insight: 'Renters don’t need a hard sell on owning. They need a route they can see.',
      priority: 'High',
    },
  },
  {
    id: 'stories',
    title: 'Lloyds Living Stories: A Place to Rebuild',
    journey: 'rental',
    development: 'Burleyfields, Stafford',
    source: 'Inspired by the "Lloyds Living Stories" resident series, including "A Place to Rebuild".',
    channels: ['instagram', 'facebook', 'linkedin'],
    text: `Brand storytelling campaign extending our Lloyds Living Stories series. Theme: "A place to rebuild". Real residents who found a fresh start in a secure, well-managed home after a hard chapter in life. Hero setting: a family home at Burleyfields, Stafford. Emotional, warm and honest, no hard sell. KPI: video completion and brand consideration. Social first: Instagram, Facebook and LinkedIn.`,
    structured: {
      name: 'Lloyds Living Stories: A Place to Rebuild',
      objective: 'Lift brand consideration with resident stories about fresh starts in a secure home.',
      audience: 'Renters 25–55 who value security and a landlord that treats them fairly.',
      keyMessages: ['A secure home to start again', 'Repairs handled by our own team', 'Long-term homes, not short lets'],
      masterHeadline: 'Some homes are a fresh start',
      insight: 'After a hard chapter, security matters more than square footage.',
      priority: 'Medium',
    },
  },
  {
    id: 'gaydon',
    title: 'Gaydon: 21 new apartments',
    journey: 'rental',
    development: 'Gaydon, Warwickshire',
    source: 'Lloyds Living announced 21 brand-new apartments to rent at its Gaydon development.',
    channels: ['instagram', 'linkedin', 'google'],
    text: `Quick-turnaround campaign: 21 brand-new apartments now available to rent at Gaydon, Warwickshire. Close to major engineering and automotive employers. Audience: engineers and professionals 24 to 40 relocating for work. Messages: ready to move in now, professionally managed, quiet village setting with easy access to the M40. Goal: let all 21 in six weeks. Channels: Instagram, LinkedIn, Google display.`,
    structured: {
      name: 'Gaydon: 21 New Apartments',
      objective: 'Let all 21 apartments within six weeks.',
      audience: 'Engineers and professionals 24–40 relocating to Warwickshire for work.',
      keyMessages: ['21 brand-new apartments', 'Ready to move in now', 'Minutes from the M40'],
      masterHeadline: 'New job? Your new home is ready.',
      insight: 'Relocators need a home sorted in weeks, not months.',
      priority: 'Medium',
    },
  },
  {
    id: 'keyworkers',
    title: 'Key workers: own a share',
    journey: 'shared',
    development: 'Hampton Beach, Peterborough',
    source: 'Shared Ownership homes in the Barratt Redrow pipeline; key-worker targeting is illustrative.',
    channels: ['facebook', 'instagram', 'linkedin', 'email'],
    text: `Shared Ownership campaign for NHS staff, teachers and emergency workers around Peterborough. Message: buy a share of a brand-new home from 10%, deposit based on your share not the full price, staircase over time. Must be clear and responsible, always explain how Shared Ownership works and carry the risk disclaimer. Goal: 250 eligibility checks.`,
    structured: {
      name: 'Shared Ownership for Key Workers',
      objective: 'Drive 250 eligibility checks from key workers around Peterborough.',
      audience: 'NHS staff, teachers and emergency workers, 25–45, household income under £80k.',
      keyMessages: ['Buy a share from 10%', 'Deposit based on your share', 'Own more over time'],
      masterHeadline: 'You look after us. Let’s help you own a home.',
      insight: 'Key workers feel priced out of the towns they serve.',
      priority: 'High',
    },
  },
]
