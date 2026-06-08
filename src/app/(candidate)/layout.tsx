// Candidate shell layout
'use client'

import { UserButton, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Zap, Fingerprint, Waypoints, Vault, FolderOpen,
  Crosshair, BrainCircuit, Settings2,
  type LucideIcon,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

type NavItem = {
  href: string
  label: string
  Icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard',       Icon: Zap },
  { href: '/discover',  label: 'Career Identity', Icon: Fingerprint },
  { href: '/paths',     label: 'Path Navigator',  Icon: Waypoints },
  { href: '/profile',   label: 'Skills Vault',    Icon: Vault },
  { href: '/portfolio', label: 'Portfolio',       Icon: FolderOpen },
  { href: '/jobs',      label: 'Job Matches',     Icon: Crosshair },
  { href: '/coach',     label: 'AI Coach',        Icon: BrainCircuit },
]

function Sidebar() {
  const pathname = usePathname()
  const { user } = useUser()
  const displayName = user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ?? '—'

  return (
    <aside className="w-56 shrink-0 flex flex-col border-r border-border bg-sidebar relative overflow-hidden">
      {/* Aurora glows — only show in dark mode */}
      <div className="absolute -top-20 -left-10 w-52 h-52 rounded-full pointer-events-none
        opacity-0 dark:opacity-100 transition-opacity duration-500"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12), transparent 70%)' }} aria-hidden />
      <div className="absolute bottom-10 -right-10 w-44 h-44 rounded-full pointer-events-none
        opacity-0 dark:opacity-100 transition-opacity duration-500"
        style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.1), transparent 70%)' }} aria-hidden />

      {/* Logo */}
      <Link href="/dashboard" className="relative px-5 py-5 border-b border-border flex items-center gap-2.5 group">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600
          flex items-center justify-center text-xs font-bold shadow-lg shadow-violet-500/25
          group-hover:shadow-violet-500/45 transition-all duration-300 text-white">
          C
        </div>
        <div>
          <p className="font-bold text-sm tracking-tight text-foreground leading-none">Career OS</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 tracking-wide">Skills-first hiring</p>
        </div>
      </Link>

      {/* Main nav */}
      <nav className="relative flex-1 px-2.5 py-3 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 group relative ${
                isActive
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-gradient-to-b from-violet-400 to-indigo-500" />
              )}
              <Icon
                size={15}
                className={`shrink-0 transition-all duration-200 ${
                  isActive ? 'text-indigo-400' : 'text-muted-foreground group-hover:text-foreground'
                }`}
                strokeWidth={isActive ? 2 : 1.75}
              />
              <span className={`font-medium text-[13px] ${isActive ? 'text-foreground' : ''}`}>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Settings + theme toggle */}
      <nav className="relative px-2.5 pb-2 border-t border-border pt-2 space-y-0.5">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground
            hover:bg-accent/60 hover:text-foreground transition-all duration-200 group"
        >
          <Settings2 size={15} className="shrink-0 transition-colors" strokeWidth={1.75} />
          <span className="text-[13px]">Settings</span>
        </Link>

        <div className="flex items-center gap-3 px-3 py-1.5">
          <ThemeToggle size="sm" />
          <span className="text-[13px] text-muted-foreground">Theme</span>
        </div>
      </nav>

      {/* User */}
      <div className="relative px-4 py-4 border-t border-border flex items-center gap-3">
        <UserButton />
        <div className="min-w-0">
          <p className="text-xs font-medium truncate text-foreground">{displayName}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Candidate</p>
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
