'use client'

// Onboarding: the first page after sign-up.
// Users choose: "I'm looking for work" (candidate) or "I'm hiring" (employer).
// This role choice gates the entire rest of the app experience.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// Small delay to ensure the new Clerk session cookie is fully propagated
// before the first server-side auth() call in the profile API.
function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default function OnboardingPage() {
  const { user } = useUser()
  const router = useRouter()
  const [selected, setSelected] = useState<'candidate' | 'employer' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleContinue() {
    if (!selected || !user) return
    setLoading(true)
    setError(null)

    try {
      // 1. Save role to Clerk metadata so it's available in the session
      await user.update({ unsafeMetadata: { role: selected } })

      // 2. Brief pause — lets the Clerk session propagate to the server
      //    so that auth() on the API route returns a valid userId.
      await wait(400)

      // 3. Create / update the DB user record (upsert — safe to retry)
      const res = await fetch('/api/candidate/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selected }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(data.error ?? `Server error ${res.status}`)
      }

      // 4. Redirect: candidates → guided registration wizard
      //             employers  → employer dashboard
      router.push(selected === 'candidate' ? '/onboarding/profile' : '/employer/dashboard')
    } catch (err) {
      console.error('[onboarding] handleContinue failed:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong — please try again'
      )
      setLoading(false)
    }
  }

  const roles = [
    {
      id: 'candidate' as const,
      emoji: '🎯',
      title: "I'm looking for work",
      description:
        'Build your Skills Vault, get matched to jobs on ability, and get an AI coach that tells you exactly what to fix.',
    },
    {
      id: 'employer' as const,
      emoji: '🏢',
      title: "I'm hiring",
      description:
        'Post jobs and find candidates ranked by proven skills — not school names. Stop filtering in ATS, start finding real talent.',
    },
  ]

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="max-w-xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">How are you using Career OS?</h1>
          <p className="text-zinc-500">
            We&apos;ll personalise your experience based on your answer.
          </p>
        </div>

        <div className="grid gap-4 mb-8">
          {roles.map((role) => (
            <Card
              key={role.id}
              onClick={() => { if (!loading) setSelected(role.id) }}
              className={`p-6 cursor-pointer border-2 transition-all ${
                selected === role.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-transparent hover:border-zinc-200'
              }`}
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">{role.emoji}</span>
                <div>
                  <h3 className="font-semibold text-lg">{role.title}</h3>
                  <p className="text-zinc-500 text-sm mt-1">{role.description}</p>
                </div>
                <div className={`ml-auto mt-1 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                  selected === role.id ? 'border-blue-500 bg-blue-500' : 'border-zinc-300'
                }`}>
                  {selected === role.id && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Visible error message — no more silent failures */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 text-center">
            {error}
            <button
              onClick={handleContinue}
              className="block mx-auto mt-1 text-xs text-red-600 underline hover:text-red-800"
            >
              Try again →
            </button>
          </div>
        )}

        <Button
          onClick={handleContinue}
          disabled={!selected || loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Setting up your account…
            </span>
          ) : (
            'Continue →'
          )}
        </Button>

        <p className="text-center text-xs text-zinc-400 mt-4">
          You can change your account type later in settings.
        </p>
      </div>
    </div>
  )
}
