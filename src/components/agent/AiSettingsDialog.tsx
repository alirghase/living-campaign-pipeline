import { useState, type ReactNode } from 'react'
import { CheckCircle2, ExternalLink, KeyRound, Loader2, ShieldAlert, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Segmented } from '@/components/common'
import { isLive, useAiSettings, type AiMode } from '@/ai/settings'
import { cn } from '@/lib/utils'

function ModelSelect({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  const all = options.includes(value) ? options : [value, ...options]
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full font-mono text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {all.map((m) => (
          <SelectItem key={m} value={m} className="font-mono text-xs">
            {m}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function AiStatusChip({ className }: { className?: string }) {
  const s = useAiSettings()
  const live = isLive(s)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap',
        live ? 'bg-brand-500/12 text-brand-700 ring-1 ring-brand-500/25 dark:text-brand-300' : 'bg-amber-500/12 text-amber-800 ring-1 ring-amber-500/25 dark:text-amber-300',
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', live ? 'animate-pulse bg-brand-500' : 'bg-amber-500')} />
      {live ? `Live · Gemini` : 'Demo mode'}
    </span>
  )
}

export function AiSettingsDialog({ children }: { children: ReactNode }) {
  const s = useAiSettings()
  const [draft, setDraft] = useState(s.apiKey)
  const [open, setOpen] = useState(false)

  const connect = async () => {
    const ok = await s.verify(draft)
    if (ok) toast.success('Google AI Studio connected', { description: 'The agent team now runs on Gemini.' })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (o) setDraft(useAiSettings.getState().apiKey)
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-brand-500" /> Connect Google AI Studio
          </DialogTitle>
          <DialogDescription>
            The agents use Gemini for copy, art direction and vision QA, and Gemini image models (Nano Banana) for photography. Without a key, everything still runs in demo mode with
            offline outputs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Label>Mode</Label>
            <Segmented<AiMode>
              value={s.mode}
              onChange={(mode) => {
                if (mode === 'live' && !s.apiKey) {
                  toast('Add an API key first')
                  return
                }
                s.save({ mode })
              }}
              options={[
                { value: 'live', label: 'Live (Gemini)' },
                { value: 'demo', label: 'Demo (offline)' },
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="gemini-key" className="flex items-center gap-1.5">
              <KeyRound className="size-3.5" /> Gemini API key
            </Label>
            <div className="flex gap-2">
              <Input
                id="gemini-key"
                type="password"
                autoComplete="off"
                spellCheck={false}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="AIza…"
                className="font-mono text-xs"
              />
              <Button onClick={connect} disabled={!draft.trim() || s.status === 'checking'}>
                {s.status === 'checking' ? <Loader2 className="animate-spin" /> : null}
                {s.apiKey && s.apiKey === draft.trim() && s.status === 'ok' ? 'Re-check' : 'Connect'}
              </Button>
            </div>
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-brand-700 hover:underline dark:text-brand-300">
              Get a key in Google AI Studio <ExternalLink className="size-3" />
            </a>
            {s.statusMessage && (
              <p className={cn('flex items-start gap-1.5 text-xs', s.status === 'error' ? 'text-destructive' : 'text-brand-700 dark:text-brand-300')}>
                {s.status === 'error' ? <ShieldAlert className="mt-px size-3.5 shrink-0" /> : <CheckCircle2 className="mt-px size-3.5 shrink-0" />}
                {s.statusMessage}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Text, vision &amp; QA model</Label>
              <ModelSelect value={s.textModel} options={s.available.text} onChange={(textModel) => s.save({ textModel })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Image model</Label>
              <ModelSelect value={s.imageModel} options={s.available.image} onChange={(imageModel) => s.save({ imageModel })} />
            </div>
          </div>

          <div className="rounded-lg bg-muted px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
            Your key is stored only in this browser and sent only to <span className="font-mono">generativelanguage.googleapis.com</span>. For a production rollout, calls would go through
            a Lloyds-hosted proxy (for example Vertex AI) instead. Image generation may need billing enabled on your AI Studio project.
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          {s.apiKey ? (
            <Button
              variant="ghost"
              onClick={() => {
                s.clearKey()
                setDraft('')
              }}
            >
              Remove key
            </Button>
          ) : (
            <span />
          )}
          <Button variant="outline" onClick={() => setOpen(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
