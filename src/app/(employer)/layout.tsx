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
    <div className="flex min-h-screen bg-zinc-50">
      {/* ── Sidebar ────────────────────────────────────────────── */}
      <aside className="w-56 shrink-0 bg-white border-r flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b">
          <Link href="/employer/dashboard" className="font-bold text-lg tracking-tight">
            Career OS
          </Link>
          <p className="text-xs text-zinc-400 mt-0.5">Employer portal</p>
        </div>

        {/* Nav links */}
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

        {/* User profile at bottom */}
        <div className="px-5 py-4 border-t flex items-center gap-3">
          <UserButton />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {user.firstName ?? user.emailAddresses[0]?.emailAddress}
            </p>
            <p className="text-xs text-zinc-400">Employer</p>
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
