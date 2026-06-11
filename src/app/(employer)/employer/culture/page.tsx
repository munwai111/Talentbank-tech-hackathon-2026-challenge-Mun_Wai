'use client'

// /employer/culture — Employer Culture Identity Builder (2-step form + AI synthesis)
//
// Step 1: Your culture (descriptors, work arrangement, benefits)
// Step 2: What makes you different (value prop, growth paths, hiring criteria)
// → AI generates an Employer Identity narrative

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import type { CultureData } from '@/types/database'

function ChipSelect({
  options, selected, onChange,
}: {
  options: string[]
  selected: string[]
  onChange: (v: string[]) => void
}) {
  function toggle(opt: string) {
    onChange(selected.includes(opt)
      ? selected.filter(s => s !== opt)
      : [...selected, opt])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={`px-3 py-1.5 rounded-full text-sm border transition ${
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

const EMPTY: CultureData = {
  culture_tags: [],
  work_arrangements: [],
  why_work_here: null,
  employee_growth_path: null,
  cultural_fit_criteria: [],
  benefits: [],
  typical_roles: [],
  employer_identity_summary: null,
  synthesized_at: null,
}

export default function EmployerCulturePage() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<CultureData>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [synthesis, setSynthesis] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    fetch('/api/employer/culture-data')
      .then(r => r.json())
      .then(({ culture_data }) => {
        if (culture_data) {
          setForm(culture_data)
          setSynthesis(culture_data.employer_identity_summary ?? null)
          if (culture_data.synthesized_at) setDone(true)
        }
      })
  }, [])

  function set<K extends keyof CultureData>(key: K, value: CultureData[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function submit() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/employer/culture-data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSynthesis(data.employer_identity_summary)
      setDone(true)
      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
    setSaving(false)
  }

  // Step 1: Culture
  const step1 = (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">What is it like to work here?</h2>
        <p className="text-zinc-500 text-sm">Be honest. Candidates who resonate with your real culture will stay longer.</p>
      </div>

      <div>
        <Label className="mb-2 block">Culture descriptors (pick all that fit)</Label>
        <ChipSelect
          options={['Fast-paced', 'Steady and structured', 'Flat hierarchy', 'Traditional hierarchy', 'Mission-driven', 'Profit-driven', 'Collaborative', 'Independent', 'High ownership', 'Lots of process', 'Creative', 'Data-driven', 'Startup energy', 'Corporate stability', 'Family-like', 'Professional and formal']}
          selected={form.culture_tags}
          onChange={v => set('culture_tags', v)}
        />
      </div>

      <div>
        <Label className="mb-2 block">Work arrangements you offer</Label>
        <ChipSelect
          options={['Fully remote', 'Hybrid (flexible days)', 'Hybrid (set days)', 'On-site only', 'Varies by role']}
          selected={form.work_arrangements}
          onChange={v => set('work_arrangements', v)}
        />
      </div>

      <div>
        <Label className="mb-2 block">Benefits and perks</Label>
        <ChipSelect
          options={['Medical & dental', 'EPF/SOCSO (statutory)', 'Performance bonus', 'Equity / ESOP', 'Annual leave above statutory', 'Flexible hours', 'Learning & development budget', 'Team retreats', 'Mental health support', 'Childcare support', 'Transport allowance', 'Phone allowance', 'Free meals / pantry']}
          selected={form.benefits}
          onChange={v => set('benefits', v)}
        />
      </div>

      <div>
        <Label className="mb-2 block">What types of roles do you typically hire for?</Label>
        <ChipSelect
          options={['Software Engineering', 'Data / Analytics', 'Product Management', 'Design / UX', 'DevOps / Infrastructure', 'Business Development', 'Marketing', 'Finance / Accounting', 'Operations', 'HR / People', 'Sales', 'Customer Success', 'Research']}
          selected={form.typical_roles}
          onChange={v => set('typical_roles', v)}
        />
      </div>
    </div>
  )

  // Step 2: What makes you different
  const step2form = (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">What makes you worth working for?</h2>
        <p className="text-zinc-500 text-sm">Go beyond the job description. Help candidates understand why they should choose you.</p>
      </div>

      <div>
        <Label>Why do people love working here? *</Label>
        <Textarea
          placeholder="e.g. Every engineer owns their features end-to-end and deploys to production weekly. There's no bureaucracy between an idea and shipping it. Senior engineers pair with juniors regularly — growth is a team sport here."
          value={form.why_work_here ?? ''}
          onChange={e => set('why_work_here', e.target.value || null)}
          rows={4}
        />
        <p className="text-xs text-zinc-400 mt-1">Be specific. &quot;Great culture&quot; means nothing. Specifics mean everything.</p>
      </div>

      <div>
        <Label>How do careers progress here?</Label>
        <Textarea
          placeholder="e.g. Most of our team leads started as individual contributors. We review salaries every 6 months. Within 18 months, strong performers typically move from junior to mid-level with a 20-30% salary increase."
          value={form.employee_growth_path ?? ''}
          onChange={e => set('employee_growth_path', e.target.value || null)}
          rows={3}
        />
      </div>

      <div>
        <Label className="mb-2 block">What do you look for beyond skills?</Label>
        <ChipSelect
          options={['Ownership mindset', 'Growth mindset', 'Team player', 'Self-starter', 'Attention to detail', 'Speed over perfection', 'Precision over speed', 'Customer empathy', 'Data-driven thinking', 'Clear communication', 'Honesty and directness', 'Resilience']}
          selected={form.cultural_fit_criteria}
          onChange={v => set('cultural_fit_criteria', v)}
        />
      </div>
    </div>
  )

  // Result
  const result = (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-4xl mb-3">✨</p>
        <h2 className="text-xl font-bold mb-1">Your Employer Identity</h2>
        <p className="text-zinc-500 text-sm">This narrative is shown to candidates alongside your job listings.</p>
      </div>

      {synthesis ? (
        <Card className="p-6 bg-gradient-to-br from-indigo-500/10 to-white/4 border-indigo-500/20">
          <p className="text-sm font-medium text-indigo-400 mb-3">🤖 Employer Identity narrative</p>
          <p className="text-zinc-300 leading-relaxed">{synthesis}</p>
        </Card>
      ) : (
        <Card className="p-6 bg-white/4">
          <p className="text-sm text-zinc-400">
            Your culture data has been saved. The AI narrative could not be generated this time — your profile is still complete.
          </p>
        </Card>
      )}

      <div className="flex gap-3">
        <Button onClick={() => window.location.href = '/employer/jobs/new'} className="flex-1">
          Post a job →
        </Button>
        <Button variant="outline" onClick={() => setStep(0)}>
          Edit answers
        </Button>
      </div>
    </div>
  )

  const steps = [step1, step2form]

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Culture Profile 🏢</h1>
        <p className="text-zinc-500 mt-1">
          Help candidates understand who you are — not just what the role is.
          {done && <span className="ml-2 text-emerald-400 text-sm font-medium">✓ Completed</span>}
        </p>
      </div>

      {/* Step indicators */}
      {step < 2 && (
        <div className="flex items-center gap-2 mb-6">
          {[0, 1].map(i => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                i < step ? 'bg-indigo-600 text-white' :
                i === step ? 'bg-indigo-500/20 text-indigo-300 border-2 border-indigo-500' :
                'bg-white/8 text-zinc-500'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              {i < 1 && <div className={`h-0.5 w-8 ${i < step ? 'bg-indigo-600' : 'bg-white/15'}`} />}
            </div>
          ))}
          <span className="text-sm text-zinc-400 ml-2">Step {step + 1} of 2</span>
        </div>
      )}

      <Card className="p-6">
        {step < 2 ? steps[step] : result}

        {step < 2 && (
          <>
            {error && (
              <p className="mt-4 text-sm text-red-400 bg-red-500/8 border border-red-500/20 rounded-lg px-4 py-3">
                ⚠️ {error}
              </p>
            )}
            <div className="flex justify-between mt-8 pt-4 border-t border-white/8">
              <Button variant="ghost" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
                ← Back
              </Button>
              {step === 1 ? (
                <Button onClick={submit} disabled={saving}>
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating your Employer Identity...
                    </span>
                  ) : 'Save & generate Employer Identity →'}
                </Button>
              ) : (
                <Button onClick={() => setStep(1)}>Next →</Button>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
