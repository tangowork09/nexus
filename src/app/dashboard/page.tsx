'use client'

import { useSession, authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isPending && !session) {
        router.push('/sign-in')
    }
  }, [session, isPending, router])

  if (isPending) return <div className="p-12 text-center text-gray-500">Authenticating...</div>
  if (!session) return null

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Console</h1>
          <p className="text-gray-400 mt-1 font-medium">Manage your progress and tasks.</p>
        </div>
        <button 
          onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => router.push('/sign-in') } })}
          className="h-10 px-5 rounded-xl border border-gray-200 font-bold text-[13px] hover:bg-gray-50 transition-all"
        >
          Sign out
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="p-10 rounded-[40px] bg-indigo-600 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
             <div className="relative z-10">
                <p className="text-indigo-100 font-bold uppercase tracking-widest text-[11px] mb-3">Today&apos;s Goal</p>
                <h2 className="text-3xl font-black mb-6">Complete 3 mini-tasks to keep your streak!</h2>
                <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                   <div className="h-full bg-white/60 w-[30%]" />
                </div>
             </div>
             <div className="absolute right-[-20px] top-[-20px] w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          </div>

          <div className="grid grid-cols-2 gap-6">
             <div className="p-8 rounded-[32px] border border-gray-100 bg-white shadow-sm flex flex-col justify-between h-[180px]">
                <p className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Total XP</p>
                <h3 className="text-5xl font-black text-indigo-600">0</h3>
             </div>
             <div className="p-8 rounded-[32px] border border-gray-100 bg-white shadow-sm flex flex-col justify-between h-[180px]">
                <p className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Global Rank</p>
                <h3 className="text-5xl font-black text-indigo-600">#--</h3>
             </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="p-8 rounded-[32px] border border-gray-100 bg-white shadow-sm">
              <h4 className="font-bold text-[15px] mb-4">Current Focus</h4>
              {/* @ts-ignore */}
              <p className="text-sm font-medium text-gray-500 mb-6">{session.user.designation || 'Onboarding Complete'}</p>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-indigo-50 border border-indigo-100/50">
                 <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-[12px] font-bold">L1</div>
                 <div>
                    <p className="text-[11px] font-bold text-indigo-600 tracking-wide uppercase">Tango Level</p>
                    <p className="text-[13px] font-bold">Newbie</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
