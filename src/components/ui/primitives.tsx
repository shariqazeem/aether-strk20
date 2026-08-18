'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useReveal } from '@/lib/hooks/use-motion'

/** Wraps children in a scroll-triggered reveal. `delay` staggers siblings. */
export function Reveal({
  children,
  delay = 0,
  blur = false,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode
  delay?: number
  blur?: boolean
  className?: string
  as?: 'div' | 'section' | 'li' | 'article' | 'header'
}) {
  const { ref, shown } = useReveal<HTMLDivElement>()
  return (
    <Tag
      // @ts-expect-error — ref is valid for every tag in the union above
      ref={ref}
      data-shown={shown}
      style={{ ['--reveal-delay' as string]: `${delay}ms` }}
      className={`${blur ? 'reveal-blur' : 'reveal'} ${className}`}
    >
      {children}
    </Tag>
  )
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>
}

/** Page gutter. Every section shares it so nothing drifts out of alignment. */
export function Container({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-6 sm:px-8 lg:px-10 ${className}`}>{children}</div>
  )
}

export function Button({
  children,
  href,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  disabled = false,
}: {
  children: ReactNode
  href?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  type?: 'button' | 'submit'
  disabled?: boolean
}) {
  const sizes = {
    sm: 'h-9 px-4 text-[13px]',
    md: 'h-11 px-5 text-sm',
    lg: 'h-13 px-7 text-[15px]',
  }

  const variants = {
    primary:
      'bg-ink text-paper hover:bg-ink-soft shadow-[0_1px_2px_rgba(20,21,15,0.14),0_8px_20px_-10px_rgba(20,21,15,0.4)]',
    secondary: 'bg-paper-raised text-ink border border-rule-strong hover:border-ink-faint hover:bg-paper-sunk',
    ghost: 'text-ink-soft hover:text-ink hover:bg-paper-sunk',
  }

  const classes = `inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 active:scale-[0.985] disabled:pointer-events-none disabled:opacity-45 ${sizes[size]} ${variants[variant]} ${className}`

  if (href) {
    const external = href.startsWith('http')
    if (external) {
      return (
        <a href={href} target="_blank" rel="noreferrer noopener" className={classes}>
          {children}
        </a>
      )
    }
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  )
}

/** Private / public state chip. The two states must never look alike. */
export function StateBadge({
  state,
  children,
}: {
  state: 'private' | 'public' | 'neutral' | 'good'
  children: ReactNode
}) {
  const styles = {
    private: 'bg-veil-soft text-veil-deep border-veil-mid/45',
    public: 'bg-exposed-soft text-exposed border-exposed-mid/50',
    good: 'bg-good-soft text-good border-good/25',
    neutral: 'bg-paper-sunk text-ink-muted border-rule-strong',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-wide ${styles[state]}`}
    >
      {children}
    </span>
  )
}

/** Truncated hex with a copy affordance, for addresses and tx hashes. */
export function Hex({
  value,
  href,
  chars = 6,
}: {
  value: string
  href?: string
  chars?: number
}) {
  const short = value.length > chars * 2 + 2
    ? `${value.slice(0, chars + 2)}…${value.slice(-chars)}`
    : value

  const body = (
    <code className="font-mono text-[12.5px] tracking-tight text-ink-muted">{short}</code>
  )

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="rounded transition-colors hover:text-veil hover:underline underline-offset-2"
      >
        {body}
      </a>
    )
  }
  return body
}

export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = 'left',
}: {
  eyebrow: string
  title: ReactNode
  lede?: ReactNode
  align?: 'left' | 'center'
}) {
  const centered = align === 'center'
  return (
    <div className={centered ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <Reveal>
        <Eyebrow>{eyebrow}</Eyebrow>
      </Reveal>
      <Reveal delay={80}>
        <h2 className="display-md mt-4 text-balance">{title}</h2>
      </Reveal>
      {lede ? (
        <Reveal delay={150}>
          <p className="mt-5 text-[17px] leading-relaxed text-ink-muted text-pretty">{lede}</p>
        </Reveal>
      ) : null}
    </div>
  )
}
