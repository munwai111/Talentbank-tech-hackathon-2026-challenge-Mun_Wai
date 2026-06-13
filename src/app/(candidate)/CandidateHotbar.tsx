'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import {
  Zap, Waypoints, Crosshair, ClipboardList,
  Newspaper, CalendarDays,
  type LucideIcon,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { TranslationKey } from '@/lib/i18n/translations'

const NAV_ITEMS: { href: string; key: TranslationKey; Icon: LucideIcon }[] = [
  { href: '/dashboard',    key: 'nav.home',         Icon: Zap },
  { href: '/paths',        key: 'nav.navigator',    Icon: Waypoints },
  { href: '/jobs',         key: 'nav.jobs',         Icon: Crosshair },
  { href: '/applications', key: 'nav.applications', Icon: ClipboardList },
  { href: '/news',         key: 'nav.news',         Icon: Newspaper },
  { href: '/events',       key: 'nav.events',       Icon: CalendarDays },
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
  const { t } = useLanguage()

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
          {NAV_ITEMS.map(({ href, key, Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                aria-label={t(key)}
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
                <span className="font-medium leading-none">{t(key)}</span>
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
