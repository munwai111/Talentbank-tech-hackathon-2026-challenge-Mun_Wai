'use client'

import { useState, useRef } from 'react'
import {
  User, Briefcase, GraduationCap, FolderOpen, Award, Layers, Link2,
  Plus, Trash2, GripVertical, Info, Check, Loader2, Upload, Globe,
  ExternalLink, FileText, ChevronDown, ChevronUp, Sparkles, AlertTriangle,
  type LucideIcon,
} from 'lucide-react'
import { GithubIcon, LinkedinIcon, FacebookIcon, InstagramIcon, TiktokIcon } from '@/components/ui/BrandIcons'
import { AIProfilingSection } from './AIProfilingSection'
import type { CandidateProfile, Skill, WorkExperienceEntry, EducationEntry, PortfolioItem } from '@/types/database'
import { SORTED_COUNTRIES, getStatesForCountry, GENDER_OPTIONS, ETHNICITY_OPTIONS } from '@/lib/countries'
import { toExternalHref } from '@/lib/url'
import { checkProfileLink, type ProfileLinkPlatform } from '@/lib/profile-links'

type FullProfile = CandidateProfile & { skills: Skill[]; portfolio_items: PortfolioItem[] }

type EditSection = 'personal' | 'experience' | 'education' | 'projects' | 'awards' | 'skills' | 'accounts' | 'ai'

type AwardEntry = { title: string; issuer: string; date: string; description: string; url: string }

// ── Floating glass nav ────────────────────────────────────────────────────────

const NAV_ITEMS: { id: EditSection; label: string; icon: LucideIcon; info?: string }[] = [
  { id: 'personal',    label: 'Personal Info',  icon: User },
  { id: 'experience',  label: 'Experience',      icon: Briefcase },
  { id: 'education',   label: 'Education',       icon: GraduationCap },
  { id: 'projects',    label: 'Projects',        icon: FolderOpen },
  { id: 'awards',      label: 'Awards',          icon: Award },
  { id: 'skills',      label: 'Skills Vault',    icon: Layers },
  { id: 'accounts',    label: 'Linked Accounts', icon: Link2 },
  { id: 'ai',          label: 'AI Profiling',    icon: Sparkles,
    info: 'AI reads your resume/CV and profile to build a full persona: achievements, MBTI-style type, Big Five traits, Korn Ferry-style competencies & drivers, field fit, life priorities and behavioural insights. Indicative — not a clinical assessment.' },
]

function EditSectionNav({ active, onChange }: { active: EditSection; onChange: (s: EditSection) => void }) {
  return (
    <div className="sticky top-20 w-[188px] shrink-0">
      <div className="rounded-2xl border border-white/10 bg-white/3 backdrop-blur-xl p-2 space-y-0.5
        shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600 px-2 pt-1 pb-2">Edit Profile</p>
        {NAV_ITEMS.map(({ id, label, icon: Icon, info }) => (
          <button key={id} onClick={() => onChange(id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 text-left ${
              active === id
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
            }`}>
            <Icon size={14} strokeWidth={active === id ? 2 : 1.75}
              className={active === id ? 'text-indigo-400' : 'text-zinc-500'} />
            <span className="flex-1">{label}</span>
            {info && (
              <span title={info} className="text-zinc-600 hover:text-zinc-400 cursor-help shrink-0">
                <Info size={11} />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Shared field components ───────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-zinc-600 mt-1">{hint}</p>}
    </div>
  )
}

const inputCls = 'w-full bg-white/4 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-400/40 focus:outline-none transition-colors'
const selectCls = 'w-full bg-white/4 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-400/40 focus:outline-none transition-colors [&>option]:bg-[#0f0f1f]'

function SaveBar({ saving, saved, onSave }: { saving: boolean; saved: boolean; onSave: () => void }) {
  return (
    <div className="flex justify-end mt-8 pt-4 border-t border-white/6">
      <button onClick={onSave} disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60
          text-sm font-medium text-white transition-colors">
        {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
        {saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
      </button>
    </div>
  )
}

// ── Personal Info section ─────────────────────────────────────────────────────

function PersonalInfoSection({ profile, onSave }: { profile: FullProfile; onSave: (data: Partial<FullProfile>) => Promise<void> }) {
  const [form, setForm] = useState({
    first_name: profile.first_name ?? '',
    middle_name: profile.middle_name ?? '',
    last_name: profile.last_name ?? '',
    date_of_birth: profile.date_of_birth ?? '',
    headline: profile.headline ?? '',
    bio: profile.bio ?? '',
    gender: profile.gender ?? '',
    ethnicity: profile.ethnicity ?? '',
    country_of_origin: profile.country_of_origin ?? '',
    disability_disclosure: profile.disability_disclosure ?? false,
    phone_country_code: profile.phone_country_code ?? '+60',
    phone_number: profile.phone_number ?? '',
    address_line1: profile.address_line1 ?? '',
    address_line2: profile.address_line2 ?? '',
    city: profile.city ?? '',
    state_region: profile.state_region ?? '',
    country_name: profile.country_name ?? 'Malaysia',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const states = getStatesForCountry(form.country_name)

  function set(key: keyof typeof form, value: string | boolean) {
    setForm(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    await onSave(form)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-white mb-4">Basic Details</h3>
        <div className="grid grid-cols-3 gap-3">
          <Field label="First Name">
            <input className={inputCls} value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="First name" />
          </Field>
          <Field label="Middle Name">
            <input className={inputCls} value={form.middle_name} onChange={e => set('middle_name', e.target.value)} placeholder="Optional" />
          </Field>
          <Field label="Surname">
            <input className={inputCls} value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Last name" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Field label="Date of Birth (DD/MM/YYYY)">
            <input type="date" className={inputCls} value={form.date_of_birth}
              onChange={e => set('date_of_birth', e.target.value)} />
          </Field>
          <Field label="Gender">
            <select className={selectCls} value={form.gender} onChange={e => set('gender', e.target.value)}>
              <option value="">Select gender</option>
              {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Field label="Ethnicity">
            <select className={selectCls} value={form.ethnicity} onChange={e => set('ethnicity', e.target.value)}>
              <option value="">Select ethnicity</option>
              {ETHNICITY_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </Field>
          <Field label="Country of Origin">
            <select className={selectCls} value={form.country_of_origin} onChange={e => set('country_of_origin', e.target.value)}>
              <option value="">Select country</option>
              {SORTED_COUNTRIES.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
            </select>
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Headline">
            <input className={inputCls} value={form.headline} onChange={e => set('headline', e.target.value)} placeholder="e.g. Senior Product Manager at TechCorp" />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Professional Bio">
            <textarea className={`${inputCls} resize-none`} rows={4} value={form.bio} onChange={e => set('bio', e.target.value)} placeholder="Tell employers about yourself…" />
          </Field>
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold text-white mb-4">Contact</h3>
        <div className="space-y-3">
          <Field label="Phone Number">
            <div className="flex gap-2">
              <select className={`${selectCls} w-28 shrink-0`} value={form.phone_country_code} onChange={e => set('phone_country_code', e.target.value)}>
                {SORTED_COUNTRIES.map(c => <option key={c.code} value={c.dial}>{c.dial} {c.code}</option>)}
              </select>
              <input className={inputCls} type="tel" value={form.phone_number} onChange={e => set('phone_number', e.target.value)} placeholder="Phone number" />
            </div>
          </Field>
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold text-white mb-4">Location</h3>
        <div className="space-y-3">
          <Field label="Country">
            <select className={selectCls} value={form.country_name} onChange={e => { set('country_name', e.target.value); set('state_region', '') }}>
              <option value="">Select country</option>
              {SORTED_COUNTRIES.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Address Line 1">
            <input className={inputCls} value={form.address_line1} onChange={e => set('address_line1', e.target.value)} placeholder="Street address" />
          </Field>
          <Field label="Address Line 2">
            <input className={inputCls} value={form.address_line2} onChange={e => set('address_line2', e.target.value)} placeholder="Apartment, suite, unit (optional)" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="City / Suburb">
              <input className={inputCls} value={form.city} onChange={e => set('city', e.target.value)} placeholder="City" />
            </Field>
            <Field label="State / Region">
              {states.length > 0 ? (
                <select className={selectCls} value={form.state_region} onChange={e => set('state_region', e.target.value)}>
                  <option value="">Select state</option>
                  {states.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <input className={inputCls} value={form.state_region} onChange={e => set('state_region', e.target.value)} placeholder="State / Province" />
              )}
            </Field>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold text-white mb-4">Accessibility</h3>
        <div className="flex items-start gap-3 p-4 rounded-xl border border-white/8 bg-white/2">
          <button
            onClick={() => set('disability_disclosure', !form.disability_disclosure)}
            className={`mt-0.5 w-10 h-5.5 rounded-full transition-colors shrink-0 relative ${form.disability_disclosure ? 'bg-indigo-600' : 'bg-white/12'}`}
            style={{ width: 40, height: 22 }}
          >
            <span className={`absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${form.disability_disclosure ? 'left-[19px]' : 'left-[2px]'}`} />
          </button>
          <div>
            <p className="text-sm font-medium text-zinc-300">Disability disclosure</p>
            <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
              I have a disability and may require reasonable accommodations from employers.
              This is optional and only visible to you and employers you apply to.
            </p>
          </div>
          <button title="What does this mean?" className="text-zinc-600 hover:text-zinc-400 transition-colors shrink-0 mt-0.5">
            <Info size={14} />
          </button>
        </div>
      </div>

      <SaveBar saving={saving} saved={saved} onSave={handleSave} />
    </div>
  )
}

// ── Experience section ────────────────────────────────────────────────────────

const EMPTY_JOB: WorkExperienceEntry = {
  title: '', company: '', start_date: '', end_date: null, duration_months: null,
  description: '', key_technologies: [], employment_type: null,
}

function JobEntryEditor({ job, index, onChange, onDelete }: {
  job: WorkExperienceEntry; index: number; onChange: (j: WorkExperienceEntry) => void; onDelete: () => void
}) {
  const [open, setOpen] = useState(index === 0)

  function set(key: keyof WorkExperienceEntry, value: unknown) {
    onChange({ ...job, [key]: value })
  }

  return (
    <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/3 transition-colors">
        <GripVertical size={14} className="text-zinc-700 cursor-grab" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{job.title || 'New position'}</p>
          <p className="text-xs text-zinc-500 truncate">{job.company || 'Company'}</p>
        </div>
        <button onClick={e => { e.stopPropagation(); onDelete() }}
          className="p-1 text-zinc-700 hover:text-red-400 transition-colors mr-1">
          <Trash2 size={13} />
        </button>
        {open ? <ChevronUp size={14} className="text-zinc-600 shrink-0" /> : <ChevronDown size={14} className="text-zinc-600 shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/6 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Job Title">
              <input className={inputCls} value={job.title} onChange={e => set('title', e.target.value)} placeholder="Software Engineer" />
            </Field>
            <Field label="Company">
              <input className={inputCls} value={job.company} onChange={e => set('company', e.target.value)} placeholder="Company name" />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Type">
              <select className={selectCls} value={job.employment_type ?? ''} onChange={e => set('employment_type', e.target.value || null)}>
                <option value="">Select</option>
                {['full_time','part_time','freelance','contract','internship'].map(t => (
                  <option key={t} value={t}>{t.replace('_', '-')}</option>
                ))}
              </select>
            </Field>
            <Field label="Start (YYYY-MM)">
              <input className={inputCls} value={job.start_date ?? ''} onChange={e => set('start_date', e.target.value)} placeholder="2022-03" />
            </Field>
            <Field label="End (or blank = present)">
              <input className={inputCls} value={job.end_date ?? ''} onChange={e => set('end_date', e.target.value || null)} placeholder="2024-01" />
            </Field>
          </div>
          <Field label="Description">
            <textarea className={`${inputCls} resize-none`} rows={3} value={job.description ?? ''} onChange={e => set('description', e.target.value)} placeholder="Describe your role and responsibilities…" />
          </Field>
          <Field label="Technologies (comma-separated)">
            <input className={inputCls} value={job.key_technologies.join(', ')} onChange={e => set('key_technologies', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="React, TypeScript, Node.js" />
          </Field>
        </div>
      )}
    </div>
  )
}

function ExperienceSection({ profile, onSave }: { profile: FullProfile; onSave: (data: Partial<FullProfile>) => Promise<void> }) {
  const [jobs, setJobs] = useState<WorkExperienceEntry[]>(profile.work_experience ?? [])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function updateJob(index: number, job: WorkExperienceEntry) {
    setJobs(prev => prev.map((j, i) => i === index ? job : j))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    await onSave({ work_experience: jobs })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-3">
      {jobs.map((job, i) => (
        <JobEntryEditor key={i} job={job} index={i}
          onChange={j => updateJob(i, j)}
          onDelete={() => { setJobs(prev => prev.filter((_, idx) => idx !== i)); setSaved(false) }} />
      ))}
      <button onClick={() => { setJobs(prev => [...prev, { ...EMPTY_JOB }]); setSaved(false) }}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-white/15
          text-xs text-zinc-500 hover:text-zinc-300 hover:border-white/25 transition-colors">
        <Plus size={13} />Add position
      </button>
      <SaveBar saving={saving} saved={saved} onSave={handleSave} />
    </div>
  )
}

// ── Education section ─────────────────────────────────────────────────────────

const EMPTY_EDU: EducationEntry = { institution: '', degree: null, field: null, graduation_year: null, start_year: null, currently_enrolled: false }

function EduEntryEditor({ entry, index, onChange, onDelete }: {
  entry: EducationEntry; index: number; onChange: (e: EducationEntry) => void; onDelete: () => void
}) {
  const [open, setOpen] = useState(index === 0)
  function set(key: keyof EducationEntry, value: unknown) { onChange({ ...entry, [key]: value }) }

  return (
    <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/3 transition-colors">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{entry.institution || 'New institution'}</p>
          <p className="text-xs text-zinc-500 truncate">{[entry.degree, entry.field].filter(Boolean).join(' · ') || 'Degree / Field'}</p>
        </div>
        <button onClick={e => { e.stopPropagation(); onDelete() }} className="p-1 text-zinc-700 hover:text-red-400 transition-colors mr-1">
          <Trash2 size={13} />
        </button>
        {open ? <ChevronUp size={14} className="text-zinc-600" /> : <ChevronDown size={14} className="text-zinc-600" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/6 pt-3">
          <Field label="Institution">
            <input className={inputCls} value={entry.institution} onChange={e => set('institution', e.target.value)} placeholder="University / College name" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Degree">
              <input className={inputCls} value={entry.degree ?? ''} onChange={e => set('degree', e.target.value || null)} placeholder="Bachelor of Science" />
            </Field>
            <Field label="Field of Study">
              <input className={inputCls} value={entry.field ?? ''} onChange={e => set('field', e.target.value || null)} placeholder="Computer Science" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Year">
              <input className={inputCls} type="number" value={entry.start_year ?? ''} onChange={e => set('start_year', parseInt(e.target.value) || null)} placeholder="2019" />
            </Field>
            <Field label="Graduation Year">
              <input className={inputCls} type="number" value={entry.graduation_year ?? ''} onChange={e => set('graduation_year', parseInt(e.target.value) || null)} placeholder="2023" />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
            <input type="checkbox" checked={entry.currently_enrolled ?? false} onChange={e => set('currently_enrolled', e.target.checked)} className="accent-indigo-500 w-3.5 h-3.5" />
            Currently enrolled
          </label>
        </div>
      )}
    </div>
  )
}

function EducationSection({ profile, onSave }: { profile: FullProfile; onSave: (data: Partial<FullProfile>) => Promise<void> }) {
  const [entries, setEntries] = useState<EducationEntry[]>(profile.education ?? [])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave({ education: entries })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-3">
      {entries.map((e, i) => (
        <EduEntryEditor key={i} entry={e} index={i}
          onChange={upd => setEntries(prev => prev.map((x, idx) => idx === i ? upd : x))}
          onDelete={() => { setEntries(prev => prev.filter((_, idx) => idx !== i)); setSaved(false) }} />
      ))}
      <button onClick={() => setEntries(prev => [...prev, { ...EMPTY_EDU }])}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-white/15 text-xs text-zinc-500 hover:text-zinc-300 hover:border-white/25 transition-colors">
        <Plus size={13} />Add education
      </button>
      <SaveBar saving={saving} saved={saved} onSave={handleSave} />
    </div>
  )
}

// ── Projects section ──────────────────────────────────────────────────────────

type ProjectForm = { title: string; description: string; url: string; repo_url: string; tech_stack: string; impact: string }
const EMPTY_PROJECT: ProjectForm = { title: '', description: '', url: '', repo_url: '', tech_stack: '', impact: '' }

function ProjectEditor({ item, onDelete, onChange }: {
  item: ProjectForm; onDelete: () => void; onChange: (p: ProjectForm) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/3 transition-colors">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{item.title || 'New project'}</p>
        </div>
        <button onClick={e => { e.stopPropagation(); onDelete() }} className="p-1 text-zinc-700 hover:text-red-400 transition-colors mr-1"><Trash2 size={13} /></button>
        {open ? <ChevronUp size={14} className="text-zinc-600" /> : <ChevronDown size={14} className="text-zinc-600" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/6 pt-3">
          <Field label="Project Name"><input className={inputCls} value={item.title} onChange={e => onChange({ ...item, title: e.target.value })} placeholder="Project name" /></Field>
          <Field label="Description"><textarea className={`${inputCls} resize-none`} rows={2} value={item.description} onChange={e => onChange({ ...item, description: e.target.value })} placeholder="What did you build and why?" /></Field>
          <Field label="Key Impact"><input className={inputCls} value={item.impact} onChange={e => onChange({ ...item, impact: e.target.value })} placeholder="e.g. Reduced load time by 60%" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Live URL"><input className={inputCls} value={item.url} onChange={e => onChange({ ...item, url: e.target.value })} placeholder="https://" /></Field>
            <Field label="Repo URL"><input className={inputCls} value={item.repo_url} onChange={e => onChange({ ...item, repo_url: e.target.value })} placeholder="https://github.com/…" /></Field>
          </div>
          <Field label="Tech Stack (comma-separated)"><input className={inputCls} value={item.tech_stack} onChange={e => onChange({ ...item, tech_stack: e.target.value })} placeholder="React, Node.js, PostgreSQL" /></Field>
        </div>
      )}
    </div>
  )
}

function toProjectForm(item: PortfolioItem): ProjectForm {
  return { title: item.title, description: item.description ?? '', url: item.url ?? '', repo_url: item.repo_url ?? '', tech_stack: Array.isArray(item.tech_stack) ? item.tech_stack.join(', ') : '', impact: item.impact ?? '' }
}

function ProjectsSection({ profile, onSaveProjects }: { profile: FullProfile; onSaveProjects: (projects: ProjectForm[]) => Promise<void> }) {
  const [items, setItems] = useState<ProjectForm[]>(profile.portfolio_items.map(toProjectForm))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSaveProjects(items)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <ProjectEditor key={i} item={item}
          onChange={upd => setItems(prev => prev.map((x, idx) => idx === i ? upd : x))}
          onDelete={() => setItems(prev => prev.filter((_, idx) => idx !== i))} />
      ))}
      <button onClick={() => setItems(prev => [...prev, { ...EMPTY_PROJECT }])}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-white/15 text-xs text-zinc-500 hover:text-zinc-300 hover:border-white/25 transition-colors">
        <Plus size={13} />Add project
      </button>
      <SaveBar saving={saving} saved={saved} onSave={handleSave} />
    </div>
  )
}

// ── Awards section ────────────────────────────────────────────────────────────

const EMPTY_AWARD: AwardEntry = { title: '', issuer: '', date: '', description: '', url: '' }

function AwardEditor({ award, onDelete, onChange }: {
  award: AwardEntry; onDelete: () => void; onChange: (a: AwardEntry) => void
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/2 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-400">{award.title || 'New award / certification'}</p>
        <button onClick={onDelete} className="text-zinc-700 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Title"><input className={inputCls} value={award.title} onChange={e => onChange({ ...award, title: e.target.value })} placeholder="Award / Certification name" /></Field>
        <Field label="Issuing Organisation"><input className={inputCls} value={award.issuer} onChange={e => onChange({ ...award, issuer: e.target.value })} placeholder="e.g. AWS, Google, Coursera" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date"><input className={inputCls} value={award.date} onChange={e => onChange({ ...award, date: e.target.value })} placeholder="e.g. June 2024" /></Field>
        <Field label="URL (optional)"><input className={inputCls} value={award.url} onChange={e => onChange({ ...award, url: e.target.value })} placeholder="https://credential.net/…" /></Field>
      </div>
      <Field label="Description (optional)"><input className={inputCls} value={award.description} onChange={e => onChange({ ...award, description: e.target.value })} placeholder="Brief description" /></Field>
    </div>
  )
}

function AwardsSection({ profile, onSave }: { profile: FullProfile; onSave: (data: Partial<FullProfile>) => Promise<void> }) {
  const existingAwards: AwardEntry[] = (profile.career_data as (typeof profile.career_data & { awards?: AwardEntry[] }) | null)?.awards ?? []
  const [awards, setAwards] = useState<AwardEntry[]>(existingAwards)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave({ career_data: { ...(profile.career_data ?? {} as NonNullable<typeof profile.career_data>), awards } as typeof profile.career_data })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-3">
      {awards.map((a, i) => (
        <AwardEditor key={i} award={a}
          onChange={upd => setAwards(prev => prev.map((x, idx) => idx === i ? upd : x))}
          onDelete={() => setAwards(prev => prev.filter((_, idx) => idx !== i))} />
      ))}
      <button onClick={() => setAwards(prev => [...prev, { ...EMPTY_AWARD }])}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-white/15 text-xs text-zinc-500 hover:text-zinc-300 hover:border-white/25 transition-colors">
        <Plus size={13} />Add award / certification
      </button>
      <SaveBar saving={saving} saved={saved} onSave={handleSave} />
    </div>
  )
}

// ── Skills section (link to vault) ────────────────────────────────────────────

function SkillsSection() {
  return (
    <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-6 text-center">
      <Layers size={28} className="text-indigo-400 mx-auto mb-3" />
      <p className="text-sm font-semibold text-white mb-1">Skills Vault</p>
      <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
        Your full skills vault with physics bubbles, level breakdowns, and AI-recommended skills to build.
      </p>
      <a href="/profile?tab=vault"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white transition-colors">
        <Layers size={14} />Open Skills Vault
      </a>
    </div>
  )
}

// ── Linked accounts section ───────────────────────────────────────────────────

function AccountLink({ icon: Icon, label, placeholder, value, color, onChange, platform }: {
  icon: React.ComponentType<{ size?: number; className?: string }>; label: string; placeholder: string; value: string; color: string; onChange: (v: string) => void; platform?: ProfileLinkPlatform
}) {
  const warning = platform ? checkProfileLink(value, platform) : null
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${
      warning ? 'border-amber-500/25 bg-amber-500/4' : value ? 'border-white/12 bg-white/3' : 'border-white/7 bg-white/1'
    }`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-zinc-400 mb-1">{label}</p>
        <input className="w-full bg-transparent text-sm text-white placeholder:text-zinc-600 focus:outline-none"
          value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
        {warning && (
          <p className="flex items-start gap-1 text-[11px] text-amber-400/90 mt-1.5 leading-snug">
            <AlertTriangle size={10} className="shrink-0 mt-0.5" />{warning}
          </p>
        )}
      </div>
      {value && (
        <a href={toExternalHref(value) ?? '#'} target="_blank" rel="noopener noreferrer"
          title="Open link in new tab" className="text-zinc-600 hover:text-indigo-400 transition-colors shrink-0 self-center">
          <ExternalLink size={12} />
        </a>
      )}
    </div>
  )
}

function LinkedAccountsSection({ profile, onSave }: { profile: FullProfile; onSave: (data: Partial<FullProfile>) => Promise<void> }) {
  const [form, setForm] = useState({
    github_url: profile.github_url ?? '',
    linkedin_url: profile.linkedin_url ?? '',
    personal_website_url: profile.personal_website_url ?? '',
    seek_url: profile.seek_url ?? '',
    indeed_url: profile.indeed_url ?? '',
    resume_url: profile.resume_url ?? '',
    facebook_url: profile.facebook_url ?? '',
    instagram_url: profile.instagram_url ?? '',
    tiktok_url: profile.tiktok_url ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function set(key: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [key]: value })); setSaved(false)
  }

  async function handleFileUpload(file: File) {
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/candidate/resume-upload', { method: 'POST', body: formData })
      if (res.ok) {
        const { url } = await res.json() as { url: string }
        set('resume_url', url)
      }
    } catch { /* silently fail */ }
    setUploading(false)
  }

  async function handleSave() {
    setSaving(true)
    await onSave(form)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <AccountLink icon={GithubIcon} label="GitHub" platform="github" placeholder="https://github.com/username" value={form.github_url} color="bg-emerald-500/15 text-emerald-400" onChange={v => set('github_url', v)} />
        <AccountLink icon={LinkedinIcon} label="LinkedIn" platform="linkedin" placeholder="https://linkedin.com/in/username" value={form.linkedin_url} color="bg-sky-500/15 text-sky-400" onChange={v => set('linkedin_url', v)} />
        <AccountLink icon={Globe} label="Personal Website" platform="website" placeholder="https://yourname.dev" value={form.personal_website_url} color="bg-violet-500/15 text-violet-400" onChange={v => set('personal_website_url', v)} />
        <AccountLink icon={ExternalLink} label="Seek Profile" platform="seek" placeholder="https://seek.com.au/profile/…" value={form.seek_url} color="bg-orange-500/15 text-orange-400" onChange={v => set('seek_url', v)} />
        <AccountLink icon={ExternalLink} label="Indeed Profile" platform="indeed" placeholder="https://indeed.com/r/…" value={form.indeed_url} color="bg-blue-500/15 text-blue-400" onChange={v => set('indeed_url', v)} />
      </div>

      {/* Social — optional, for marketing / comms / media / content-creator roles */}
      <div className="space-y-2">
        <div className="flex items-start gap-2 px-1">
          <Info size={12} className="text-zinc-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-zinc-600 leading-relaxed">
            Social accounts are optional — useful for marketing, comms, media and content-creator roles.
            Add only <span className="text-zinc-400">public</span> profiles so viewers can open them without logging in.
          </p>
        </div>
        <AccountLink icon={InstagramIcon} label="Instagram" platform="instagram" placeholder="https://instagram.com/username" value={form.instagram_url} color="bg-pink-500/15 text-pink-400" onChange={v => set('instagram_url', v)} />
        <AccountLink icon={TiktokIcon} label="TikTok" platform="tiktok" placeholder="https://tiktok.com/@username" value={form.tiktok_url} color="bg-zinc-500/15 text-zinc-200" onChange={v => set('tiktok_url', v)} />
        <AccountLink icon={FacebookIcon} label="Facebook" platform="facebook" placeholder="https://facebook.com/username" value={form.facebook_url} color="bg-blue-600/15 text-blue-400" onChange={v => set('facebook_url', v)} />
      </div>

      <div className="p-4 rounded-xl border border-white/8 bg-white/2">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
            <FileText size={15} />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-300">Resume / CV</p>
            <p className="text-xs text-zinc-600">PDF, Word or any format</p>
          </div>
        </div>
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden"
          onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]) }} />
        {form.resume_url ? (
          <div className="flex items-center gap-2">
            <a href={form.resume_url} target="_blank" rel="noopener noreferrer"
              className="flex-1 text-xs text-indigo-400 hover:text-indigo-300 truncate flex items-center gap-1">
              <ExternalLink size={11} />View current resume
            </a>
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Replace</button>
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-white/15
              text-xs text-zinc-500 hover:text-zinc-300 hover:border-white/25 transition-colors">
            {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
            {uploading ? 'Uploading…' : 'Upload resume / CV'}
          </button>
        )}
        {form.resume_url && (
          <div className="mt-2">
            <Field label="Or paste URL directly">
              <input className={inputCls} value={form.resume_url} onChange={e => set('resume_url', e.target.value)} placeholder="https://…" />
            </Field>
          </div>
        )}
      </div>

      <SaveBar saving={saving} saved={saved} onSave={handleSave} />
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

const SECTION_TITLES: Record<EditSection, string> = {
  personal:   'Personal Information',
  experience: 'Work Experience',
  education:  'Education',
  projects:   'Projects',
  awards:     'Awards & Certifications',
  skills:     'Skills Vault',
  accounts:   'Linked Accounts',
  ai:         'AI Profiling',
}

const VALID_SECTIONS = new Set<EditSection>(['personal', 'experience', 'education', 'projects', 'awards', 'skills', 'accounts', 'ai'])

export function ProfileEditMode({ profile, onSave, onSaveProjects, initialSection }: {
  profile: FullProfile
  onSave: (data: Partial<FullProfile>) => Promise<void>
  onSaveProjects: (projects: { title: string; description: string; url: string; repo_url: string; tech_stack: string; impact: string }[]) => Promise<void>
  initialSection?: string | null
}) {
  const [section, setSection] = useState<EditSection>(
    initialSection && VALID_SECTIONS.has(initialSection as EditSection) ? initialSection as EditSection : 'personal'
  )

  return (
    <div className="flex gap-8 py-8 px-4 max-w-5xl mx-auto items-start">
      <EditSectionNav active={section} onChange={setSection} />

      <div className="flex-1 min-w-0">
        <h2 className="text-base font-semibold text-white mb-6">{SECTION_TITLES[section]}</h2>
        {section === 'personal'    && <PersonalInfoSection profile={profile} onSave={onSave} />}
        {section === 'experience'  && <ExperienceSection profile={profile} onSave={onSave} />}
        {section === 'education'   && <EducationSection profile={profile} onSave={onSave} />}
        {section === 'projects'    && <ProjectsSection profile={profile} onSaveProjects={onSaveProjects} />}
        {section === 'awards'      && <AwardsSection profile={profile} onSave={onSave} />}
        {section === 'skills'      && <SkillsSection />}
        {section === 'accounts'    && <LinkedAccountsSection profile={profile} onSave={onSave} />}
        {section === 'ai'          && <AIProfilingSection profile={profile} onSave={onSave} />}
      </div>
    </div>
  )
}
