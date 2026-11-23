import { Bookmark, Globe, Heart, MessageCircle, MoreHorizontal, Send, ThumbsUp } from 'lucide-react'
import { Creative, HouseMark, type CreativeProps } from '@/components/creative/Creative'
import { formats } from '@/data/formats'

function Avatar() {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-700">
      <HouseMark size={15} />
    </span>
  )
}

const Skeleton = ({ w }: { w: string }) => <div className="h-1.5 rounded bg-muted" style={{ width: w }} />

/** The creative inside the chrome of the channel it will run on. */
export function ChannelPreview(p: CreativeProps) {
  const channel = formats[p.format].channel
  const creative = <Creative {...p} />

  if (p.format === 'ig-story') {
    return (
      <div className="relative mx-auto w-full max-w-[220px] overflow-hidden rounded-[22px] bg-black p-1.5 shadow-lg">
        <div className="relative overflow-hidden rounded-[16px]">
          {creative}
          <div className="absolute inset-x-2 top-2 flex gap-1">
            <div className="h-0.5 flex-1 rounded bg-white" />
            <div className="h-0.5 flex-1 rounded bg-white/40" />
          </div>
          <div className="absolute top-4 left-2 flex items-center gap-1.5 text-[9px] font-semibold text-white">
            <Avatar /> lloydsliving <span className="font-normal opacity-75">Sponsored</span>
          </div>
        </div>
      </div>
    )
  }

  if (channel === 'instagram') {
    return (
      <div className="overflow-hidden rounded-xl border bg-card text-[11px]">
        <div className="flex items-center gap-2 px-2.5 py-2">
          <Avatar />
          <div className="flex-1 leading-tight">
            <div className="font-semibold">lloydsliving</div>
            <div className="text-[10px] text-muted-foreground">Sponsored</div>
          </div>
          <MoreHorizontal className="size-4 text-muted-foreground" />
        </div>
        {creative}
        <div className="flex items-center justify-between border-b px-2.5 py-2 font-semibold text-shared-600">
          {p.cta} <span>›</span>
        </div>
        <div className="flex items-center gap-3 px-2.5 py-2">
          <Heart className="size-4" />
          <MessageCircle className="size-4" />
          <Send className="size-4" />
          <Bookmark className="ml-auto size-4" />
        </div>
        <p className="line-clamp-2 px-2.5 pb-2.5">
          <span className="font-semibold">lloydsliving</span> {p.body}
        </p>
      </div>
    )
  }

  if (channel === 'facebook' || channel === 'linkedin') {
    return (
      <div className="overflow-hidden rounded-xl border bg-card text-[11px]">
        <div className="flex items-center gap-2 px-2.5 py-2">
          <Avatar />
          <div className="flex-1 leading-tight">
            <div className="font-semibold">Lloyds Living</div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              {channel === 'linkedin' ? 'Promoted' : 'Sponsored'} · <Globe className="size-2.5" />
            </div>
          </div>
          <MoreHorizontal className="size-4 text-muted-foreground" />
        </div>
        <p className="line-clamp-2 px-2.5 pb-2">{p.body}</p>
        {creative}
        <div className="flex items-center gap-2 bg-muted/60 px-2.5 py-2">
          <div className="min-w-0 flex-1">
            <div className="text-[9px] text-muted-foreground uppercase">lloydsliving.co.uk</div>
            <div className="truncate font-semibold">{p.headline}</div>
          </div>
          <span className="shrink-0 rounded-md bg-secondary px-2 py-1 font-semibold ring-1 ring-border">{p.cta}</span>
        </div>
        <div className="flex justify-around border-t py-1.5 text-muted-foreground">
          <ThumbsUp className="size-3.5" />
          <MessageCircle className="size-3.5" />
          <Send className="size-3.5" />
        </div>
      </div>
    )
  }

  if (channel === 'email') {
    return (
      <div className="overflow-hidden rounded-xl border bg-card text-[11px]">
        <div className="space-y-0.5 border-b px-3 py-2">
          <div>
            <span className="text-muted-foreground">From</span> <span className="font-semibold">Lloyds Living</span>
          </div>
          <div className="truncate">
            <span className="text-muted-foreground">Subject</span> <span className="font-semibold">{p.headline}</span>
          </div>
        </div>
        <div className="space-y-2 bg-muted/40 p-3">
          {creative}
          <div className="space-y-1.5 rounded-md bg-card p-2.5">
            <Skeleton w="90%" />
            <Skeleton w="75%" />
            <Skeleton w="82%" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2 rounded-xl border bg-card p-3">
      <Skeleton w="40%" />
      <Skeleton w="95%" />
      <div className="relative">
        {creative}
        <span className="absolute top-0 right-0 rounded-bl bg-white/90 px-1 text-[8px] font-medium text-sky-700">Ad ⓘ</span>
      </div>
      <Skeleton w="88%" />
      <Skeleton w="70%" />
    </div>
  )
}
