'use client'

import { useState, useEffect, Fragment, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Code2, Building2, Check, Upload, Sparkles, Briefcase, MapPin, Search, BookOpen, Plus, X } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { friendlyError } from '@/lib/friendly-error'
import { LeftPanel } from '@/components/auth/LeftPanel'
import { OtpInput } from '@/components/auth/OtpInput'
import { checkUserEmail } from '@/lib/auth-actions'

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
              className="text-[11px] font-bold tracking-tight"
              style={{ color: i === current ? 'var(--nx-text)' : 'var(--nx-text-muted)' }}
            >
              {label}
            </span>
          </div>
          {i === 0 && <div className="h-px w-6 bg-gray-100" />}
        </Fragment>
      ))}
    </div>
  )
}

function CandidateProfileForm({ email, onSubmit, loading, error }: { email: string, onSubmit: (d: Record<string, any>) => void; loading: boolean, error?: string }) {
  const [f, setF] = useState({ 
    firstName: '', lastName: '', username: '', designation: '', 
    employmentStatus: 'OPEN_TO_WORK' as 'EMPLOYED' | 'ON_BENCH' | 'OPEN_TO_WORK' | 'UPSKILLING',
    skills: [] as string[]
  })
  const [isParsing, setIsParsing] = useState(false)
  const [localErr, setLocalErr] = useState('')
  const set = (k: keyof typeof f) => (v: any) => setF((p) => ({ ...p, [k]: v }))

  const PROFESSIONS = ['Frontend Developer', 'Backend Developer', 'Fullstack Engineer', 'Product Manager', 'UX/UI Designer', 'DevOps Architect', 'Data Scientist']
  const SKILL_SUGGESTIONS = ['React', 'Next.js', 'Typescript', 'Node.js', 'PostgreSQL', 'Python', 'TailwindCSS']

  const handleMagicParse = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setIsParsing(true); setLocalErr('')
    setTimeout(() => {
      setF(p => ({ ...p, firstName: 'John', lastName: 'Doe', username: 'johndoe_ai', designation: 'Fullstack Engineer', skills: ['React', 'Next.js', 'TailwindCSS'] }))
      setIsParsing(false)
    }, 1500)
  }

  const toggleSkill = (s: string) => {
    set('skills')(f.skills.includes(s) ? f.skills.filter(i => i !== s) : [...f.skills, s])
  }

  const submit = () => {
    if (!f.firstName || !f.lastName || !f.username || !f.designation) { setLocalErr('All fields are required.'); return }
    if (f.skills.length < 5) { setLocalErr('Please select at least 5 skills to showcase your expertise.'); return }
    setLocalErr(''); onSubmit({ ...f, email, role: 'candidate' })
  }

  const displayErr = error || localErr
  const STATUS_LIST: { id: typeof f.employmentStatus; label: string; Icon: any }[] = [
    { id: 'EMPLOYED', label: 'Working', Icon: Briefcase },
    { id: 'OPEN_TO_WORK', label: 'Seeking', Icon: MapPin },
    { id: 'UPSKILLING', label: 'Learning', Icon: BookOpen },
  ]

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-xl border-2 border-dashed border-indigo-600/10 bg-indigo-50/20 text-center relative overflow-hidden group">
        <Sparkles className="w-5 h-5 text-indigo-600 mx-auto mb-2" />
        <p className="text-[12.5px] font-black text-indigo-900">Magic AI Onboarding</p>
        <p className="text-[11px] text-gray-400 mb-4 px-2 italic">Upload PDF to auto-fill everything instantly</p>
        <label className="inline-block px-4 py-2 rounded-full bg-indigo-600 text-white text-[11px] font-black cursor-pointer shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">
           {isParsing ? 'Parsing...' : 'Upload Resume'}
           <input type="file" accept=".pdf" className="hidden" onChange={handleMagicParse} />
        </label>
        {isParsing && <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center font-black text-[10px] text-indigo-600 animate-pulse">SYNCING CAREER DATA...</div>}
      </div>

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
          style={displayErr?.includes('username') ? { borderColor: '#ef4444', boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.12)' } : {}}
        />
        {(displayErr?.includes('username') || (displayErr?.includes('required') && !f.username)) && <div className="mt-2 text-[12px] font-bold text-red-600">⚠ {displayErr}</div>}
      </div>

      <div>
        <FieldLabel required>Current Role</FieldLabel>
        <input 
          list="p_list" placeholder="Select or type role..." value={f.designation} onChange={e => set('designation')(e.target.value)}
          className="w-full h-11 px-3.5 rounded-xl text-[13.5px] outline-none transition-all"
          style={{ background: '#fff', border: '1px solid var(--nx-border)', boxShadow: 'var(--nx-shadow-sm)' }}
        />
        <datalist id="p_list">{PROFESSIONS.map(p => <option key={p} value={p} />)}</datalist>
      </div>

      <div>
        <FieldLabel required>Employment Status</FieldLabel>
        <div className="grid grid-cols-3 gap-2">
          {STATUS_LIST.map(opt => (
            <button key={opt.id} onClick={() => set('employmentStatus')(opt.id)} className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${f.employmentStatus === opt.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-transparent bg-gray-50/50 grayscale opacity-60'}`}>
              <opt.Icon className={`w-4 h-4 mb-1.5 ${f.employmentStatus === opt.id ? 'text-indigo-600' : 'text-gray-400'}`} />
              <span className={`text-[10px] font-black uppercase tracking-wider ${f.employmentStatus === opt.id ? 'text-indigo-900' : 'text-gray-400'}`}>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2">
        <div className="flex items-center justify-between mb-3">
          <FieldLabel required>Skills (Min 5)</FieldLabel>
          <span className={`text-[10px] font-black italic ${f.skills.length >= 5 ? 'text-emerald-600' : 'text-amber-600'}`}>{f.skills.length}/5 ADDED</span>
        </div>
        <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/30 min-h-[50px] mb-4">
           {f.skills.map(s => (
             <div key={s} className="px-3 py-1.5 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center gap-1.5 shadow-md shadow-indigo-100">
               {s} <X className="w-3 h-3 cursor-pointer opacity-70" onClick={() => toggleSkill(s)} />
             </div>
           ))}
           {f.skills.length === 0 && <span className="text-[12px] text-gray-300 font-medium p-1">Add expertise below...</span>}
        </div>
        <div className="flex flex-wrap gap-1.5">
           {SKILL_SUGGESTIONS.filter(i => !f.skills.includes(i)).map(s => (
             <button key={s} onClick={() => toggleSkill(s)} className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-[11px] font-bold text-gray-500 hover:border-indigo-600 hover:text-indigo-600 transition-all">+ {s}</button>
           ))}
           <input 
            placeholder="Type skill + Enter..." className="flex-1 min-w-[120px] h-8 bg-transparent outline-none text-[11px] font-bold px-2"
            onKeyDown={e => { if (e.key === 'Enter') { const val = (e.target as any).value.trim(); if(val && !f.skills.includes(val)) toggleSkill(val); (e.target as any).value = '' } }}
           />
        </div>
      </div>

      {displayErr && !displayErr.includes('username') && !displayErr.includes('required') && <div className="pt-2"><ErrorMsg message={displayErr} /></div>}
      <div className="pt-4">
        <PrimaryBtn loading={loading} onClick={submit}>Join the Nexus Hub</PrimaryBtn>
      </div>
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

/* ─── page ─────────────────────────────────────────────────── */
function SignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [role, setRole] = useState<'candidate' | 'recruiter'>('candidate')
  const [step, setStep] = useState<'main' | 'otp' | 'profile'>('main')
  const [email, setEmail] = useState('')
  const [showPolicy, setShowPolicy] = useState<'terms' | 'privacy' | null>(null)

  useEffect(() => {
    const e = searchParams.get('email')
    const r = searchParams.get('role') as any
    if (e) setEmail(e)
    if (r && (r === 'candidate' || r === 'recruiter')) setRole(r)
  }, [searchParams])

  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [isExistingUser, setIsExistingUser] = useState(false)
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
    
    setError(''); setLoading(true)
    try {
      const checkRes = await checkUserEmail(email)
      if (checkRes.exists) {
        setIsExistingUser(true)
        setExistingUserRole(checkRes.role || '')
      } else {
        setIsExistingUser(false)
      }
      const { error: err } = await authClient.emailOtp.sendVerificationOtp({ email, type: 'sign-in' })
      if (err) throw new Error(err.message)
      setOtp(''); setStep('otp'); setCountdown(60)
    } catch (e: any) {
      setError(friendlyError(e))
    } finally {
      setLoading(false)
    }
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
      const { data: sess } = await authClient.getSession()
      // @ts-ignore
      if (sess?.user?.onboarded) {
        router.push('/dashboard')
        return
      }
      setStep('profile')
    } catch (e: unknown) { setError(friendlyError(e)) }
    finally { setLoading(false) }
  }

  const handleProfile = async (data: Record<string, any>) => {
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/users/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update profile info')
      }
      await authClient.getSession() 
      router.push('/dashboard')
    } catch (e: unknown) {
      setError(friendlyError(e))
    } finally {
      setLoading(false)
    }
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
                  <button onClick={() => setShowPolicy('terms')} className="underline underline-offset-2 hover:text-slate-900 transition-colors" style={{ color: 'var(--nx-text-2)' }}>Terms of Service</button>
                  {' '}and{' '}
                  <button onClick={() => setShowPolicy('privacy')} className="underline underline-offset-2 hover:text-slate-900 transition-colors" style={{ color: 'var(--nx-text-2)' }}>Data Privacy Policy</button>.
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
                {!isExistingUser && <ProfileStepBar current={0} />}
                <h1 className="font-bold tracking-[-0.03em] leading-[1.1] mb-2" style={{ fontSize: '1.85rem', color: 'var(--nx-text)' }}>
                  {isExistingUser ? 'Welcome back!' : 'Enter the code'}
                </h1>
                <p className="text-[14px] mb-8 leading-relaxed" style={{ color: 'var(--nx-text-2)' }}>
                  {isExistingUser ? (
                    (() => {
                      const roleMismatch = role !== existingUserRole
                      return roleMismatch ? (
                        <>Hello <span className="font-bold text-indigo-600 capitalize">{existingUserRole}</span>, you are already registered! Looks like you strayed into the <span className="italic">{role}</span> lane, but we&apos;re getting you logged in to your account at <span className="font-semibold" style={{ color: 'var(--nx-text)' }}>{email}</span></>
                      ) : (
                        <>Hello <span className="font-bold text-indigo-600 capitalize">{existingUserRole}</span>, looks like you are already registered. We&apos;ve sent a login code to <span className="font-semibold" style={{ color: 'var(--nx-text)' }}>{email}</span></>
                      )
                    })()
                  ) : (
                    <>Sent to <span className="font-semibold" style={{ color: 'var(--nx-text)' }}>{email}</span></>
                  )}
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
                {role === 'candidate' && <CandidateProfileForm email={email} onSubmit={handleProfile} loading={loading} error={error} />}
                {role === 'recruiter' && (
                  <>
                    {error && <div className="mb-5"><ErrorMsg message={error} /></div>}
                    <RecruiterProfileForm email={email} onSubmit={handleProfile} loading={loading} />
                  </>
                )}
              </>
            )}

          </div>
        </div>
      </div>
      {showPolicy && <PolicyModal type={showPolicy} onClose={() => setShowPolicy(null)} />}
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center font-black text-indigo-600 animate-pulse tracking-widest">LOADING NEXUS...</div>}>
      <SignUpForm />
    </Suspense>
  )
}
