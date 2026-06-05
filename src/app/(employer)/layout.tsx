// Employer shell layout — wraps every page under /employer/*
// Mirrors the candidate layout pattern but with employer-specific nav.
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

const navItems = [
  { href: '/employer/dashboard',  label: 'Dashboard',       icon: '⚡' },
  { href: '/employer/jobs',       label: 'My Jobs',         icon: '📋' },
  { href: '/employer/jobs/new',   label: 'Post a Job',      icon: '➕' },
  { href: '/employer/candidates', label: 'Talent Pool',     icon: '🎯' },
  { href: '/employer/culture',    label: 'Culture Profile', icon: '🌱' },
  { href: '/employer/company',    label: 'Company Profile', icon: '🏢' },
]

export default async function EmployerLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  // Verify this user is actually an employer — redirect if not
  const supabase = createServerClient()
  const { data: dbUser } = await supabase
    .from('users').select('role').eq('clerk_id', user.id).single()

  if (!dbUser) redirect('/onboarding')
  if (dbUser.role !== 'employer') redirect('/dashboard')

  return (
    <div className="flex min-h-screen bg-[#070714]">
      {/* ── Sidebar ────────────────────────────────────────────── */}
      <aside className="w-56 shrink-0 bg-[#08081a] border-r border-white/7 flex flex-col relative overflow-hidden">
        {/* Aurora glow orbs */}
        <div className="absolute -top-20 -left-10 w-48 h-48 rounded-full bg-[radial-gradient(circle,#7c3aed,transparent_70%)] opacity-10 pointer-events-none" aria-hidden />

        {/* Logo */}
        <div className="relative px-5 py-5 border-b border-white/7">
          <Link href="/employer/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600
              flex items-center justify-center text-xs font-bold shadow-lg shadow-violet-500/30
              group-hover:shadow-violet-500/50 transition-all text-white">
              C
            </div>
            <div>
              <p className="font-bold text-base tracking-tight text-white leading-none">Career OS</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Employer portal</p>
            </div>
          </Link>
        </div>

        {/* Nav links */}
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

        {/* User profile at bottom */}
        <div className="relative px-4 py-4 border-t border-white/7 flex items-center gap-3">
          <UserButton />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate text-zinc-200">
              {user.firstName ?? user.emailAddresses[0]?.emailAddress}
            </p>
            <p className="text-xs text-zinc-500">Employer</p>
          </div>
        </div>
      </aside>

      {/* ── Main content area ─────────────────────────────────── */}
      <main className="flex-1 overflow-auto bg-[#070714] text-zinc-100">
        {children}
      </main>
    </div>
  )
}
