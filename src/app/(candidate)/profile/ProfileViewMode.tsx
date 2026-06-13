'use client'

// Employer-facing profile scroll. A single streamlined scroll that lets a hiring
// team understand the whole person — identity, AI persona & working style,
// experience, education, projects, awards, and an interactive skills vault they
// can zoom into for an AI breakdown of each skill. Theme-aware (dark + light).

import { useEffect, useState } from 'react'
import {
  MapPin, Globe, FileText, ExternalLink,
  Briefcase, GraduationCap, FolderOpen, Award, Layers,
  Building2, Calendar, Star, Sparkles,
} from 'lucide-react'
import { GithubIcon, LinkedinIcon, FacebookIcon, InstagramIcon, TiktokIcon } from '@/components/ui/BrandIcons'
import type { CandidateProfile, Skill, PortfolioItem, WorkExperienceEntry, EducationEntry, PersonaAnalysis } from '@/types/database'
import { toExternalHref } from '@/lib/url'
import { SkillsVault } from './SkillsVault'

type FullProfile = CandidateProfile & { skills: Skill[]; portfolio_items: PortfolioItem[] }

// ── Shared bits ────────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <Icon size={16} className="text-indigo-500 dark:text-indigo-400" strokeWidth={1.75} />
      <h2 className="text-sm font-semibold tracking-widest uppercase text-muted-foreground">{label}</h2>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

function LinkedChip({ href, icon: Icon, label, color }: {
  href: string; icon: React.ComponentType<{ size?: number; className?: string }>; label: string; color: string
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 hover:scale-105 ${color}`}>
      <Icon size={12} />{label}
      <ExternalLink size={10} className="opacity-60" />
    </a>
  )
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function ProfileHero({ profile, avatarUrl, clerkName }: {
  profile: FullProfile; avatarUrl: string | null; clerkName: string
}) {
  const displayName = profile.first_name
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ')
    : profile.name || clerkName

  type LinkEntry = { href: string; icon: React.ComponentType<{ size?: number; className?: string }>; label: string; color: string }
  const linkDefs = [
    profile.github_url && { href: toExternalHref(profile.github_url)!, icon: GithubIcon, label: 'GitHub', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' },
    profile.linkedin_url && { href: toExternalHref(profile.linkedin_url)!, icon: LinkedinIcon, label: 'LinkedIn', color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 hover:bg-sky-500/20' },
    profile.personal_website_url && { href: toExternalHref(profile.personal_website_url)!, icon: Globe, label: 'Website', color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 hover:bg-violet-500/20' },
    profile.resume_url && { href: toExternalHref(profile.resume_url)!, icon: FileText, label: 'Resume/CV', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20' },
    profile.seek_url && { href: toExternalHref(profile.seek_url)!, icon: ExternalLink, label: 'Seek', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/20' },
    profile.indeed_url && { href: toExternalHref(profile.indeed_url)!, icon: ExternalLink, label: 'Indeed', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20' },
    profile.instagram_url && { href: toExternalHref(profile.instagram_url)!, icon: InstagramIcon, label: 'Instagram', color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20 hover:bg-pink-500/20' },
    profile.tiktok_url && { href: toExternalHref(profile.tiktok_url)!, icon: TiktokIcon, label: 'TikTok', color: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-200 border-zinc-400/20 hover:bg-zinc-500/20' },
    profile.facebook_url && { href: toExternalHref(profile.facebook_url)!, icon: FacebookIcon, label: 'Facebook', color: 'bg-blue-600/10 text-blue-700 dark:text-blue-400 border-blue-600/20 hover:bg-blue-600/20' },
  ]
  const links = linkDefs.filter(Boolean) as LinkEntry[]

  const locationParts = [profile.city, profile.state_region, profile.country_name].filter(Boolean)
  const locationStr = locationParts.length ? locationParts.join(', ') : profile.location

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden mb-10">
      <div className="h-28 bg-gradient-to-br from-indigo-600/70 via-violet-600/50 to-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-25"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #818cf8 0%, transparent 60%), radial-gradient(circle at 80% 20%, #a78bfa 0%, transparent 50%)' }} />
      </div>
      <div className="px-6 pb-6">
        <div className="flex items-end gap-4 -mt-10 mb-4">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={displayName}
              className="w-20 h-20 rounded-2xl ring-4 ring-card object-cover shrink-0" />
          ) : (
            <div className="w-20 h-20 rounded-2xl ring-4 ring-card bg-indigo-500/20 border border-indigo-400/30
              flex items-center justify-center text-2xl font-bold text-indigo-600 dark:text-indigo-300 shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="pb-1">
            <h1 className="text-xl font-bold text-foreground leading-tight">{displayName}</h1>
            {profile.headline && <p className="text-sm text-muted-foreground mt-0.5">{profile.headline}</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-4">
          {locationStr && (
            <span className="flex items-center gap-1.5">
              <MapPin size={12} className="text-indigo-500 dark:text-indigo-400" />{locationStr}
            </span>
          )}
          {profile.availability && profile.availability !== 'not_looking' && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
              {{ immediate: 'Available now', one_month: 'Available in 1 month', three_months: 'Available in 3 months' }[profile.availability] ?? ''}
            </span>
          )}
          <span className="text-muted-foreground/70">{profile.skills.length} skills</span>
        </div>

        {links.length > 0 && (
          <div className="flex flex-wrap gap-2">{links.map(l => <LinkedChip key={l.label} {...l} />)}</div>
        )}
      </div>
    </div>
  )
}

// ── About ─────────────────────────────────────────────────────────────────────

function AboutSection({ profile }: { profile: FullProfile }) {
  const text = profile.career_data?.career_identity_summary || profile.bio
  if (!text) return null
  return (
    <>
      <SectionHeader icon={Star} label="About" />
      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{text}</p>
    </>
  )
}

// ── Experience ──────────────────────────────────────────────────────────────────

function WorkCard({ job, index }: { job: WorkExperienceEntry; index: number }) {
  return (
    <div className="relative pl-6 pb-6 last:pb-0">
      <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full border-2 border-indigo-500 bg-background" />
      {index > 0 && <div className="absolute left-[5px] bottom-0 top-0 w-px bg-border -translate-y-1.5" />}
      <div className="rounded-xl border border-border bg-card px-4 py-3 hover:border-indigo-500/30 transition">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <p className="text-sm font-semibold text-foreground">{job.title}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Building2 size={11} />{job.company}
              {job.employment_type && (
                <span className="px-1.5 py-px rounded bg-muted text-muted-foreground border border-border capitalize">
                  {job.employment_type.replace('_', '-')}
                </span>
              )}
            </p>
          </div>
          <span className="text-[11px] text-muted-foreground/70 shrink-0 flex items-center gap-1">
            <Calendar size={10} />{job.start_date ?? '?'} – {job.end_date ?? 'Present'}
          </span>
        </div>
        {job.role_context && <p className="text-xs text-indigo-600/90 dark:text-indigo-400/80 italic mb-2">{job.role_context}</p>}
        {(job.key_impacts?.length ?? 0) > 0 && (
          <ul className="space-y-1 mt-2">
            {job.key_impacts!.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500 shrink-0" />{p}
              </li>
            ))}
          </ul>
        )}
        {job.key_technologies.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {job.key_technologies.map(t => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function WorkSection({ work }: { work: WorkExperienceEntry[] }) {
  return (
    <>
      <SectionHeader icon={Briefcase} label="Experience" />
      <div className="space-y-0">{work.map((job, i) => <WorkCard key={i} job={job} index={i} />)}</div>
    </>
  )
}

// ── Education ─────────────────────────────────────────────────────────────────

function EducationSection({ education }: { education: EducationEntry[] }) {
  return (
    <>
      <SectionHeader icon={GraduationCap} label="Education" />
      <div className="space-y-2">
        {education.map((entry, i) => (
          <div key={i} className="flex gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:border-violet-500/30 transition">
            <div className="w-9 h-9 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center shrink-0">
              <GraduationCap size={16} className="text-violet-600 dark:text-violet-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{entry.institution}</p>
              {(entry.degree || entry.field) && (
                <p className="text-xs text-muted-foreground mt-0.5">{[entry.degree, entry.field].filter(Boolean).join(' · ')}</p>
              )}
              {(entry.start_year || entry.graduation_year) && (
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">
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

function ProjectsSection({ items }: { items: PortfolioItem[] }) {
  return (
    <>
      <SectionHeader icon={FolderOpen} label="Projects" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map(item => (
          <div key={item.id} className="rounded-xl border border-border bg-card p-4 hover:border-sky-500/30 transition">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              {(item.url || item.repo_url) && (
                <a href={toExternalHref(item.url || item.repo_url!) ?? '#'} target="_blank" rel="noopener noreferrer"
                  className="text-muted-foreground/70 hover:text-indigo-500 transition-colors shrink-0"><ExternalLink size={13} /></a>
              )}
            </div>
            {item.description && <p className="text-xs text-muted-foreground leading-relaxed mb-2">{item.description}</p>}
            {item.impact && <p className="text-xs text-emerald-600/90 dark:text-emerald-400/80 italic mb-2">{item.impact}</p>}
            {item.tech_stack && item.tech_stack.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {item.tech_stack.map((t: string) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/15">{t}</span>
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

type AwardEntry = { title: string; issuer?: string; date?: string | null; description?: string | null; url?: string | null }

function AwardsSection({ awards }: { awards: AwardEntry[] }) {
  return (
    <>
      <SectionHeader icon={Award} label="Awards & Certifications" />
      <div className="space-y-2">
        {awards.map((a, i) => (
          <div key={i} className="flex gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:border-amber-500/30 transition">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Award size={16} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground truncate">{a.title}</p>
                {a.url && (
                  <a href={toExternalHref(a.url) ?? '#'} target="_blank" rel="noopener noreferrer"
                    className="text-muted-foreground/70 hover:text-indigo-500 transition-colors shrink-0"><ExternalLink size={11} /></a>
                )}
              </div>
              {a.issuer && <p className="text-xs text-muted-foreground mt-0.5">{a.issuer}</p>}
              {a.date && <p className="text-[11px] text-muted-foreground/70 mt-0.5">{a.date}</p>}
              {a.description && <p className="text-xs text-muted-foreground mt-1">{a.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// ── AI Persona ──────────────────────────────────────────────────────────────────

function PersonaMiniBar({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <span className="text-[10px] text-muted-foreground/70 tabular-nums">{score}</span>
      </div>
      <div className="h-1 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
      </div>
    </div>
  )
}

function PersonaSpectrum({ left, right, position }: { left: string; right: string; position: number }) {
  const pos = Math.min(100, Math.max(0, position))
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground/70 w-20 shrink-0 text-right truncate">{left}</span>
      <div className="flex-1 relative h-1 rounded-full bg-muted">
        <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-indigo-400 ring-2 ring-card"
          style={{ left: `calc(${pos}% - 5px)` }} />
      </div>
      <span className="text-[10px] text-muted-foreground/70 w-20 shrink-0 truncate">{right}</span>
    </div>
  )
}

function PersonaWorkplace({ wb }: { wb: NonNullable<PersonaAnalysis['workplace_behaviour']> }) {
  return (
    <div className="border-t border-border pt-4 space-y-3">
      {wb.spectrums?.length > 0 && (
        <div className="space-y-2">
          {wb.spectrums.slice(0, 8).map(s => <PersonaSpectrum key={s.name} left={s.left} right={s.right} position={s.position} />)}
        </div>
      )}
      {wb.working_with_guide?.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/70 mb-1.5">Working with them</p>
          <ul className="space-y-1">
            {wb.working_with_guide.map((g, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground leading-relaxed">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500 shrink-0" />{g}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function PersonaSection({ persona }: { persona: PersonaAnalysis }) {
  const topFit = persona.field_fit?.slice(0, 3) ?? []
  return (
    <>
      <SectionHeader icon={Sparkles} label="Persona & Working Style" />
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {persona.mbti && (
            <>
              <span className="px-3 py-1 rounded-lg bg-violet-500/12 border border-violet-500/25 text-violet-700 dark:text-violet-300 text-sm font-bold tracking-widest">{persona.mbti.type}</span>
              <span className="text-xs text-muted-foreground">{persona.mbti.label}</span>
            </>
          )}
          <span className="ml-auto text-[10px] text-muted-foreground/60 uppercase tracking-wider">AI-generated · indicative</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{persona.persona_summary}</p>
        {persona.big_five?.length > 0 && (
          <div className="grid grid-cols-2 gap-x-5 gap-y-2.5">
            {persona.big_five.map(t => <PersonaMiniBar key={t.name} label={t.name} score={t.score} />)}
          </div>
        )}
        {persona.strengths?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {persona.strengths.map(s => (
              <span key={s} className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">{s}</span>
            ))}
          </div>
        )}
        {topFit.length > 0 && (
          <p className="text-[11px] text-muted-foreground border-t border-border pt-3">
            Best-fit fields: {topFit.map(f => `${f.field} (${f.fit_score})`).join(' · ')}
          </p>
        )}
        {persona.workplace_behaviour && <PersonaWorkplace wb={persona.workplace_behaviour} />}
      </div>
    </>
  )
}

// ── Section navigator (sticky scrollspy) ──────────────────────────────────────

type NavItem = { id: string; label: string; icon: React.ElementType }

function SectionNav({ items }: { items: NavItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? '')

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting)
        if (visible.length) setActive(visible[0].target.id)
      },
      { rootMargin: '-25% 0px -65% 0px', threshold: 0 },
    )
    items.forEach(i => { const el = document.getElementById(i.id); if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [items])

  return (
    <nav className="sticky top-24 w-44 shrink-0 hidden lg:block">
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-xl p-2 space-y-0.5">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/60 px-2 pt-1 pb-2">Profile</p>
        {items.map(({ id, label, icon: Icon }) => (
          <a key={id} href={`#${id}`}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              active === id ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/25'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent'
            }`}>
            <Icon size={14} className={active === id ? 'text-indigo-500 dark:text-indigo-400' : 'text-muted-foreground/70'} />
            {label}
          </a>
        ))}
      </div>
    </nav>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function ProfileViewMode({ profile, avatarUrl, clerkName }: {
  profile: FullProfile; avatarUrl: string | null; clerkName: string
}) {
  const work: WorkExperienceEntry[] = Array.isArray(profile.work_experience) ? profile.work_experience : []
  const education: EducationEntry[] = Array.isArray(profile.education) ? profile.education : []
  const persona = profile.career_data?.ai_persona ?? null
  const awards = (profile.career_data as (typeof profile.career_data & { awards?: AwardEntry[] }) | null)?.awards ?? []
  const hasAbout = !!(profile.career_data?.career_identity_summary || profile.bio)

  // Build nav from sections that actually have content.
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
    <div className="max-w-5xl mx-auto px-4 py-8 flex gap-8 items-start">
      {nav.length > 1 && <SectionNav items={nav} />}

      <div className="flex-1 min-w-0 max-w-2xl mx-auto lg:mx-0">
        <ProfileHero profile={profile} avatarUrl={avatarUrl} clerkName={clerkName} />

        <div className="space-y-12">
          {hasAbout && <section id="about" className="scroll-mt-28"><AboutSection profile={profile} /></section>}
          {persona && <section id="persona" className="scroll-mt-28"><PersonaSection persona={persona} /></section>}
          {work.length > 0 && <section id="experience" className="scroll-mt-28"><WorkSection work={work} /></section>}
          {education.length > 0 && <section id="education" className="scroll-mt-28"><EducationSection education={education} /></section>}
          {profile.portfolio_items.length > 0 && <section id="projects" className="scroll-mt-28"><ProjectsSection items={profile.portfolio_items} /></section>}
          {awards.length > 0 && <section id="awards" className="scroll-mt-28"><AwardsSection awards={awards} /></section>}
          {profile.skills.length > 0 && (
            <section id="skills" className="scroll-mt-28">
              <SectionHeader icon={Layers} label={`Skills · ${profile.skills.length} total`} />
              <SkillsVault skills={profile.skills} readOnly />
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
