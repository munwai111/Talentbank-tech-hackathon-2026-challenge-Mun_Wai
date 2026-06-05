// Candidate shell layout — wraps every page under (candidate)/
// The sidebar renders once here; individual pages render in {children}
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
  // Server-side auth check — redirect if not logged in
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {/* ── Sidebar ────────────────────────────────────────────── */}
      <aside className="w-56 shrink-0 bg-white border-r flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b">
          <Link href="/dashboard" className="font-bold text-lg tracking-tight">
            Career OS
          </Link>
          <p className="text-xs text-zinc-400 mt-0.5">Skills-first hiring</p>
        </div>

        {/* Main nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-600
                         hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Bottom utility nav (Settings etc.) */}
        <nav className="px-3 pb-2 border-t pt-2">
          {bottomNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400
                         hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User profile at bottom */}
        <div className="px-5 py-4 border-t flex items-center gap-3">
          <UserButton />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {user.firstName ?? user.emailAddresses[0]?.emailAddress}
            </p>
            <p className="text-xs text-zinc-400">Candidate</p>
          </div>
        </div>
      </aside>

      {/* ── Main content area ─────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
