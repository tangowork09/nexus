'use client'

import { useRef } from 'react'

interface OtpInputProps {
  value: string
  onChange: (v: string) => void
  length?: number
  idPrefix?: string
  compact?: boolean
}

export function OtpInput({ value, onChange, length = 6, idPrefix = 'otp', compact = false }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (index: number, char: string) => {
    const digit = char.replace(/\D/g, '').slice(-1)
    const arr = value.padEnd(length, ' ').split('')
    arr[index] = digit || ' '
    onChange(arr.join('').trimEnd())
    if (digit && index < length - 1) refs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!value[index]?.trim() && index > 0) refs.current[index - 1]?.focus()
      const arr = value.padEnd(length, ' ').split('')
      arr[index] = ' '
      onChange(arr.join('').trimEnd())
    }
    if (e.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < length - 1) refs.current[index + 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    onChange(text)
    refs.current[Math.min(text.length, length - 1)]?.focus()
  }

  return (
    <div className={`flex ${compact ? 'gap-1.5' : 'gap-2.5'}`}>
      {Array.from({ length }).map((_, i) => {
        const filled = !!value[i]?.trim()
        const w = compact ? '36px' : '52px'
        const h = compact ? '40px' : '58px'
        return (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el }}
            id={`${idPrefix}-${i}`}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={value[i]?.trim() || ''}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            className="text-center font-bold rounded-xl outline-none transition-all"
            style={{
              width: w,
              height: h,
              fontSize: compact ? '0.9rem' : '1.25rem',
              background: filled ? '#fff' : 'var(--nx-surface-low)',
              color: 'var(--nx-text)',
              border: `1px solid ${filled ? 'var(--nx-primary)' : 'var(--nx-border)'}`,
              boxShadow: filled ? '0 0 0 3px rgba(79,70,229,0.12), var(--nx-shadow-sm)' : 'var(--nx-shadow-sm)',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--nx-primary)'
              e.target.style.background = '#fff'
              e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.12)'
            }}
            onBlur={(e) => {
              if (!e.target.value) {
                e.target.style.background = 'var(--nx-surface-low)'
                e.target.style.borderColor = 'var(--nx-border)'
                e.target.style.boxShadow = 'var(--nx-shadow-sm)'
              }
            }}
          />
        )
      })}
    </div>
  )
}
