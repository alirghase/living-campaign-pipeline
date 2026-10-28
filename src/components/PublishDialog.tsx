import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { CheckCircle2, Loader2, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { channelLabel } from '@/data/formats'
import type { Asset, Channel } from '@/data/types'
import { useStore } from '@/store/useStore'
import { ChannelIcon } from './common'

const TARGET: Record<Channel, string> = {
  facebook: 'Sprout Social → Facebook',
  instagram: 'Sprout Social → Instagram',
  linkedin: 'Sprout Social → LinkedIn',
  google: 'Google Ads → Display Network',
  email: 'Email platform → header library',
}

/** Simulated multi-channel publish: per-target progress, then confetti. */
export function PublishDialog({ assets, onClose }: { assets: Asset[]; onClose: () => void }) {
  const publish = useStore((s) => s.publish)
  const targets = [...new Set(assets.map((a) => a.channel))]
  const [progress, setProgress] = useState<number[]>(() => targets.map(() => 0))
  const [done, setDone] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (started.current || !assets.length) return
    started.current = true
    const ids = assets.map((a) => a.id)
    const timers: number[] = []
    targets.forEach((_, i) => {
      for (let step = 1; step <= 5; step++) {
        timers.push(
          window.setTimeout(
            () => setProgress((p) => p.map((v, j) => (j === i ? step * 20 : v))),
            i * 450 + step * 160,
          ),
        )
      }
    })
    timers.push(
      window.setTimeout(() => {
        publish(ids)
        setDone(true)
        confetti({ particleCount: 90, spread: 70, startVelocity: 32, origin: { y: 0.6 }, colors: ['#14b8a6', '#a855f7', '#6366f1', '#ffffff'] })
      }, targets.length * 450 + 900),
    )
    // Timers are left to finish so the publish always lands, even if the dialog closes.
  }, [assets, targets, publish])

  return (
    <Dialog open onOpenChange={(o) => !o && done && onClose()}>
      <DialogContent className="sm:max-w-md" showCloseButton={done}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {done ? <CheckCircle2 className="size-5 text-emerald-500" /> : <Rocket className="size-5" />}
            {done ? 'Published' : `Publishing ${assets.length} asset${assets.length > 1 ? 's' : ''}`}
          </DialogTitle>
          <DialogDescription>{done ? 'Live on every target channel. Measurement has started.' : 'Delivering to each channel target…'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {targets.map((c, i) => (
            <div key={c} className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm">
                <ChannelIcon channel={c} />
                <span className="font-medium">{channelLabel(c)}</span>
                <span className="text-xs text-muted-foreground">{TARGET[c]}</span>
                <span className="ml-auto">
                  {progress[i] === 100 ? (
                    <CheckCircle2 className="size-4 text-emerald-500" />
                  ) : progress[i] > 0 ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  ) : null}
                </span>
              </div>
              <Progress value={progress[i]} className="h-1.5" />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button disabled={!done} onClick={onClose}>
            {done ? 'Done' : 'Publishing…'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
