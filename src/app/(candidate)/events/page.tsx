'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { FadeUp } from '@/components/animations/FadeUp'
import { Button } from '@/components/ui/button'
import {
  CalendarDays, MapPin, Ticket, Check, Users, Mic2,
} from 'lucide-react'

type CareerEvent = {
  id: string
  title: string
  host: string
  date: string
  location: string
  mode: 'In-person' | 'Online' | 'Hybrid'
  blurb: string
  spots: string
}

const EVENTS: CareerEvent[] = [
  {
    id: 'e1',
    title: 'Talentbank Career Fair 2026',
    host: 'Talentbank',
    date: '2026-07-18',
    location: 'KLCC Convention Centre, Kuala Lumpur',
    mode: 'In-person',
    blurb: 'Malaysia\'s largest skills-first hiring fair. 120+ employers screening by demonstrated ability — bring your portfolio, not just your CV.',
    spots: '2,400 attending',
  },
  {
    id: 'e2',
    title: 'KL Tech Hiring Week — Data & AI track',
    host: 'Axiata Digital',
    date: '2026-06-24',
    location: 'Bangsar South, KL',
    mode: 'Hybrid',
    blurb: 'A week of open interviews and portfolio reviews for data engineering, analytics, and ML roles. Walk-in technical conversations, no ATS.',
    spots: '380 attending',
  },
  {
    id: 'e3',
    title: 'Skills-First Hiring: Employer Roundtable',
    host: 'TalentLab Asia',
    date: '2026-06-19',
    location: 'Online',
    mode: 'Online',
    blurb: 'How Malaysian SMEs are replacing CV keyword filters with evidence-based screening. Open Q&A for candidates on what reviewers actually look for.',
    spots: '950 attending',
  },
  {
    id: 'e4',
    title: 'Penang Dev Meetup — Career Pivots Edition',
    host: 'FinFlow',
    date: '2026-07-02',
    location: 'Georgetown, Penang',
    mode: 'In-person',
    blurb: 'Engineers who switched domains share how they re-skilled. Includes a live Path Navigator demo and CV-to-skills clinic.',
    spots: '160 attending',
  },
]

type Tab = 'discover' | 'tickets' | 'host'
type HostForm = { title: string; format: string; about: string }

function patchPreferences(updates: Record<string, unknown>) {
  fetch('/api/candidate/preferences', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  }).catch(console.error)
}

function EventsContent() {
  const searchParams = useSearchParams()
  const initialTab = (['tickets', 'host'].includes(searchParams.get('tab') ?? '')
    ? searchParams.get('tab') : 'discover') as Tab
  const [tab, setTab] = useState<Tab>(initialTab)
  const [tickets, setTickets] = useState<Set<string>>(new Set())
  const [hostSubmitted, setHostSubmitted] = useState(false)
  const [hostForm, setHostForm] = useState<HostForm>({ title: '', format: 'Online', about: '' })

  useEffect(() => {
    fetch('/api/candidate/preferences')
      .then(r => r.json())
      .then(({ preferences }) => {
        if (!preferences) return
        setTickets(new Set(preferences.event_tickets ?? []))
        setHostSubmitted(preferences.host_request !== null)
      })
      .catch(console.error)
  }, [])

  function register(id: string) {
    setTickets(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      patchPreferences({ event_tickets: [...next] })
      return next
    })
  }

  function submitHost(e: React.FormEvent) {
    e.preventDefault()
    const request = { ...hostForm, submitted_at: Date.now() }
    patchPreferences({ host_request: request })
    setHostSubmitted(true)
  }

  const myEvents = EVENTS.filter(ev => tickets.has(ev.id))

  return (
    <div className="px-6 py-6 max-w-3xl">
      <FadeUp className="mb-6" scrollTrigger={false}>
        <p className="section-label mb-2">Meet the market</p>
        <h1 className="text-2xl font-bold text-white">Events</h1>
        <p className="text-zinc-400 mt-1">
          Career fairs, hiring weeks, and meetups — register to attend, or host your own.
        </p>
      </FadeUp>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/8">
        {([
          { id: 'discover', label: 'Discover' },
          { id: 'tickets', label: `My Tickets${tickets.size > 0 ? ` (${tickets.size})` : ''}` },
          { id: 'host', label: 'Host an event' },
        ] as { id: Tab; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.id ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}>
            {t.label}
            {tab === t.id && <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-t-full bg-gradient-to-r from-violet-400 to-indigo-500" />}
          </button>
        ))}
      </div>

      {/* ── Discover ─────────────────────────────────────────────────────── */}
      {tab === 'discover' && (
        <div className="space-y-3">
          {EVENTS.map(ev => <EventCard key={ev.id} ev={ev} hasTicket={tickets.has(ev.id)} onRegister={register} />)}
        </div>
      )}

      {/* ── My Tickets ───────────────────────────────────────────────────── */}
      {tab === 'tickets' && (
        myEvents.length === 0 ? (
          <div className="p-10 text-center surface">
            <Ticket size={28} strokeWidth={1.5} className="mx-auto mb-4 text-zinc-500" />
            <h3 className="font-semibold mb-1 text-white">No tickets yet</h3>
            <p className="text-sm text-zinc-400 mb-5">Register for an event and your ticket appears here.</p>
            <Button onClick={() => setTab('discover')} className="bg-indigo-600 hover:bg-indigo-500 border-0 text-white">
              Discover events
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {myEvents.map(ev => (
              <div key={ev.id} className="surface p-5 border-indigo-500/25 bg-indigo-500/5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="section-label !text-indigo-400 mb-1">Ticket · {ev.mode}</p>
                    <h3 className="font-semibold text-white">{ev.title}</h3>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-zinc-400">
                      <span className="inline-flex items-center gap-1.5"><CalendarDays size={12} className="opacity-60" />{new Date(ev.date).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      <span className="inline-flex items-center gap-1.5"><MapPin size={12} className="opacity-60" />{ev.location}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/25 rounded-lg px-2.5 py-1.5">
                      {ev.id.toUpperCase()}-{(ev.title.length * 7919).toString(36).toUpperCase().slice(0, 5)}
                    </p>
                    <button onClick={() => register(ev.id)} className="text-[11px] text-zinc-500 hover:text-red-400 transition-colors mt-2">
                      Cancel registration
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Host ─────────────────────────────────────────────────────────── */}
      {tab === 'host' && (
        hostSubmitted ? (
          <div className="p-10 text-center surface">
            <span className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <Check size={20} className="text-emerald-400" strokeWidth={2.5} />
            </span>
            <h3 className="font-semibold mb-1 text-white">Host request submitted</h3>
            <p className="text-sm text-zinc-400 max-w-sm mx-auto">
              Our team reviews host applications within 3 working days. You&apos;ll be
              notified once your event space is approved.
            </p>
          </div>
        ) : (
          <form onSubmit={submitHost} className="surface p-6 space-y-5">
            <div>
              <p className="section-label mb-1">Host an event</p>
              <p className="text-sm text-zinc-400">
                Run a meetup, portfolio clinic, or hiring session for the Career OS community.
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1.5">Event title</label>
              <input
                required
                value={hostForm.title}
                onChange={e => setHostForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Shah Alam Career Pivot Meetup"
                className="w-full bg-white/4 border border-white/10 rounded-lg px-3 py-2 text-sm text-white
                  placeholder:text-zinc-600 focus:border-indigo-400/50 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1.5">Format</label>
              <div className="flex gap-2">
                {['Online', 'In-person', 'Hybrid'].map(m => (
                  <button type="button" key={m} onClick={() => setHostForm(f => ({ ...f, format: m }))}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      hostForm.format === m
                        ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40'
                        : 'bg-white/4 text-zinc-500 border-white/10 hover:text-zinc-300'
                    }`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1.5">What is it about?</label>
              <textarea
                required
                rows={3}
                value={hostForm.about}
                onChange={e => setHostForm(f => ({ ...f, about: e.target.value }))}
                placeholder="Who it is for, what attendees will get, and roughly when you want to run it."
                className="w-full bg-white/4 border border-white/10 rounded-lg px-3 py-2 text-sm text-white
                  placeholder:text-zinc-600 focus:border-indigo-400/50 focus:outline-none transition-colors resize-none"
              />
            </div>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 border-0 text-white">
              <Mic2 size={14} /> Submit host request
            </Button>
          </form>
        )
      )}
    </div>
  )
}

function EventCard({ ev, hasTicket, onRegister }: {
  ev: CareerEvent
  hasTicket: boolean
  onRegister: (id: string) => void
}) {
  return (
    <div className="surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] text-zinc-500 mb-1">{ev.host} · {ev.mode}</p>
          <h3 className="font-semibold text-white">{ev.title}</h3>
          <p className="text-sm text-zinc-400 leading-relaxed mt-1.5">{ev.blurb}</p>
          <div className="flex flex-wrap gap-3 mt-3 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1.5"><CalendarDays size={12} className="opacity-60" />{new Date(ev.date).toLocaleDateString('en-MY', { day: 'numeric', month: 'long' })}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin size={12} className="opacity-60" />{ev.location}</span>
            <span className="inline-flex items-center gap-1.5"><Users size={12} className="opacity-60" />{ev.spots}</span>
          </div>
        </div>
        <div className="shrink-0">
          {hasTicket ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full
              bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Check size={12} strokeWidth={2.5} /> Registered
            </span>
          ) : (
            <Button size="sm" onClick={() => onRegister(ev.id)}
              className="bg-indigo-600 hover:bg-indigo-500 border-0 text-white">
              <Ticket size={13} /> Register
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function EventsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-zinc-500">Loading…</div>}>
      <EventsContent />
    </Suspense>
  )
}
