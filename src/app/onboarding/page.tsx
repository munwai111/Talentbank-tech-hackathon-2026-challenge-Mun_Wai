'use client'

// Onboarding: the first page after sign-up.
// Users choose: "I'm looking for work" (candidate) or "I'm hiring" (employer).
// This role choice gates the entire rest of the app experience.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function OnboardingPage() {
  const { user } = useUser()
  const router = useRouter()
  const [selected, setSelected] = useState<'candidate' | 'employer' | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleContinue() {
    if (!selected || !user) return
    setLoading(true)

    try {
      // 1. Save role to Clerk's publicMetadata
      //    This syncs to our webhook → Supabase users table
      await user.update({
        unsafeMetadata: { role: selected },
      })

      // 2. Call our API to create the DB user record
      const res = await fetch('/api/candidate/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selected }),
      })

      if (!res.ok) throw new Error('Failed to create profile')

      // 3. Redirect to the right dashboard based on role
      router.push(selected === 'candidate' ? '/dashboard' : '/employer/dashboard')
    } catch (err) {
      console.error(err)
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
            We&apos;ll personalize your experience based on your answer.
          </p>
        </div>

        <div className="grid gap-4 mb-8">
          {roles.map((role) => (
            <Card
              key={role.id}
              onClick={() => setSelected(role.id)}
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
                {/* Selection indicator */}
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

        <Button
          onClick={handleContinue}
          disabled={!selected || loading}
          className="w-full"
          size="lg"
        >
          {loading ? 'Setting up your account...' : 'Continue →'}
        </Button>
      </div>
    </div>
  )
}
