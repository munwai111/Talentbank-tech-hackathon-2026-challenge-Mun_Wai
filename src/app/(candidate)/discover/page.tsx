'use client'

// /discover — Career Identity Builder (5-step form + AI synthesis)
//
// Step 1: Where are you now?      (situation, education, experience)
// Step 2: What are you looking for? (industries, roles, company type, location)
// Step 3: What matters to you?    (values, work style, motivation)
// Step 4: Where are you headed?   (goals, dream role, deal-breakers)
// Step 5: Life Chapter Designer   (life events that shape career plan — C-05)
// → AI generates Career Identity narrative from all answers

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import type { CareerData } from '@/types/database'

// ── Reusable multi-select chip component ──────────────────────────────────────
function ChipSelect({
  options, selected, onChange, max,
}: {
  options: string[]
  selected: string[]
  onChange: (v: string[]) => void
  max?: number
}) {
  function toggle(opt: string) {
    if (selected.includes(opt)) {
      onChange(selected.filter(s => s !== opt))
    } else {
      if (max && selected.length >= max) return
      onChange([...selected, opt])
    }
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
            selected.includes(opt)
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white/6 text-zinc-400 border-white/15 hover:border-white/30'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

// ── Step progress indicator ───────────────────────────────────────────────────
function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
            i < current ? 'bg-indigo-600 text-white' :
            i === current ? 'bg-indigo-500/20 text-indigo-300 border-2 border-indigo-500' :
            'bg-white/8 text-zinc-500'
          }`}>
            {i < current ? '✓' : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`h-0.5 w-8 ${i < current ? 'bg-indigo-600' : 'bg-white/15'}`} />
          )}
        </div>
      ))}
      <span className="text-sm text-zinc-400 ml-2">Step {current + 1} of {total}</span>
    </div>
  )
}

// ── Default empty form state ───────────────────────────────────────────────────
const EMPTY: CareerData = {
  current_situation: null,
  education_level: null,
  education_field: null,
  education_institution: null,
  graduation_year: null,
  years_experience: null,
  current_or_last_role: null,
  current_or_last_company: null,
  key_achievements: null,
  preferred_industries: [],
  preferred_job_functions: [],
  preferred_company_types: [],
  preferred_work_arrangement: null,
  open_to_relocation: false,
  preferred_locations: [],
  values_priorities: [],
  work_style: [],
  why_this_field: null,
  goal_1_year: null,
  goal_5_year: null,
  dream_role: null,
  deal_breakers: null,
  life_chapter_context: null,
  career_identity_summary: null,
  synthesized_at: null,
}

const LIFE_CHAPTER_PILLS = [
  'I have caregiving responsibilities',
  "I'm planning a career break or parental leave",
  "I'm returning after a career gap",
  'I need to stay in a specific location',
  "I'm managing a health condition",
  'I want to reduce hours or go part-time',
  'None of the above — no constraints right now',
]

export default function DiscoverPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<CareerData>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [synthesis, setSynthesis] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load existing data if user has been here before
  useEffect(() => {
    fetch('/api/candidate/career-data')
      .then(r => r.json())
      .then(({ career_data }) => {
        if (career_data) {
          setForm(career_data)
          setSynthesis(career_data.career_identity_summary ?? null)
        }
      })
  }, [])

  function set<K extends keyof CareerData>(key: K, value: CareerData[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function submit() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/candidate/career-data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSynthesis(data.career_identity_summary)
      setStep(5) // success/result step
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
    setSaving(false)
  }

  // ── Step 1: Where are you now? ───────────────────────────────────────────
  const step1 = (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Where are you right now?</h2>
        <p className="text-zinc-500 text-sm">This helps us understand your starting point. There are no wrong answers.</p>
      </div>

      <div>
        <Label className="mb-2 block">Current situation *</Label>
        <div className="grid grid-cols-2 gap-3">
          {([
            { value: 'student',        label: '🎓 Still studying' },
            { value: 'fresh_grad',     label: '🏛️ Recently graduated' },
            { value: 'employed',       label: '💼 Currently working' },
            { value: 'career_changer', label: '🔄 Changing careers' },
          ] as const).map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set('current_situation', opt.value)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                form.current_situation === opt.value
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-white/15 hover:border-white/30'
              }`}
            >
              <span className="text-sm font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="mb-2 block">Highest education level</Label>
          <div className="space-y-1.5">
            {([
              ['high_school', 'High school / SPM'],
              ['diploma',     'Diploma'],
              ['degree',      'Bachelor\'s degree'],
              ['masters',     'Master\'s degree'],
              ['phd',         'PhD'],
              ['self_taught', 'Self-taught'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => set('education_level', value)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-all ${
                  form.education_level === value
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                    : 'border-white/15 hover:border-white/30'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Field of study</Label>
            <Input
              placeholder="e.g. Computer Science, Business, Engineering"
              value={form.education_field ?? ''}
              onChange={e => set('education_field', e.target.value || null)}
            />
          </div>
          <div>
            <Label>Institution</Label>
            <Input
              placeholder="e.g. UPM, UTM, Taylor's, HELP"
              value={form.education_institution ?? ''}
              onChange={e => set('education_institution', e.target.value || null)}
            />
          </div>
          <div>
            <Label>Graduation year</Label>
            <Input
              type="number"
              placeholder="e.g. 2024"
              value={form.graduation_year ?? ''}
              onChange={e => set('graduation_year', e.target.value ? parseInt(e.target.value) : null)}
            />
          </div>
          <div>
            <Label>Years of work experience</Label>
            <Input
              type="number"
              placeholder="0 if fresh grad / student"
              value={form.years_experience ?? ''}
              onChange={e => set('years_experience', e.target.value ? parseInt(e.target.value) : null)}
            />
          </div>
        </div>
      </div>

      {(form.current_situation === 'employed' || form.current_situation === 'career_changer') && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Current / last job title</Label>
            <Input
              placeholder="e.g. Junior Developer, Marketing Executive"
              value={form.current_or_last_role ?? ''}
              onChange={e => set('current_or_last_role', e.target.value || null)}
            />
          </div>
          <div>
            <Label>Company name</Label>
            <Input
              placeholder="e.g. Grab, Maybank, a startup..."
              value={form.current_or_last_company ?? ''}
              onChange={e => set('current_or_last_company', e.target.value || null)}
            />
          </div>
        </div>
      )}

      <div>
        <Label>Key achievement so far (optional)</Label>
        <Textarea
          placeholder="e.g. Led a team of 3 to rebuild our checkout flow, cutting drop-off by 20%. Or: Built a personal project with 500 active users."
          value={form.key_achievements ?? ''}
          onChange={e => set('key_achievements', e.target.value || null)}
          rows={3}
        />
        <p className="text-xs text-zinc-400 mt-1">One specific, concrete achievement — not a list. Numbers help.</p>
      </div>
    </div>
  )

  // ── Step 2: What are you looking for? ────────────────────────────────────
  const step2 = (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">What are you looking for?</h2>
        <p className="text-zinc-500 text-sm">Be honest. This isn&apos;t a CV — nobody&apos;s judging you for wanting a well-funded startup over a GLC.</p>
      </div>

      <div>
        <Label className="mb-2 block">Industries you want to work in (pick up to 4)</Label>
        <ChipSelect
          max={4}
          options={['Technology', 'Financial Services', 'E-commerce', 'Healthcare', 'Education', 'Media & Entertainment', 'Government / GLC', 'NGO / Social Impact', 'Consulting', 'FMCG / Retail', 'Manufacturing', 'Real Estate', 'Logistics', 'Energy', 'Open to anything']}
          selected={form.preferred_industries}
          onChange={v => set('preferred_industries', v)}
        />
      </div>

      <div>
        <Label className="mb-2 block">Job functions you want (pick up to 3)</Label>
        <ChipSelect
          max={3}
          options={['Software Engineering', 'Data / Analytics', 'Product Management', 'Design / UX', 'DevOps / Infrastructure', 'Business Development', 'Marketing', 'Finance / Accounting', 'Operations', 'HR / People', 'Research', 'Sales', 'Customer Success']}
          selected={form.preferred_job_functions}
          onChange={v => set('preferred_job_functions', v)}
        />
      </div>

      <div>
        <Label className="mb-2 block">Company types you prefer</Label>
        <ChipSelect
          options={['Early-stage startup', 'Growth-stage startup', 'Mid-size company', 'Large corporation / MNC', 'Government / GLC', 'NGO / Non-profit', 'Family-owned business', 'No preference']}
          selected={form.preferred_company_types}
          onChange={v => set('preferred_company_types', v)}
        />
      </div>

      <div>
        <Label className="mb-2 block">Preferred work arrangement</Label>
        <div className="flex gap-3">
          {([
            { value: 'remote',   label: '🌐 Fully remote' },
            { value: 'hybrid',   label: '🏠 Hybrid' },
            { value: 'onsite',   label: '🏢 On-site' },
            { value: 'flexible', label: '✨ No preference' },
          ] as const).map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set('preferred_work_arrangement', opt.value)}
              className={`flex-1 py-2.5 rounded-lg text-sm border-2 transition-all ${
                form.preferred_work_arrangement === opt.value
                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 font-medium'
                  : 'border-white/15 hover:border-white/30'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Preferred locations</Label>
        <ChipSelect
          options={['Kuala Lumpur', 'Selangor (PJ / Subang / Shah Alam)', 'Penang', 'Johor Bahru', 'Singapore', 'Jakarta', 'Bangkok', 'Anywhere in Malaysia', 'Open to APAC', 'Remote only']}
          selected={form.preferred_locations}
          onChange={v => set('preferred_locations', v)}
        />
        <div className="flex items-center gap-2 mt-3">
          <input
            type="checkbox"
            id="reloc"
            checked={form.open_to_relocation}
            onChange={e => set('open_to_relocation', e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <label htmlFor="reloc" className="text-sm cursor-pointer">
            I&apos;m open to relocating for the right role
          </label>
        </div>
      </div>
    </div>
  )

  // ── Step 3: What matters to you? ─────────────────────────────────────────
  const step3 = (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">What matters to you?</h2>
        <p className="text-zinc-500 text-sm">This shapes how we present you to employers — and helps you find places where you&apos;ll actually thrive.</p>
      </div>

      <div>
        <Label className="mb-2 block">What matters most in a job? (pick up to 4, in order of importance)</Label>
        <p className="text-xs text-zinc-400 mb-2">Order matters — pick your highest priority first.</p>
        <ChipSelect
          max={4}
          options={['Career growth', 'Salary & compensation', 'Work-life balance', 'Meaningful impact', 'Learning opportunities', 'Job security / stability', 'Team & culture', 'Autonomy & ownership', 'Brand / prestige', 'Purpose & mission']}
          selected={form.values_priorities}
          onChange={v => set('values_priorities', v)}
        />
      </div>

      <div>
        <Label className="mb-2 block">How do you work best? (pick all that apply)</Label>
        <ChipSelect
          options={['Collaborative team environment', 'Independent / deep focus work', 'Fast-paced, always changing', 'Structured and predictable', 'Creative and experimental', 'Data-driven and analytical', 'High ownership, low oversight', 'Clear direction and support', 'Remote-first culture', 'In-person energy']}
          selected={form.work_style}
          onChange={v => set('work_style', v)}
        />
      </div>

      <div>
        <Label>What drew you to your field? *</Label>
        <Textarea
          placeholder="e.g. I got into software because I built a tool for my mum's shop and saw it actually change how she worked. I want to keep building things that solve real problems for real people — not just internal tools."
          value={form.why_this_field ?? ''}
          onChange={e => set('why_this_field', e.target.value || null)}
          rows={4}
        />
        <p className="text-xs text-zinc-400 mt-1">Be specific. A genuine answer here is more valuable than a polished one.</p>
      </div>
    </div>
  )

  // ── Step 4: Where are you headed? ────────────────────────────────────────
  const step4 = (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Where are you headed?</h2>
        <p className="text-zinc-500 text-sm">Your goals help employers understand whether they can actually get you where you want to go.</p>
      </div>

      <div>
        <Label>In 1–2 years, where do you want to be?</Label>
        <Textarea
          placeholder="e.g. I want to be a mid-level engineer who has shipped at least two production features and is starting to mentor junior devs. I'm not chasing a title — I want to be genuinely useful."
          value={form.goal_1_year ?? ''}
          onChange={e => set('goal_1_year', e.target.value || null)}
          rows={3}
        />
      </div>

      <div>
        <Label>In 5 years?</Label>
        <Textarea
          placeholder="e.g. I want to be technical enough to design systems end-to-end and trusted enough to lead a small team. I&apos;m open to pivoting into product if the right opportunity comes."
          value={form.goal_5_year ?? ''}
          onChange={e => set('goal_5_year', e.target.value || null)}
          rows={3}
        />
      </div>

      <div>
        <Label>Dream role (optional)</Label>
        <Input
          placeholder="e.g. CTO of a climate-tech company, Head of Product at a Series B startup..."
          value={form.dream_role ?? ''}
          onChange={e => set('dream_role', e.target.value || null)}
        />
        <p className="text-xs text-zinc-400 mt-1">Be honest — this is private context for matching, not your CV.</p>
      </div>

      <div>
        <Label>Anything you will not do? (optional)</Label>
        <Input
          placeholder="e.g. Won't do sales-heavy roles. Not interested in pure corporate environments with no autonomy."
          value={form.deal_breakers ?? ''}
          onChange={e => set('deal_breakers', e.target.value || null)}
        />
        <p className="text-xs text-zinc-400 mt-1">Deal-breakers help us filter out bad fits before they waste your time.</p>
      </div>
    </div>
  )

  // ── Step 5: Life Chapter Designer (C-05) ────────────────────────────────
  const step5 = (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Life comes first.</h2>
        <p className="text-zinc-500 text-sm">
          Your career plan should fit your actual life — not the other way around. Is there anything we should know?
          This step is completely optional and private.
        </p>
      </div>

      <div>
        <p className="text-sm font-medium text-zinc-300 mb-3">Select anything that applies, or describe it below.</p>
        <div className="flex flex-wrap gap-2">
          {LIFE_CHAPTER_PILLS.map(pill => {
            const isSelected = form.life_chapter_context === pill
            return (
              <button
                key={pill}
                type="button"
                onClick={() => set('life_chapter_context', isSelected ? null : pill)}
                className={`px-3 py-2 rounded-full text-sm border transition-all text-left ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white/6 text-zinc-400 border-white/15 hover:border-white/30'
                }`}
              >
                {pill}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Something else? Tell us in your own words.</Label>
        <Textarea
          placeholder="e.g. I'm caring for my mum and need to stay in Klang Valley. I can't take roles with unpredictable hours or frequent travel."
          value={
            form.life_chapter_context && !LIFE_CHAPTER_PILLS.includes(form.life_chapter_context)
              ? form.life_chapter_context
              : ''
          }
          onChange={e => set('life_chapter_context', e.target.value || null)}
          rows={3}
        />
        <p className="text-xs text-zinc-400 mt-1">
          Your words will override any pill selection above.
        </p>
      </div>

      <div className="bg-white/4 rounded-xl p-4 text-sm text-zinc-400 border border-white/8">
        <p className="font-medium text-zinc-300 mb-1">🔒 This is never shown to employers.</p>
        <p>It only shapes your career paths and coach advice — so both are relevant to your real life, not an idealised version of it. You can skip this step with no impact on your matches.</p>
      </div>
    </div>
  )

  // ── Step 6: Result (AI synthesis) ────────────────────────────────────────
  const stepResult = (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-4xl mb-3">✨</p>
        <h2 className="text-xl font-bold mb-1">Your Career Identity</h2>
        <p className="text-zinc-500 text-sm">AI-generated from your answers. This is what shapes your matches.</p>
      </div>

      {synthesis ? (
        <Card className="p-6 bg-gradient-to-br from-indigo-500/10 to-white/4 border-indigo-500/20">
          <p className="text-sm font-medium text-indigo-400 mb-3">🤖 Career Identity narrative</p>
          <p className="text-zinc-300 leading-relaxed">{synthesis}</p>
        </Card>
      ) : (
        <Card className="p-6 bg-white/4">
          <p className="text-sm text-zinc-400">
            Your answers have been saved. The AI narrative could not be generated this time —
            but your profile data is complete and is being used for matching.
          </p>
        </Card>
      )}

      <Card className="p-5 border-white/10">
        <p className="text-sm font-medium text-zinc-300 mb-3">Summary of your profile</p>
        <dl className="space-y-2 text-sm">
          {form.current_situation && <div className="flex gap-2"><dt className="text-zinc-400 w-28 shrink-0">Situation</dt><dd>{form.current_situation.replace('_', ' ')}</dd></div>}
          {form.education_field && <div className="flex gap-2"><dt className="text-zinc-400 w-28 shrink-0">Education</dt><dd>{form.education_level} in {form.education_field}</dd></div>}
          {form.preferred_industries.length > 0 && <div className="flex gap-2"><dt className="text-zinc-400 w-28 shrink-0">Target industries</dt><dd>{form.preferred_industries.join(', ')}</dd></div>}
          {form.values_priorities.length > 0 && <div className="flex gap-2"><dt className="text-zinc-400 w-28 shrink-0">Top values</dt><dd>{form.values_priorities.join(' › ')}</dd></div>}
          {form.goal_1_year && <div className="flex gap-2"><dt className="text-zinc-400 w-28 shrink-0">1-year goal</dt><dd className="line-clamp-2">{form.goal_1_year}</dd></div>}
        </dl>
      </Card>

      <div className="flex gap-3">
        <Button onClick={() => router.push('/jobs')} className="flex-1">
          See my job matches →
        </Button>
        <Button variant="outline" onClick={() => setStep(0)}>
          Edit answers
        </Button>
      </div>
    </div>
  )

  const steps = [step1, step2, step3, step4, step5]
  const isFinalFormStep = step === 4

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Career Identity Builder 🧭</h1>
        <p className="text-zinc-500 mt-1">
          5 steps. About 6 minutes. What you share here shapes every match, path, and coaching conversation.
        </p>
      </div>

      {step < 5 && <StepProgress current={step} total={5} />}

      <Card className="p-6">
        {step < 5 ? steps[step] : stepResult}

        {step < 5 && (
          <>
            {error && (
              <p className="mt-4 text-sm text-red-400 bg-red-500/8 border border-red-500/20 rounded-lg px-4 py-3">
                ⚠️ {error}
              </p>
            )}
            <div className="flex justify-between mt-8 pt-4 border-t border-white/8">
              <Button
                variant="ghost"
                onClick={() => setStep(s => s - 1)}
                disabled={step === 0}
              >
                ← Back
              </Button>

              {isFinalFormStep ? (
                <Button onClick={submit} disabled={saving}>
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating your Career Identity...
                    </span>
                  ) : 'Save & generate Career Identity →'}
                </Button>
              ) : (
                <Button onClick={() => setStep(s => s + 1)}>
                  Next →
                </Button>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
