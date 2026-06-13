'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import {
  Store, Newspaper, CalendarDays, Settings2,
  ChevronDown, Globe, FileText, ExternalLink,
  Plus, type LucideIcon,
} from 'lucide-react'
import { GithubIcon, LinkedinIcon, FacebookIcon, InstagramIcon, TiktokIcon } from '@/components/ui/BrandIcons'
import type { CandidateProfile } from '@/types/database'
import { toExternalHref } from '@/lib/url'

// ── Linked-account banners ────────────────────────────────────────────────────

type IconComp = React.ComponentType<{ size?: number; className?: string }>

type AccountDef = {
  key: keyof CandidateProfile
  icon: IconComp
  label: string
  color: string
  activeColor: string
}

const ACCOUNT_DEFS: AccountDef[] = [
  { key: 'github_url',          icon: GithubIcon,   label: 'GitHub',    color: 'border-white/8 text-zinc-600',          activeColor: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/8' },
  { key: 'linkedin_url',        icon: LinkedinIcon, label: 'LinkedIn',  color: 'border-white/8 text-zinc-600',          activeColor: 'border-sky-500/30 text-sky-400 bg-sky-500/8' },
  { key: 'resume_url',          icon: FileText,     label: 'Resume',    color: 'border-white/8 text-zinc-600',          activeColor: 'border-amber-500/30 text-amber-400 bg-amber-500/8' },
  { key: 'personal_website_url',icon: Globe,        label: 'Website',   color: 'border-white/8 text-zinc-600',          activeColor: 'border-violet-500/30 text-violet-400 bg-violet-500/8' },
  { key: 'seek_url',            icon: ExternalLink, label: 'Seek',      color: 'border-white/8 text-zinc-600',          activeColor: 'border-orange-500/30 text-orange-400 bg-orange-500/8' },
  { key: 'indeed_url',          icon: ExternalLink, label: 'Indeed',    color: 'border-white/8 text-zinc-600',          activeColor: 'border-blue-500/30 text-blue-400 bg-blue-500/8' },
  { key: 'instagram_url',       icon: InstagramIcon,label: 'Instagram', color: 'border-white/8 text-zinc-600',          activeColor: 'border-pink-500/30 text-pink-400 bg-pink-500/8' },
  { key: 'tiktok_url',          icon: TiktokIcon,   label: 'TikTok',    color: 'border-white/8 text-zinc-600',          activeColor: 'border-zinc-400/30 text-zinc-200 bg-zinc-500/8' },
  { key: 'facebook_url',        icon: FacebookIcon, label: 'Facebook',  color: 'border-white/8 text-zinc-600',          activeColor: 'border-blue-600/30 text-blue-400 bg-blue-600/8' },
]

function LinkedAccountBanners({ profile }: { profile: CandidateProfile | null }) {
  if (!profile) {
    return (
      <div className="px-3 py-2 border-b border-white/6">
        <Link href="/profile?mode=edit"
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-white/10 text-[11px] text-zinc-600 hover:text-zinc-400 hover:border-white/20 transition-colors">
          <Plus size={11} />Add resume & links
        </Link>
      </div>
    )
  }

  const connected = ACCOUNT_DEFS.filter(a => !!profile[a.key])
  const unconnected = ACCOUNT_DEFS.filter(a => !profile[a.key])

  return (
    <div className="px-3 py-2.5 border-b border-white/6 space-y-1.5">
      {/* Connected accounts */}
      {connected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {connected.map(({ key, icon: Icon, label, activeColor }) => {
            const href = toExternalHref(profile[key] as string)
            if (!href) return null
            return (
              <a key={key} href={href} target="_blank" rel="noopener noreferrer"
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium border transition-all hover:scale-105 ${activeColor}`}>
                <Icon size={9} />{label}
              </a>
            )
          })}
        </div>
      )}

      {/* Unconnected nudge */}
      {unconnected.length > 0 && (
        <Link href="/profile?mode=edit"
          className="w-full flex items-center justify-center gap-1.5 py-1 rounded-lg border border-dashed border-white/8
            text-[10px] text-zinc-700 hover:text-zinc-500 hover:border-white/15 transition-colors">
          <Plus size={10} />
          {connected.length === 0 ? 'Add resume & links' : `+${unconnected.length} more to connect`}
        </Link>
      )}
    </div>
  )
}

// ── Expandable nav item ───────────────────────────────────────────────────────

function ExpandableItem({ label, Icon, children }: { label: string; Icon: LucideIcon; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium
          text-zinc-300 hover:bg-white/6 hover:text-white transition-colors duration-150">
        <Icon size={15} strokeWidth={1.75} className="text-zinc-500" />
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown size={13} className={`text-zinc-600 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`grid transition-[grid-template-rows] duration-250 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
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

// ── Main component ────────────────────────────────────────────────────────────

export function ProfileRail() {
  const { user } = useUser()
  const [profile, setProfile] = useState<CandidateProfile | null>(null)

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ?? '—'

  useEffect(() => {
    fetch('/api/candidate/profile')
      .then(r => r.ok ? r.json() : null)
      .then((data: { profile: CandidateProfile } | null) => { if (data?.profile) setProfile(data.profile) })
      .catch(() => { /* silently fail */ })
  }, [])

  return (
    <aside className="w-60 shrink-0 hidden lg:block">
      <div className="surface overflow-hidden sticky top-[72px]">

        {/* Hero identity */}
        <div className="px-4 pt-6 pb-4 text-center map-grid border-b border-white/6">
          <div className="animate-scale-in inline-block">
            {user?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.imageUrl} alt={displayName}
                className="w-20 h-20 rounded-full mx-auto object-cover ring-2 ring-indigo-400/40 ring-offset-4 ring-offset-[#0a0a1a]" />
            ) : (
              <div className="w-20 h-20 rounded-full mx-auto bg-indigo-500/15 border border-indigo-400/30
                flex items-center justify-center text-2xl font-bold text-indigo-300">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <p className="mt-3 font-semibold text-[15px] text-white animate-fade-up animate-delay-1">{displayName}</p>

          {/* My Profile — navigates to profile page */}
          <Link href="/profile"
            className="mt-1.5 inline-flex items-center gap-1 px-4 py-1 rounded-full text-xs font-medium text-indigo-300
              border border-transparent transition-all duration-200 hover:scale-105
              hover:border-indigo-400/50 hover:shadow-[0_0_14px_rgba(129,140,248,0.35)]
              animate-fade-up animate-delay-2">
            My Profile
          </Link>
        </div>

        {/* Linked account banners */}
        <LinkedAccountBanners profile={profile} />

        {/* Platform destinations */}
        <div className="px-2 py-2 space-y-0.5">
          <Link href="/jobs"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium
              text-zinc-300 hover:bg-white/6 hover:text-white transition-colors duration-150">
            <Store size={15} strokeWidth={1.75} className="text-zinc-500" />Job Marketplace
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
            <Settings2 size={15} strokeWidth={1.75} className="text-zinc-500" />Settings
          </Link>
        </div>
      </div>
    </aside>
  )
}
