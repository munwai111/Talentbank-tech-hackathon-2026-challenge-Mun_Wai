'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { FadeUp } from '@/components/animations/FadeUp'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { Bookmark, BookmarkCheck, Building2, ArrowRight, Newspaper } from 'lucide-react'

type Post = {
  id: string
  channel: string
  industry: string
  date: string
  tag: 'Hiring' | 'Market' | 'Event' | 'Insight'
  title: string
  body: string
  jobLink?: boolean
}

const POSTS: Post[] = [
  {
    id: 'p1', channel: 'TalentLab Asia', industry: 'Human Resources', date: '2026-06-11', tag: 'Hiring',
    title: 'We are expanding our people-analytics practice',
    body: 'Three new roles open this month across analytics and research. We hire on demonstrated skills — portfolios beat CVs in our process. Talent Analytics Manager and UX Research Lead are live on the marketplace now.',
    jobLink: true,
  },
  {
    id: 'p2', channel: 'Axiata Digital', industry: 'Technology', date: '2026-06-10', tag: 'Market',
    title: 'Malaysia tech salaries moved 6–9% YoY in data roles',
    body: 'Our latest compensation review shows data engineering and ML roles in KL commanding RM 9–16k/mo at mid level, with Penang trailing by roughly 15%. Skills in demand: Python, Spark, dbt, and stakeholder communication.',
  },
  {
    id: 'p3', channel: 'FinFlow', industry: 'Financial Services', date: '2026-06-09', tag: 'Insight',
    title: 'Why we stopped filtering CVs by university',
    body: 'Six months after switching to skills-first screening, our interview-to-offer rate doubled. The best predictor of success in our engineering team has been demonstrated project work — not institution names.',
  },
  {
    id: 'p4', channel: 'Talentbank', industry: 'Career Platform', date: '2026-06-08', tag: 'Event',
    title: 'Graduates Choice Award 2026 — employer branding insights',
    body: 'What 28,000 Malaysian graduates told us about choosing employers: growth path clarity ranked first, salary second, brand prestige sixth. Employers who publish skill expectations see 3× more qualified applications.',
  },
  {
    id: 'p5', channel: 'Shopmatic MY', industry: 'E-commerce', date: '2026-06-07', tag: 'Hiring',
    title: 'E-commerce hiring rebounds ahead of year-end season',
    body: 'We and our merchant network are opening roles in logistics tech, mobile development, and growth. Hybrid-first. If your vault shows React Native or growth analytics, you will rank high with us.',
    jobLink: true,
  },
  {
    id: 'p6', channel: 'UNIQLO Malaysia', industry: 'Retail', date: '2026-06-05', tag: 'Insight',
    title: 'Retail operations is becoming a technology career',
    body: 'Store development now runs on data: footfall modelling, space optimisation, demand forecasting. Candidates who pair operational experience with analytics skills are some of the strongest cross-domain hires we make.',
  },
]

const CHANNELS = [...new Set(POSTS.map(p => p.channel))]

const TAG_STYLES: Record<Post['tag'], string> = {
  Hiring:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  Market:  'bg-sky-500/15 text-sky-400 border-sky-500/25',
  Event:   'bg-violet-500/15 text-violet-300 border-violet-500/25',
  Insight: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
}

function patchPreferences(updates: Record<string, unknown>) {
  fetch('/api/candidate/preferences', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  }).catch(console.error)
}

function NewsContent() {
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') === 'saved' ? 'saved' : 'following'
  const [tab, setTab] = useState<'following' | 'saved'>(initialTab)
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [followed, setFollowed] = useState<Set<string>>(new Set(CHANNELS))

  useEffect(() => {
    fetch('/api/candidate/preferences')
      .then(r => r.json())
      .then(({ preferences }) => {
        if (!preferences) return
        setSaved(new Set(preferences.news_saved ?? []))
        // Empty array = first visit → default to all channels followed
        setFollowed(
          (preferences.news_followed as string[])?.length
            ? new Set(preferences.news_followed as string[])
            : new Set(CHANNELS),
        )
      })
      .catch(console.error)
  }, [])

  function toggleSave(id: string) {
    setSaved(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      patchPreferences({ news_saved: [...next] })
      return next
    })
  }

  function toggleFollow(channel: string) {
    setFollowed(prev => {
      const next = new Set(prev)
      if (next.has(channel)) next.delete(channel); else next.add(channel)
      patchPreferences({ news_followed: [...next] })
      return next
    })
  }

  const visible = tab === 'saved'
    ? POSTS.filter(p => saved.has(p.id))
    : POSTS.filter(p => followed.has(p.channel))

  return (
    <div className="px-6 py-6 max-w-3xl">
      <FadeUp className="mb-6" scrollTrigger={false}>
        <p className="section-label mb-2">{t('news.eyebrow')}</p>
        <h1 className="text-2xl font-bold text-white">{t('news.title')}</h1>
        <p className="text-zinc-400 mt-1">
          {t('news.subtitle')}
        </p>
      </FadeUp>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-white/8">
        {(['following', 'saved'] as const).map(tabId => (
          <button key={tabId} onClick={() => setTab(tabId)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === tabId ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}>
            {tabId === 'following' ? t('news.following') : t('news.saved')}{tabId === 'saved' && saved.size > 0 ? ` (${saved.size})` : ''}
            {tab === tabId && <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-t-full bg-gradient-to-r from-violet-400 to-indigo-500" />}
          </button>
        ))}
      </div>

      {/* Channels strip */}
      {tab === 'following' && (
        <div className="flex flex-wrap gap-2 mb-6">
          {CHANNELS.map(c => {
            const on = followed.has(c)
            return (
              <button key={c} onClick={() => toggleFollow(c)}
                className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors duration-150 ${
                  on
                    ? 'bg-indigo-500/12 text-indigo-300 border-indigo-500/30'
                    : 'bg-white/4 text-zinc-500 border-white/10 hover:text-zinc-300'
                }`}>
                <Building2 size={11} strokeWidth={1.75} />
                {c}
              </button>
            )
          })}
        </div>
      )}

      {/* Feed */}
      {visible.length === 0 ? (
        <div className="p-10 text-center surface">
          <Newspaper size={28} strokeWidth={1.5} className="mx-auto mb-4 text-zinc-500" />
          <h3 className="font-semibold mb-1 text-white">
            {tab === 'saved' ? t('news.saved') : t('news.following')}
          </h3>
          <p className="text-sm text-zinc-400">
            {tab === 'saved'
              ? 'Tap the bookmark on any post to keep it here.'
              : 'Follow a channel above to fill your feed.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(post => (
            <article key={post.id} className="surface p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-lg bg-white/6 border border-white/10 flex items-center justify-center shrink-0">
                    <Building2 size={14} className="text-zinc-400" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{post.channel}</p>
                    <p className="text-[11px] text-zinc-500">{post.industry} · {new Date(post.date).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${TAG_STYLES[post.tag]}`}>
                    {post.tag}
                  </span>
                  <button onClick={() => toggleSave(post.id)}
                    aria-label={saved.has(post.id) ? 'Remove from saved' : 'Save post'}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-indigo-300 hover:bg-white/6 transition-colors">
                    {saved.has(post.id)
                      ? <BookmarkCheck size={15} className="text-indigo-400" strokeWidth={2} />
                      : <Bookmark size={15} strokeWidth={1.75} />}
                  </button>
                </div>
              </div>
              <h2 className="font-semibold text-[15px] text-white mb-1.5">{post.title}</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">{post.body}</p>
              {post.jobLink && (
                <Link href="/jobs" className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-indigo-400 hover:text-indigo-300">
                  {t('news.seeRoles')} <ArrowRight size={12} />
                </Link>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default function NewsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-zinc-500">Loading…</div>}>
      <NewsContent />
    </Suspense>
  )
}
