// Candidate shell layout — dark aurora sidebar + main content
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

const navItems = [
  { href: '/dashboard',  label: 'Dashboard',       icon: '⚡' },
  { href: '/discover',   label: 'Career Identity', icon: '🧭' },
  { href: '/paths',      label: 'Path Navigator',  icon: '🗺️' },
  { href: '/profile',    label: 'Skills Vault',    icon: '🗂️' },
  { href: '/portfolio',  label: 'Portfolio',       icon: '🗃️' },
  { href: '/jobs',       label: 'Job Matches',     icon: '🎯' },
  { href: '/coach',      label: 'AI Coach',        icon: '🤖' },
]

const bottomNavItems = [
  { href: '/settings', label: 'Settings', icon: '⚙️' },
]

export default async function CandidateLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  return (
    <div className="flex min-h-screen bg-[#070714]">

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="w-56 shrink-0 flex flex-col border-r border-white/7
        bg-[#08081a] relative overflow-hidden">

        {/* Subtle aurora glow behind sidebar */}
        <div className="absolute -top-20 -left-10 w-48 h-48 rounded-full
          bg-[radial-gradient(circle,#7c3aed,transparent_70%)] opacity-10 pointer-events-none" aria-hidden />
        <div className="absolute bottom-20 -right-10 w-40 h-40 rounded-full
          bg-[radial-gradient(circle,#4f46e5,transparent_70%)] opacity-8 pointer-events-none" aria-hidden />

        {/* Logo */}
        <div className="relative px-5 py-5 border-b border-white/7">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600
              flex items-center justify-center text-xs font-bold shadow-lg shadow-violet-500/30
              group-hover:shadow-violet-500/50 transition-all">
              C
            </div>
            <div>
              <p className="font-bold text-base tracking-tight text-white leading-none">Career OS</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Skills-first hiring</p>
            </div>
          </Link>
        </div>

        {/* Main nav links */}
        <nav className="relative flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400
                hover:bg-white/6 hover:text-white transition-colors group"
            >
              <span className="text-base group-hover:scale-110 transition-transform">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Bottom nav */}
        <nav className="relative px-3 pb-2 border-t border-white/7 pt-2">
          {bottomNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-600
                hover:bg-white/6 hover:text-zinc-300 transition-colors"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User profile */}
        <div className="relative px-4 py-4 border-t border-white/7 flex items-center gap-3">
          <UserButton />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate text-zinc-200">
              {user.firstName ?? user.emailAddresses[0]?.emailAddress}
            </p>
            <p className="text-xs text-zinc-500">Candidate</p>
          </div>
        </div>
      </aside>

      {/* ── Main content area ─────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto bg-[#070714] text-zinc-100">
        {children}
      </main>
    </div>
  )
}
