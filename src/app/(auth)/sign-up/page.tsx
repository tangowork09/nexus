'use client'

import { useState, useEffect, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Smartphone, Code2, Building2,
  Check, Upload, RefreshCw,
} from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { friendlyError } from '@/lib/friendly-error'
import { LeftPanel } from '@/components/auth/LeftPanel'
import { OtpInput } from '@/components/auth/OtpInput'

/* ─── types ───────────────────────────────────────────────── */
type Role = 'candidate' | 'recruiter'
type ProfileMode = 'manual' | 'resume'
type Step = 'main' | 'phone-entry' | 'otp' | 'profile'

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

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px" style={{ background: 'var(--nx-border)' }} />
      <span className="text-[10px] font-bold tracking-[0.1em] uppercase select-none" style={{ color: 'var(--nx-text-muted)' }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: 'var(--nx-border)' }} />
    </div>
  )
}

/* ─── role tab control ────────────────────────────────────── */
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

/* ─── provider button ─────────────────────────────────────── */
function ProviderBtn({ icon, label, onClick, disabled }: { icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="relative flex items-center justify-center w-full h-[52px] rounded-xl transition-all disabled:opacity-50"
      style={{ background: '#fff', border: '1px solid var(--nx-border)', boxShadow: 'var(--nx-shadow-sm)' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--nx-border-strong)'; e.currentTarget.style.boxShadow = 'var(--nx-shadow-md)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--nx-border)'; e.currentTarget.style.boxShadow = 'var(--nx-shadow-sm)' }}
    >
      <span className="absolute left-4 flex items-center justify-center w-5">{icon}</span>
      <span className="text-[13.5px] font-semibold" style={{ color: 'var(--nx-text)' }}>{label}</span>
    </button>
  )
}

/* ─── profile step indicator ──────────────────────────────── */
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

/* ─── inline email verifier ───────────────────────────────── */
interface InlineVerifierProps {
  idPrefix: string; label: string; placeholder: string
  value: string; onChange: (v: string) => void
  verified: boolean; onVerified: () => void
}

function InlineEmailVerifier({ idPrefix, label, placeholder, value, onChange, verified, onVerified }: InlineVerifierProps) {
  const [showOtp, setShowOtp] = useState(false)
  const [otp, setOtp] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [err, setErr] = useState('')

  const send = async () => {
    setSending(true); setErr('')
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({ email: value, type: 'email-verification' })
      if (error) throw new Error(error.message)
      setShowOtp(true)
    } catch (e: unknown) { setErr(friendlyError(e)) }
    finally { setSending(false) }
  }

  const verify = async () => {
    setVerifying(true); setErr('')
    try {
      const { error } = await authClient.emailOtp.verifyEmail({ email: value, otp })
      if (error) throw new Error(error.message)
      onVerified()
    } catch (e: unknown) { setErr(friendlyError(e)) }
    finally { setVerifying(false) }
  }

  return (
    <div>
      <FieldLabel required>{label}</FieldLabel>
      <div className="flex gap-2 mb-1">
        <TextInput
          type="email"
          id={idPrefix}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={verified}
          style={{ flex: 1 }}
        />
        {!verified && !showOtp && (
          <button
            type="button"
            onClick={send}
            disabled={!value || sending}
            className="shrink-0 h-11 px-4 rounded-xl text-[12px] font-semibold text-white disabled:opacity-40 transition-all"
            style={{ background: 'var(--nx-primary)' }}
          >
            {sending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Verify'}
          </button>
        )}
        {verified && (
          <div className="shrink-0 h-11 px-3.5 flex items-center gap-1.5 rounded-xl text-[12px] font-semibold" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
            <Check className="w-3.5 h-3.5" /> Verified
          </div>
        )}
      </div>
      {showOtp && !verified && (
        <div className="flex gap-2 items-center mt-3">
          <OtpInput idPrefix={`${idPrefix}-v`} value={otp} onChange={setOtp} compact />
          <button
            type="button"
            onClick={verify}
            disabled={otp.replace(/\s/g, '').length < 6 || verifying}
            className="shrink-0 px-4 h-10 rounded-xl text-[12px] font-semibold text-white disabled:opacity-40"
            style={{ background: 'var(--nx-primary)' }}
          >
            {verifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Confirm'}
          </button>
        </div>
      )}
      {err && <ErrorMsg message={err} />}
    </div>
  )
}

/* ─── profile forms ───────────────────────────────────────── */
function CandidateForm({ onSubmit, loading }: { onSubmit: (d: Record<string, string>) => void; loading: boolean }) {
  const [mode, setMode] = useState<ProfileMode>('manual')
  const [f, setF] = useState({ firstName: '', lastName: '', username: '', officialEmail: '', designation: '' })
  const [emailVerified, setEmailVerified] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [err, setErr] = useState('')
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }))

  const submit = () => {
    if (!f.firstName || !f.lastName || !f.username || !f.designation) { setErr('Please fill in all required fields.'); return }
    if (mode === 'manual' && !emailVerified) { setErr('Please verify your official email first.'); return }
    setErr(''); onSubmit({ ...f, role: 'candidate' })
  }

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
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

      {mode === 'manual' && (
        <InlineEmailVerifier
          idPrefix="cand-email"
          label="Official email"
          placeholder="you@company.com"
          value={f.officialEmail}
          onChange={set('officialEmail')}
          verified={emailVerified}
          onVerified={() => setEmailVerified(true)}
        />
      )}

      <div><FieldLabel required>Designation</FieldLabel><TextInput placeholder="Frontend Engineer" value={f.designation} onChange={(e) => set('designation')(e.target.value)} /></div>

      {err && <ErrorMsg message={err} />}
      <PrimaryBtn loading={loading} onClick={submit}>Create account</PrimaryBtn>
    </div>
  )
}

function RecruiterForm({ onSubmit, loading }: { onSubmit: (d: Record<string, string>) => void; loading: boolean }) {
  const [f, setF] = useState({ firstName: '', lastName: '', companyName: '', officialEmail: '' })
  const [emailVerified, setEmailVerified] = useState(false)
  const [err, setErr] = useState('')
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }))

  const submit = () => {
    if (!f.firstName || !f.lastName || !f.companyName) { setErr('Please fill in all required fields.'); return }
    if (!emailVerified) { setErr('Please verify your company email.'); return }
    setErr(''); onSubmit({ ...f, role: 'recruiter' })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><FieldLabel required>First name</FieldLabel><TextInput placeholder="Priya" value={f.firstName} onChange={(e) => set('firstName')(e.target.value)} /></div>
        <div><FieldLabel required>Last name</FieldLabel><TextInput placeholder="Mehta" value={f.lastName} onChange={(e) => set('lastName')(e.target.value)} /></div>
      </div>
      <div><FieldLabel required>Company name</FieldLabel><TextInput placeholder="Acme Corp" value={f.companyName} onChange={(e) => set('companyName')(e.target.value)} /></div>
      <InlineEmailVerifier
        idPrefix="rec-email"
        label="Company email"
        placeholder="priya@acmecorp.com"
        value={f.officialEmail}
        onChange={set('officialEmail')}
        verified={emailVerified}
        onVerified={() => setEmailVerified(true)}
      />
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
    document.cookie = `signup_role=${role}; path=/; max-age=600; samesite=lax`
    setLoading(true)
    await authClient.signIn.social({ provider, callbackURL: `/sign-up?step=profile&role=${role}` })
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
        const { error: err } = await authClient.phoneNumber.verify({ phoneNumber: phone, code: otp })
        if (err) throw new Error(err.message)
      }
      setStep('profile')
    } catch (e: unknown) { setError(friendlyError(e)) }
    finally { setLoading(false) }
  }

  const handleProfile = async (data: Record<string, string>) => {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600)) // TODO: POST /api/users
    setLoading(false)
    router.push('/dashboard')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <LeftPanel />

      <div className="flex-1 overflow-y-auto" style={{ background: 'var(--nx-bg)' }}>
        <div className="flex items-center justify-center px-8 py-12" style={{ minHeight: '100%' }}>
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
                  <span className="text-[15px] font-bold tracking-[-0.01em]" style={{ color: 'var(--nx-text)' }}>Nexus</span>
                </div>

                <h1 className="font-bold tracking-[-0.03em] leading-[1.1] mb-2" style={{ fontSize: '1.85rem', color: 'var(--nx-text)' }}>
                  Create Account
                </h1>
                <p className="text-[14px] mb-8 leading-relaxed" style={{ color: 'var(--nx-text-2)' }}>
                  Choose your role to get started on Nexus
                </p>

                <RoleTabs role={role} onChange={setRole} />

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

                <div className="space-y-3">
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
                    />
                  </div>
                  {error && <ErrorMsg message={error} />}
                  <PrimaryBtn loading={loading} disabled={!email} onClick={handleSendEmailOtp}>
                    Get Email OTP
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

            {/* ── Phone entry ── */}
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
                  <PrimaryBtn loading={loading} disabled={!phone} onClick={handleSendPhoneOtp}>Send code</PrimaryBtn>
                </div>
              </>
            )}

            {/* ── OTP verify ── */}
            {step === 'otp' && (
              <>
                <BackBtn onClick={() => { setStep(otpTarget === 'phone' ? 'phone-entry' : 'main'); setError('') }} />
                <ProfileStepBar current={0} />
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

            {/* ── Profile completion ── */}
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
                {role === 'candidate' && <CandidateForm onSubmit={handleProfile} loading={loading} />}
                {role === 'recruiter' && <RecruiterForm onSubmit={handleProfile} loading={loading} />}
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
