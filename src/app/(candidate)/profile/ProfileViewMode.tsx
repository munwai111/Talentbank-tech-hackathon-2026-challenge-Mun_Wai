'use client'

import {
  MapPin, Globe, FileText, ExternalLink,
  Briefcase, GraduationCap, FolderOpen, Award, Layers,
  Building2, Calendar, Star,
} from 'lucide-react'
import { GithubIcon, LinkedinIcon } from '@/components/ui/BrandIcons'
import type { CandidateProfile, Skill, PortfolioItem, WorkExperienceEntry, EducationEntry } from '@/types/database'

type FullProfile = CandidateProfile & { skills: Skill[]; portfolio_items: PortfolioItem[] }

// ── Helpers ──────────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <Icon size={16} className="text-indigo-400" strokeWidth={1.75} />
      <h2 className="text-sm font-semibold tracking-widest uppercase text-zinc-500">{label}</h2>
      <div className="flex-1 h-px bg-white/6" />
    </div>
  )
}

function LinkedChip({ href, icon: Icon, label, color }: {
  href: string; icon: React.ComponentType<{ size?: number; className?: string }>; label: string; color: string
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 hover:scale-105 ${color}`}>
      <Icon size={12} />
      {label}
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
  const links: LinkEntry[] = [
    profile.github_url && { href: profile.github_url, icon: GithubIcon, label: 'GitHub', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' },
    profile.linkedin_url && { href: profile.linkedin_url, icon: LinkedinIcon, label: 'LinkedIn', color: 'bg-sky-500/10 text-sky-400 border-sky-500/20 hover:bg-sky-500/20' },
    profile.personal_website_url && { href: profile.personal_website_url, icon: Globe, label: 'Website', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20 hover:bg-violet-500/20' },
    profile.resume_url && { href: profile.resume_url, icon: FileText, label: 'Resume/CV', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20' },
    profile.seek_url && { href: profile.seek_url, icon: ExternalLink, label: 'Seek', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20' },
    profile.indeed_url && { href: profile.indeed_url, icon: ExternalLink, label: 'Indeed', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20' },
  ].filter(Boolean) as LinkEntry[]

  const locationParts = [profile.city, profile.state_region, profile.country_name].filter(Boolean)
  const locationStr = locationParts.length ? locationParts.join(', ') : profile.location

  return (
    <div className="rounded-2xl border border-white/8 bg-white/2 overflow-hidden mb-6">
      {/* gradient banner */}
      <div className="h-28 bg-gradient-to-br from-indigo-900/60 via-violet-900/40 to-[#0a0a14]
        relative overflow-hidden">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #818cf8 0%, transparent 60%), radial-gradient(circle at 80% 20%, #a78bfa 0%, transparent 50%)' }} />
      </div>

      <div className="px-6 pb-6">
        <div className="flex items-end gap-4 -mt-10 mb-4">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={displayName}
              className="w-20 h-20 rounded-2xl ring-4 ring-[#0a0a14] object-cover shrink-0" />
          ) : (
            <div className="w-20 h-20 rounded-2xl ring-4 ring-[#0a0a14] bg-indigo-500/20 border border-indigo-400/30
              flex items-center justify-center text-2xl font-bold text-indigo-300 shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="pb-1">
            <h1 className="text-xl font-bold text-white leading-tight">{displayName}</h1>
            {profile.headline && <p className="text-sm text-zinc-400 mt-0.5">{profile.headline}</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 mb-4">
          {locationStr && (
            <span className="flex items-center gap-1.5">
              <MapPin size={12} className="text-indigo-400" />{locationStr}
            </span>
          )}
          {profile.availability && profile.availability !== 'not_looking' && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/12 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
              {{
                immediate: 'Available now',
                one_month: 'Available in 1 month',
                three_months: 'Available in 3 months',
              }[profile.availability] ?? ''}
            </span>
          )}
          <span className="text-zinc-600">{profile.skills.length} skills</span>
        </div>

        {links.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {links.map(l => <LinkedChip key={l.label} {...l} />)}
          </div>
        )}
      </div>
    </div>
  )
}

// ── About ─────────────────────────────────────────────────────────────────────

function AboutSection({ profile }: { profile: FullProfile }) {
  if (!profile.bio && !profile.career_data?.career_identity_summary) return null
  const text = profile.career_data?.career_identity_summary || profile.bio
  return (
    <section className="mb-8">
      <SectionHeader icon={Star} label="About" />
      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{text}</p>
    </section>
  )
}

// ── Work Experience ───────────────────────────────────────────────────────────

function WorkCard({ job, index }: { job: WorkExperienceEntry; index: number }) {
  return (
    <div className="relative pl-6 pb-6 last:pb-0">
      <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full border-2 border-indigo-500 bg-[#0a0a14]" />
      {index > 0 && <div className="absolute left-[5px] bottom-0 top-0 w-px bg-white/8 -translate-y-1.5" />}
      <div className="rounded-xl border border-white/7 bg-white/2 px-4 py-3 hover:border-white/12 transition">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <p className="text-sm font-semibold text-white">{job.title}</p>
            <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
              <Building2 size={11} />{job.company}
              {job.employment_type && (
                <span className="px-1.5 py-px rounded bg-white/6 text-zinc-600 border border-white/8 capitalize">
                  {job.employment_type.replace('_', '-')}
                </span>
              )}
            </p>
          </div>
          <span className="text-[11px] text-zinc-600 shrink-0 flex items-center gap-1">
            <Calendar size={10} />
            {job.start_date ?? '?'} – {job.end_date ?? 'Present'}
          </span>
        </div>
        {job.role_context && <p className="text-xs text-indigo-400/80 italic mb-2">{job.role_context}</p>}
        {(job.key_impacts?.length ?? 0) > 0 && (
          <ul className="space-y-1 mt-2">
            {job.key_impacts!.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500 shrink-0" />{p}
              </li>
            ))}
          </ul>
        )}
        {job.key_technologies.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {job.key_technologies.map(t => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-zinc-500 border border-white/7">{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function WorkSection({ work }: { work: WorkExperienceEntry[] }) {
  if (!work.length) return null
  return (
    <section className="mb-8">
      <SectionHeader icon={Briefcase} label="Experience" />
      <div className="space-y-0">
        {work.map((job, i) => <WorkCard key={i} job={job} index={i} />)}
      </div>
    </section>
  )
}

// ── Education ─────────────────────────────────────────────────────────────────

function EducationCard({ entry }: { entry: EducationEntry }) {
  return (
    <div className="flex gap-3 px-4 py-3 rounded-xl border border-white/7 bg-white/2 hover:border-white/12 transition">
      <div className="w-9 h-9 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center shrink-0">
        <GraduationCap size={16} className="text-violet-400" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white truncate">{entry.institution}</p>
        {(entry.degree || entry.field) && (
          <p className="text-xs text-zinc-400 mt-0.5">
            {[entry.degree, entry.field].filter(Boolean).join(' · ')}
          </p>
        )}
        {(entry.start_year || entry.graduation_year) && (
          <p className="text-[11px] text-zinc-600 mt-0.5">
            {entry.start_year ?? '?'} – {entry.currently_enrolled ? 'Present' : (entry.graduation_year ?? '?')}
          </p>
        )}
      </div>
    </div>
  )
}

function EducationSection({ education }: { education: EducationEntry[] }) {
  if (!education.length) return null
  return (
    <section className="mb-8">
      <SectionHeader icon={GraduationCap} label="Education" />
      <div className="space-y-2">
        {education.map((e, i) => <EducationCard key={i} entry={e} />)}
      </div>
    </section>
  )
}

// ── Projects ──────────────────────────────────────────────────────────────────

function ProjectCard({ item }: { item: PortfolioItem }) {
  return (
    <div className="rounded-xl border border-white/7 bg-white/2 p-4 hover:border-white/12 transition">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-white">{item.title}</p>
        {(item.url || item.repo_url) && (
          <a href={item.url || item.repo_url!} target="_blank" rel="noopener noreferrer"
            className="text-zinc-600 hover:text-indigo-400 transition-colors shrink-0">
            <ExternalLink size={13} />
          </a>
        )}
      </div>
      {item.description && <p className="text-xs text-zinc-400 leading-relaxed mb-2">{item.description}</p>}
      {item.impact && <p className="text-xs text-emerald-400/80 italic mb-2">{item.impact}</p>}
      {item.tech_stack && item.tech_stack.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.tech_stack.map((t: string) => (
            <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-sky-500/8 text-sky-400 border border-sky-500/15">{t}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function ProjectsSection({ items }: { items: PortfolioItem[] }) {
  if (!items.length) return null
  return (
    <section className="mb-8">
      <SectionHeader icon={FolderOpen} label="Projects" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map(item => <ProjectCard key={item.id} item={item} />)}
      </div>
    </section>
  )
}

// ── Awards ────────────────────────────────────────────────────────────────────

type AwardEntry = { title: string; issuer?: string; date?: string | null; description?: string | null; url?: string | null }

function AwardsSection({ profile }: { profile: FullProfile }) {
  const awards = (profile.career_data as (typeof profile.career_data & { awards?: AwardEntry[] }) | null)?.awards
  if (!awards?.length) return null
  return (
    <section className="mb-8">
      <SectionHeader icon={Award} label="Awards & Certifications" />
      <div className="space-y-2">
        {awards.map((a, i) => (
          <div key={i} className="flex gap-3 px-4 py-3 rounded-xl border border-white/7 bg-white/2 hover:border-white/12 transition">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Award size={16} className="text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-white truncate">{a.title}</p>
                {a.url && (
                  <a href={a.url} target="_blank" rel="noopener noreferrer"
                    className="text-zinc-600 hover:text-indigo-400 transition-colors shrink-0">
                    <ExternalLink size={11} />
                  </a>
                )}
              </div>
              {a.issuer && <p className="text-xs text-zinc-500 mt-0.5">{a.issuer}</p>}
              {a.date && <p className="text-[11px] text-zinc-600 mt-0.5">{a.date}</p>}
              {a.description && <p className="text-xs text-zinc-400 mt-1">{a.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Skills ────────────────────────────────────────────────────────────────────

const LEVEL_LABELS: Record<number, string> = { 1: 'Elementary', 2: 'Beginner', 3: 'Intermediate', 4: 'Advanced', 5: 'Expert' }
const LEVEL_COLORS: Record<number, string> = {
  1: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
  2: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  3: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  4: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  5: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
}

function SkillsSection({ skills }: { skills: Skill[] }) {
  if (!skills.length) return null
  const byLevel = [5, 4, 3, 2, 1].map(l => ({ level: l, items: skills.filter(s => s.level === l) })).filter(g => g.items.length > 0)
  return (
    <section className="mb-8">
      <SectionHeader icon={Layers} label={`Skills · ${skills.length} total`} />
      <div className="space-y-4">
        {byLevel.map(({ level, items }) => (
          <div key={level}>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600 mb-2">{LEVEL_LABELS[level]}</p>
            <div className="flex flex-wrap gap-1.5">
              {items.map(s => (
                <span key={s.id} className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${LEVEL_COLORS[level]}`}>{s.name}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function ProfileViewMode({ profile, avatarUrl, clerkName }: {
  profile: FullProfile
  avatarUrl: string | null
  clerkName: string
}) {
  const work: WorkExperienceEntry[] = Array.isArray(profile.work_experience) ? profile.work_experience : []
  const education: EducationEntry[] = Array.isArray(profile.education) ? profile.education : []

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <ProfileHero profile={profile} avatarUrl={avatarUrl} clerkName={clerkName} />
      <AboutSection profile={profile} />
      <WorkSection work={work} />
      <EducationSection education={education} />
      <ProjectsSection items={profile.portfolio_items} />
      <AwardsSection profile={profile} />
      <SkillsSection skills={profile.skills} />
    </div>
  )
}
