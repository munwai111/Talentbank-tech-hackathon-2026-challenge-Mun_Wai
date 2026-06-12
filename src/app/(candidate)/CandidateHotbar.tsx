'use client'

// Top hotbar — candidate navigation (replaces the left sidebar).
// LinkedIn-pattern: brand left, icon-over-label nav center, identity right.

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import {
  Zap, BrainCircuit, Waypoints, Crosshair, ClipboardList,
  Newspaper, CalendarDays,
  type LucideIcon,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const NAV_ITEMS: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: '/dashboard',    label: 'Home',         Icon: Zap },
  { href: '/coach',        label: 'AI Coach',     Icon: BrainCircuit },
  { href: '/paths',        label: 'Navigator',    Icon: Waypoints },
  { href: '/jobs',         label: 'Jobs',         Icon: Crosshair },
  { href: '/applications', label: 'Applications', Icon: ClipboardList },
  { href: '/news',         label: 'News',         Icon: Newspaper },
  { href: '/events',       label: 'Events',       Icon: CalendarDays },
]

function Brandmark() {
  return (
    <span className="relative inline-flex items-center justify-center w-7 h-7 rounded-full border border-indigo-400/40" aria-hidden>
      <span className="absolute inset-[27%] rounded-full bg-indigo-400" />
    </span>
  )
}

export function CandidateHotbar() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-sidebar/90 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 flex items-center gap-2 h-14">

        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-2.5 pr-3 shrink-0">
          <Brandmark />
          <span className="font-bold text-[15px] tracking-tight text-foreground hidden md:inline">Career OS</span>
        </Link>

        {/* Nav — icon over label, active gets journey accent + underline */}
        <nav className="flex items-stretch flex-1 justify-center gap-1">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex flex-col items-center justify-center gap-0.5 px-3 min-w-[64px]
                  text-[11px] transition-colors duration-150 group ${
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2 : 1.6}
                  className={`transition-colors duration-150 ${
                    isActive ? 'text-indigo-400' : 'text-muted-foreground group-hover:text-foreground'
                  }`}
                />
                <span className="font-medium leading-none">{label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-t-full bg-gradient-to-r from-violet-400 to-indigo-500" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Identity */}
        <div className="flex items-center gap-3 pl-3 shrink-0 border-l border-border">
          <ThemeToggle size="sm" />
          <UserButton />
        </div>
      </div>
    </header>
  )
}
