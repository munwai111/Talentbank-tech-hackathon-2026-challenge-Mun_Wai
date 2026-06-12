'use client'

// Dashboard left rail — the candidate's identity card and personal menu.
// Hero avatar animates in on every visit; "My Profile" expands into the
// profile sections; below the divider live the platform destinations.

import { useState } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import {
  FileText, Briefcase, GraduationCap, FolderOpen, Award, Vault,
  Sparkles, Info, ChevronDown, Store, Newspaper, CalendarDays, Settings2,
  type LucideIcon,
} from 'lucide-react'

const PROFILE_SECTIONS: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: '/discover',            label: 'Bio',                    Icon: FileText },
  { href: '/profile?tab=vault',   label: 'Experience',             Icon: Briefcase },
  { href: '/profile?tab=vault',   label: 'Education',              Icon: GraduationCap },
  { href: '/portfolio',           label: 'Projects',               Icon: FolderOpen },
  { href: '/portfolio',           label: 'Awards & Certifications', Icon: Award },
  { href: '/profile?tab=vault',   label: 'Skills Vault',           Icon: Vault },
]

function ExpandableItem({ label, Icon, children }: {
  label: string
  Icon: LucideIcon
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium
          text-zinc-300 hover:bg-white/6 hover:text-white transition-colors duration-150"
      >
        <Icon size={15} strokeWidth={1.75} className="text-zinc-500" />
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown size={13} className={`text-zinc-600 transition-transform duration-200 ease-snap ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`grid transition-[grid-template-rows] duration-250 ease-snap ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="pl-7 pb-1 space-y-0.5">{children}</div>
        </div>
      </div>
    </div>
  )
}

function SubLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href}
      className="block px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/6 transition-colors duration-150">
      {label}
    </Link>
  )
}

export function ProfileRail() {
  const { user } = useUser()
  const [profileOpen, setProfileOpen] = useState(false)
  const [tipOpen, setTipOpen] = useState(false)

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ?? '—'

  return (
    <aside className="w-60 shrink-0 hidden lg:block">
      <div className="surface overflow-hidden sticky top-[72px]">

        {/* ── Hero identity ─────────────────────────────────────────────── */}
        <div className="px-4 pt-6 pb-4 text-center map-grid border-b border-white/6">
          <div className="animate-scale-in inline-block">
            {user?.imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={user.imageUrl}
                alt={displayName}
                className="w-20 h-20 rounded-full mx-auto object-cover
                  ring-2 ring-indigo-400/40 ring-offset-4 ring-offset-[#0a0a1a]"
              />
            ) : (
              <div className="w-20 h-20 rounded-full mx-auto bg-indigo-500/15 border border-indigo-400/30
                flex items-center justify-center text-2xl font-bold text-indigo-300">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <p className="mt-3 font-semibold text-[15px] text-white animate-fade-up animate-delay-1">{displayName}</p>

          {/* My Profile — bulge + glow on hover, expands sections on click */}
          <button
            onClick={() => setProfileOpen(o => !o)}
            className="mt-1.5 px-4 py-1 rounded-full text-xs font-medium text-indigo-300
              border border-transparent transition-all duration-200 ease-snap
              hover:scale-105 hover:border-indigo-400/50 hover:shadow-[0_0_14px_rgba(129,140,248,0.35)]
              animate-fade-up animate-delay-2"
          >
            My Profile
            <ChevronDown size={11} className={`inline ml-1 -mt-px transition-transform duration-200 ease-snap ${profileOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* ── Profile sections (dropdown) ──────────────────────────────── */}
        <div className={`grid transition-[grid-template-rows] duration-300 ease-snap ${profileOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <div className="overflow-hidden">
            <div className="px-2 py-2 space-y-0.5 border-b border-white/6">
              {PROFILE_SECTIONS.map(({ href, label, Icon }) => (
                <Link key={label} href={href}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs
                    text-zinc-400 hover:text-white hover:bg-white/6 transition-colors duration-150">
                  <Icon size={13} strokeWidth={1.75} className="text-zinc-500" />
                  {label}
                </Link>
              ))}

              {/* AI Profiling — the special one */}
              <div className="relative flex items-center gap-1.5 pt-1">
                <Link href="/discover"
                  className="flex-1 flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold
                    text-white bg-gradient-to-r from-violet-600/80 to-indigo-600/80
                    hover:from-violet-500/90 hover:to-indigo-500/90
                    border border-indigo-400/30 transition-colors duration-200">
                  <Sparkles size={13} strokeWidth={2} />
                  AI Profiling
                </Link>
                <button
                  aria-label="What is AI Profiling?"
                  onMouseEnter={() => setTipOpen(true)}
                  onMouseLeave={() => setTipOpen(false)}
                  onFocus={() => setTipOpen(true)}
                  onBlur={() => setTipOpen(false)}
                  className="p-1 rounded-full text-zinc-500 hover:text-indigo-300 transition-colors"
                >
                  <Info size={13} strokeWidth={1.75} />
                </button>
                {tipOpen && (
                  <div className="absolute left-2 right-2 bottom-full mb-2 z-20 p-3 rounded-xl
                    bg-[#11112a] border border-indigo-400/25 shadow-xl shadow-black/50
                    text-[11px] leading-relaxed text-zinc-300 animate-scale-in">
                    <p className="font-semibold text-indigo-300 mb-1">AI Profiling</p>
                    Lets the AI agent read through and understand your entire persona —
                    professional and personal traits, built experience, goals, and life
                    context — to give every tool on the platform real depth about you.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Platform destinations ────────────────────────────────────── */}
        <div className="px-2 py-2 space-y-0.5">
          <Link href="/jobs"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium
              text-zinc-300 hover:bg-white/6 hover:text-white transition-colors duration-150">
            <Store size={15} strokeWidth={1.75} className="text-zinc-500" />
            Job Marketplace
          </Link>

          <ExpandableItem label="News" Icon={Newspaper}>
            <SubLink href="/news" label="Following" />
            <SubLink href="/news?tab=saved" label="Saved" />
          </ExpandableItem>

          <ExpandableItem label="My Events" Icon={CalendarDays}>
            <SubLink href="/events" label="Discover events" />
            <SubLink href="/events?tab=tickets" label="My Tickets" />
            <SubLink href="/events?tab=host" label="Host an event" />
          </ExpandableItem>

          <Link href="/settings"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium
              text-zinc-300 hover:bg-white/6 hover:text-white transition-colors duration-150">
            <Settings2 size={15} strokeWidth={1.75} className="text-zinc-500" />
            Settings
          </Link>
        </div>
      </div>
    </aside>
  )
}
