'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { CandidateProfile, Skill, PortfolioItem, WorkExperienceEntry, EducationEntry } from '@/types/database'
import type { ExtractedProfile } from '@/lib/ai/profile-extractor'

// ─────────────────────────────────────────────────────────────
// Types for the combined profile response
// ─────────────────────────────────────────────────────────────
type FullProfile = CandidateProfile & {
  skills: Skill[]
  portfolio_items: PortfolioItem[]
  work_experience: WorkExperienceEntry[] | null
  education: EducationEntry[] | null
}

// Skill level labels — shown as human-readable text not just numbers
const LEVEL_LABELS: Record<number, string> = {
  1: 'Beginner',
  2: 'Elementary',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Expert',
}

const LEVEL_COLORS: Record<number, { badge: string; bar: string; accent: string }> = {
  1: { badge: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',   bar: 'bg-zinc-500',   accent: '#71717a' },
  2: { badge: 'bg-blue-500/15 text-blue-400 border-blue-500/20',   bar: 'bg-blue-500',   accent: '#60a5fa' },
  3: { badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', bar: 'bg-emerald-500', accent: '#34d399' },
  4: { badge: 'bg-violet-500/15 text-violet-400 border-violet-500/20', bar: 'bg-violet-500', accent: '#a78bfa' },
  5: { badge: 'bg-amber-500/15 text-amber-400 border-amber-500/20', bar: 'bg-gradient-to-r from-amber-400 to-orange-400', accent: '#fbbf24' },
}

const SOURCE_BADGES: Record<string, { label: string; color: string }> = {
  manual:     { label: 'Self-reported',  color: 'bg-white/6 text-zinc-500 border-white/8' },
  import:     { label: '📄 Resume',      color: 'bg-amber-500/10 text-amber-400 border-amber-500/15' },
  github:     { label: '🐙 GitHub',      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15' },
  assessment: { label: '✅ Assessed',    color: 'bg-blue-500/10 text-blue-400 border-blue-500/15' },
}

function ProfilePageInner() {
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab')
  const defaultTab = tab === 'github' ? 'github' : tab === 'import' ? 'import' : 'skills'

  const [profile, setProfile] = useState<FullProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Bio form state
  const [bio, setBio] = useState({ name: '', headline: '', location: '', bio: '', github_url: '', salary_min: '', salary_max: '' })

  // Add skill form state
  const [newSkill, setNewSkill] = useState({ name: '', level: '3' })
  const [addingSkill, setAddingSkill] = useState(false)

  // Add portfolio item state
  const [newItem, setNewItem] = useState({ title: '', description: '', url: '', repo_url: '', tech_stack: '', impact: '' })
  const [addingItem, setAddingItem] = useState(false)

  // GitHub import state
  const [githubUrl, setGithubUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ skills: string[]; summary: string } | null>(null)

  // AI profile import state
  const [importMode, setImportMode] = useState<'pdf' | 'url' | 'text'>('pdf')
  const [importUrl, setImportUrl] = useState('')
  const [importText, setImportText] = useState('')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [extractedProfile, setExtractedProfile] = useState<ExtractedProfile | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [applyBio, setApplyBio] = useState(true)
  const [applySkills, setApplySkills] = useState(true)
  const [applying, setApplying] = useState(false)
  const [applySuccess, setApplySuccess] = useState(false)

  // ── Load profile on mount ──────────────────────────────────
  useEffect(() => {
    fetch('/api/candidate/profile')
      .then(r => r.json())
      .then(({ profile }) => {
        setProfile(profile)
        if (profile) {
          setBio({
            name: profile.name ?? '',
            headline: profile.headline ?? '',
            location: profile.location ?? '',
            bio: profile.bio ?? '',
            github_url: profile.github_url ?? '',
            salary_min: profile.salary_min?.toString() ?? '',
            salary_max: profile.salary_max?.toString() ?? '',
          })
          setGithubUrl(profile.github_url ?? '')
        }
        setLoading(false)
      })
  }, [])

  // ── Save bio/profile info ──────────────────────────────────
  async function saveBio() {
    setSaving(true)
    setSaveSuccess(false)
    try {
      const res = await fetch('/api/candidate/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bio,
          salary_min: bio.salary_min ? parseInt(bio.salary_min) : null,
          salary_max: bio.salary_max ? parseInt(bio.salary_max) : null,
        }),
      })
      if (res.ok) setSaveSuccess(true)
    } catch {
      // error handled by save button remaining in non-success state
    } finally {
      setSaving(false)
    }
  }

  // ── Add a skill manually ───────────────────────────────────
  async function addSkill() {
    if (!newSkill.name.trim()) return
    setAddingSkill(true)
    const res = await fetch('/api/candidate/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newSkill.name.trim(), level: parseInt(newSkill.level), source: 'manual' }),
    })
    const { skill } = await res.json()
    setProfile(p => p ? { ...p, skills: [...p.skills, skill] } : p)
    setNewSkill({ name: '', level: '3' })
    setAddingSkill(false)
  }

  // ── Delete a skill ─────────────────────────────────────────
  async function deleteSkill(skillId: string) {
    await fetch(`/api/candidate/skills/${skillId}`, { method: 'DELETE' })
    setProfile(p => p ? { ...p, skills: p.skills.filter(s => s.id !== skillId) } : p)
  }

  // ── Add portfolio item ─────────────────────────────────────
  async function addPortfolioItem() {
    if (!newItem.title.trim()) return
    setAddingItem(true)
    const res = await fetch('/api/candidate/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newItem,
        tech_stack: newItem.tech_stack.split(',').map(s => s.trim()).filter(Boolean),
      }),
    })
    const { item } = await res.json()
    setProfile(p => p ? { ...p, portfolio_items: [...(p.portfolio_items ?? []), item] } : p)
    setNewItem({ title: '', description: '', url: '', repo_url: '', tech_stack: '', impact: '' })
    setAddingItem(false)
  }

  // ── GitHub AI import ───────────────────────────────────────
  async function importFromGithub() {
    if (!githubUrl.trim()) return
    setImporting(true)
    setImportResult(null)
    try {
      const res = await fetch('/api/candidate/github-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ github_url: githubUrl }),
      })
      const data = await res.json()
      setImportResult(data)
      // Refresh profile to show new skills
      const refreshed = await fetch('/api/candidate/profile').then(r => r.json())
      setProfile(refreshed.profile)
    } finally {
      setImporting(false)
    }
  }

  // ── AI profile import ──────────────────────────────────────────
  // All three modes (PDF, URL, text) now return streaming responses.
  // Non-200 errors (blocked URL, bad request) are JSON and handled before streaming.
  // On 200, we accumulate the full stream, then parse the ExtractedProfile JSON.
  async function extractProfile() {
    setExtracting(true)
    setExtractedProfile(null)
    setImportError(null)
    setApplySuccess(false)

    try {
      let res: Response

      if (importMode === 'pdf') {
        if (!importFile) { setImportError('Please select a file.'); setExtracting(false); return }
        const fd = new FormData()
        fd.append('file', importFile)
        res = await fetch('/api/candidate/import/pdf', { method: 'POST', body: fd })
      } else if (importMode === 'url') {
        if (!importUrl.trim()) { setImportError('Please enter a URL.'); setExtracting(false); return }
        res = await fetch('/api/candidate/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: importUrl.trim() }),
        })
      } else {
        if (!importText.trim()) { setImportError('Please paste some text.'); setExtracting(false); return }
        res = await fetch('/api/candidate/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: importText.trim() }),
        })
      }

      // Non-200: JSON error (blocked URL, validation failure, auth error)
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string; message?: string }
        setImportError(err.message ?? err.error ?? 'Extraction failed — please try again.')
        return
      }

      // 200: streaming response — accumulate all chunks then parse JSON
      if (!res.body) throw new Error('Empty response from server')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
      }

      // Extract outermost JSON object (Claude occasionally adds prose despite instructions)
      const start = accumulated.indexOf('{')
      const end = accumulated.lastIndexOf('}')
      if (start === -1) throw new Error('AI returned an unexpected response — please try again')

      let data: ExtractedProfile & { error?: unknown }
      try {
        // Primary parse: full well-formed JSON
        if (end > start) {
          data = JSON.parse(accumulated.slice(start, end + 1)) as ExtractedProfile & { error?: unknown }
        } else {
          throw new SyntaxError('No closing brace')
        }
      } catch {
        // Fallback: JSON was likely truncated (model hit max_tokens).
        // Try several repair strategies in order — gives the user partial data + a
        // warning rather than a hard failure that loses all extracted content.
        const truncated = accumulated.slice(start).trimEnd().replace(/,\s*$/, '')
        const opened = (truncated.match(/\{/g) ?? []).length
        const closed = (truncated.match(/\}/g) ?? []).length
        const braces = '}'.repeat(Math.max(0, opened - closed))

        // Strategy 1: just close open braces (works when truncated between values)
        // Strategy 2: close an open string first, then close braces
        // Strategy 3: close string + close object + close braces
        const candidates = [
          truncated + braces,
          truncated + '"' + braces,
          truncated + '"}' + (braces.length > 1 ? braces.slice(1) : ''),
          truncated + '"]}' + (braces.length > 2 ? braces.slice(2) : ''),
        ]

        let patched: string | null = null
        for (const candidate of candidates) {
          try { JSON.parse(candidate); patched = candidate; break } catch { /* try next */ }
        }

        if (!patched) {
          throw new Error('AI response could not be parsed — your resume may be too long. Try Paste Text mode with only the key sections.')
        }

        data = JSON.parse(patched) as ExtractedProfile & { error?: unknown }
        if (!data.warnings) data.warnings = []
        ;(data.warnings as string[]).push('Profile may be incomplete — resume was very long and was partially truncated.')
      }

      // data.error is a string emitted by the server when Claude API fails;
      // always stringify to prevent React from receiving an object as a child.
      if (data.error) {
        const errMsg = typeof data.error === 'string' ? data.error : 'AI extraction failed — please try again'
        setImportError(errMsg)
      } else {
        setExtractedProfile(data)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error — please try again'
      setImportError(msg)
    } finally {
      setExtracting(false)
    }
  }

  async function applyExtracted() {
    if (!extractedProfile) return
    setApplying(true)
    try {
      const res = await fetch('/api/candidate/import/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extracted: extractedProfile, applyBio, applySkills }),
      })
      if (res.ok) {
        setApplySuccess(true)
        const { profile: refreshed } = await fetch('/api/candidate/profile').then(r => r.json())
        setProfile(refreshed)
      } else {
        const err = await res.json().catch(() => ({})) as { error?: string }
        setImportError(err.error ?? 'Failed to apply profile — please try again.')
      }
    } catch {
      setImportError('Network error — please try again.')
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-zinc-400">
        <div className="w-5 h-5 border-2 border-zinc-300 border-t-blue-500 rounded-full animate-spin" />
        Loading your Skills Vault...
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Skills Vault 🗂️</h1>
        <p className="text-zinc-500 mt-1">
          Your evidence base. Employers see skills, not school names.
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="skills">Skills ({profile?.skills?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio ({profile?.portfolio_items?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="import">📥 Import Profile</TabsTrigger>
          <TabsTrigger value="github">🐙 GitHub Import</TabsTrigger>
          <TabsTrigger value="bio">Profile Info</TabsTrigger>
        </TabsList>

        {/* ── SKILLS TAB ─────────────────────────────────────── */}
        <TabsContent value="skills" className="space-y-6">
          {/* Add skill form */}
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Add a skill</h3>
            <div className="flex gap-3">
              <Input
                placeholder="e.g. React, PostgreSQL, System Design..."
                value={newSkill.name}
                onChange={e => setNewSkill(s => ({ ...s, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addSkill()}
                className="flex-1"
              />
              <Select value={newSkill.level} onValueChange={v => setNewSkill(s => ({ ...s, level: v ?? '3' }))}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5].map(l => (
                    <SelectItem key={l} value={String(l)}>{LEVEL_LABELS[l]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={addSkill} disabled={addingSkill || !newSkill.name.trim()}>
                {addingSkill ? '...' : 'Add'}
              </Button>
            </div>
            <p className="text-xs text-zinc-400 mt-2">
              💡 Tip: Import from GitHub to get skills auto-extracted and verified from real code.
            </p>
          </Card>

          {/* Skills list */}
          <div className="space-y-2">
            {(profile?.skills ?? []).length === 0 ? (
              <div className="text-center py-12 text-zinc-400 border-2 border-dashed rounded-xl">
                <p className="text-4xl mb-3">🎯</p>
                <p className="font-medium">No skills yet</p>
                <p className="text-sm mt-1">Add skills above or import from GitHub</p>
              </div>
            ) : (
              (profile?.skills ?? []).map(skill => {
                const lvl = LEVEL_COLORS[skill.level] ?? LEVEL_COLORS[3]
                const src = SOURCE_BADGES[skill.source] ?? SOURCE_BADGES.manual
                return (
                  <div key={skill.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/7 bg-white/3
                      hover:bg-white/5 hover:border-white/12 transition-all duration-150 group"
                    style={{ borderLeft: `3px solid ${lvl.accent}33` }}>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-zinc-200">{skill.name}</span>
                      {/* Mini level bar */}
                      <div className="flex gap-0.5 mt-1.5">
                        {[1,2,3,4,5].map(n => (
                          <div key={n} className={`h-1 w-4 rounded-full ${n <= skill.level ? lvl.bar : 'bg-white/6'}`} />
                        ))}
                      </div>
                    </div>
                    <span className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold border ${lvl.badge}`}>
                      {LEVEL_LABELS[skill.level]}
                    </span>
                    <span className={`text-[11px] px-2.5 py-1 rounded-lg border ${src.color}`}>
                      {src.label}
                    </span>
                    <button
                      onClick={() => deleteSkill(skill.id)}
                      className="text-zinc-700 hover:text-red-400 transition-colors text-lg leading-none
                        opacity-0 group-hover:opacity-100 shrink-0"
                    >
                      ×
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {/* Work experience — imported from resume */}
          {(profile?.work_experience ?? []).length > 0 && (
            <div>
              <h3 className="font-semibold text-zinc-300 mb-3 mt-6">💼 Work Experience</h3>
              <div className="space-y-3">
                {(profile!.work_experience!).map((job, i) => (
                  <Card key={i} className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="font-semibold text-white">{job.title}</p>
                        <p className="text-sm text-zinc-500">{job.company}</p>
                      </div>
                      <p className="text-xs text-zinc-400 whitespace-nowrap mt-0.5">
                        {job.start_date ?? '?'} – {job.end_date ?? 'Present'}
                      </p>
                    </div>
                    {job.description && (
                      <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{job.description}</p>
                    )}
                    {job.key_technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {job.key_technologies.map(t => (
                          <span key={t} className="text-xs bg-white/8 text-zinc-400 px-2 py-0.5 rounded">{t}</span>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Education — imported from resume */}
          {(profile?.education ?? []).length > 0 && (
            <div>
              <h3 className="font-semibold text-zinc-300 mb-3 mt-2">🎓 Education</h3>
              <div className="space-y-2">
                {(profile!.education!).map((edu, i) => (
                  <div key={i} className="flex items-start justify-between p-3 bg-white/4 border border-white/8 rounded-lg">
                    <div>
                      <p className="font-medium text-white">{edu.institution}</p>
                      <p className="text-sm text-zinc-500">
                        {[edu.degree, edu.field].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    {edu.graduation_year && (
                      <span className="text-xs text-zinc-400 mt-0.5">{edu.graduation_year}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── PORTFOLIO TAB ──────────────────────────────────── */}
        <TabsContent value="portfolio" className="space-y-6">
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Add a project</h3>
            <div className="space-y-3">
              <div>
                <Label>Project title *</Label>
                <Input
                  placeholder="e.g. E-commerce Platform, Open Source CLI Tool..."
                  value={newItem.title}
                  onChange={e => setNewItem(i => ({ ...i, title: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Live URL</Label>
                  <Input placeholder="https://..." value={newItem.url} onChange={e => setNewItem(i => ({ ...i, url: e.target.value }))} />
                </div>
                <div>
                  <Label>GitHub repo URL</Label>
                  <Input placeholder="https://github.com/..." value={newItem.repo_url} onChange={e => setNewItem(i => ({ ...i, repo_url: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Tech stack (comma-separated)</Label>
                <Input placeholder="React, Node.js, PostgreSQL, Docker..." value={newItem.tech_stack} onChange={e => setNewItem(i => ({ ...i, tech_stack: e.target.value }))} />
              </div>
              <div>
                <Label>What did you achieve? (impact)</Label>
                <Input placeholder="e.g. Reduced API latency by 40%, served 500 users..." value={newItem.impact} onChange={e => setNewItem(i => ({ ...i, impact: e.target.value }))} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea placeholder="Brief description of the project and your role..." value={newItem.description} onChange={e => setNewItem(i => ({ ...i, description: e.target.value }))} rows={3} />
              </div>
              <Button onClick={addPortfolioItem} disabled={addingItem || !newItem.title.trim()}>
                {addingItem ? 'Adding...' : 'Add project'}
              </Button>
            </div>
          </Card>

          {/* Portfolio list */}
          <div className="space-y-3">
            {(profile?.portfolio_items ?? []).length === 0 ? (
              <div className="text-center py-12 text-zinc-400 border-2 border-dashed rounded-xl">
                <p className="text-4xl mb-3">📁</p>
                <p className="font-medium">No projects yet</p>
                <p className="text-sm mt-1">Add projects to show employers what you&apos;ve actually built</p>
              </div>
            ) : (
              (profile?.portfolio_items ?? []).map(item => (
                <Card key={item.id} className="p-5">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold">{item.title}</h3>
                    <div className="flex gap-2">
                      {item.url && <a href={item.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:underline">Live ↗</a>}
                      {item.repo_url && <a href={item.repo_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:underline">GitHub ↗</a>}
                    </div>
                  </div>
                  {item.impact && <p className="text-sm text-emerald-400 font-medium mt-1">✓ {item.impact}</p>}
                  {item.description && <p className="text-sm text-zinc-500 mt-1">{item.description}</p>}
                  {item.tech_stack?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {item.tech_stack.map(t => (
                        <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  )}
                  {item.ai_summary && (
                    <div className="mt-3 p-3 bg-indigo-500/8 rounded-lg">
                      <p className="text-xs font-medium text-indigo-400 mb-1">🤖 AI analysis</p>
                      <p className="text-xs text-indigo-300/80">{item.ai_summary}</p>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* ── AI PROFILE IMPORT TAB ──────────────────────────── */}
        <TabsContent value="import" className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-1">📥 Import your profile</h3>
            <p className="text-sm text-zinc-500 mb-5">
              Upload your resume or CV, paste a URL, or drop in any text. Our AI reads,
              normalises, and cross-checks everything before adding it to your vault.
            </p>

            {/* Input mode selector */}
            <div className="flex gap-2 mb-5">
              {(['pdf', 'url', 'text'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => { setImportMode(mode); setImportError(null); setExtractedProfile(null) }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    importMode === mode
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white/6 text-zinc-400 hover:bg-white/10'
                  }`}
                >
                  {mode === 'pdf' ? '📎 Upload File' : mode === 'url' ? '🔗 URL' : '📋 Paste Text'}
                </button>
              ))}
            </div>

            {/* File upload */}
            {importMode === 'pdf' && (
              <label className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                importFile ? 'border-indigo-500/50 bg-indigo-500/8' : 'border-white/15 hover:border-white/30 hover:bg-white/4'
              }`}>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt,.md,.png,.jpg,.jpeg,.webp"
                  className="hidden"
                  onChange={e => { setImportFile(e.target.files?.[0] ?? null); setExtractedProfile(null) }}
                />
                {importFile ? (
                  <>
                    <p className="text-2xl mb-1">📎</p>
                    <p className="text-sm font-medium text-indigo-300">{importFile.name}</p>
                    <p className="text-xs text-zinc-400">{(importFile.size / 1024).toFixed(0)} KB — click to change</p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl mb-1">📤</p>
                    <p className="text-sm text-zinc-500">Click to upload your resume or CV</p>
                    <p className="text-xs text-zinc-400 mt-1">PDF, DOCX, TXT, or image (PNG/JPG) — up to 20 MB</p>
                  </>
                )}
              </label>
            )}

            {/* URL input */}
            {importMode === 'url' && (
              <div className="space-y-2">
                <Input
                  placeholder="https://seek.com/profile/... or https://yourwebsite.com"
                  value={importUrl}
                  onChange={e => { setImportUrl(e.target.value); setExtractedProfile(null) }}
                />
                {importUrl.toLowerCase().includes('linkedin.com') ? (
                  <div className="p-3 bg-amber-500/8 border border-amber-500/20 rounded-lg text-xs text-amber-400 space-y-1">
                    <p className="font-semibold">⚠️ LinkedIn blocks automated access</p>
                    <p>LinkedIn requires login — we can&apos;t fetch it server-side. Instead:</p>
                    <ol className="list-decimal pl-4 space-y-0.5">
                      <li>Open your LinkedIn profile in your browser</li>
                      <li>Press <strong>Ctrl+A</strong> (Windows) or <strong>Cmd+A</strong> (Mac) to select all</li>
                      <li>Press <strong>Ctrl+C / Cmd+C</strong> to copy</li>
                      <li>Click <strong>&quot;Paste Text&quot;</strong> tab above and paste</li>
                    </ol>
                    <button
                      onClick={() => { setImportMode('text'); setImportUrl('') }}
                      className="mt-1 text-amber-400 font-semibold underline hover:text-amber-300"
                    >
                      Switch to Paste Text →
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400">
                    Works for Seek profiles and most personal/portfolio websites.
                    If the site uses a JavaScript framework (React, Vue), use Paste Text instead.
                  </p>
                )}
              </div>
            )}

            {/* Text paste */}
            {importMode === 'text' && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Paste your resume text, LinkedIn profile, portfolio page, or any professional bio here…&#10;&#10;The more text you provide, the more accurately AI can extract and verify your skills."
                  value={importText}
                  onChange={e => { setImportText(e.target.value); setExtractedProfile(null) }}
                  rows={9}
                  className="text-sm"
                />
                <div className="p-3 bg-white/4 border border-white/8 rounded-lg text-xs text-zinc-400 space-y-1">
                  <p className="font-medium text-zinc-300">How to copy from LinkedIn:</p>
                  <p>1. Open your LinkedIn profile page in the browser</p>
                  <p>2. Press <strong>Ctrl+A</strong> (Windows) or <strong>Cmd+A</strong> (Mac) to select all</p>
                  <p>3. Press <strong>Ctrl+C / Cmd+C</strong> to copy, then paste here</p>
                  <p className="pt-1 text-zinc-400">Works with any website — just copy the visible text from the page.</p>
                </div>
              </div>
            )}

            <Button
              onClick={extractProfile}
              disabled={extracting}
              className="w-full mt-4"
            >
              {extracting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  AI is reading and vetting your profile...
                </span>
              ) : 'Extract profile with AI'}
            </Button>
          </Card>

          {/* Error */}
          {importError && (
            <div className="p-4 bg-red-500/8 border border-red-500/20 rounded-xl text-sm text-red-400">
              ⚠️ {importError}
            </div>
          )}

          {/* Progress messages while extracting */}
          {extracting && (
            <div className="p-4 bg-white/4 rounded-xl text-sm text-zinc-400 space-y-1.5">
              <p>🔍 Reading source content...</p>
              <p>🧠 Identifying skills, experience, and background...</p>
              <p>✅ Cross-checking skill levels against evidence...</p>
              <p>📊 Normalising names and estimating salary range...</p>
            </div>
          )}

          {/* Extracted results preview */}
          {extractedProfile && !extracting && (
            <div className="space-y-4">
              {/* Confidence + source detected */}
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  extractedProfile.confidence === 'high'   ? 'bg-emerald-500/15 text-emerald-400' :
                  extractedProfile.confidence === 'medium' ? 'bg-amber-500/15 text-amber-400' :
                                                             'bg-red-500/15 text-red-400'
                }`}>
                  {extractedProfile.confidence === 'high'   ? '✓ High confidence' :
                   extractedProfile.confidence === 'medium' ? '~ Medium confidence' :
                                                              '! Low confidence — review carefully'}
                </span>
                <span className="text-xs text-zinc-400">
                  Source detected: <strong>{extractedProfile.source_type_detected}</strong>
                </span>
              </div>

              {/* AI warnings */}
              {extractedProfile.warnings.length > 0 && (
                <div className="p-4 bg-amber-500/8 border border-amber-500/20 rounded-xl">
                  <p className="text-xs font-semibold text-amber-400 mb-2">⚠️ AI flagged these for review:</p>
                  <ul className="space-y-1">
                    {extractedProfile.warnings.map((w, i) => (
                      <li key={i} className="text-xs text-amber-400">• {w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Bio preview */}
              {(extractedProfile.name || extractedProfile.headline || extractedProfile.location) && (
                <Card className="p-5">
                  <h4 className="font-semibold text-sm mb-3">Profile info extracted</h4>
                  <div className="space-y-2 text-sm">
                    {extractedProfile.name && (
                      <p><span className="text-zinc-400 inline-block w-20">Name</span>{extractedProfile.name}</p>
                    )}
                    {extractedProfile.headline && (
                      <p><span className="text-zinc-400 inline-block w-20">Headline</span>{extractedProfile.headline}</p>
                    )}
                    {extractedProfile.location && (
                      <p><span className="text-zinc-400 inline-block w-20">Location</span>{extractedProfile.location}</p>
                    )}
                    {(extractedProfile.salary_min || extractedProfile.salary_max) && (
                      <p>
                        <span className="text-zinc-400 inline-block w-20">Salary</span>
                        {extractedProfile.salary_min?.toLocaleString()} – {extractedProfile.salary_max?.toLocaleString()}
                      </p>
                    )}
                  </div>
                </Card>
              )}

              {/* Skills preview */}
              {extractedProfile.skills.length > 0 && (
                <Card className="p-5">
                  <h4 className="font-semibold text-sm mb-3">
                    {extractedProfile.skills.length} skills extracted
                  </h4>
                  <div className="space-y-2">
                    {extractedProfile.skills.map((skill, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="flex-1 text-sm font-medium">{skill.name}</span>
                        <span className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold border shrink-0 ${(LEVEL_COLORS[skill.level] ?? LEVEL_COLORS[3]).badge}`}>
                          {LEVEL_LABELS[skill.level]}
                        </span>
                        <span className="text-xs text-zinc-400 shrink-0 w-20 text-right">
                          {skill.source_type === 'inferred' ? '🔍 inferred' : '📝 explicit'}
                        </span>
                      </div>
                    ))}
                  </div>
                  {extractedProfile.skills.some(s => s.source_type === 'inferred') && (
                    <p className="text-xs text-zinc-400 mt-3 pt-3 border-t">
                      🔍 Inferred = AI detected this skill from your experience descriptions, not an explicit mention.
                    </p>
                  )}
                </Card>
              )}

              {/* Experience preview (read-only, context only) */}
              {extractedProfile.experience.length > 0 && (
                <Card className="p-5">
                  <h4 className="font-semibold text-sm mb-3">Experience detected</h4>
                  <div className="space-y-3">
                    {extractedProfile.experience.map((exp, i) => (
                      <div key={i} className="border-l-2 border-white/20 pl-3">
                        <p className="font-medium text-sm">{exp.title}</p>
                        <p className="text-xs text-zinc-500">
                          {exp.company}
                          {exp.start_date && ` · ${exp.start_date} → ${exp.end_date ?? 'Present'}`}
                        </p>
                        {exp.description && (
                          <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{exp.description}</p>
                        )}
                        {exp.key_technologies.length > 0 && (
                          <p className="text-xs text-zinc-400 mt-0.5">
                            {exp.key_technologies.slice(0, 5).join(' · ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-400 mt-3">
                    Experience is used to verify skill levels. It is not saved separately yet.
                  </p>
                </Card>
              )}

              {/* Apply options */}
              <Card className="p-5 border-indigo-500/20 bg-indigo-500/8">
                <h4 className="font-semibold text-sm mb-4">What would you like to apply?</h4>
                <div className="space-y-3 mb-5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyBio}
                      onChange={e => setApplyBio(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">
                      Update profile info (name, headline, location, salary)
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applySkills}
                      onChange={e => setApplySkills(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">
                      Add {extractedProfile.skills.length} extracted skills to my vault
                      <span className="text-zinc-400 ml-1">(existing skills only upgraded, never downgraded)</span>
                    </span>
                  </label>
                </div>

                <Button
                  onClick={applyExtracted}
                  disabled={applying || (!applyBio && !applySkills)}
                  className="w-full"
                >
                  {applying ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Applying to profile...
                    </span>
                  ) : 'Apply to my profile'}
                </Button>

                {applySuccess && (
                  <p className="text-sm text-emerald-400 font-medium text-center mt-3">
                    ✅ Done! Check your Skills tab and Profile Info tab to see the changes.
                  </p>
                )}
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ── GITHUB IMPORT TAB ──────────────────────────────── */}
        <TabsContent value="github" className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-2">🐙 Import skills from GitHub</h3>
            <p className="text-sm text-zinc-500 mb-5">
              Paste your GitHub profile URL. Our AI reads your top repositories,
              extracts real skills from your actual code, and adds them to your vault
              with a <span className="font-medium text-emerald-400">GitHub-verified</span> badge —
              more trusted than self-reported skills.
            </p>

            <div className="flex gap-3">
              <Input
                placeholder="https://github.com/yourusername"
                value={githubUrl}
                onChange={e => setGithubUrl(e.target.value)}
                className="flex-1"
              />
              <Button onClick={importFromGithub} disabled={importing || !githubUrl.trim()}>
                {importing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analysing...
                  </span>
                ) : 'Import skills'}
              </Button>
            </div>

            {importing && (
              <div className="mt-4 p-4 bg-white/4 rounded-lg text-sm text-zinc-400 space-y-1">
                <p>🔍 Fetching your public repositories...</p>
                <p>🧠 Reading code to identify skills...</p>
                <p>✨ Generating skill evidence...</p>
              </div>
            )}

            {importResult && (
              <div className="mt-4 p-4 bg-emerald-500/8 border border-emerald-500/20 rounded-lg">
                <p className="font-medium text-emerald-300 mb-2">
                  ✅ {importResult.skills.length} skills extracted!
                </p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {importResult.skills.map(s => (
                    <Badge key={s} className="bg-emerald-500/15 text-emerald-400 border-0">{s}</Badge>
                  ))}
                </div>
                <p className="text-sm text-emerald-400/80">{importResult.summary}</p>
              </div>
            )}
          </Card>

          <Card className="p-5 border-white/8 bg-white/4">
            <h4 className="font-medium mb-2 text-sm">Why GitHub-verified skills matter</h4>
            <div className="space-y-2 text-sm text-zinc-400">
              <p>🏷️ <strong>Self-reported</strong> — you said you know it. Least weight in matching.</p>
              <p>🐙 <strong>GitHub-verified</strong> — AI found evidence in your actual code. More trusted.</p>
              <p>✅ <strong>Assessed</strong> — you passed a skills test. Highest trust signal.</p>
            </div>
          </Card>
        </TabsContent>

        {/* ── BIO / PROFILE INFO TAB ─────────────────────────── */}
        <TabsContent value="bio" className="space-y-5">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Profile information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Full name</Label>
                  <Input value={bio.name} onChange={e => setBio(b => ({ ...b, name: e.target.value }))} />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input placeholder="e.g. Kuala Lumpur, Malaysia" value={bio.location} onChange={e => setBio(b => ({ ...b, location: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Professional headline</Label>
                <Input placeholder="e.g. Full-stack developer with 3 years building fintech products" value={bio.headline} onChange={e => setBio(b => ({ ...b, headline: e.target.value }))} />
              </div>
              <div>
                <Label>Bio</Label>
                <Textarea
                  placeholder="Tell employers what makes you unique. Focus on what you've built and the impact you've had."
                  value={bio.bio}
                  onChange={e => setBio(b => ({ ...b, bio: e.target.value }))}
                  rows={4}
                />
              </div>
              <div>
                <Label>GitHub URL</Label>
                <Input placeholder="https://github.com/username" value={bio.github_url} onChange={e => setBio(b => ({ ...b, github_url: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Min salary (MYR/year)</Label>
                  <Input type="number" placeholder="48000" value={bio.salary_min} onChange={e => setBio(b => ({ ...b, salary_min: e.target.value }))} />
                </div>
                <div>
                  <Label>Max salary (MYR/year)</Label>
                  <Input type="number" placeholder="72000" value={bio.salary_max} onChange={e => setBio(b => ({ ...b, salary_max: e.target.value }))} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={() => { setSaveSuccess(false); saveBio() }} disabled={saving}>
                  {saving ? 'Saving...' : 'Save profile'}
                </Button>
                {saveSuccess && (
                  <span className="text-sm text-green-600 font-medium">✓ Saved</span>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-8 flex items-center gap-3 text-zinc-500"><div className="w-5 h-5 border-2 border-white/20 border-t-indigo-400 rounded-full animate-spin" />Loading vault…</div>}>
      <ProfilePageInner />
    </Suspense>
  )
}
