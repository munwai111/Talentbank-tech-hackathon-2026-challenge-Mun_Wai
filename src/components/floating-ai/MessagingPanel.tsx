'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, FileText, ChevronRight, Check } from 'lucide-react'
import type { ConversationMinutes } from '@/lib/ai/minutes'

// ── Types ──────────────────────────────────────────────────────────────────────

type Contact = {
  id: string
  name: string
  role: string
  company: string
  initials: string
  lastMessage: string
  time: string
  unread: boolean
}

type ChatMessage = {
  id: string
  from: 'me' | 'them'
  text: string
  time: string
}

type SavedMinutes = ConversationMinutes & { savedAt?: string }

// ── Seed data ──────────────────────────────────────────────────────────────────

const CONTACTS: Contact[] = [
  { id: 'c1', name: 'Sonia Jackson', role: 'Talent Acquisition Partner', company: 'Hays', initials: 'SJ',
    lastMessage: 'Exciting Opportunity with Hays — we are looking for…', time: 'Apr 22', unread: true },
  { id: 'c2', name: 'Ee Lyn Soo', role: 'Recruiter', company: 'TechCorp', initials: 'EL',
    lastMessage: 'Hi Ee Lyn, Thank you for reaching out. Though I know…', time: 'May 20', unread: false },
  { id: 'c3', name: 'Jasper Fang', role: 'Engineering Manager', company: 'FinFlow', initials: 'JF',
    lastMessage: 'Hi Mun Wai, thanks for connecting! I\'m Jasper from…', time: 'Apr 23', unread: false },
]

const INITIAL_THREADS: Record<string, ChatMessage[]> = {
  c1: [
    { id: 'm1', from: 'them', text: 'Hi there! I am the Talent Acquisition Partner at Hays. I am reaching out about an exciting sales career in Recruitment for ambitious candidates.', time: '4:26 PM' },
    { id: 'm2', from: 'them', text: 'We provide full training and support. Are you open to a brief call this week?', time: '4:27 PM' },
  ],
  c2: [
    { id: 'm1', from: 'them', text: 'Hi Mun Wai! Came across your profile — have a role that might interest you at TechCorp.', time: '10:15 AM' },
    { id: 'm2', from: 'me', text: 'Hi Ee Lyn, thank you for reaching out. Though this isn\'t quite aligned with my current direction, I appreciate the thought!', time: '2:30 PM' },
  ],
  c3: [
    { id: 'm1', from: 'them', text: 'Hi Mun Wai, thanks for connecting! I\'m Jasper from FinFlow. Your skills vault on Career OS caught our attention — we have a senior frontend role opening up.', time: '9:00 AM' },
  ],
}

const AVATAR_COLORS: Record<string, string> = {
  c1: 'bg-violet-700', c2: 'bg-indigo-700', c3: 'bg-sky-700',
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ContactRow({ contact, active, onClick }: { contact: Contact; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors ${
        active ? 'bg-white/8 border-r-2 border-indigo-500' : 'hover:bg-white/4 border-r-2 border-transparent'
      }`}>
      <span className={`w-8 h-8 rounded-full ${AVATAR_COLORS[contact.id]} text-white text-[11px] font-bold flex items-center justify-center shrink-0`}>
        {contact.initials}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span className={`text-[11px] font-semibold truncate ${contact.unread ? 'text-white' : 'text-zinc-300'}`}>{contact.name}</span>
          <span className="text-[10px] text-zinc-600 shrink-0">{contact.time}</span>
        </div>
        <p className="text-[10px] text-zinc-500 truncate mt-0.5">{contact.lastMessage}</p>
      </div>
      {contact.unread && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />}
    </button>
  )
}

function MinutesCard({ minutes, onSave }: { minutes: SavedMinutes; onSave: () => void }) {
  return (
    <div className="mx-3 mb-2 rounded-xl bg-indigo-500/8 border border-indigo-500/20 p-3 text-[11px]">
      <div className="flex items-center gap-1.5 mb-2">
        <FileText size={11} className="text-indigo-400" />
        <span className="font-semibold text-indigo-300">AI Conversation Minutes</span>
      </div>
      <p className="text-zinc-400 mb-2 leading-relaxed">{minutes.summary}</p>
      {minutes.keyPoints.length > 0 && (
        <div className="mb-2">
          <p className="text-[10px] font-medium text-zinc-500 mb-1">KEY POINTS</p>
          {minutes.keyPoints.map((p, i) => (
            <p key={i} className="text-zinc-400 flex gap-1.5 mb-0.5"><span className="text-indigo-400 shrink-0">•</span>{p}</p>
          ))}
        </div>
      )}
      {minutes.actionItems.length > 0 && (
        <div className="mb-2">
          <p className="text-[10px] font-medium text-zinc-500 mb-1">ACTION ITEMS</p>
          {minutes.actionItems.map((a, i) => (
            <p key={i} className="text-zinc-400 flex gap-1.5 mb-0.5"><ChevronRight size={10} className="text-emerald-400 mt-0.5 shrink-0" />{a}</p>
          ))}
        </div>
      )}
      {minutes.savedAt ? (
        <p className="text-emerald-500 flex items-center gap-1"><Check size={10} />Saved to contact notes</p>
      ) : (
        <button onClick={onSave} className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
          <Check size={10} />Save to contact notes
        </button>
      )}
    </div>
  )
}

function ChatInput({ onSend }: { onSend: (text: string) => void }) {
  const [value, setValue] = useState('')
  function send() { if (!value.trim()) return; onSend(value.trim()); setValue('') }
  return (
    <div className="px-3 pb-3 pt-2 border-t border-white/8 flex gap-2">
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); send() } }}
        placeholder="Write a message…"
        className="flex-1 bg-white/4 border border-white/10 rounded-xl px-3 py-2 text-xs text-white
          placeholder:text-zinc-600 focus:border-indigo-400/40 focus:outline-none transition-colors"
      />
      <button onClick={send} disabled={!value.trim()}
        className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 transition-colors shrink-0">
        <Send size={13} className="text-white" />
      </button>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function MessagingPanel() {
  const [activeId, setActiveId] = useState('c1')
  const [threads, setThreads] = useState(INITIAL_THREADS)
  const [minutesOn, setMinutesOn] = useState(false)
  const [loadingMinutes, setLoadingMinutes] = useState(false)
  const [minutesMap, setMinutesMap] = useState<Record<string, SavedMinutes | null>>({})
  const endRef = useRef<HTMLDivElement>(null)

  const contact = CONTACTS.find(c => c.id === activeId)!
  const thread = threads[activeId] ?? []

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [activeId, thread.length])

  function addMessage(text: string) {
    const msg: ChatMessage = { id: `m${Date.now()}`, from: 'me', text, time: new Date().toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' }) }
    setThreads(prev => ({ ...prev, [activeId]: [...(prev[activeId] ?? []), msg] }))
  }

  async function generateMinutes() {
    setLoadingMinutes(true)
    try {
      const conversation = thread.map(m => `${m.from === 'me' ? 'Me' : contact.name}: ${m.text}`).join('\n')
      const res = await fetch('/api/candidate/ai-minutes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation, contactName: contact.name }),
      })
      if (!res.ok) throw new Error('Minutes request failed')
      const { minutes } = await res.json() as { minutes: ConversationMinutes }
      setMinutesMap(prev => ({ ...prev, [activeId]: minutes }))
    } catch (err) {
      console.error('[messaging-panel] minutes error:', err)
    } finally {
      setLoadingMinutes(false)
    }
  }

  function saveMinutes() {
    setMinutesMap(prev => {
      const note = prev[activeId]
      if (!note) return prev
      return { ...prev, [activeId]: { ...note, savedAt: new Date().toISOString() } }
    })
  }

  return (
    <div className="flex h-full">
      {/* Contact list */}
      <div className="w-[130px] shrink-0 border-r border-white/8 overflow-y-auto">
        {CONTACTS.map(c => (
          <ContactRow key={c.id} contact={c} active={c.id === activeId} onClick={() => setActiveId(c.id)} />
        ))}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div className="px-3 py-2 border-b border-white/8 flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{contact.name}</p>
            <p className="text-[10px] text-zinc-500">{contact.role} · {contact.company}</p>
          </div>
          <button onClick={() => setMinutesOn(v => !v)} title={minutesOn ? 'AI Minutes ON' : 'AI Minutes OFF'}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium border transition-colors shrink-0 ml-2 ${
              minutesOn
                ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                : 'bg-white/4 text-zinc-500 border-white/10 hover:text-zinc-300'
            }`}>
            <Sparkles size={9} />Minutes
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {thread.map(msg => (
            <div key={msg.id} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] text-xs rounded-2xl px-3 py-2 leading-relaxed ${
                msg.from === 'me'
                  ? 'bg-indigo-600 text-white rounded-br-sm'
                  : 'bg-white/6 border border-white/8 text-zinc-200 rounded-bl-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Generate minutes button */}
        {minutesOn && !minutesMap[activeId] && thread.length >= 2 && (
          <div className="px-3 pb-2">
            <button onClick={generateMinutes} disabled={loadingMinutes}
              className="w-full text-[11px] flex items-center justify-center gap-1.5 py-1.5 rounded-lg
                bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loadingMinutes
                ? <><span className="w-3 h-3 border border-indigo-400/50 border-t-indigo-400 rounded-full animate-spin" />Generating minutes…</>
                : <><Sparkles size={11} />Generate conversation minutes</>}
            </button>
          </div>
        )}

        {/* Minutes card */}
        {minutesMap[activeId] && <MinutesCard minutes={minutesMap[activeId]!} onSave={saveMinutes} />}

        <ChatInput onSend={addMessage} />
      </div>
    </div>
  )
}
