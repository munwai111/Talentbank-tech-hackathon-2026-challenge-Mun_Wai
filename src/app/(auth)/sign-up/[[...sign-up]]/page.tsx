'use client'

// Sign-up page — fully theme-adaptive (dark + light).
// Mirrors sign-in structure exactly.

import { SignUp } from '@clerk/nextjs'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

// ── Clerk appearance variables ────────────────────────────────────────────────

const DARK_VARS = {
  colorBackground: '#0d0d1a',
  colorInputBackground: '#13132a',
  colorInputText: '#e8e9f3',
  colorText: '#e8e9f3',
  colorTextSecondary: '#8b8fa8',
  colorPrimary: '#818cf8',
  colorDanger: '#f87171',
  colorNeutral: '#0d0d1a',
  borderRadius: '0.875rem',
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
  borderRadius: '0.875rem',
} as const

// ── Button element styles — adapts per theme ──────────────────────────────────

function socialButtonStyles(isDark: boolean) {
  return {
    socialButtonsBlockButton: {
      borderRadius: '9999px',
      background: isDark
        ? 'rgba(99, 102, 241, 0.14)'
        : 'rgba(99, 102, 241, 0.08)',
      border: isDark
        ? '1px solid rgba(129, 140, 248, 0.35)'
        : '1px solid rgba(99, 102, 241, 0.30)',
      color: isDark ? '#ffffff' : '#312e81',
      backdropFilter: 'blur(8px)',
      padding: '10px 20px',
      transition: 'background 0.15s, border-color 0.15s',
    },
    socialButtonsBlockButtonText: {
      color: isDark ? '#ffffff' : '#312e81',
      fontWeight: '500',
    },
    socialButtonsBlockButtonArrow: {
      color: isDark ? '#ffffff' : '#312e81',
    },
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SignUpPage() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const isDark = !mounted || resolvedTheme === 'dark'

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center transition-colors duration-300"
      style={{ background: isDark ? '#070714' : '#f1f0f7' }}
    >
      {/* Aurora glow — dark only */}
      <div className="pointer-events-none fixed inset-0 dark:opacity-100 opacity-0 transition-opacity duration-500" aria-hidden>
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.15), transparent 70%)' }} />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.12), transparent 70%)' }} />
      </div>

      {/* Theme toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Centered content column */}
      <div className="relative flex flex-col items-center w-full max-w-[26rem] px-4">

        {/* Header */}
        <div className="text-center mb-6 w-full">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-4
            bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30">
            <span className="text-sm font-bold text-white">C</span>
          </div>
          <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white/90' : 'text-slate-800'}`}>
            Create your account
          </h1>
          <p className={`mt-1.5 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Join APAC professionals on Career OS
          </p>
        </div>

        {/* Clerk widget */}
        <div className="w-full">
          <SignUp
            forceRedirectUrl="/onboarding"
            appearance={{
              variables: isDark ? DARK_VARS : LIGHT_VARS,
              layout: {
                socialButtonsVariant: 'blockButton',
                socialButtonsPlacement: 'top',
              },
              elements: socialButtonStyles(isDark),
            }}
          />
        </div>
      </div>
    </div>
  )
}
