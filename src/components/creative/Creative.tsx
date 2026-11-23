import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { formats } from '@/data/formats'
import { journeyPresets } from '@/data/journeys'
import type { FormatId, Journey } from '@/data/types'
import { sceneUrl } from '@/ai/scene'
import { cn } from '@/lib/utils'

/**
 * Brand layout system. The model generates photography only; headline, CTA,
 * logo and the mandatory disclaimer are typeset here at the channel's native
 * pixel size, then scaled to fit. Copy is always crisp, on-brand and compliant.
 */

export interface CreativeProps {
  format: FormatId
  journey: Journey
  headline: string
  body?: string
  cta: string
  image?: string
  seed: string
  className?: string
  /** 'width' scales to the container width; 'contain' fits inside both dimensions. */
  fit?: 'width' | 'contain'
  /** Shimmer overlay while an image is generating. */
  loading?: boolean
}

const INK = '#00261c'
const DEEP = '#004a36'
const LIME = '#77ba00'

export function HouseMark({ size = 24, color = '#fff', accent = LIME }: { size?: number; color?: string; accent?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <path d="M4 15.5 16 5l12 10.5V28H4z" fill="none" stroke={color} strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M12.5 28v-7.5h7V28" fill={accent} />
    </svg>
  )
}

export function Wordmark({ size = 24, color = '#fff', accent = LIME, className }: { size?: number; color?: string; accent?: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center', className)} style={{ gap: size * 0.38, color }}>
      <HouseMark size={size * 1.15} color={color} accent={accent} />
      <span style={{ fontSize: size, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
        Lloyds <span style={{ fontWeight: 400 }}>Living</span>
      </span>
    </span>
  )
}

function Tag({ journey, size }: { journey: Journey; size: number }) {
  return (
    <span
      style={{
        fontSize: size,
        fontWeight: 600,
        padding: `${size * 0.35}px ${size * 0.8}px`,
        borderRadius: 999,
        background: journey === 'rental' ? LIME : '#2178b0',
        color: journey === 'rental' ? INK : '#fff',
        whiteSpace: 'nowrap',
      }}
    >
      {journey === 'rental' ? 'To rent' : 'Shared Ownership'}
    </span>
  )
}

function Cta({ children, size, style }: { children: ReactNode; size: number; style?: CSSProperties }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size * 0.4,
        fontSize: size,
        fontWeight: 700,
        padding: `${size * 0.55}px ${size * 1.05}px`,
        borderRadius: size * 0.4,
        background: LIME,
        color: INK,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
      <svg width={size * 0.8} height={size * 0.8} viewBox="0 0 16 16" aria-hidden>
        <path d="M3 8h9M8.5 4 12.5 8l-4 4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

function Img({ src, style }: { src: string; style?: CSSProperties }) {
  return <img src={src} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', ...style }} />
}

function Layout({ format, journey, headline, body, cta, image }: Omit<CreativeProps, 'className' | 'fit' | 'loading' | 'seed'> & { image: string }) {
  const f = formats[format]
  const disclaimer = journeyPresets[journey].disclaimer
  const base: CSSProperties = { position: 'relative', width: f.width, height: f.height, overflow: 'hidden', fontFamily: 'var(--font-sans)', color: '#fff', background: DEEP }

  switch (format) {
    case 'ig-post':
    case 'ig-story': {
      const story = format === 'ig-story'
      const pad = story ? 84 : 64
      return (
        <div style={base}>
          <Img src={image} />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, rgba(0,38,28,.94) 0%, rgba(0,38,28,.6) ${story ? 32 : 40}%, rgba(0,38,28,0) ${story ? 55 : 66}%)` }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,38,28,.45), rgba(0,38,28,0) 22%)' }} />
          <div style={{ position: 'absolute', top: pad, left: pad, right: pad, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Wordmark size={story ? 44 : 38} />
            <Tag journey={journey} size={story ? 30 : 26} />
          </div>
          <div style={{ position: 'absolute', left: pad, right: pad, bottom: story ? 150 : pad, display: 'flex', flexDirection: 'column', gap: story ? 36 : 26 }}>
            <div style={{ width: 96, height: 8, borderRadius: 4, background: LIME }} />
            <div style={{ fontSize: story ? 104 : 78, fontWeight: 700, lineHeight: 1.02, letterSpacing: '-0.025em', textWrap: 'balance' }}>{headline}</div>
            {body && <div style={{ fontSize: story ? 38 : 30, lineHeight: 1.35, opacity: 0.88, maxWidth: 900, display: '-webkit-box', WebkitLineClamp: story ? 4 : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{body}</div>}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32 }}>
              <Cta size={story ? 40 : 32}>{cta}</Cta>
            </div>
            <div style={{ fontSize: story ? 22 : 17, lineHeight: 1.35, opacity: 0.7, maxWidth: 940 }}>{disclaimer}</div>
          </div>
        </div>
      )
    }
    case 'fb-banner':
    case 'li-post':
      return (
        <div style={base}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '58%' }}>
            <Img src={image} />
          </div>
          <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '46%', background: DEEP, clipPath: 'polygon(9% 0, 100% 0, 100% 100%, 0 100%)' }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '46%', clipPath: 'polygon(9% 0, 10.4% 0, 1.4% 100%, 0 100%)', background: LIME }} />
          <div style={{ position: 'absolute', top: 44, bottom: 40, right: 48, width: '34%', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Wordmark size={26} />
            <div style={{ marginTop: 'auto' }}>
              <Tag journey={journey} size={17} />
            </div>
            <div style={{ fontSize: 44, fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.02em', textWrap: 'balance' }}>{headline}</div>
            {body && <div style={{ fontSize: 19, lineHeight: 1.4, opacity: 0.85, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{body}</div>}
            <div>
              <Cta size={21}>{cta}</Cta>
            </div>
            <div style={{ fontSize: 11.5, lineHeight: 1.35, opacity: 0.65 }}>{disclaimer}</div>
          </div>
        </div>
      )
    case 'gd-mpu':
      return (
        <div style={base}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 136 }}>
            <Img src={image} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,38,28,.5), rgba(0,38,28,0) 45%)' }} />
            <div style={{ position: 'absolute', top: 10, left: 12 }}>
              <Wordmark size={13} />
            </div>
          </div>
          <div style={{ position: 'absolute', top: 132, left: 0, right: 0, height: 4, background: LIME }} />
          <div style={{ position: 'absolute', top: 146, left: 14, right: 14, bottom: 10, display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.01em', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{headline}</div>
            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Cta size={12}>{cta}</Cta>
              <span style={{ fontSize: 7.5, opacity: 0.6, maxWidth: 110, lineHeight: 1.2, textAlign: 'right' }}>{journey === 'rental' ? 'Subject to availability' : 'Eligibility applies. Leasehold.'}</span>
            </div>
          </div>
        </div>
      )
    case 'gd-leaderboard':
      return (
        <div style={base}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 150 }}>
            <Img src={image} />
          </div>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 146, width: 4, background: LIME }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 168, right: 160, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
            <Wordmark size={11} />
            <div style={{ fontSize: 21, fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{headline}</div>
          </div>
          <div style={{ position: 'absolute', top: 0, bottom: 0, right: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', gap: 5 }}>
            <Cta size={13}>{cta}</Cta>
            <span style={{ fontSize: 7.5, opacity: 0.6 }}>{journey === 'rental' ? 'Subject to availability' : 'Eligibility applies'}</span>
          </div>
        </div>
      )
    case 'email-header':
      return (
        <div style={base}>
          <Img src={image} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,74,54,.97) 0%, rgba(0,74,54,.88) 42%, rgba(0,74,54,0) 72%)' }} />
          <div style={{ position: 'absolute', top: 22, bottom: 20, left: 28, width: 330, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Wordmark size={15} />
            <div style={{ marginTop: 'auto', fontSize: 28, fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.02em', textWrap: 'balance' }}>{headline}</div>
            <div>
              <Cta size={13}>{cta}</Cta>
            </div>
          </div>
        </div>
      )
  }
}

export function Creative({ fit = 'width', className, loading, ...p }: CreativeProps) {
  const f = formats[p.format]
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      const s = fit === 'contain' && h > 0 ? Math.min(w / f.width, h / f.height) : w / f.width
      setScale(s > 0 ? s : 0)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [fit, f.width, f.height])

  const image = p.image || sceneUrl(p.seed, p.journey, f.width / f.height)
  return (
    <div ref={ref} className={cn('relative flex w-full items-center justify-center', fit === 'contain' && 'h-full', className)} style={fit === 'width' ? { aspectRatio: `${f.width} / ${f.height}` } : undefined}>
      {scale > 0 && (
        <div className="relative overflow-hidden rounded-[inherit] shadow-sm ring-1 ring-black/10" style={{ width: f.width * scale, height: f.height * scale }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: '0 0', width: f.width, height: f.height }}>
            <Layout {...p} image={image} />
          </div>
          {loading && <div className="shimmer absolute inset-0" />}
        </div>
      )}
    </div>
  )
}
