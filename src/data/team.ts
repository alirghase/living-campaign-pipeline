import type { ReviewType, TeamMember } from './types'

export const team: TeamMember[] = [
  { id: 't1', name: 'Priya Shah', initials: 'PS', role: 'Campaign Lead', color: '#00864f' },
  { id: 't2', name: 'Tom Hughes', initials: 'TH', role: 'Brand Manager', color: '#2178b0' },
  { id: 't3', name: 'Amara Okafor', initials: 'AO', role: 'Business Reviewer', color: '#c27803' },
  { id: 't4', name: 'Daniel Reid', initials: 'DR', role: 'Risk Officer', color: '#dc2a4d' },
  { id: 't5', name: 'Sofia Marin', initials: 'SM', role: 'Content Designer', color: '#b4407a' },
  { id: 't6', name: 'Kwame Mensah', initials: 'KM', role: 'Creative Lead', color: '#5b8c00' },
  { id: 't7', name: 'Hannah Lewis', initials: 'HL', role: 'Journey Owner (Rental)', color: '#00553e' },
  { id: 't8', name: 'Leo Nakamura', initials: 'LN', role: 'Journey Owner (Shared Ownership)', color: '#155784' },
]

export const CURRENT_USER_ID = 't1'

export const REVIEWER: Record<ReviewType, string> = { brand: 't2', business: 't3', risk: 't4' }

/** Volume estimate (synthetic) used to size the pilot. */
export const VOLUME_ESTIMATE = { campaignsPerQuarter: 15, assetsPerQuarter: 80 }

export function member(id: string | undefined): TeamMember {
  return team.find((m) => m.id === id) ?? team[0]
}
