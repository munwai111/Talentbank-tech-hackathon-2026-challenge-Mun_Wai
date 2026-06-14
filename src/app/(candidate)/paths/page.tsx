'use client'

import { useCallback, useEffect, useState } from 'react'
import type { CareerPath, PathMatchType } from '@/lib/ai/path-navigator'
import { StaggerContainer } from '@/components/animations/StaggerContainer'
import { FadeUp } from '@/components/animations/FadeUp'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { TranslationKey } from '@/lib/i18n/translations'

const MATCH_LABEL_KEY: Record<PathMatchType, TranslationKey> = {
  strong: 'paths.strongMatch',
  emerging: 'paths.emergingPath',
  stretch: 'paths.stretchGoal',
}

// ── Pure utilities (outside component — no closure over state) ────────────────

function extractJSON(raw: string): string {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1 || start >= end) throw new Error('No JSON object found in response')
  return raw.slice(start, end + 1)
}

async function readStreamedPaths(lang: string): Promise<{ paths?: CareerPath[]; error?: string }> {
  const res = await fetch(`/api/candidate/paths?lang=${encodeURIComponent(lang)}`)
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(data.error ?? 'Generation failed')
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let accumulated = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    accumulated += decoder.decode(value, { stream: true })
  }
  return JSON.parse(extractJSON(accumulated)) as { paths?: CareerPath[]; error?: string }
}

// ── Visual config per match type ─────────────────────────────────────────────

type MatchConfig = {
  label: string
  accent: string
  badge: string
  badgeDot: string
  cardBg: string
  cardBorder: string
  glow: string
  salaryBg: string
  salaryText: string
  ctaGradient: string
  tradeoffBorder: string
}

const MATCH_CONFIG: Record<PathMatchType, MatchConfig> = {
  strong: {
    label: 'Strong Match',
    accent: 'from-emerald-500 to-teal-500',
    badge: 'bg-emerald-500/12 text-emerald-300 border-emerald-500/20',
    badgeDot: 'bg-emerald-400',
    cardBg: 'linear-gradient(160deg, rgba(16,185,129,0.08) 0%, rgba(20,184,166,0.04) 100%)',
    cardBorder: 'rgba(16,185,129,0.25)',
    glow: '0 0 40px rgba(16,185,129,0.1)',
    salaryBg: 'rgba(16,185,129,0.1)',
    salaryText: '#34d399',
    ctaGradient: 'from-emerald-600 to-teal-600',
    tradeoffBorder: 'border-l-emerald-500/40',
  },
  emerging: {
    label: 'Emerging Path',
    accent: 'from-amber-400 to-orange-500',
    badge: 'bg-amber-500/12 text-amber-300 border-amber-500/20',
    badgeDot: 'bg-amber-400',
    cardBg: 'linear-gradient(160deg, rgba(245,158,11,0.08) 0%, rgba(249,115,22,0.04) 100%)',
    cardBorder: 'rgba(245,158,11,0.25)',
    glow: '0 0 40px rgba(245,158,11,0.1)',
    salaryBg: 'rgba(245,158,11,0.1)',
    salaryText: '#fbbf24',
    ctaGradient: 'from-amber-600 to-orange-600',
    tradeoffBorder: 'border-l-amber-500/40',
  },
  stretch: {
    label: 'Stretch Goal',
    accent: 'from-violet-500 to-indigo-600',
    badge: 'bg-violet-500/12 text-violet-300 border-violet-500/20',
    badgeDot: 'bg-violet-400',
    cardBg: 'linear-gradient(160deg, rgba(124,58,237,0.08) 0%, rgba(99,102,241,0.04) 100%)',
    cardBorder: 'rgba(124,58,237,0.25)',
    glow: '0 0 40px rgba(124,58,237,0.1)',
    salaryBg: 'rgba(124,58,237,0.1)',
    salaryText: '#a78bfa',
    ctaGradient: 'from-violet-600 to-indigo-600',
    tradeoffBorder: 'border-l-violet-500/40',
  },
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SkillChip({ name, variant }: { name: string; variant: 'have' | 'develop' }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
      variant === 'have'
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    }`}>
      {variant === 'have' ? '✓' : '+'} {name}
    </span>
  )
}

function PathCard({ path }: { path: CareerPath }) {
  const { t } = useLanguage()
  const cfg = MATCH_CONFIG[path.id] ?? MATCH_CONFIG.emerging
  const salary = path.salary_min_myr > 0
    ? `RM ${path.salary_min_myr.toLocaleString()} – ${path.salary_max_myr.toLocaleString()}/mo`
    : 'Variable / equity-based'
  const timeline = `${path.timeline_months_min}–${path.timeline_months_max} months`

  return (
    <div className="relative rounded-2xl flex flex-col overflow-hidden backdrop-blur-sm transition duration-300 hover:-translate-y-0.5"
      style={{
        background: cfg.cardBg,
        border: `1px solid ${cfg.cardBorder}`,
        boxShadow: cfg.glow,
      }}>

      {/* Top gradient bar */}
      <div className={`h-0.5 w-full bg-gradient-to-r ${cfg.accent}`} />

      <div className="flex flex-col gap-4 p-5">

        {/* Badge + title */}
        <div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cfg.badge} mb-2.5`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.badgeDot}`} />
            {t(MATCH_LABEL_KEY[path.id] ?? 'paths.emergingPath')}
          </span>
          <h3 className="text-base font-bold text-white leading-snug">{path.title}</h3>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{path.match_label}</p>
          {path.company_types.length > 0 && (
            <p className="text-[11px] text-zinc-600 mt-1.5">{path.company_types.slice(0, 3).join(' · ')}</p>
          )}
        </div>

        {/* Salary highlight */}
        <div className="rounded-xl px-4 py-3" style={{ background: cfg.salaryBg, border: `1px solid ${cfg.cardBorder}` }}>
          <p className="text-[10px] font-semibold tracking-wider uppercase text-zinc-500 mb-0.5">{t('paths.marketSalary')}</p>
          <p className="text-lg font-bold tracking-tight" style={{ color: cfg.salaryText }}>{salary}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-zinc-600">{t('paths.timeline')}:</span>
            <span className="text-[10px] font-semibold text-zinc-400">{timeline}</span>
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-2">
          {path.skills_you_have.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold tracking-wider uppercase text-zinc-600 mb-1.5">{t('paths.youHave')}</p>
              <div className="flex flex-wrap gap-1">
                {path.skills_you_have.map(s => <SkillChip key={s} name={s} variant="have" />)}
              </div>
            </div>
          )}
          {path.skills_to_develop.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold tracking-wider uppercase text-zinc-600 mb-1.5">{t('paths.toDevelop')}</p>
              <div className="flex flex-wrap gap-1">
                {path.skills_to_develop.map(s => <SkillChip key={s} name={s} variant="develop" />)}
              </div>
            </div>
          )}
        </div>

        {/* Trade-off */}
        <div className={`rounded-xl px-3.5 py-3 border-l-2 ${cfg.tradeoffBorder} bg-white/3 border border-white/6`}>
          <p className="text-[10px] font-semibold tracking-wider uppercase text-zinc-600 mb-1">Trade-off</p>
          <p className="text-xs text-zinc-400 leading-relaxed">{path.trade_off}</p>
        </div>

        {/* Navigation note */}
        {path.navigation_note && (
          <p className="text-xs text-zinc-600 italic leading-relaxed">{path.navigation_note}</p>
        )}

        {/* CTA */}
        <a href="/jobs"
          className={`mt-auto flex items-center justify-center gap-1.5 text-sm font-semibold text-white
            bg-gradient-to-r ${cfg.ctaGradient} rounded-xl px-4 py-2.5 transition
            hover:opacity-90 hover:shadow-lg`}>
          Explore matching jobs →
        </a>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <p className="text-4xl mb-4">🗺️</p>
      <h2 className="text-lg font-semibold text-white mb-2">No paths generated yet</h2>
      <p className="text-sm text-zinc-400 max-w-sm mx-auto">
        Add some skills to your profile first — the navigator needs at least a few to map realistic paths.
      </p>
      <a href="/profile" className="mt-6 inline-block text-sm font-medium text-indigo-400 hover:text-indigo-300 hover:underline">
        Add skills to your vault →
      </a>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PathsPage() {
  const { t, language } = useLanguage()
  const [paths, setPaths] = useState<CareerPath[]>([])
  const [loading, setLoading] = useState(true)  // true = skeleton visible on mount
  const [error, setError] = useState<string | null>(null)

  // fetchPaths: called from the Refresh button (event handler context).
  // Calling setLoading(true) synchronously here is fine — event handlers
  // are not subject to react-hooks/set-state-in-effect.
  const fetchPaths = useCallback(() => {
    setLoading(true)
    setError(null)
    readStreamedPaths(language)
      .then(parsed => {
        if (parsed.error) throw new Error(parsed.error)
        setPaths(parsed.paths ?? [])
        setLoading(false)
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Something went wrong')
        setLoading(false)
      })
  }, [language])

  // Initial load + re-generation whenever the selected language changes, so
  // AI-written path content always renders in the user's chosen language.
  // All setState calls happen inside callbacks to satisfy set-state-in-effect.
  useEffect(() => {
    let cancelled = false
    readStreamedPaths(language)
      .then(parsed => {
        if (cancelled) return
        if (parsed.error) throw new Error(parsed.error)
        setPaths(parsed.paths ?? [])
        setLoading(false)
      })
      .catch(err => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Something went wrong')
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [language])

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Page header */}
      <FadeUp className="flex items-start justify-between mb-8" scrollTrigger={false}>
        <div>
          <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-zinc-600 mb-1">{t('paths.eyebrow')}</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">{t('paths.title')}</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {t('paths.subtitle')}
          </p>
        </div>
        <button
          onClick={fetchPaths}
          disabled={loading}
          className="flex items-center gap-2 text-sm font-medium text-zinc-400 border border-white/8 bg-white/3
            rounded-xl px-4 py-2.5 hover:bg-white/6 hover:border-white/15 hover:text-zinc-200 disabled:opacity-40 transition"
        >
          <span className={loading ? 'animate-spin' : ''}>↺</span>
          {loading ? t('common.loading') : t('paths.refresh')}
        </button>
      </FadeUp>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { color: 'rgba(16,185,129,0.15)' },
            { color: 'rgba(245,158,11,0.15)' },
            { color: 'rgba(124,58,237,0.15)' },
          ].map((sk, i) => (
            <div key={i} className="rounded-2xl p-5 animate-pulse space-y-4 overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="h-0.5 w-full rounded-full mb-4" style={{ background: sk.color }} />
              <div className="h-5 bg-white/6 rounded-lg w-28" />
              <div className="h-6 bg-white/6 rounded-lg w-4/5" />
              <div className="h-4 bg-white/4 rounded-lg w-3/5" />
              <div className="h-16 bg-white/4 rounded-xl" />
              <div className="h-20 bg-white/4 rounded-xl" />
              <div className="h-10 bg-white/4 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-6 text-center">
          <p className="text-sm text-red-400 font-medium mb-3">{error}</p>
          <button onClick={fetchPaths} className="text-sm text-red-400 hover:text-red-300 hover:underline">
            Try again
          </button>
        </div>
      )}

      {/* Paths grid */}
      {!loading && !error && paths.length > 0 && (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6" stagger={0.15} y={30} scrollTrigger={false}>
          {paths.map(path => <PathCard key={path.id} path={path} />)}
        </StaggerContainer>
      )}

      {/* Empty state */}
      {!loading && !error && paths.length === 0 && <EmptyState />}

      {/* Disclaimer — only when paths are visible (not during error state) */}
      {!loading && !error && paths.length > 0 && (
        <p className="mt-8 text-xs text-zinc-400 text-center max-w-2xl mx-auto">
          Paths are generated from aggregated market data and your current skill profile.
          They show where similar professionals typically move — not a guarantee of any individual outcome.
        </p>
      )}
    </div>
  )
}
