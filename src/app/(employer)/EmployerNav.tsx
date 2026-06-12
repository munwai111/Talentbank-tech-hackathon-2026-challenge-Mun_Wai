'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Zap, ClipboardList, PlusCircle, Users, Workflow, Building2,
  type LucideIcon,
} from 'lucide-react'

const NAV_ITEMS: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: '/employer/dashboard',  label: 'Dashboard',       Icon: Zap },
  { href: '/employer/jobs',       label: 'My Jobs',         Icon: ClipboardList },
  { href: '/employer/jobs/new',   label: 'Post a Job',      Icon: PlusCircle },
  { href: '/employer/candidates', label: 'Talent Pool',     Icon: Users },
  { href: '/employer/culture',    label: 'Culture Profile', Icon: Workflow },
  { href: '/employer/company',    label: 'Company Profile', Icon: Building2 },
]

export function EmployerNav() {
  const pathname = usePathname()

  return (
    <nav className="relative flex-1 px-2.5 py-3 space-y-0.5">
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const isActive = href === '/employer/jobs'
          ? pathname === href
          : pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition duration-200 group relative ${
              isActive
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
            }`}
          >
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-gradient-to-b from-teal-300 to-cyan-500" />
            )}
            <Icon
              size={15}
              className={`shrink-0 transition-colors duration-200 ${
                isActive ? 'text-teal-400' : 'text-muted-foreground group-hover:text-foreground'
              }`}
              strokeWidth={isActive ? 2 : 1.75}
            />
            <span className="font-medium text-[13px]">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
