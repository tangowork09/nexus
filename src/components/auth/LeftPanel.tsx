export function LeftPanel() {
  return (
    <div
      className="hidden lg:flex flex-col justify-between w-[42%] relative overflow-hidden p-12 shrink-0"
      style={{ background: 'linear-gradient(150deg, #2d2fa8 0%, #4648d4 55%, #6063ee 100%)' }}
    >
      {/* Subtle grid texture */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.07]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="nx-grid" width="44" height="44" patternUnits="userSpaceOnUse">
            <path d="M 44 0 L 0 0 0 44" fill="none" stroke="white" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#nx-grid)" />
      </svg>

      {/* Glow orbs */}
      <div
        className="absolute -top-24 -right-24 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.13) 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-24 -left-20 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)' }}
      />

      {/* Logo */}
      <div className="relative z-10">
        <span className="text-white text-2xl font-bold tracking-[0.06em]">NEXUS</span>
      </div>

      {/* Hero copy */}
      <div className="relative z-10">
        <p
          className="text-white/50 mb-5"
          style={{ fontSize: '0.6875rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}
        >
          Say goodbye to traditional hiring
        </p>
        <h2
          className="text-white font-semibold leading-[1.18] mb-7"
          style={{ fontSize: '2.1rem', letterSpacing: '-0.03em' }}
        >
          The broken loop,
          <br />
          <span className="text-white/75">finally fixed.</span>
        </h2>

        {/* Problem cards */}
        <div className="flex flex-col gap-3 mb-6">
          {[
            {
              persona: 'Candidate',
              problem: 'Spends hours tailoring resumes that get ignored in seconds.',
            },
            {
              persona: 'Recruiter',
              problem: 'Drowns in applications with no reliable way to filter signal from noise.',
            },
            {
              persona: 'Client',
              problem: 'Hires on paper credentials and discovers the truth on day one.',
            },
          ].map(({ persona, problem }) => (
            <div
              key={persona}
              className="rounded-xl px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              <p
                className="text-white/50 mb-0.5"
                style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase' }}
              >
                {persona}
              </p>
              <p className="text-white/80 text-xs leading-relaxed">{problem}</p>
            </div>
          ))}
        </div>

        <p className="text-white/60 text-sm leading-relaxed max-w-[280px]">
          Nexus replaces the resume loop with live, verifiable performance — one platform that works for everyone.
        </p>
      </div>

      {/* Stats row */}
      <div className="relative z-10 flex gap-8 border-t border-white/10 pt-8">
        {[
          { value: '12k+', label: 'Verified candidates' },
          { value: '98%', label: 'Hire accuracy' },
          { value: '3×', label: 'Faster hiring' },
        ].map((s) => (
          <div key={s.label}>
            <p className="text-white text-xl font-bold" style={{ letterSpacing: '-0.02em' }}>
              {s.value}
            </p>
            <p className="text-white/50 mt-0.5" style={{ fontSize: '0.6875rem' }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
