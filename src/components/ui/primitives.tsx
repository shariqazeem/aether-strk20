'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useReveal } from '@/lib/hooks/use-motion'

/** Scroll-triggered reveal. Small and fast — motion is seasoning, not the meal. */
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

/** Shared page gutter. */
export function Container({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10 ${className}`}>{children}</div>
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
    sm: 'h-8 px-3.5 text-[13px]',
    md: 'h-10 px-4.5 text-[14px]',
    lg: 'h-11 px-5 text-[15px]',
  }

  const variants = {
    primary: 'bg-veil text-white hover:bg-veil-deep',
    secondary: 'bg-black/[0.05] text-ink hover:bg-black/[0.08]',
    ghost: 'text-ink-soft hover:bg-black/[0.05] hover:text-ink',
  }

  const classes = `inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition-all duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 ${sizes[size]} ${variants[variant]} ${className}`

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

/** iOS-style tinted state chip. Private and public must never look alike. */
export function StateBadge({
  state,
  children,
}: {
  state: 'private' | 'public' | 'neutral' | 'good'
  children: ReactNode
}) {
  const styles = {
    private: 'bg-veil-soft text-veil-deep',
    public: 'bg-exposed-soft text-exposed',
    good: 'bg-good-soft text-good',
    neutral: 'bg-black/[0.05] text-ink-muted',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${styles[state]}`}
    >
      {children}
    </span>
  )
}

/** iOS segmented control. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className = '',
  ariaLabel,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  className?: string
  ariaLabel?: string
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`inline-flex flex-wrap gap-0.5 rounded-[10px] bg-black/[0.05] p-0.5 ${className}`}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={`h-8 rounded-[8px] px-3 text-[13px] font-medium transition-all duration-150 ${
              selected
                ? 'bg-white text-ink shadow-[0_1px_4px_rgba(0,0,0,0.12)]'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/** Truncated hex with optional explorer link. */
export function Hex({
  value,
  href,
  chars = 6,
}: {
  value: string
  href?: string
  chars?: number
}) {
  const short =
    value.length > chars * 2 + 2 ? `${value.slice(0, chars + 2)}…${value.slice(-chars)}` : value

  const body = <code className="font-mono text-[12px] tracking-tight text-ink-muted">{short}</code>

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
      <Reveal delay={60}>
        <h2 className="display-lg mt-2.5 text-balance">{title}</h2>
      </Reveal>
      {lede ? (
        <Reveal delay={120}>
          <p className="mt-4 text-[16px] leading-relaxed text-ink-muted text-pretty sm:text-[17px]">
            {lede}
          </p>
        </Reveal>
      ) : null}
    </div>
  )
}

/** The mark: a small squircle, app-icon style. */
export function AetherMark({ size = 26 }: { size?: number }) {
  return (
    <span
      className="veil-gradient relative grid place-items-center rounded-[30%]"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span className="absolute rounded-full bg-white/95" style={{ width: size * 0.32, height: size * 0.32 }} />
    </span>
  )
}
