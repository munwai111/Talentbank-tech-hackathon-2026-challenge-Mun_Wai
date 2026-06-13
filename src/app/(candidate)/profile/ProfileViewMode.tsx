'use client'

import { useEffect, useState } from 'react'
import {
  MapPin, Globe, FileText, ExternalLink,
  Briefcase, GraduationCap, FolderOpen, Award, Layers,
  Building2, Calendar, Star, Sparkles,
} from 'lucide-react'
import { GithubIcon, LinkedinIcon, FacebookIcon, InstagramIcon, TiktokIcon } from '@/components/ui/BrandIcons'
import { AnimatedHeading } from '@/components/animations/AnimatedHeading'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import type { CandidateProfile, Skill, PortfolioItem, WorkExperienceEntry, EducationEntry, PersonaAnalysis } from '@/types/database'
import { toExternalHref } from '@/lib/url'
import { SkillsVault } from './SkillsVault'

type FullProfile = CandidateProfile & { skills: Skill[]; portfolio_items: PortfolioItem[] }
type AwardEntry = { title: string; issuer?: string; date?: string | null; description?: string | null; url?: string | null }

// ── Utilities ─────────────────────────────────────────────────────────────────

function calcYearsExp(work: WorkExperienceEntry[]): number {
  const earliest = work.reduce((min, job) => {
    const year = job.start_date ? parseInt(job.start_date.substring(0, 4)) : NaN
    return isNaN(year) ? min : Math.min(min, year)
  }, Infinity)
  return isFinite(earliest) ? new Date().getFullYear() - earliest : 0
}

// ── Chapter header — editorial section titles ─────────────────────────────────

function ChapterHeader({ num, label, icon: Icon }: { num: string; label: string; icon: React.ElementType }) {
  return (
    <div className="mb-8">
      <span className="text-[10px] font-bold tracking-[0.35em] text-muted-foreground/35 uppercase block mb-3">{num}</span>
      <div className="flex items-center gap-3">
        <Icon size={18} className="text-indigo-500 dark:text-indigo-400 shrink-0" strokeWidth={1.5} />
        <h2 className="font-display text-2xl font-bold text-foreground tracking-tight">{label}</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-border via-border/40 to-transparent" />
      </div>
    </div>
  )
}

// ── Linked account chip ────────────────────────────────────────────────────────

function LinkedChip({ href, icon: Icon, label, color }: {
  href: string; icon: React.ComponentType<{ size?: number; className?: string }>; label: string; color: string
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 hover:scale-105 active:scale-95 ${color}`}>
      <Icon size={12} />{label}
      <ExternalLink size={10} className="opacity-50" />
    </a>
  )
}

// ── Profile hero ──────────────────────────────────────────────────────────────

function HeroLinks({ profile }: { profile: FullProfile }) {
  type LinkEntry = { href: string; icon: React.ComponentType<{ size?: number; className?: string }>; label: string; color: string }
  const defs = [
    profile.github_url && { href: toExternalHref(profile.github_url)!, icon: GithubIcon, label: 'GitHub', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' },
    profile.linkedin_url && { href: toExternalHref(profile.linkedin_url)!, icon: LinkedinIcon, label: 'LinkedIn', color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 hover:bg-sky-500/20' },
    profile.personal_website_url && { href: toExternalHref(profile.personal_website_url)!, icon: Globe, label: 'Website', color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 hover:bg-violet-500/20' },
    profile.resume_url && { href: toExternalHref(profile.resume_url)!, icon: FileText, label: 'Resume', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20' },
    profile.seek_url && { href: toExternalHref(profile.seek_url)!, icon: ExternalLink, label: 'Seek', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/20' },
    profile.indeed_url && { href: toExternalHref(profile.indeed_url)!, icon: ExternalLink, label: 'Indeed', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20' },
    profile.instagram_url && { href: toExternalHref(profile.instagram_url)!, icon: InstagramIcon, label: 'Instagram', color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20 hover:bg-pink-500/20' },
    profile.tiktok_url && { href: toExternalHref(profile.tiktok_url)!, icon: TiktokIcon, label: 'TikTok', color: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-200 border-zinc-400/20 hover:bg-zinc-500/20' },
    profile.facebook_url && { href: toExternalHref(profile.facebook_url)!, icon: FacebookIcon, label: 'Facebook', color: 'bg-blue-600/10 text-blue-700 dark:text-blue-400 border-blue-600/20 hover:bg-blue-600/20' },
  ]
  const links = defs.filter(Boolean) as LinkEntry[]
  if (!links.length) return null
  return <div className="flex flex-wrap gap-2">{links.map(l => <LinkedChip key={l.label} {...l} />)}</div>
}

function ProfileHero({ profile, avatarUrl, clerkName, work }: {
  profile: FullProfile; avatarUrl: string | null; clerkName: string; work: WorkExperienceEntry[]
}) {
  const displayName = profile.first_name
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ')
    : profile.name || clerkName
  const locationParts = [profile.city, profile.state_region, profile.country_name].filter(Boolean)
  const locationStr = locationParts.length ? locationParts.join(', ') : profile.location
  const yearsExp = calcYearsExp(work)
  const availLabel: Record<string, string> = { immediate: 'Available now', one_month: '1-month notice', three_months: '3-month notice' }

  return (
    <div className="relative mb-16 pb-14 border-b border-border">
      {/* Hero gradient wash */}
      <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-indigo-500/8 via-indigo-500/3 to-transparent pointer-events-none" />

      <div className="relative pt-10 animate-fade-up">
        {/* Avatar + name */}
        <div className="flex items-start gap-6 mb-7">
          <div className="relative shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={displayName}
                className="w-28 h-28 rounded-3xl object-cover ring-1 ring-border shadow-xl" />
            ) : (
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-violet-500/10
                border border-indigo-400/20 flex items-center justify-center">
                <span className="font-display text-4xl font-bold text-indigo-400/80">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {profile.availability === 'immediate' && (
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-30" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-background" />
              </span>
            )}
          </div>

          <div className="pt-1 flex-1 min-w-0">
            <AnimatedHeading as="h1"
              className="font-display text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-tight mb-2"
              delay={0.05} stagger={0.04} scrollTrigger={false}>
              {displayName}
            </AnimatedHeading>
            {profile.headline && (
              <p className="text-base text-muted-foreground leading-snug max-w-lg animate-delay-2">{profile.headline}</p>
            )}
          </div>
        </div>

        {/* Meta + stats */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-6 animate-delay-3">
          {locationStr && (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin size={13} className="text-indigo-500/70 dark:text-indigo-400/70" />{locationStr}
            </span>
          )}
          {profile.availability && profile.availability !== 'not_looking' && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {availLabel[profile.availability] ?? ''}
            </span>
          )}
          <div className="ml-auto flex items-center gap-6">
            {profile.skills.length > 0 && <HeroStat value={profile.skills.length} label="skills" />}
            {work.length > 0 && <HeroStat value={work.length} label="roles" />}
            {yearsExp > 0 && <HeroStat value={`${yearsExp}+`} label="yrs exp" />}
          </div>
        </div>

        <div className="animate-delay-4">
          <HeroLinks profile={profile} />
        </div>
      </div>
    </div>
  )
}

function HeroStat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-2xl font-bold text-foreground leading-none">{value}</div>
      <div className="text-[10px] text-muted-foreground/60 mt-0.5 uppercase tracking-wider">{label}</div>
    </div>
  )
}

// ── About ─────────────────────────────────────────────────────────────────────

function AboutSection({ profile, num }: { profile: FullProfile; num: string }) {
  const text = profile.career_data?.career_identity_summary || profile.bio
  if (!text) return null
  return (
    <>
      <ChapterHeader num={num} label="About" icon={Star} />
      <p className="text-base text-foreground/80 leading-relaxed whitespace-pre-line">{text}</p>
    </>
  )
}

// ── Persona ───────────────────────────────────────────────────────────────────

function PersonaMiniBar({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <span className="text-[11px] text-muted-foreground/60 tabular-nums">{score}</span>
      </div>
      <div className="h-1 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
      </div>
    </div>
  )
}

function PersonaSpectrum({ left, right, position }: { left: string; right: string; position: number }) {
  const pos = Math.min(100, Math.max(0, position))
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] text-muted-foreground/60 w-24 shrink-0 text-right truncate">{left}</span>
      <div className="flex-1 relative h-px bg-border">
        <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-indigo-400 ring-2 ring-background shadow-sm"
          style={{ left: `calc(${pos}% - 5px)` }} />
      </div>
      <span className="text-[10px] text-muted-foreground/60 w-24 shrink-0 truncate">{right}</span>
    </div>
  )
}

function PersonaWorkplace({ wb }: { wb: NonNullable<PersonaAnalysis['workplace_behaviour']> }) {
  return (
    <div className="space-y-5 border-t border-border pt-5">
      {wb.spectrums?.length > 0 && (
        <div>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground/50 mb-3">Behavioural spectrums</p>
          <div className="space-y-3">
            {wb.spectrums.slice(0, 8).map(s => <PersonaSpectrum key={s.name} left={s.left} right={s.right} position={s.position} />)}
          </div>
        </div>
      )}
      {wb.working_with_guide?.length > 0 && (
        <div>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground/50 mb-3">How to work with them</p>
          <ul className="space-y-1.5">
            {wb.working_with_guide.map((g, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500 shrink-0" />{g}
              </li>
            ))}
          </ul>
        </div>
      )}
      {wb.watch_outs?.length > 0 && (
        <div>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground/50 mb-3">Watch-outs</p>
          <ul className="space-y-1.5">
            {wb.watch_outs.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-500 shrink-0" />{w}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function PersonaSection({ persona, num }: { persona: PersonaAnalysis; num: string }) {
  const topFit = persona.field_fit?.slice(0, 3) ?? []
  return (
    <>
      <ChapterHeader num={num} label="Persona & Working Style" icon={Sparkles} />
      <div className="space-y-6">
        {/* MBTI + summary */}
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5">
          <div className="flex flex-wrap items-baseline gap-3 mb-3">
            {persona.mbti && (
              <>
                <span className="font-display text-3xl font-bold tracking-wider text-indigo-600 dark:text-indigo-300">
                  {persona.mbti.type}
                </span>
                <span className="text-sm text-muted-foreground">{persona.mbti.label}</span>
              </>
            )}
            <span className="ml-auto text-[10px] text-muted-foreground/40 uppercase tracking-wider">AI-generated · indicative</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{persona.persona_summary}</p>
        </div>

        {/* Strengths */}
        {persona.strengths?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground/50 mb-2.5">Core strengths</p>
            <div className="flex flex-wrap gap-1.5">
              {persona.strengths.map(s => (
                <span key={s} className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Big Five */}
        {persona.big_five?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground/50 mb-3">Big Five (OCEAN)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {persona.big_five.map(t => <PersonaMiniBar key={t.name} label={t.name} score={t.score} />)}
            </div>
          </div>
        )}

        {/* Field fit */}
        {topFit.length > 0 && (
          <p className="text-xs text-muted-foreground border-t border-border pt-4">
            Best-fit fields: {topFit.map(f => `${f.field} (${f.fit_score})`).join(' · ')}
          </p>
        )}

        {/* Workplace behaviour */}
        {persona.workplace_behaviour && <PersonaWorkplace wb={persona.workplace_behaviour} />}
      </div>
    </>
  )
}

// ── Experience ────────────────────────────────────────────────────────────────

function WorkCard({ job, isLast }: { job: WorkExperienceEntry; isLast: boolean }) {
  return (
    <div className="relative pl-7">
      {/* Timeline line */}
      {!isLast && <div className="absolute left-[3px] top-5 bottom-0 w-px bg-border" />}
      {/* Timeline dot */}
      <div className="absolute left-0 top-1.5 w-[7px] h-[7px] rounded-full border-2 border-indigo-500 bg-background" />

      <div className="pb-8 last:pb-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-2">
          <div>
            <p className="text-base font-semibold text-foreground">{job.title}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Building2 size={12} strokeWidth={1.5} />
              {job.company}
              {job.employment_type && (
                <span className="px-1.5 py-px rounded text-[10px] bg-muted text-muted-foreground border border-border capitalize">
                  {job.employment_type.replace('_', '-')}
                </span>
              )}
            </p>
          </div>
          <span className="text-xs text-muted-foreground/60 flex items-center gap-1 shrink-0">
            <Calendar size={11} />{job.start_date ?? '?'} – {job.end_date ?? 'Present'}
          </span>
        </div>

        {job.role_context && (
          <p className="text-xs text-indigo-600/80 dark:text-indigo-400/70 italic mb-2 leading-relaxed">{job.role_context}</p>
        )}
        {(job.key_impacts?.length ?? 0) > 0 && (
          <ul className="space-y-1 mb-2">
            {job.key_impacts!.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-2 w-1 h-1 rounded-full bg-emerald-500 shrink-0" />{p}
              </li>
            ))}
          </ul>
        )}
        {job.key_technologies.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {job.key_technologies.map(t => (
              <span key={t} className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function WorkSection({ work, num }: { work: WorkExperienceEntry[]; num: string }) {
  return (
    <>
      <ChapterHeader num={num} label="Experience" icon={Briefcase} />
      <div>
        {work.map((job, i) => (
          <WorkCard key={i} job={job} isLast={i === work.length - 1} />
        ))}
      </div>
    </>
  )
}

// ── Education ─────────────────────────────────────────────────────────────────

function EducationSection({ education, num }: { education: EducationEntry[]; num: string }) {
  return (
    <>
      <ChapterHeader num={num} label="Education" icon={GraduationCap} />
      <div className="space-y-2">
        {education.map((entry, i) => (
          <div key={i} className="flex gap-4 px-4 py-3.5 rounded-xl border border-border bg-card
            hover:border-violet-500/30 transition-colors duration-200">
            <div className="w-9 h-9 rounded-lg bg-violet-500/12 border border-violet-500/20
              flex items-center justify-center shrink-0">
              <GraduationCap size={16} className="text-violet-600 dark:text-violet-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{entry.institution}</p>
              {(entry.degree || entry.field) && (
                <p className="text-xs text-muted-foreground mt-0.5">{[entry.degree, entry.field].filter(Boolean).join(' · ')}</p>
              )}
              {(entry.start_year || entry.graduation_year) && (
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                  {entry.start_year ?? '?'} – {entry.currently_enrolled ? 'Present' : (entry.graduation_year ?? '?')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// ── Projects ──────────────────────────────────────────────────────────────────

function ProjectsSection({ items, num }: { items: PortfolioItem[]; num: string }) {
  return (
    <>
      <ChapterHeader num={num} label="Projects" icon={FolderOpen} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map(item => (
          <div key={item.id} className="rounded-xl border border-border bg-card p-4
            hover:border-sky-500/30 transition-colors duration-200">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              {(item.url || item.repo_url) && (
                <a href={toExternalHref(item.url || item.repo_url!) ?? '#'} target="_blank" rel="noopener noreferrer"
                  className="text-muted-foreground/60 hover:text-indigo-500 transition-colors shrink-0">
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
            {item.description && <p className="text-xs text-muted-foreground leading-relaxed mb-2">{item.description}</p>}
            {item.impact && <p className="text-xs text-emerald-600/80 dark:text-emerald-400/70 italic mb-2">{item.impact}</p>}
            {item.tech_stack?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {item.tech_stack.map((t: string) => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/15">{t}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}

// ── Awards ────────────────────────────────────────────────────────────────────

function AwardsSection({ awards, num }: { awards: AwardEntry[]; num: string }) {
  return (
    <>
      <ChapterHeader num={num} label="Awards & Certifications" icon={Award} />
      <div className="space-y-2">
        {awards.map((a, i) => (
          <div key={i} className="flex gap-4 px-4 py-3.5 rounded-xl border border-border bg-card
            hover:border-amber-500/30 transition-colors duration-200">
            <div className="w-9 h-9 rounded-lg bg-amber-500/12 border border-amber-500/20
              flex items-center justify-center shrink-0">
              <Award size={16} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{a.title}</p>
                {a.url && (
                  <a href={toExternalHref(a.url) ?? '#'} target="_blank" rel="noopener noreferrer"
                    className="text-muted-foreground/60 hover:text-indigo-500 transition-colors shrink-0">
                    <ExternalLink size={11} />
                  </a>
                )}
              </div>
              {a.issuer && <p className="text-xs text-muted-foreground mt-0.5">{a.issuer}</p>}
              {a.date && <p className="text-[11px] text-muted-foreground/60 mt-0.5">{a.date}</p>}
              {a.description && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{a.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// ── Section navigator ─────────────────────────────────────────────────────────

type NavItem = { id: string; label: string; icon: React.ElementType }

function SectionNav({ items }: { items: NavItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? '')

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting)
        if (visible.length) setActive(visible[0].target.id)
      },
      { rootMargin: '-20% 0px -65% 0px', threshold: 0 },
    )
    items.forEach(i => { const el = document.getElementById(i.id); if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [items])

  return (
    <nav className="sticky top-24 w-40 shrink-0 hidden lg:block">
      <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-xl p-2 space-y-0.5">
        <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-muted-foreground/40 px-2 pt-1.5 pb-2">
          Profile
        </p>
        {items.map(({ id, label, icon: Icon }) => (
          <a key={id} href={`#${id}`}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              active === id
                ? 'bg-indigo-500/12 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
            }`}>
            <Icon size={13} className={active === id ? 'text-indigo-500 dark:text-indigo-400' : 'text-muted-foreground/60'} strokeWidth={1.5} />
            {label}
          </a>
        ))}
      </div>
    </nav>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function ProfileViewMode({ profile, avatarUrl, clerkName }: {
  profile: FullProfile; avatarUrl: string | null; clerkName: string
}) {
  const work: WorkExperienceEntry[] = Array.isArray(profile.work_experience) ? profile.work_experience : []
  const education: EducationEntry[] = Array.isArray(profile.education) ? profile.education : []
  const persona = profile.career_data?.ai_persona ?? null
  const awards = (profile.career_data as (typeof profile.career_data & { awards?: AwardEntry[] }) | null)?.awards ?? []
  const hasAbout = !!(profile.career_data?.career_identity_summary || profile.bio)

  // Assign sequential chapter numbers to sections that actually have content
  let chap = 0
  const num = () => `0${++chap}`

  const nav: NavItem[] = [
    hasAbout && { id: 'about', label: 'About', icon: Star },
    persona && { id: 'persona', label: 'Persona', icon: Sparkles },
    work.length && { id: 'experience', label: 'Experience', icon: Briefcase },
    education.length && { id: 'education', label: 'Education', icon: GraduationCap },
    profile.portfolio_items.length && { id: 'projects', label: 'Projects', icon: FolderOpen },
    awards.length && { id: 'awards', label: 'Awards', icon: Award },
    profile.skills.length && { id: 'skills', label: 'Skills', icon: Layers },
  ].filter(Boolean) as NavItem[]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex gap-10 items-start">
      {nav.length > 1 && <SectionNav items={nav} />}

      <div className="flex-1 min-w-0 max-w-2xl mx-auto lg:mx-0">
        <ProfileHero profile={profile} avatarUrl={avatarUrl} clerkName={clerkName} work={work} />

        <div className="space-y-16">
          {hasAbout && (
            <section id="about" className="scroll-mt-28">
              <ScrollReveal><AboutSection profile={profile} num={num()} /></ScrollReveal>
            </section>
          )}
          {persona && (
            <section id="persona" className="scroll-mt-28">
              <ScrollReveal><PersonaSection persona={persona} num={num()} /></ScrollReveal>
            </section>
          )}
          {work.length > 0 && (
            <section id="experience" className="scroll-mt-28">
              <ScrollReveal><WorkSection work={work} num={num()} /></ScrollReveal>
            </section>
          )}
          {education.length > 0 && (
            <section id="education" className="scroll-mt-28">
              <ScrollReveal><EducationSection education={education} num={num()} /></ScrollReveal>
            </section>
          )}
          {profile.portfolio_items.length > 0 && (
            <section id="projects" className="scroll-mt-28">
              <ScrollReveal><ProjectsSection items={profile.portfolio_items} num={num()} /></ScrollReveal>
            </section>
          )}
          {awards.length > 0 && (
            <section id="awards" className="scroll-mt-28">
              <ScrollReveal><AwardsSection awards={awards} num={num()} /></ScrollReveal>
            </section>
          )}
          {profile.skills.length > 0 && (
            <section id="skills" className="scroll-mt-28">
              <ScrollReveal>
                <ChapterHeader num={num()} label={`Skills · ${profile.skills.length} total`} icon={Layers} />
                <SkillsVault skills={profile.skills} readOnly />
              </ScrollReveal>
            </section>
          )}
        </div>

        {/* Bottom spacer */}
        <div className="h-24" />
      </div>
    </div>
  )
}
