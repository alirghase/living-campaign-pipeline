import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { formats } from '@/data/formats'
import { journeyPresets } from '@/data/journeys'
import type { FormatId, Journey } from '@/data/types'
import { sceneUrl } from '@/ai/scene'
import { cn } from '@/lib/utils'

/**
 * Brand layout system, modelled on the @lloydsliving Instagram templates:
 * bright-green panels with organic swoosh edges, heavy sentence-case headlines,
 * tilted location pills, white copy boxes and the black arrow button with a
 * neon ring. The model generates photography only; all type is set here at the
 * channel's native pixel size, so copy is crisp and the disclaimer is exact.
 */

export interface CreativeProps {
  format: FormatId
  journey: Journey
  headline: string
  body?: string
  cta: string
  /** Development name for the location pill, e.g. "Lapwings, Burleyfields, Stafford". */
  location?: string
  image?: string
  seed: string
  className?: string
  /** 'width' scales to the container width; 'contain' fits inside both dimensions. */
  fit?: 'width' | 'contain'
  /** Shimmer overlay while an image is generating. */
  loading?: boolean
}

export const BRAND = {
  bright: '#11b67a',
  dark: '#006c4e',
  neon: '#6cf579',
  mint: '#c8ffc5',
  lavender: '#9e9ce1',
  ink: '#000d04',
}

/** Generic house mark used for avatars and app chrome (not the Lloyds horse, which is a trademark). */
export function HouseMark({ size = 24, color = '#fff', accent = BRAND.neon }: { size?: number; color?: string; accent?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <path d="M4 15.5 16 5l12 10.5V28H4z" fill="none" stroke={color} strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M12.5 28v-7.5h7V28" fill={accent} />
    </svg>
  )
}

/** Horizontal wordmark for app chrome. */
export function Wordmark({ size = 24, color = '#fff', accent = BRAND.neon, className }: { size?: number; color?: string; accent?: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center', className)} style={{ gap: size * 0.38, color }}>
      <HouseMark size={size * 1.15} color={color} accent={accent} />
      <span style={{ fontSize: size, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
        Lloyds <span style={{ fontWeight: 500 }}>Living</span>
      </span>
    </span>
  )
}

/** Stacked LLOYDS / LIVING lockup, as used on the brand's social posts (text only). */
export function StackedLogo({ size = 40, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', color, lineHeight: 1 }}>
      <span style={{ fontSize: size, fontWeight: 800, letterSpacing: '0.02em' }}>LLOYDS</span>
      <span style={{ fontSize: size * 0.36, fontWeight: 600, letterSpacing: '0.18em', marginTop: size * 0.1 }}>LIVING</span>
    </span>
  )
}

/** Tilted bright-green location pill ("Osprey View, Worksop"). */
function LocationPill({ children, size, tilt = -2.5, style }: { children: ReactNode; size: number; tilt?: number; style?: CSSProperties }) {
  return (
    <span
      style={{
        display: 'inline-block',
        background: BRAND.bright,
        color: BRAND.ink,
        fontSize: size,
        fontWeight: 800,
        lineHeight: 1.08,
        letterSpacing: '-0.01em',
        padding: `${size * 0.32}px ${size * 0.55}px`,
        borderRadius: size * 0.32,
        transform: `rotate(${tilt}deg)`,
        boxShadow: '0 6px 18px rgba(0,0,0,.18)',
        textAlign: 'center',
        maxWidth: '100%',
        ...style,
      }}
    >
      {children}
    </span>
  )
}

/** Black arrow button with the neon ring, used as the CTA marker. */
function ArrowButton({ size }: { size: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: 999,
        background: '#000',
        boxShadow: `0 0 0 ${size * 0.1}px ${BRAND.neon}`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 16 16" aria-hidden>
        <path d="M2.5 8h10M8.5 3.5 13 8l-4.5 4.5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

function Cta({ children, size, dark = true }: { children: ReactNode; size: number; dark?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.5 }}>
      <span
        style={{
          fontSize: size,
          fontWeight: 800,
          padding: `${size * 0.5}px ${size * 0.9}px`,
          borderRadius: 999,
          background: dark ? '#000' : '#fff',
          color: dark ? '#fff' : BRAND.ink,
          whiteSpace: 'nowrap',
        }}
      >
        {children}
      </span>
      <ArrowButton size={size * 2.3} />
    </span>
  )
}

function Img({ src, style }: { src: string; style?: CSSProperties }) {
  return <img src={src} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', ...style }} />
}

/** Full-size SVG overlay in the format's own pixel space, for swoosh shapes. */
function Shape({ w, h, children }: { w: number; h: number; children: ReactNode }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ position: 'absolute', inset: 0 }} aria-hidden>
      {children}
    </svg>
  )
}

const H1: CSSProperties = { fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.02, textWrap: 'balance' }

/** Headline size that shrinks gently as copy gets longer than the layout's ideal length. */
const fitSize = (base: number, text: string, ideal: number, min = 0.55) => Math.round(base * Math.max(min, Math.min(1, Math.sqrt(ideal / Math.max(text.length, 1)))))

function Layout({ format, journey, headline, body, cta, location, image }: Omit<CreativeProps, 'className' | 'fit' | 'loading' | 'seed'> & { image: string }) {
  const f = formats[format]
  const W = f.width
  const Hh = f.height
  const disclaimer = journeyPresets[journey].disclaimer
  const short = journey === 'rental' ? 'Subject to availability.' : 'Eligibility applies. Leasehold.'
  const base: CSSProperties = { position: 'relative', width: W, height: Hh, overflow: 'hidden', fontFamily: 'var(--font-sans)', color: BRAND.ink, background: BRAND.dark }

  switch (format) {
    // "Growing family?" carousel template: bright-green swoosh panel over the photo.
    case 'ig-post':
      return (
        <div style={base}>
          <Img src={image} />
          <Shape w={W} h={Hh}>
            <path d="M0 0H1080V330C930 300 860 420 720 470C560 528 420 440 250 470C140 490 60 520 0 560Z" fill={BRAND.bright} />
            <path d="M1080 330C930 300 860 420 720 470C860 440 960 380 1080 400Z" fill={BRAND.mint} opacity=".7" />
            <rect y="880" width="1080" height="200" fill="url(#fadeBottom)" />
            <defs>
              <linearGradient id="fadeBottom" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#000" stopOpacity="0" />
                <stop offset="1" stopColor="#000" stopOpacity=".55" />
              </linearGradient>
            </defs>
          </Shape>
          <div style={{ position: 'absolute', top: 64, left: 60, right: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, textAlign: 'center' }}>
            <div style={{ ...H1, fontSize: fitSize(84, headline, 28) }}>{headline}</div>
            {body && (
              <div style={{ background: '#fff', borderRadius: 14, padding: '16px 26px', maxWidth: 900 }}>
                <div style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{body}</div>
              </div>
            )}
          </div>
          {location && (
            <div style={{ position: 'absolute', left: 56, bottom: 210, maxWidth: 620 }}>
              <LocationPill size={40}>{location}</LocationPill>
            </div>
          )}
          <div style={{ position: 'absolute', left: 56, right: 56, bottom: 52, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <StackedLogo size={50} />
            <Cta size={30}>{cta}</Cta>
          </div>
          <div style={{ position: 'absolute', left: 56, right: 56, bottom: 16, fontSize: 15, color: 'rgba(255,255,255,.75)', textAlign: 'right' }}>{short}</div>
        </div>
      )

    // House-type reel template: white headline over the photo, tilted location pill.
    case 'ig-story':
      return (
        <div style={base}>
          <Img src={image} />
          <Shape w={W} h={Hh}>
            <defs>
              <linearGradient id="storyTop" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#000" stopOpacity=".5" />
                <stop offset="1" stopColor="#000" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="storyBottom" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#000" stopOpacity="0" />
                <stop offset="1" stopColor="#000" stopOpacity=".7" />
              </linearGradient>
            </defs>
            <rect width="1080" height="520" fill="url(#storyTop)" />
            <rect y="1240" width="1080" height="680" fill="url(#storyBottom)" />
          </Shape>
          <div style={{ position: 'absolute', top: 120, left: 70, right: 70, textAlign: 'center', color: '#fff', textShadow: '0 4px 24px rgba(0,0,0,.35)' }}>
            <div style={{ ...H1, fontSize: fitSize(108, headline, 26) }}>{headline}</div>
          </div>
          {location && (
            <div style={{ position: 'absolute', left: 0, right: 0, top: 1180, display: 'flex', justifyContent: 'center', padding: '0 80px' }}>
              <LocationPill size={58}>{location}</LocationPill>
            </div>
          )}
          <div style={{ position: 'absolute', left: 72, right: 72, bottom: 120, display: 'flex', flexDirection: 'column', gap: 34, color: '#fff' }}>
            {body && <div style={{ fontSize: 40, fontWeight: 500, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{body}</div>}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <StackedLogo size={58} />
              <Cta size={36} dark={false}>
                {cta}
              </Cta>
            </div>
          </div>
          <div style={{ position: 'absolute', left: 72, right: 72, bottom: 40, fontSize: 22, color: 'rgba(255,255,255,.7)', lineHeight: 1.3 }}>{disclaimer}</div>
        </div>
      )

    // "Make your move to Lapwings" template: dark-green panel with swoosh into the photo.
    case 'fb-banner':
    case 'li-post':
      return (
        <div style={base}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 640 }}>
            <Img src={image} />
          </div>
          <Shape w={W} h={Hh}>
            <path d={`M0 0H640C580 120 700 230 600 360C520 470 610 560 560 ${Hh}H0Z`} fill={BRAND.dark} />
            <path d={`M640 0C580 120 700 230 600 360C520 470 610 560 560 ${Hh}H600C650 560 570 470 650 360C740 230 640 120 700 0Z`} fill={BRAND.bright} />
            <path d={`M700 0C640 120 740 230 650 360C570 470 650 560 600 ${Hh}H616C666 560 588 470 668 360C760 230 660 120 720 0Z`} fill={BRAND.neon} opacity=".9" />
          </Shape>
          <div style={{ position: 'absolute', top: 40, bottom: 30, left: 48, width: 500, display: 'flex', flexDirection: 'column', gap: 16, color: '#fff' }}>
            <StackedLogo size={30} />
            <div style={{ marginTop: 'auto', ...H1, fontSize: fitSize(62, headline, 26) }}>{headline}</div>
            {body && <div style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.35, opacity: 0.92, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{body}</div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
              <Cta size={19} dark={false}>
                {cta}
              </Cta>
            </div>
            <div style={{ fontSize: 11.5, lineHeight: 1.35, opacity: 0.7 }}>{disclaimer}</div>
          </div>
          {location && (
            <div style={{ position: 'absolute', right: 34, bottom: 34, maxWidth: 420 }}>
              <LocationPill size={26}>{location}</LocationPill>
            </div>
          )}
        </div>
      )

    case 'gd-mpu':
      return (
        <div style={base}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 150 }}>
            <Img src={image} />
          </div>
          <Shape w={W} h={Hh}>
            <path d="M0 132C70 116 120 150 190 138C240 130 270 112 300 118V250H0Z" fill={BRAND.bright} />
            <path d="M0 132C70 116 120 150 190 138C240 130 270 112 300 118V112C268 106 236 126 188 132C120 142 70 110 0 124Z" fill={BRAND.neon} />
          </Shape>
          <div style={{ position: 'absolute', top: 10, left: 12 }}>
            <StackedLogo size={15} />
          </div>
          <div style={{ position: 'absolute', top: 150, left: 14, right: 14, bottom: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ ...H1, fontSize: fitSize(22, headline, 26, 0.7), display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{headline}</div>
            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Cta size={11}>{cta}</Cta>
              <span style={{ fontSize: 7.5, maxWidth: 80, lineHeight: 1.2, textAlign: 'right', opacity: 0.75 }}>{short}</span>
            </div>
          </div>
        </div>
      )

    case 'gd-leaderboard':
      return (
        <div style={base}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 190 }}>
            <Img src={image} />
          </div>
          <Shape w={W} h={Hh}>
            <path d="M160 0H728V90H150C172 64 140 30 160 0Z" fill={BRAND.dark} />
            <path d="M160 0C140 30 172 64 150 90H160C182 64 150 30 170 0Z" fill={BRAND.neon} />
          </Shape>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 186, right: 220, display: 'flex', alignItems: 'center', color: '#fff' }}>
            <div style={{ ...H1, fontSize: fitSize(23, headline, 24, 0.5), lineHeight: 1.05, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{headline}</div>
          </div>
          <div style={{ position: 'absolute', top: 0, bottom: 0, right: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
            <Cta size={12} dark={false}>
              {cta}
            </Cta>
            <StackedLogo size={14} />
          </div>
        </div>
      )

    case 'email-header':
      return (
        <div style={base}>
          <Img src={image} />
          <Shape w={W} h={Hh}>
            <path d="M0 0H360C330 50 380 110 340 160C325 180 330 192 336 200H0Z" fill={BRAND.bright} />
            <path d="M360 0C330 50 380 110 340 160C325 180 330 192 336 200H346C340 190 336 178 352 160C392 110 342 50 372 0Z" fill={BRAND.neon} />
          </Shape>
          <div style={{ position: 'absolute', top: 18, bottom: 16, left: 24, width: 300, display: 'flex', flexDirection: 'column', gap: 9 }}>
            <StackedLogo size={14} color={BRAND.ink} />
            <div style={{ marginTop: 'auto', ...H1, fontSize: fitSize(28, headline, 24, 0.6) }}>{headline}</div>
            <div>
              <Cta size={11}>{cta}</Cta>
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
