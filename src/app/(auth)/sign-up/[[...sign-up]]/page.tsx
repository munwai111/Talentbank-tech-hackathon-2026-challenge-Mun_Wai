'use client'

// Clerk catch-all: handles multi-step sign-up sub-routes.

import { SignUp } from '@clerk/nextjs'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const DARK_VARS = {
  colorBackground: '#0d0d1f',
  colorInputBackground: '#13132a',
  colorInputText: '#e8e9f3',
  colorText: '#e8e9f3',
  colorTextSecondary: '#8b8fa8',
  colorPrimary: '#818cf8',
  colorDanger: '#f87171',
  colorNeutral: '#0d0d1f',
  borderRadius: '0.75rem',
} as const

const LIGHT_VARS = {
  colorBackground: '#ffffff',
  colorInputBackground: '#f4f4f8',
  colorInputText: '#111827',
  colorText: '#111827',
  colorTextSecondary: '#6b7280',
  colorPrimary: '#4f46e5',
  colorDanger: '#dc2626',
  colorNeutral: '#ffffff',
  borderRadius: '0.75rem',
} as const

export default function SignUpPage() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const isDark = !mounted || resolvedTheme === 'dark'

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background transition-colors duration-300">
      {/* Aurora glow */}
      <div className="pointer-events-none fixed inset-0 dark:opacity-100 opacity-0 transition-opacity duration-500" aria-hidden>
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.15), transparent 70%)' }} />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.12), transparent 70%)' }} />
      </div>

      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-md px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl
            bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30 mb-4">
            <span className="text-sm font-bold text-white">C</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white/90">Create your account</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Join APAC professionals on Career OS
          </p>
        </div>

        <SignUp
          forceRedirectUrl="/onboarding"
          appearance={{
            variables: isDark ? DARK_VARS : LIGHT_VARS,
            layout: {
              socialButtonsVariant: 'blockButton',
              socialButtonsPlacement: 'top',
            },
            elements: {
              socialButtonsBlockButton: {
                borderRadius: '9999px',
                background: 'rgba(99, 102, 241, 0.14)',
                border: '1px solid rgba(129, 140, 248, 0.35)',
                color: '#ffffff',
                backdropFilter: 'blur(8px)',
                padding: '10px 20px',
                transition: 'background 0.15s, border-color 0.15s',
              },
              'socialButtonsBlockButton:hover': {
                background: 'rgba(99, 102, 241, 0.24)',
                borderColor: 'rgba(129, 140, 248, 0.55)',
              },
              socialButtonsBlockButtonText: { color: '#ffffff', fontWeight: '500' },
              socialButtonsBlockButtonArrow: { color: '#ffffff' },
            },
          }}
        />
      </div>
    </div>
  )
}
