'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Eye, Pencil, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { ProfileViewMode } from './ProfileViewMode'
import { ProfileEditMode } from './ProfileEditMode'
import type { CandidateProfile, Skill, PortfolioItem } from '@/types/database'

type FullProfile = CandidateProfile & { skills: Skill[]; portfolio_items: PortfolioItem[] }

type ProjectForm = {
  title: string; description: string; url: string; repo_url: string; tech_stack: string; impact: string
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6 animate-pulse">
      <div className="rounded-2xl border border-white/6 bg-white/2 overflow-hidden">
        <div className="h-28 bg-white/4" />
        <div className="px-6 pb-6 pt-2 space-y-3">
          <div className="flex gap-4 -mt-8">
            <div className="w-20 h-20 rounded-2xl bg-white/8 shrink-0" />
            <div className="pt-8 space-y-1.5">
              <div className="w-36 h-4 bg-white/8 rounded" />
              <div className="w-48 h-3 bg-white/5 rounded" />
            </div>
          </div>
        </div>
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="rounded-xl border border-white/6 bg-white/2 p-5 space-y-2">
          <div className="w-24 h-3 bg-white/6 rounded" />
          <div className="w-full h-3 bg-white/4 rounded" />
          <div className="w-3/4 h-3 bg-white/4 rounded" />
        </div>
      ))}
    </div>
  )
}

// ── Inner page (needs search params) ─────────────────────────────────────────

function ProfilePageInner() {
  const { user } = useUser()
  const params = useSearchParams()
  const initialMode = params.get('mode') === 'edit' ? 'edit' : 'view'
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode)
  const [profile, setProfile] = useState<FullProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/candidate/profile')
      if (!res.ok) return
      const { profile: data } = await res.json() as { profile: FullProfile | null }
      setProfile(data)
    } catch { /* silently fail */ }
    setLoading(false)
  }, [])

  useEffect(() => { loadProfile() }, [loadProfile])

  async function handleSave(data: Partial<FullProfile>) {
    await fetch('/api/candidate/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    await loadProfile()
  }

  async function handleSaveProjects(projects: ProjectForm[]) {
    await fetch('/api/candidate/projects', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projects }),
    })
    await loadProfile()
  }

  const avatarUrl = user?.imageUrl ?? null
  const clerkName = user?.firstName
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ?? '—'

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="sticky top-14 z-40 border-b border-white/6 bg-[#0a0a14]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link href="/dashboard"
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeft size={13} />Dashboard
          </Link>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/8">
            <button onClick={() => setMode('view')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mode === 'view' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}>
              <Eye size={12} />View
            </button>
            <button onClick={() => setMode('edit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mode === 'edit' ? 'bg-indigo-500/20 text-indigo-300' : 'text-zinc-500 hover:text-zinc-300'
              }`}>
              <Pencil size={12} />Edit
            </button>
          </div>

          <div className="w-24" />
        </div>
      </div>

      {loading && <ProfileSkeleton />}

      {!loading && !profile && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
          <Loader2 size={28} className="text-zinc-600 animate-spin" />
          <p className="text-sm text-zinc-500">Setting up your profile…</p>
        </div>
      )}

      {!loading && profile && mode === 'view' && (
        <ProfileViewMode profile={profile} avatarUrl={avatarUrl} clerkName={clerkName} />
      )}

      {!loading && profile && mode === 'edit' && (
        <ProfileEditMode
          profile={profile}
          onSave={handleSave}
          onSaveProjects={handleSaveProjects}
        />
      )}
    </div>
  )
}

// ── Export (Suspense boundary for useSearchParams) ────────────────────────────

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfilePageInner />
    </Suspense>
  )
}
