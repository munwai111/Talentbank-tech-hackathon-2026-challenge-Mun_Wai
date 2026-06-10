'use client'

// Clerk catch-all: handles multi-step sign-up sub-routes.
// Custom OAuth buttons built with useSignUp for full design control.

import { SignUp, useSignUp } from '@clerk/nextjs'
// Clerk v7: useSignUp returns SignUpSignalValue with { signUp: SignUpFutureResource, fetchStatus }
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

type OAuthProvider = 'oauth_google' | 'oauth_linkedin_oidc'

function OAuthButtons() {
  const { signUp, fetchStatus } = useSignUp()
  const [loading, setLoading] = useState<OAuthProvider | null>(null)
  const isReady = fetchStatus !== 'fetching'

  async function startOAuth(strategy: OAuthProvider) {
    if (!isReady || loading) return
    setLoading(strategy)
    try {
      await signUp.sso({
        strategy,
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectCallbackUrl: '/onboarding',
      })
    } catch {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-3 mb-2">
      <button
        onClick={() => startOAuth('oauth_google')}
        disabled={!isReady || loading !== null}
        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium
          transition-all duration-150 select-none
          bg-white/5 border border-white/10 text-white/90
          hover:bg-white/8 hover:border-white/18
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading === 'oauth_google' ? (
          <span className="w-5 h-5 border-2 border-white/30 border-t-white/80 rounded-full animate-spin shrink-0" />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" className="shrink-0">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        <span className="flex-1 text-left">Continue with Google</span>
      </button>

      <button
        onClick={() => startOAuth('oauth_linkedin_oidc')}
        disabled={!isReady || loading !== null}
        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium
          transition-all duration-150 select-none
          bg-white/5 border border-white/10 text-white/90
          hover:bg-white/8 hover:border-white/18
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading === 'oauth_linkedin_oidc' ? (
          <span className="w-5 h-5 border-2 border-white/30 border-t-white/80 rounded-full animate-spin shrink-0" />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#0A66C2" className="shrink-0">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        )}
        <span className="flex-1 text-left">Continue with LinkedIn</span>
      </button>
    </div>
  )
}

export default function SignUpPage() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const isDark = !mounted || resolvedTheme === 'dark'

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background transition-colors duration-300">
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
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl
            bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30 mb-4">
            <span className="text-sm font-bold text-white">C</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white/90">Create your account</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Join APAC professionals on Career OS
          </p>
        </div>

        {/* Custom OAuth buttons */}
        <div className="rounded-t-2xl px-6 pt-6 pb-4"
          style={{
            background: isDark ? '#0d0d1f' : '#ffffff',
            border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.08)',
            borderBottom: 'none',
          }}>
          <OAuthButtons />
          <div className="flex items-center gap-3 mt-4">
            <div className="flex-1 h-px" style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)' }} />
            <span className="text-xs" style={{ color: isDark ? '#8b8fa8' : '#9ca3af' }}>or</span>
            <div className="flex-1 h-px" style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)' }} />
          </div>
        </div>

        {/* Clerk widget — email only, social buttons hidden */}
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
              socialButtonsBlockButtonText: {
                color: '#ffffff',
                fontWeight: '500',
              },
              socialButtonsBlockButtonArrow: { color: '#ffffff' },
            },
          }}
        />
      </div>
    </div>
  )
}
