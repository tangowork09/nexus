'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { friendlyError } from '@/lib/friendly-error'
import { LeftPanel } from '@/components/auth/LeftPanel'
import { OtpInput } from '@/components/auth/OtpInput'

type Role = 'candidate' | 'recruiter'
type Step = 'main' | 'otp'

function Spinner() {
  return (
    <span className="inline-block w-[15px] h-[15px] rounded-full border-2 border-white/30 border-t-white animate-spin" />
  )
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-[13px] font-medium mb-8 -ml-0.5 transition-colors"
      style={{ color: 'var(--nx-text-muted)' }}
      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--nx-text-2)')}
      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--nx-text-muted)')}
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      Back
    </button>
  )
}

const ROLES: { id: Role; label: string }[] = [
  { id: 'candidate', label: 'Upskill / Seek Job' },
  { id: 'recruiter', label: 'Hire / Find Talent' },
]

function RoleTabs({ role, onChange }: { role: Role; onChange: (r: Role) => void }) {
  return (
    <div
      className="flex gap-[3px] p-[3px] rounded-[11px] mb-7"
      style={{ background: 'var(--nx-surface-low)' }}
    >
      {ROLES.map((r) => (
        <button
          key={r.id}
          onClick={() => onChange(r.id)}
          className="flex-1 h-[34px] rounded-[9px] text-[11px] font-bold tracking-[0.05em] uppercase transition-all"
          style={
            role === r.id
              ? {
                  background: '#fff',
                  color: 'var(--nx-primary)',
                  boxShadow: '0 1px 3px rgba(15,23,42,0.1), 0 1px 2px rgba(15,23,42,0.06)',
                }
              : { color: 'var(--nx-text-muted)', background: 'transparent' }
          }
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full h-11 px-3.5 rounded-xl text-[13.5px] outline-none transition-all"
      style={{
        background: '#fff',
        color: 'var(--nx-text)',
        border: '1px solid var(--nx-border)',
        boxShadow: 'var(--nx-shadow-sm)',
      }}
      onFocus={(e) => {
        e.target.style.borderColor = 'var(--nx-primary)'
        e.target.style.boxShadow = `0 0 0 3px rgba(var(--nx-primary-rgb), 0.12)`
        props.onFocus?.(e)
      }}
      onBlur={(e) => {
        e.target.style.borderColor = 'var(--nx-border)'
        e.target.style.boxShadow = 'var(--nx-shadow-sm)'
        props.onBlur?.(e)
      }}
    />
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-bold tracking-[0.07em] uppercase" style={{ color: 'var(--nx-text-2)' }}>
      {children}
    </p>
  )
}

function PrimaryBtn({
  loading, disabled, children, onClick,
}: {
  loading?: boolean; disabled?: boolean; children: React.ReactNode; onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full h-11 rounded-xl text-white text-[13.5px] font-semibold tracking-[0.01em] transition-all disabled:opacity-40"
      style={{
        background: 'linear-gradient(180deg, var(--nx-primary-end) 0%, var(--nx-primary) 100%)',
        boxShadow: '0 1px 2px rgba(79,70,229,0.4), inset 0 1px 0 rgba(255,255,255,0.12)',
      }}
      onMouseEnter={(e) => { if (!disabled && !loading) e.currentTarget.style.opacity = '0.93' }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
      onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.99)' }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <Spinner /> Processing…
        </span>
      ) : children}
    </button>
  )
}

function ErrorMsg({ message }: { message: string }) {
  const isServerError = message.includes("It's not you")
  return (
    <div
      className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl"
      style={{
        background: isServerError ? '#fffbeb' : '#fef2f2',
        border: `1px solid ${isServerError ? '#fde68a' : '#fecaca'}`,
      }}
    >
      <span className="text-[13px] mt-px shrink-0">{isServerError ? '⚠️' : '!'}</span>
      <p className="text-[12.5px] font-medium leading-snug" style={{ color: isServerError ? '#92400e' : '#991b1b' }}>
        {message}
      </p>
    </div>
  )
}

/* ─── page ─────────────────────────────────────────────────── */
export default function SignInPage() {
  const router = useRouter()
  const [role, setRole] = useState<Role>('candidate')
  const [step, setStep] = useState<Step>('main')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleSendEmailOtp = async () => {
    setError(''); setLoading(true)
    try {
      const { error: err } = await authClient.emailOtp.sendVerificationOtp({ email, type: 'sign-in' })
      if (err) throw new Error(err.message)
      setOtp(''); setStep('otp'); setCountdown(60)
    } catch (e: unknown) { setError(friendlyError(e)) }
    finally { setLoading(false) }
  }

  const handleResend = async () => {
    setError(''); setLoading(true)
    try {
      const { error: err } = await authClient.emailOtp.sendVerificationOtp({ email, type: 'sign-in' })
      if (err) throw new Error(err.message)
      setCountdown(60)
    } catch (e: unknown) { setError(friendlyError(e)) }
    finally { setLoading(false) }
  }

  const handleVerifyOtp = async () => {
    setError(''); setLoading(true)
    try {
      const { error: err } = await authClient.signIn.emailOtp({ email, otp })
      if (err) throw new Error(err.message)
      router.push('/dashboard')
    } catch (e: unknown) { setError(friendlyError(e)) }
    finally { setLoading(false) }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <LeftPanel />

      <div
        className="flex-1 flex items-center justify-center overflow-y-auto px-8 py-12"
        style={{ background: 'var(--nx-bg)' }}
      >
        <div className="w-full max-w-[380px]">

          {step === 'main' && (
            <>
              <div className="flex items-center gap-2 mb-10">
                <div
                  className="w-8 h-8 rounded-[9px] flex items-center justify-center"
                  style={{ background: 'var(--nx-primary)', boxShadow: '0 2px 8px rgba(79,70,229,0.35)' }}
                >
                  <span className="text-white text-[10px] font-black tracking-[0.08em]">NX</span>
                </div>
                <span className="text-[15px] font-bold tracking-[-0.01em]" style={{ color: 'var(--nx-text)' }}>
                  Nexus
                </span>
              </div>

              <h1
                className="font-bold tracking-[-0.03em] leading-[1.1] mb-2"
                style={{ fontSize: '1.85rem', color: 'var(--nx-text)' }}
              >
                Access Portal
              </h1>
              <p className="text-[14px] mb-8 leading-relaxed" style={{ color: 'var(--nx-text-2)' }}>
                Select your account profile to continue
              </p>

              <RoleTabs role={role} onChange={setRole} />

              <div className="space-y-3">
                <div>
                  <Label>Work email address</Label>
                  <TextInput
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && email) handleSendEmailOtp() }}
                    autoFocus
                  />
                </div>
                {error && <ErrorMsg message={error} />}
                <PrimaryBtn loading={loading} disabled={!email} onClick={handleSendEmailOtp}>
                  Get One-Time Password
                </PrimaryBtn>
              </div>

              <p className="text-center mt-7 text-[12px] leading-relaxed" style={{ color: 'var(--nx-text-muted)' }}>
                By signing in, you agree to our{' '}
                <span className="underline underline-offset-2 cursor-pointer transition-colors" style={{ color: 'var(--nx-text-2)' }}>
                  Terms of Service
                </span>{' '}
                and{' '}
                <span className="underline underline-offset-2 cursor-pointer transition-colors" style={{ color: 'var(--nx-text-2)' }}>
                  Data Privacy Policy
                </span>.
              </p>

              <p className="text-center mt-4 text-[13px]" style={{ color: 'var(--nx-text-2)' }}>
                New to Nexus?{' '}
                <Link
                  href="/sign-up"
                  className="font-semibold underline-offset-2 hover:underline"
                  style={{ color: 'var(--nx-primary)' }}
                >
                  Create account
                </Link>
              </p>
            </>
          )}

          {step === 'otp' && (
            <>
              <BackBtn onClick={() => { setStep('main'); setError('') }} />
              <h1 className="font-bold tracking-[-0.03em] leading-[1.1] mb-2" style={{ fontSize: '1.85rem', color: 'var(--nx-text)' }}>
                Enter the code
              </h1>
              <p className="text-[14px] mb-8 leading-relaxed" style={{ color: 'var(--nx-text-2)' }}>
                Sent to{' '}
                <span className="font-semibold" style={{ color: 'var(--nx-text)' }}>
                  {email}
                </span>
              </p>

              <div className="space-y-5">
                <OtpInput idPrefix="signin" value={otp} onChange={setOtp} />
                {error && <ErrorMsg message={error} />}
                <PrimaryBtn
                  loading={loading}
                  disabled={otp.replace(/\s/g, '').length < 6}
                  onClick={handleVerifyOtp}
                >
                  Verify &amp; sign in
                </PrimaryBtn>
                <p className="text-[13px]" style={{ color: 'var(--nx-text-muted)' }}>
                  {countdown > 0 ? (
                    <>
                      Resend available in{' '}
                      <span className="tabular-nums font-semibold" style={{ color: 'var(--nx-text-2)' }}>
                        {countdown}s
                      </span>
                    </>
                  ) : (
                    <>
                      Didn&apos;t receive it?{' '}
                      <button
                        onClick={handleResend}
                        className="font-semibold underline-offset-2 hover:underline"
                        style={{ color: 'var(--nx-primary)' }}
                      >
                        Resend code
                      </button>
                    </>
                  )}
                </p>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
