'use client'

// /employer/jobs/new — Post a new job listing
// Tag-input UI for skills so employers don't need to know skill names exactly.
// Skills are stored as string[] which feeds directly into the matching engine.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

// Tag input — press Enter or comma to add a skill chip
function TagInput({
  tags, onChange, placeholder,
}: {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder: string
}) {
  const [input, setInput] = useState('')

  function add() {
    const trimmed = input.trim().replace(/,+$/, '')
    if (trimmed && !tags.includes(trimmed)) onChange([...tags, trimmed])
    setInput('')
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() }
          }}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button type="button" variant="outline" onClick={add} disabled={!input.trim()}>
          Add
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <Badge key={tag} variant="secondary" className="gap-1 pr-1">
              {tag}
              <button
                onClick={() => onChange(tags.filter(t => t !== tag))}
                className="ml-1 hover:text-red-500 transition-colors text-xs leading-none"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PostJobPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    remote: 'hybrid' as 'onsite' | 'hybrid' | 'remote',
    salary_min: '',
    salary_max: '',
  })
  const [required, setRequired] = useState<string[]>([])
  const [nice, setNice] = useState<string[]>([])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.description.trim()) {
      setError('Job title and description are required.')
      return
    }
    if (required.length === 0) {
      setError('Add at least one required skill so candidates can be matched.')
      return
    }

    setSaving(true)
    setError(null)

    const res = await fetch('/api/employer/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        salary_min: form.salary_min ? parseInt(form.salary_min) : null,
        salary_max: form.salary_max ? parseInt(form.salary_max) : null,
        required_skills: required,
        nice_to_have_skills: nice,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      setSaving(false)
      return
    }

    // Redirect to the matched candidates view for this new job
    router.push(`/employer/candidates/${data.job.id}`)
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Post a Job ➕</h1>
        <p className="text-zinc-500 mt-1">
          Define the role and required skills. Candidates are matched the moment you publish.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <Card className="p-6 space-y-5">
          <h2 className="font-semibold text-sm text-zinc-500 uppercase tracking-wide">Role details</h2>

          <div>
            <Label>Job title *</Label>
            <Input
              placeholder="e.g. Senior Full Stack Developer, Data Analyst, Product Manager"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div>
            <Label>Description *</Label>
            <Textarea
              placeholder="Describe the role, team, and what success looks like in the first 6 months. Be specific — vague descriptions attract unqualified candidates."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={5}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Location</Label>
              <Input
                placeholder="e.g. Kuala Lumpur, Malaysia"
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              />
            </div>
            <div>
              <Label>Work arrangement</Label>
              <Select
                value={form.remote}
                onValueChange={v => setForm(f => ({ ...f, remote: v as typeof form.remote }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="onsite">🏢 On-site</SelectItem>
                  <SelectItem value="hybrid">🏠 Hybrid</SelectItem>
                  <SelectItem value="remote">🌐 Remote</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Min salary (MYR/month)</Label>
              <Input
                type="number"
                placeholder="e.g. 6000"
                value={form.salary_min}
                onChange={e => setForm(f => ({ ...f, salary_min: e.target.value }))}
              />
            </div>
            <div>
              <Label>Max salary (MYR/month)</Label>
              <Input
                type="number"
                placeholder="e.g. 10000"
                value={form.salary_max}
                onChange={e => setForm(f => ({ ...f, salary_max: e.target.value }))}
              />
            </div>
          </div>
        </Card>

        {/* ── Skills section ──────────────────────────────────── */}
        <Card className="p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-sm text-zinc-500 uppercase tracking-wide mb-1">Skills</h2>
            <p className="text-xs text-zinc-400">
              These drive the matching engine. Be specific: &quot;React&quot; not &quot;frontend development&quot;.
            </p>
          </div>

          <div>
            <Label>Required skills *</Label>
            <p className="text-xs text-zinc-400 mb-2">
              Candidates missing these will rank low. Add and press Enter.
            </p>
            <TagInput tags={required} onChange={setRequired} placeholder="e.g. React, Node.js, PostgreSQL..." />
          </div>

          <div>
            <Label>Nice-to-have skills</Label>
            <p className="text-xs text-zinc-400 mb-2">
              Improve ranking but not dealbreakers.
            </p>
            <TagInput tags={nice} onChange={setNice} placeholder="e.g. Docker, AWS, GraphQL..." />
          </div>
        </Card>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            ⚠️ {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Publishing...
              </span>
            ) : 'Publish job — start matching →'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
