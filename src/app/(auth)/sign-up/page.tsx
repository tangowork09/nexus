'use client'

import { useState, useEffect, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Code2, Building2, Check, Upload } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { friendlyError } from '@/lib/friendly-error'
import { LeftPanel } from '@/components/auth/LeftPanel'
import { OtpInput } from '@/components/auth/OtpInput'

type Role = 'candidate' | 'recruiter'
type ProfileMode = 'manual' | 'resume'
type Step = 'main' | 'otp' | 'profile'

function Spinner() {
  return <span className="inline-block w-[15px] h-[15px] rounded-full border-2 border-white/30 border-t-white animate-spin" />
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
      {loading
        ? <span className="flex items-center justify-center gap-2"><Spinner /> Processing…</span>
        : children}
    </button>
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
        ...props.style,
      }}
      onFocus={(e) => {
        e.target.style.borderColor = 'var(--nx-primary)'
        e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.12)'
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

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[11px] font-bold tracking-[0.07em] uppercase mb-2" style={{ color: 'var(--nx-text-2)' }}>
      {children}
      {required && <span className="ml-0.5 normal-case tracking-normal font-normal" style={{ color: 'var(--nx-primary)' }}> *</span>}
    </label>
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

const ROLE_DEFS = [
  { id: 'candidate' as Role, label: 'Upskill / Seek Job', Icon: Code2 },
  { id: 'recruiter' as Role, label: 'Hire / Find Talent', Icon: Building2 },
]

function RoleTabs({ role, onChange }: { role: Role; onChange: (r: Role) => void }) {
  return (
    <div className="flex gap-[3px] p-[3px] rounded-[11px] mb-7" style={{ background: 'var(--nx-surface-low)' }}>
      {ROLE_DEFS.map((r) => (
        <button
          key={r.id}
          onClick={() => onChange(r.id)}
          className="flex-1 h-[34px] rounded-[9px] text-[11px] font-bold tracking-[0.05em] uppercase transition-all"
          style={
            role === r.id
              ? { background: '#fff', color: 'var(--nx-primary)', boxShadow: '0 1px 3px rgba(15,23,42,0.1), 0 1px 2px rgba(15,23,42,0.06)' }
              : { color: 'var(--nx-text-muted)', background: 'transparent' }
          }
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}

function ProfileStepBar({ current }: { current: 0 | 1 }) {
  const steps = ['Verify identity', 'Complete profile']
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((label, i) => (
        <Fragment key={label}>
          <div className="flex items-center gap-2 shrink-0">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center transition-all"
              style={
                i < current
                  ? { background: 'var(--nx-primary)', color: '#fff' }
                  : i === current
                  ? { background: 'var(--nx-primary)', color: '#fff', boxShadow: '0 0 0 3px rgba(79,70,229,0.15)' }
                  : { background: 'var(--nx-surface-high)', color: 'var(--nx-text-muted)' }
              }
            >
              {i < current
                ? <Check className="w-3 h-3" />
                : <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>{i + 1}</span>
              }
            </div>
            <span
              className="text-[12px] font-medium"
              style={{ color: i <= current ? 'var(--nx-text)' : 'var(--nx-text-muted)' }}
            >
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 h-px" style={{ background: i < current ? 'var(--nx-primary)' : 'var(--nx-border)' }} />
          )}
        </Fragment>
      ))}
    </div>
  )
}

function CandidateProfileForm({ email, onSubmit, loading }: { email: string, onSubmit: (d: Record<string, string>) => void; loading: boolean }) {
  const [mode, setMode] = useState<ProfileMode>('manual')
  const [f, setF] = useState({ firstName: '', lastName: '', username: '', designation: '' })
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [err, setErr] = useState('')
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }))

  const submit = () => {
    if (!f.firstName || !f.lastName || !f.username || !f.designation) { setErr('Please fill in all required fields.'); return }
    setErr(''); onSubmit({ ...f, email, role: 'candidate' })
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-[3px] p-[3px] rounded-[11px]" style={{ background: 'var(--nx-surface-low)' }}>
        {(['manual', 'resume'] as ProfileMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className="flex-1 h-[34px] rounded-[9px] text-[11px] font-bold tracking-[0.03em] transition-all"
            style={mode === m
              ? { background: '#fff', color: 'var(--nx-primary)', boxShadow: '0 1px 3px rgba(15,23,42,0.1)' }
              : { color: 'var(--nx-text-muted)', background: 'transparent' }
            }
          >
            {m === 'resume' ? 'Upload resume' : 'Fill manually'}
          </button>
        ))}
      </div>

      {mode === 'resume' && (
        <label
          className="flex flex-col items-center justify-center gap-2 h-28 rounded-xl cursor-pointer transition-all"
          style={{ border: `1.5px dashed ${resumeFile ? 'var(--nx-primary)' : 'var(--nx-border)'}`, background: resumeFile ? 'rgba(79,70,229,0.03)' : 'transparent' }}
        >
          <Upload className="w-[18px] h-[18px]" style={{ color: resumeFile ? 'var(--nx-primary)' : 'var(--nx-text-muted)' }} />
          <p className="text-[13px] font-medium" style={{ color: resumeFile ? 'var(--nx-primary)' : 'var(--nx-text-2)' }}>
            {resumeFile ? resumeFile.name : 'Drop your PDF resume here'}
          </p>
          <p className="text-[11px]" style={{ color: 'var(--nx-text-muted)' }}>PDF · max 5 MB</p>
          <input type="file" accept=".pdf" className="hidden" onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)} />
        </label>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div><FieldLabel required>First name</FieldLabel><TextInput placeholder="Aryan" value={f.firstName} onChange={(e) => set('firstName')(e.target.value)} /></div>
        <div><FieldLabel required>Last name</FieldLabel><TextInput placeholder="Sharma" value={f.lastName} onChange={(e) => set('lastName')(e.target.value)} /></div>
      </div>

      <div>
        <FieldLabel required>Username</FieldLabel>
        <TextInput
          placeholder="aryan_sharma"
          value={f.username}
          onChange={(e) => set('username')(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
        />
        <p className="mt-1.5 text-[11px]" style={{ color: 'var(--nx-text-muted)' }}>Lowercase, numbers, underscores only</p>
      </div>

      <div><FieldLabel required>Designation</FieldLabel><TextInput placeholder="Frontend Engineer" value={f.designation} onChange={(e) => set('designation')(e.target.value)} /></div>

      {err && <ErrorMsg message={err} />}
      <PrimaryBtn loading={loading} onClick={submit}>Create account</PrimaryBtn>
    </div>
  )
}

function RecruiterProfileForm({ email, onSubmit, loading }: { email: string, onSubmit: (d: Record<string, string>) => void; loading: boolean }) {
  const [f, setF] = useState({ firstName: '', lastName: '', companyName: '' })
  const [err, setErr] = useState('')
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }))
  
  const PUBLIC_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com']
  const domain = email.split('@')[1]?.toLowerCase()
  const isPublicDomain = PUBLIC_DOMAINS.includes(domain)

  const submit = () => {
    if (!f.firstName || !f.lastName || !f.companyName) { setErr('Please fill in all required fields.'); return }
    setErr(''); onSubmit({ ...f, email, role: 'recruiter', isVerifiedRecruiter: String(!isPublicDomain) })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><FieldLabel required>First name</FieldLabel><TextInput placeholder="Priya" value={f.firstName} onChange={(e) => set('firstName')(e.target.value)} /></div>
        <div><FieldLabel required>Last name</FieldLabel><TextInput placeholder="Mehta" value={f.lastName} onChange={(e) => set('lastName')(e.target.value)} /></div>
      </div>
      <div><FieldLabel required>Company name</FieldLabel><TextInput placeholder="Acme Corp" value={f.companyName} onChange={(e) => set('companyName')(e.target.value)} /></div>
      
      {isPublicDomain && (
        <div className="p-3 mt-2 rounded-xl text-xs" style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}>
          <strong>Note:</strong> You are signing up with a personal email domain ({domain}). Your recruiter account will be marked as unverified until you add a corporate email.
        </div>
      )}

      {err && <ErrorMsg message={err} />}
      <PrimaryBtn loading={loading} onClick={submit}>Create account</PrimaryBtn>
    </div>
  )
}

/* ─── page ─────────────────────────────────────────────────── */
export default function SignUpPage() {
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
      setStep('profile')
    } catch (e: unknown) { setError(friendlyError(e)) }
    finally { setLoading(false) }
  }

  const handleProfile = async (data: Record<string, string>) => {
    setLoading(true)
    // TODO: POST /api/users
    await new Promise((r) => setTimeout(r, 600)) 
    setLoading(false)
    router.push('/dashboard')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <LeftPanel />

      <div className="flex-1 overflow-y-auto" style={{ background: 'var(--nx-bg)' }}>
        <div className="flex items-center justify-center px-8 py-12" style={{ minHeight: '100%' }}>
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
                  <span className="text-[15px] font-bold tracking-[-0.01em]" style={{ color: 'var(--nx-text)' }}>Nexus</span>
                </div>

                <h1 className="font-bold tracking-[-0.03em] leading-[1.1] mb-2" style={{ fontSize: '1.85rem', color: 'var(--nx-text)' }}>
                  Create Account
                </h1>
                <p className="text-[14px] mb-8 leading-relaxed" style={{ color: 'var(--nx-text-2)' }}>
                  Choose your role to get started on Nexus
                </p>

                <RoleTabs role={role} onChange={setRole} />

                <div className="space-y-3 mt-5">
                  <div>
                    <label className="block text-[11px] font-bold tracking-[0.07em] uppercase mb-2" style={{ color: 'var(--nx-text-2)' }}>
                      Work email address
                    </label>
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
                  By signing up, you agree to our{' '}
                  <span className="underline underline-offset-2 cursor-pointer" style={{ color: 'var(--nx-text-2)' }}>Terms of Service</span>
                  {' '}and{' '}
                  <span className="underline underline-offset-2 cursor-pointer" style={{ color: 'var(--nx-text-2)' }}>Data Privacy Policy</span>.
                </p>

                <p className="text-center mt-4 text-[13px]" style={{ color: 'var(--nx-text-2)' }}>
                  Already have an account?{' '}
                  <Link href="/sign-in" className="font-semibold underline-offset-2 hover:underline" style={{ color: 'var(--nx-primary)' }}>
                    Sign in
                  </Link>
                </p>
              </>
            )}

            {step === 'otp' && (
              <>
                <BackBtn onClick={() => { setStep('main'); setError('') }} />
                <ProfileStepBar current={0} />
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
                  <OtpInput idPrefix="signup" value={otp} onChange={setOtp} />
                  {error && <ErrorMsg message={error} />}
                  <PrimaryBtn loading={loading} disabled={otp.replace(/\s/g, '').length < 6} onClick={handleVerifyOtp}>
                    Verify &amp; continue
                  </PrimaryBtn>
                  <p className="text-[13px]" style={{ color: 'var(--nx-text-muted)' }}>
                    {countdown > 0 ? (
                      <>Resend available in <span className="tabular-nums font-semibold" style={{ color: 'var(--nx-text-2)' }}>{countdown}s</span></>
                    ) : (
                      <>Didn&apos;t receive it? <button onClick={handleResend} className="font-semibold hover:underline" style={{ color: 'var(--nx-primary)' }}>Resend</button></>
                    )}
                  </p>
                </div>
              </>
            )}

            {step === 'profile' && (
              <>
                <ProfileStepBar current={1} />
                <div className="mb-7">
                  <h1 className="font-bold tracking-[-0.03em] leading-[1.1] mb-2" style={{ fontSize: '1.85rem', color: 'var(--nx-text)' }}>
                    Complete your profile
                  </h1>
                  <p className="text-[14px]" style={{ color: 'var(--nx-text-2)' }}>
                    {role === 'candidate' ? 'Add your professional details to get started' : 'Tell us about your company'}
                  </p>
                </div>
                {role === 'candidate' && <CandidateProfileForm email={email} onSubmit={handleProfile} loading={loading} />}
                {role === 'recruiter' && <RecruiterProfileForm email={email} onSubmit={handleProfile} loading={loading} />}
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
