'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Smartphone } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { friendlyError } from '@/lib/friendly-error'
import { LeftPanel } from '@/components/auth/LeftPanel'
import { OtpInput } from '@/components/auth/OtpInput'

/* ─── types ───────────────────────────────────────────────── */
type Role = 'candidate' | 'recruiter'
type Step = 'main' | 'phone-entry' | 'otp'

/* ─── brand icons ─────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path fill="#f25022" d="M11.4 11.4H1V1h10.4z" />
      <path fill="#00a4ef" d="M23 11.4H12.6V1H23z" />
      <path fill="#7fba00" d="M11.4 23H1V12.6h10.4z" />
      <path fill="#ffb900" d="M23 23H12.6V12.6H23z" />
    </svg>
  )
}

/* ─── design primitives ───────────────────────────────────── */
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

/* Role tab segmented control */
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

/* Social / provider button — icon pinned left, label centered */
function ProviderBtn({
  icon, label, onClick, disabled,
}: {
  icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="relative flex items-center justify-center w-full h-[52px] rounded-xl transition-all disabled:opacity-50"
      style={{
        background: '#fff',
        border: '1px solid var(--nx-border)',
        boxShadow: 'var(--nx-shadow-sm)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--nx-border-strong)'
        e.currentTarget.style.boxShadow = 'var(--nx-shadow-md)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--nx-border)'
        e.currentTarget.style.boxShadow = 'var(--nx-shadow-sm)'
      }}
    >
      <span className="absolute left-4 flex items-center justify-center w-5">{icon}</span>
      <span className="text-[13.5px] font-semibold" style={{ color: 'var(--nx-text)' }}>{label}</span>
    </button>
  )
}

/* Section divider */
function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px" style={{ background: 'var(--nx-border)' }} />
      <span
        className="text-[10px] font-bold tracking-[0.1em] uppercase select-none"
        style={{ color: 'var(--nx-text-muted)' }}
      >
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: 'var(--nx-border)' }} />
    </div>
  )
}

/* Text input */
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

/* Field label */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-bold tracking-[0.07em] uppercase" style={{ color: 'var(--nx-text-2)' }}>
      {children}
    </p>
  )
}

/* Primary CTA */
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

/* Error message */
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
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpTarget, setOtpTarget] = useState<'email' | 'phone'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleOAuth = async (provider: 'google' | 'microsoft') => {
    setLoading(true)
    await authClient.signIn.social({ provider, callbackURL: '/dashboard' })
  }

  const handleSendEmailOtp = async () => {
    setError(''); setLoading(true)
    try {
      const { error: err } = await authClient.emailOtp.sendVerificationOtp({ email, type: 'sign-in' })
      if (err) throw new Error(err.message)
      setOtp(''); setOtpTarget('email'); setStep('otp'); setCountdown(60)
    } catch (e: unknown) { setError(friendlyError(e)) }
    finally { setLoading(false) }
  }

  const handleSendPhoneOtp = async () => {
    setError(''); setLoading(true)
    try {
      const { error: err } = await authClient.phoneNumber.sendOtp({ phoneNumber: phone })
      if (err) throw new Error(err.message)
      setOtp(''); setOtpTarget('phone'); setStep('otp'); setCountdown(60)
    } catch (e: unknown) { setError(friendlyError(e)) }
    finally { setLoading(false) }
  }

  const handleResend = async () => {
    setError(''); setLoading(true)
    try {
      if (otpTarget === 'email') {
        const { error: err } = await authClient.emailOtp.sendVerificationOtp({ email, type: 'sign-in' })
        if (err) throw new Error(err.message)
      } else {
        const { error: err } = await authClient.phoneNumber.sendOtp({ phoneNumber: phone })
        if (err) throw new Error(err.message)
      }
      setCountdown(60)
    } catch (e: unknown) { setError(friendlyError(e)) }
    finally { setLoading(false) }
  }

  const handleVerifyOtp = async () => {
    setError(''); setLoading(true)
    try {
      if (otpTarget === 'email') {
        const { error: err } = await authClient.signIn.emailOtp({ email, otp })
        if (err) throw new Error(err.message)
      } else {
        const { error: err } = await authClient.phoneNumber.verify({ phoneNumber: phone, code: otp, callbackURL: '/dashboard' })
        if (err) throw new Error(err.message)
      }
      router.push('/dashboard')
    } catch (e: unknown) { setError(friendlyError(e)) }
    finally { setLoading(false) }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <LeftPanel />

      {/* Right panel */}
      <div
        className="flex-1 flex items-center justify-center overflow-y-auto px-8 py-12"
        style={{ background: 'var(--nx-bg)' }}
      >
        <div className="w-full max-w-[380px]">

          {/* ── Main screen ── */}
          {step === 'main' && (
            <>
              {/* Wordmark */}
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

              {/* Provider buttons */}
              <div className="space-y-2 mb-1">
                <ProviderBtn icon={<GoogleIcon />} label="Continue with Google" onClick={() => handleOAuth('google')} disabled={loading} />
                <ProviderBtn icon={<MicrosoftIcon />} label="Continue with Outlook" onClick={() => handleOAuth('microsoft')} disabled={loading} />
                <ProviderBtn
                  icon={<Smartphone className="w-[18px] h-[18px]" style={{ color: 'var(--nx-text-2)' }} />}
                  label="Continue with Phone"
                  onClick={() => { setStep('phone-entry'); setError('') }}
                />
              </div>

              <Divider label="Corporate Access" />

              {/* Email OTP */}
              <div className="space-y-3">
                <div>
                  <Label>Work email address</Label>
                  <TextInput
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && email) handleSendEmailOtp() }}
                  />
                </div>
                {error && <ErrorMsg message={error} />}
                <PrimaryBtn loading={loading} disabled={!email} onClick={handleSendEmailOtp}>
                  Get Email OTP
                </PrimaryBtn>
              </div>

              {/* Footer */}
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

          {/* ── Phone entry screen ── */}
          {step === 'phone-entry' && (
            <>
              <BackBtn onClick={() => { setStep('main'); setError('') }} />
              <h1 className="font-bold tracking-[-0.03em] leading-[1.1] mb-2" style={{ fontSize: '1.85rem', color: 'var(--nx-text)' }}>
                Your phone number
              </h1>
              <p className="text-[14px] mb-8" style={{ color: 'var(--nx-text-2)' }}>
                We'll send a one-time code via SMS
              </p>
              <div className="space-y-3">
                <TextInput
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && phone) handleSendPhoneOtp() }}
                  autoFocus
                />
                {error && <ErrorMsg message={error} />}
                <PrimaryBtn loading={loading} disabled={!phone} onClick={handleSendPhoneOtp}>
                  Send code
                </PrimaryBtn>
              </div>
            </>
          )}

          {/* ── OTP screen ── */}
          {step === 'otp' && (
            <>
              <BackBtn onClick={() => { setStep(otpTarget === 'phone' ? 'phone-entry' : 'main'); setError('') }} />
              <h1 className="font-bold tracking-[-0.03em] leading-[1.1] mb-2" style={{ fontSize: '1.85rem', color: 'var(--nx-text)' }}>
                Enter the code
              </h1>
              <p className="text-[14px] mb-8 leading-relaxed" style={{ color: 'var(--nx-text-2)' }}>
                Sent to{' '}
                <span className="font-semibold" style={{ color: 'var(--nx-text)' }}>
                  {otpTarget === 'email' ? email : phone}
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
