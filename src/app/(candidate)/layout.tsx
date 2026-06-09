// Candidate shell layout
'use client'

import { UserButton, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Zap, Waypoints, Crosshair, BrainCircuit,
  Vault, FolderOpen, Settings2, ChevronRight,
  type LucideIcon,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

type NavItem = {
  href: string
  label: string
  Icon: LucideIcon
}

// Main nav — Career Identity is now inside Coach
const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard',       Icon: Zap },
  { href: '/coach',     label: 'AI Coach',        Icon: BrainCircuit },
  { href: '/paths',     label: 'Path Navigator',  Icon: Waypoints },
  { href: '/jobs',      label: 'Job Matches',     Icon: Crosshair },
]

// Profile sub-links — appear under the profile header
const PROFILE_ITEMS: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: '/profile?tab=vault',     label: 'Skills Vault', Icon: Vault },
  { href: '/profile?tab=portfolio', label: 'Portfolio',    Icon: FolderOpen },
  { href: '/profile?tab=settings',  label: 'Settings',     Icon: Settings2 },
]

function Sidebar() {
  const pathname = usePathname()
  const { user } = useUser()
  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ?? '—'

  const isProfileActive = pathname === '/profile' || pathname.startsWith('/profile/')

  return (
    <aside className="w-56 shrink-0 flex flex-col border-r border-border bg-sidebar relative overflow-hidden">
      {/* Aurora glows — only show in dark mode */}
      <div className="absolute -top-20 -left-10 w-52 h-52 rounded-full pointer-events-none
        opacity-0 dark:opacity-100 transition-opacity duration-500"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12), transparent 70%)' }} aria-hidden />
      <div className="absolute bottom-10 -right-10 w-44 h-44 rounded-full pointer-events-none
        opacity-0 dark:opacity-100 transition-opacity duration-500"
        style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.1), transparent 70%)' }} aria-hidden />

      {/* ── Profile header (replaces old Career OS logo) ─────────────────── */}
      <div className={`relative px-4 py-4 border-b border-border transition-colors duration-200 ${
        isProfileActive ? 'bg-accent/40' : ''
      }`}>
        <div className="flex items-center gap-3">
          <UserButton />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate text-slate-900 dark:text-white/85 leading-tight">{displayName}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Candidate</p>
          </div>
          <Link
            href="/profile"
            className="shrink-0 p-1 rounded-lg hover:bg-accent/60 transition-colors"
            title="View profile"
          >
            <ChevronRight size={13} className="text-slate-400 dark:text-slate-500" />
          </Link>
        </div>

        {/* Profile sub-items */}
        <div className="mt-2.5 space-y-0.5 pl-0.5">
          {PROFILE_ITEMS.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px]
                text-slate-600 dark:text-slate-400
                hover:bg-accent/60 hover:text-slate-900 dark:hover:text-white/90
                transition-all duration-150 group"
            >
              <Icon size={12} className="shrink-0 text-slate-500 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors" strokeWidth={1.75} />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Main nav ────────────────────────────────────────────────────── */}
      <nav className="relative flex-1 px-2.5 py-3 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 group relative ${
                isActive
                  ? 'bg-accent text-slate-900 dark:text-white/90'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-accent/60 hover:text-slate-900 dark:hover:text-white/90'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-gradient-to-b from-violet-400 to-indigo-500" />
              )}
              <Icon
                size={15}
                className={`shrink-0 transition-all duration-200 ${
                  isActive
                    ? 'text-indigo-500 dark:text-indigo-400'
                    : 'text-slate-500 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                }`}
                strokeWidth={isActive ? 2 : 1.75}
              />
              <span className="font-medium text-[13px]">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* ── Bottom: theme toggle ─────────────────────────────────────────── */}
      <div className="relative px-2.5 pb-3 border-t border-border pt-2">
        <div className="flex items-center gap-3 px-3 py-1.5">
          <ThemeToggle size="sm" />
          <span className="text-[13px] text-slate-600 dark:text-slate-400">Theme</span>
        </div>
      </div>
    </aside>
  )
}

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background text-foreground">
        {children}
      </main>
    </div>
  )
}
