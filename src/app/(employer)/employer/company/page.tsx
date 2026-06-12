'use client'

// /employer/company — Company profile editor
// This is what candidates see when they look at who posted a job.

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function CompanyProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState({
    name: '', industry: '', size: '', description: '', website: '',
  })

  useEffect(() => {
    fetch('/api/employer/company')
      .then(r => r.json())
      .then(({ company }) => {
        if (company) {
          setForm({
            name:        company.name        ?? '',
            industry:    company.industry    ?? '',
            size:        company.size        ?? '',
            description: company.description ?? '',
            website:     company.website     ?? '',
          })
        }
        setLoading(false)
      })
  }, [])

  async function save() {
    setSaving(true)
    setSaved(false)
    await fetch('/api/employer/company', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-zinc-400">
        <div className="w-5 h-5 border-2 border-zinc-300 border-t-blue-500 rounded-full animate-spin" />
        Loading...
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Company Profile</h1>
        <p className="text-zinc-500 mt-1">
          This is what candidates see when they look at your job listings.
        </p>
      </div>

      <Card className="p-6 space-y-5">
        <div>
          <Label>Company name *</Label>
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Industry</Label>
            <Input
              placeholder="e.g. Technology, Financial Services"
              value={form.industry}
              onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
            />
          </div>
          <div>
            <Label>Company size</Label>
            <Select value={form.size || undefined} onValueChange={v => setForm(f => ({ ...f, size: v ?? '' }))}>
              <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="startup">Startup (1–50)</SelectItem>
                <SelectItem value="sme">SME (51–200)</SelectItem>
                <SelectItem value="mid">Mid-size (201–1000)</SelectItem>
                <SelectItem value="large">Large (1000+)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>About your company</Label>
          <Textarea
            placeholder="Tell candidates what you do, what makes you different, and what kind of people thrive here."
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={4}
          />
        </div>

        <div>
          <Label>Website</Label>
          <Input
            placeholder="https://yourcompany.com"
            value={form.website}
            onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
          />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Button onClick={save} disabled={saving || !form.name.trim()}>
            {saving ? 'Saving...' : 'Save profile'}
          </Button>
          {saved && <span className="text-sm text-green-600">✓ Saved</span>}
        </div>
      </Card>
    </div>
  )
}
