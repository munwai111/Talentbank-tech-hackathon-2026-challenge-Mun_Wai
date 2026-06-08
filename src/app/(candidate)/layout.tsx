// Candidate shell layout — premium dark sidebar
'use client'

import { UserButton, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard',  label: 'Dashboard',       icon: '⚡', color: 'from-amber-500 to-orange-500' },
  { href: '/discover',   label: 'Career Identity', icon: '🧭', color: 'from-violet-500 to-purple-500' },
  { href: '/paths',      label: 'Path Navigator',  icon: '🗺️', color: 'from-sky-500 to-indigo-500' },
  { href: '/profile',    label: 'Skills Vault',    icon: '🗂️', color: 'from-amber-500 to-yellow-500' },
  { href: '/portfolio',  label: 'Portfolio',       icon: '🗃️', color: 'from-teal-500 to-emerald-500' },
  { href: '/jobs',       label: 'Job Matches',     icon: '🎯', color: 'from-rose-500 to-pink-500' },
  { href: '/coach',      label: 'AI Coach',        icon: '🤖', color: 'from-indigo-500 to-blue-500' },
]

function Sidebar() {
  const pathname = usePathname()
  const { user } = useUser()
  const displayName = user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ?? '—'

  return (
    <aside className="w-56 shrink-0 flex flex-col border-r border-white/6 bg-[#08081a] relative overflow-hidden">
      {/* Aurora glows */}
      <div className="absolute -top-20 -left-10 w-52 h-52 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12), transparent 70%)' }} aria-hidden />
      <div className="absolute bottom-10 -right-10 w-44 h-44 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.1), transparent 70%)' }} aria-hidden />

      {/* Logo */}
      <Link href="/dashboard" className="relative px-5 py-5 border-b border-white/6 flex items-center gap-2.5 group">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600
          flex items-center justify-center text-xs font-bold shadow-lg shadow-violet-500/25
          group-hover:shadow-violet-500/45 transition-all duration-300">
          C
        </div>
        <div>
          <p className="font-bold text-sm tracking-tight text-white leading-none">Career OS</p>
          <p className="text-[10px] text-zinc-600 mt-0.5 tracking-wide">Skills-first hiring</p>
        </div>
      </Link>

      {/* Main nav */}
      <nav className="relative flex-1 px-2.5 py-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 group relative ${
                isActive
                  ? 'bg-white/8 text-white'
                  : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-200'
              }`}
            >
              {/* Active left bar */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-gradient-to-b from-violet-400 to-indigo-500" />
              )}
              <span className={`text-base transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                {item.icon}
              </span>
              <span className={`font-medium ${isActive ? 'text-white' : ''}`}>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Settings */}
      <nav className="relative px-2.5 pb-2 border-t border-white/6 pt-2">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-zinc-600
            hover:bg-white/5 hover:text-zinc-300 transition-all duration-200"
        >
          <span>⚙️</span>
          <span>Settings</span>
        </Link>
      </nav>

      {/* User */}
      <div className="relative px-4 py-4 border-t border-white/6 flex items-center gap-3">
        <UserButton />
        <div className="min-w-0">
          <p className="text-xs font-medium truncate text-zinc-300">{displayName}</p>
          <p className="text-[10px] text-zinc-600 mt-0.5">Candidate</p>
        </div>
      </div>
    </aside>
  )
}

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#070714]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-[#070714] text-zinc-100">
        {children}
      </main>
    </div>
  )
}
