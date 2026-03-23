'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, X } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { friendlyError } from '@/lib/friendly-error'
import { LeftPanel } from '@/components/auth/LeftPanel'
import { OtpInput } from '@/components/auth/OtpInput'
import { checkUserEmail } from '@/lib/auth-actions'

type Role = 'candidate' | 'recruiter'
type Step = 'main' | 'otp'

function PolicyModal({ type, onClose }: { type: 'terms' | 'privacy'; onClose: () => void }) {
  const isTerms = type === 'terms'
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[6px]" onClick={onClose} />
      <div className="relative w-full max-w-[500px] bg-white rounded-[32px] shadow-2xl shadow-slate-900/20 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
         <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-50">
           <div>
             <h2 className="text-xl font-black text-slate-900 tracking-tight">{isTerms ? 'Terms of Service' : 'Privacy Policy'}</h2>
             <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest mt-1">Nexus Hub v2.1</p>
           </div>
           <button onClick={onClose} className="p-2.5 rounded-full bg-slate-50 hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-900">
             <X className="w-5 h-5" />
           </button>
         </div>
         <div className="flex-1 overflow-y-auto p-8 pt-6 space-y-6 text-slate-600 leading-relaxed text-[13.5px]">
            {isTerms ? (
              <>
                <section>
                  <h3 className="font-bold text-slate-900 mb-2">1. The Nexus Agreement</h3>
                  <p>By entering the Nexus platform, you embrace an ecosystem dedicated to verifiable talent. Our mission is to dissolve the "broken loop" of traditional hiring. You agree to provide authentic skill data and maintain professional integrity.</p>
                </section>
                <section>
                  <h3 className="font-bold text-slate-900 mb-2">2. Usage Rights</h3>
                  <p>Candidates grant Nexus a license to display their verified expertise to vetted recruiters. Recruiters agree to use this data solely for talent acquisition and strictly adhere to ethical hiring frameworks.</p>
                </section>
                <section>
                  <h3 className="font-bold text-slate-900 mb-2">3. Talent Authenticity</h3>
                  <p>Any deliberate misrepresentation of skills or identity results in immediate revocation of access. We value the "Proof of Skill" over "Proof of Resume."</p>
                </section>
                <section>
                  <h3 className="font-bold text-slate-900 mb-2">4. Systematic Liability</h3>
                  <p>Nexus provides the bridge, but the journey belongs to you. We are not liable for direct employment outcomes but guarantee the integrity of our verification pipelines.</p>
                </section>
              </>
            ) : (
              <>
                <section>
                  <h3 className="font-bold text-slate-900 mb-2">1. Data Ownership</h3>
                  <p>Your skills belong to you. We collect professional data, verified credentials, and career preferences primarily to match you with recruiters who value your specific expertise.</p>
                </section>
                <section>
                  <h3 className="font-bold text-slate-900 mb-2">2. How we use Skill-Data</h3>
                  <p>We leverage AI to parse resumes and map you into our expertise graph. This data is never sold to third-party advertisers. It stays within the Nexus hiring loop.</p>
                </section>
                <section>
                  <h3 className="font-bold text-slate-900 mb-2">3. Verified Access</h3>
                  <p>Only vetted recruiters with corporate credentials can view candidate profiles. Your sensitive contact information is only revealed once a mutual match is confirmed.</p>
                </section>
                <section>
                  <h3 className="font-bold text-slate-900 mb-2">4. Cookie & Session Policy</h3>
                  <p>We use session tokens for secure authentication. These are ephemeral and designed to keep your professional Nexus experience safe and seamless.</p>
                </section>
              </>
            )}
         </div>
         <div className="p-8 border-t border-slate-50 bg-slate-50/30">
           <button onClick={onClose} className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-black text-[13px] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase tracking-wider">
             I Understand
           </button>
         </div>
      </div>
    </div>
  )
}

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
  const [showPolicy, setShowPolicy] = useState<'terms' | 'privacy' | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [isNotRegistered, setIsNotRegistered] = useState(false)
  const [existingUserRole, setExistingUserRole] = useState('')

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleSendEmailOtp = async () => {
    if (!email) { setError('Please enter your email address'); return }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) { setError('Please enter a valid email address'); return }
    
    setError(''); setLoading(true); setIsNotRegistered(false)
    try {
      // 1. Check if user exists
      const checkRes = await checkUserEmail(email)
      if (!checkRes.exists) {
        setIsNotRegistered(true)
        setError("Hello, looks like you're not registered yet. Redirecting to account creation…")
        setTimeout(() => {
          router.push(`/sign-up?email=${encodeURIComponent(email)}&role=${role}`)
        }, 2500)
        return
      }

      setExistingUserRole(checkRes.role || '')
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
      
      // Refresh session
      const { data: sess } = await authClient.getSession()
      // @ts-ignore
      if (sess?.user?.onboarded) {
        router.push('/dashboard')
      } else {
        router.push('/sign-up') // If they have an account but didn't finish profile
      }
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
                <button onClick={() => setShowPolicy('terms')} className="underline underline-offset-2 hover:text-slate-900 transition-colors" style={{ color: 'var(--nx-text-2)' }}>Terms of Service</button>
                {' '}and{' '}
                <button onClick={() => setShowPolicy('privacy')} className="underline underline-offset-2 hover:text-slate-900 transition-colors" style={{ color: 'var(--nx-text-2)' }}>Data Privacy Policy</button>.
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
                  {(() => {
                    const roleMismatch = existingUserRole && role !== existingUserRole
                    return roleMismatch ? (
                        <>Hey <span className="font-bold text-indigo-600 capitalize">{existingUserRole}</span>! Looks like you strayed into the <span className="italic">{role}</span> lane. No worries, we&apos;ve sent a secure login code to <span className="font-semibold" style={{ color: 'var(--nx-text)' }}>{email}</span> anyway!</>
                    ) : (
                        <>Sent to <span className="font-semibold" style={{ color: 'var(--nx-text)' }}>{email}</span></>
                    )
                  })()}
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
      {showPolicy && <PolicyModal type={showPolicy} onClose={() => setShowPolicy(null)} />}
    </div>
  )
}
