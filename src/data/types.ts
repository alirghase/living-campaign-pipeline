export type Journey = 'rental' | 'shared'
export type JourneyFilter = 'all' | Journey

export type Channel = 'facebook' | 'instagram' | 'linkedin' | 'google' | 'email'

export type FormatId =
  | 'ig-post'
  | 'ig-story'
  | 'fb-banner'
  | 'li-post'
  | 'gd-leaderboard'
  | 'gd-mpu'
  | 'email-header'

export type Priority = 'High' | 'Medium' | 'Low'

export type BriefStatus = 'Draft' | 'Routed' | 'In Production' | 'In Review' | 'Approved' | 'Live'

export type AssetStage = 'creation' | 'qa' | 'approval' | 'approved' | 'published'

export type CheckStatus = 'pass' | 'warn' | 'fail'
export type QaState = 'not-run' | CheckStatus

export type ReviewType = 'brand' | 'business' | 'risk'
export type ReviewStatus = 'pending' | 'in-review' | 'approved' | 'changes' | 'rejected'

export type Tool = 'Firefly' | 'Figma AI' | 'Copilot'

export type DeliveryStatus = 'Scheduled' | 'Live' | 'Paused'

export type Role =
  | 'Campaign Lead'
  | 'Brand Manager'
  | 'Business Reviewer'
  | 'Risk Officer'
  | 'Content Designer'
  | 'Creative Lead'
  | 'Journey Owner (Rental)'
  | 'Journey Owner (Shared Ownership)'

export interface TeamMember {
  id: string
  name: string
  initials: string
  role: Role
  color: string
}

export interface Format {
  id: FormatId
  label: string
  short: string
  channel: Channel
  width: number
  height: number
  maxHeadline: number
}

export interface Brief {
  id: string
  name: string
  journey: Journey
  development: string
  objective: string
  audience: string
  journeyContext: string
  keyMessages: string[]
  tone: string
  masterHeadline: string
  formats: FormatId[]
  constraints: string[]
  channels: Channel[]
  priority: Priority
  status: BriefStatus
  ownerId: string
  createdAt: number
  routedAt?: number
  deadline: number
  slaHours: number
  reusedFrom?: string
}

export interface CheckResult {
  id: string
  label: string
  status: CheckStatus
  detail: string
}

export interface Review {
  status: ReviewStatus
  reviewerId: string
  startedAt?: number
  at?: number
  comment?: string
}

export interface AuditEntry {
  at: number
  actorId: string
  action: string
}

export interface Asset {
  id: string
  briefId: string
  journey: Journey
  format: FormatId
  channel: Channel
  headlines: string[]
  body: string
  cta: string
  variant: number
  version: number
  tool: Tool
  stage: AssetStage
  qaState: QaState
  qa: CheckResult[] | null
  /** Seeded QA outcome the next scan reports, cleared by a fix. */
  qaOutcome: CheckStatus
  firstPassQa: boolean
  revisions: number
  approvalRounds: number
  createdAt: number
  qaAt?: number
  submittedAt?: number
  submittedBy?: string
  slaDue?: number
  reviews: Record<ReviewType, Review>
  approvedAt?: number
  approvedBy?: string
  publishedAt?: number
  deliveryStatus?: DeliveryStatus
  reused: boolean
  audit: AuditEntry[]
}
