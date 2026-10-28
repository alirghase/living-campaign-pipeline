import type { Channel, Format, FormatId, Journey } from './types'

export const formats: Record<FormatId, Format> = {
  'ig-post': { id: 'ig-post', label: 'Instagram Post', short: 'IG Post', channel: 'instagram', width: 1080, height: 1080, maxHeadline: 90 },
  'ig-story': { id: 'ig-story', label: 'Instagram Story', short: 'IG Story', channel: 'instagram', width: 1080, height: 1920, maxHeadline: 60 },
  'fb-banner': { id: 'fb-banner', label: 'Facebook Banner', short: 'FB Banner', channel: 'facebook', width: 1200, height: 628, maxHeadline: 90 },
  'li-post': { id: 'li-post', label: 'LinkedIn Post', short: 'LinkedIn Post', channel: 'linkedin', width: 1200, height: 627, maxHeadline: 90 },
  'gd-leaderboard': { id: 'gd-leaderboard', label: 'Google Display Leaderboard', short: 'GDN Leaderboard', channel: 'google', width: 728, height: 90, maxHeadline: 40 },
  'gd-mpu': { id: 'gd-mpu', label: 'Google Display MPU', short: 'GDN MPU', channel: 'google', width: 300, height: 250, maxHeadline: 45 },
  'email-header': { id: 'email-header', label: 'Email Header', short: 'Email Header', channel: 'email', width: 600, height: 200, maxHeadline: 70 },
}

export const formatList = Object.values(formats)

export const channels: { id: Channel; label: string }[] = [
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'google', label: 'Google Display' },
  { id: 'email', label: 'Email' },
]

export const channelLabel = (c: Channel) => channels.find((x) => x.id === c)!.label

export const journeyLabel: Record<Journey, string> = { rental: 'Rental', shared: 'Shared Ownership' }

export function formatsForChannels(selected: Channel[]): FormatId[] {
  const byChannel: Record<Channel, FormatId[]> = {
    instagram: ['ig-post', 'ig-story'],
    facebook: ['fb-banner'],
    linkedin: ['li-post'],
    google: ['gd-mpu', 'gd-leaderboard'],
    email: ['email-header'],
  }
  return selected.flatMap((c) => byChannel[c])
}
