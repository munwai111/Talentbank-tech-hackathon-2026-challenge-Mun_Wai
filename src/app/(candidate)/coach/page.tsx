'use client'

// /coach — AI Career Coach
// Live streaming chat with a career advisor that knows your actual profile.
// Messages are session-local (no persistence needed for demo).

import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import type { CoachMessage } from '@/lib/ai/coach'
import type { CoachCalibration } from '@/app/api/candidate/coach-calibration/route'

// ── Starter prompts shown before first message ────────────────────────────────

const STARTERS = [
  'What should I focus on to get a Senior role in the next 12 months?',
  'Am I underpaid for my role and experience level in Malaysia?',
  'I want to switch from backend to product management — is that realistic?',
  'What skills are most in-demand right now in KL tech companies?',
  'How do I negotiate a raise without risking my job?',
]

const DEFAULT_CALIBRATION: CoachCalibration = {
  communication_style: 'Balanced',
  technical_depth: 'Mixed',
  career_stage: 'Fresh grad',
  primary_goal: '',
  coaching_tone: 'Honest',
}

// ── CalibrationPanel ──────────────────────────────────────────────────────────

function CalibrationPanel({
  open,
  onClose,
  onCalibrated,
}: {
  open: boolean
  onClose: () => void
  onCalibrated: () => void
}) {
  const [form, setForm] = useState<CoachCalibration>(DEFAULT_CALIBRATION)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Load existing calibration on open
  useEffect(() => {
    if (!open) return
    fetch('/api/candidate/coach-calibration')
      .then(r => r.json())
      .then(({ calibration }: { calibration: CoachCalibration | null }) => {
        if (calibration) setForm(calibration)
      })
      .catch(() => { /* use defaults */ })
  }, [open])

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/candidate/coach-calibration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setSaved(true)
        onCalibrated()
        setTimeout(onClose, 800)
      }
    } catch { /* silently fail */ }
    finally { setSaving(false) }
  }

  function setField<K extends keyof CoachCalibration>(key: K, value: CoachCalibration[K]) {
    setForm(f => ({ ...f, [key]: value }))
    setSaved(false)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`fixed top-0 right-0 h-full w-[360px] z-50 flex flex-col
        bg-[#0f0f1f] border-l border-white/10 shadow-2xl
        transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-start justify-between shrink-0">
          <div>
            <h2 className="font-semibold text-white">🎛 Coach Calibration</h2>
            <p className="text-xs text-zinc-500 mt-0.5">How should your coach communicate?</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors text-xl leading-none mt-0.5">×</button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <div>
            <Label className="text-xs text-zinc-400 mb-1.5 block">Communication style</Label>
            <Select value={form.communication_style} onValueChange={v => setField('communication_style', v as CoachCalibration['communication_style'])}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(['Formal', 'Balanced', 'Casual'] as const).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-zinc-400 mb-1.5 block">Technical depth</Label>
            <Select value={form.technical_depth} onValueChange={v => setField('technical_depth', v as CoachCalibration['technical_depth'])}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(['Non-technical', 'Mixed', 'Technical'] as const).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-zinc-400 mb-1.5 block">Career stage</Label>
            <Select value={form.career_stage} onValueChange={v => setField('career_stage', v as CoachCalibration['career_stage'])}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(['Student', 'Fresh grad', 'Mid-career', 'Senior'] as const).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-zinc-400 mb-1.5 block">Primary goal</Label>
            <Input
              placeholder="e.g. Land a product manager role by 2027"
              value={form.primary_goal}
              onChange={e => setField('primary_goal', e.target.value)}
            />
          </div>

          <div>
            <Label className="text-xs text-zinc-400 mb-1.5 block">Coaching tone</Label>
            <Select value={form.coaching_tone} onValueChange={v => setField('coaching_tone', v as CoachCalibration['coaching_tone'])}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(['Motivating', 'Honest', 'Strategic', 'Analytical'] as const).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Save */}
        <div className="px-5 py-4 border-t border-white/10 shrink-0">
          <Button onClick={save} disabled={saving} className="w-full">
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : saved ? '✓ Saved!' : 'Save calibration'}
          </Button>
          <p className="text-xs text-zinc-600 text-center mt-2">Settings apply to your next message</p>
        </div>
      </div>
    </>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}

function CoachMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
        em: ({ children }) => <em className="text-zinc-300 italic">{children}</em>,
        h1: ({ children }) => <h1 className="text-base font-bold text-white mb-2 mt-3 first:mt-0">{children}</h1>,
        h2: ({ children }) => <h2 className="text-sm font-bold text-white mb-2 mt-3 first:mt-0">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-semibold text-zinc-200 mb-1.5 mt-2.5 first:mt-0">{children}</h3>,
        ul: ({ children }) => <ul className="space-y-1 mb-3 ml-1">{children}</ul>,
        ol: ({ children }) => <ol className="space-y-1 mb-3 ml-1 list-none counter-reset-[item]">{children}</ol>,
        li: ({ children, ...props }) => {
          const ordered = 'ordered' in props
          return (
            <li className={`flex gap-2 text-sm leading-relaxed ${ordered ? 'items-start' : 'items-start'}`}>
              <span className="shrink-0 mt-0.5 text-indigo-400 font-medium">{ordered ? '→' : '•'}</span>
              <span>{children}</span>
            </li>
          )
        },
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-indigo-400 pl-3 my-3 text-zinc-300 italic">{children}</blockquote>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-3"><table className="text-xs border-collapse w-full">{children}</table></div>
        ),
        thead: ({ children }) => <thead className="text-zinc-400">{children}</thead>,
        th: ({ children }) => <th className="border border-white/10 px-2 py-1 text-left font-semibold text-zinc-300">{children}</th>,
        td: ({ children }) => <td className="border border-white/10 px-2 py-1 text-zinc-300">{children}</td>,
        code: ({ children }) => <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs text-indigo-300 font-mono">{children}</code>,
        hr: () => <hr className="border-white/10 my-3" />,
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

function MessageBubble({ msg }: { msg: CoachMessage & { streaming?: boolean } }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-5`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600
          flex items-center justify-center text-white text-sm mr-3 shrink-0 mt-0.5
          shadow-lg shadow-indigo-500/30">
          🤖
        </div>
      )}
      <div className={`rounded-2xl px-4 py-3 text-sm ${
        isUser
          ? 'max-w-[80%] bg-indigo-600 text-white rounded-br-sm shadow-lg shadow-indigo-500/20 leading-relaxed'
          : 'max-w-[88%] bg-white/6 border border-white/10 text-zinc-300 rounded-bl-sm backdrop-blur-sm'
      }`}>
        {isUser ? (
          <>
            {msg.content}
            {msg.streaming && <span className="inline-block w-0.5 h-4 bg-white/60 ml-0.5 animate-pulse align-middle" />}
          </>
        ) : (
          <>
            <CoachMarkdown content={msg.content} />
            {msg.streaming && <span className="inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 animate-pulse align-middle" />}
          </>
        )}
      </div>
    </div>
  )
}

function StarterButton({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-left px-4 py-3 rounded-xl border border-white/10 bg-white/4 text-sm text-zinc-400
                 hover:border-indigo-500/40 hover:text-white hover:bg-indigo-500/10 transition backdrop-blur-sm"
    >
      {text} →
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const COACH_STORAGE_KEY = 'career_os_coach_messages'
const MAX_STORED_MESSAGES = 40

function loadStoredMessages(): CoachMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(COACH_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CoachMessage[]
    return Array.isArray(parsed) ? parsed.slice(-MAX_STORED_MESSAGES) : []
  } catch {
    return []
  }
}

function CoachPageInner() {
  const searchParams = useSearchParams()
  const [messages, setMessages] = useState<CoachMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [calibrationOpen, setCalibrationOpen] = useState(false)
  const [isCalibrated, setIsCalibrated] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const nudgeFiredRef = useRef(false)

  // Load persisted messages on mount
  useEffect(() => {
    const stored = loadStoredMessages()
    if (stored.length > 0) setMessages(stored)
  }, [])

  // Persist messages to localStorage on every change
  useEffect(() => {
    if (messages.length === 0) return
    try {
      localStorage.setItem(COACH_STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)))
    } catch { /* storage full or unavailable */ }
  }, [messages])

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Check if already calibrated on mount
  useEffect(() => {
    fetch('/api/candidate/coach-calibration')
      .then(r => r.json())
      .then(({ calibration }: { calibration: CoachCalibration | null }) => {
        if (calibration) setIsCalibrated(true)
      })
      .catch(() => { /* ignore */ })
  }, [])

  // Open calibration panel if ?calibrate=1
  useEffect(() => {
    if (searchParams.get('calibrate') === '1') setCalibrationOpen(true)
  }, [searchParams])

  const sendMessageRef = useRef<(text: string) => void>(() => undefined)

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return

    const userMsg: CoachMessage = { role: 'user', content: text.trim() }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    setStreaming(true)

    setMessages(prev => [
      ...prev,
      { role: 'assistant', content: '', streaming: true } as CoachMessage & { streaming: boolean },
    ])

    try {
      const res = await fetch('/api/candidate/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      })

      if (!res.ok || !res.body) throw new Error('Coach unavailable')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: accumulated, streaming: true } as CoachMessage & { streaming: boolean }
          return updated
        })
      }

      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: accumulated }
        return updated
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: `Sorry — ${msg}. Try again.` }
        return updated
      })
    } finally {
      setStreaming(false)
      inputRef.current?.focus()
    }
  }, [messages, streaming])

  useEffect(() => { sendMessageRef.current = sendMessage }, [sendMessage])

  useEffect(() => {
    if (nudgeFiredRef.current) return
    const q = searchParams.get('q')
    if (!q) return
    nudgeFiredRef.current = true
    const timer = setTimeout(() => sendMessageRef.current(q), 300)
    return () => clearTimeout(timer)
  }, [searchParams])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  const hasMessages = messages.length > 0

  return (
    <div className="flex flex-col h-screen">
      {/* Calibration panel */}
      <CalibrationPanel
        open={calibrationOpen}
        onClose={() => setCalibrationOpen(false)}
        onCalibrated={() => setIsCalibrated(true)}
      />

      {/* Header */}
      <div className="px-6 py-4 border-b border-white/7 bg-[#08081a]/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600
            flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            🤖
          </div>
          <div>
            <h1 className="font-semibold text-white flex items-center gap-2">
              AI Career Coach
              {isCalibrated && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-medium">
                  🎛 Calibrated ✓
                </span>
              )}
            </h1>
            <p className="text-xs text-zinc-500">Knows your skills · APAC market · Honest advice</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {messages.length > 0 && (
              <button
                onClick={() => {
                  setMessages([])
                  try { localStorage.removeItem(COACH_STORAGE_KEY) } catch { /* ignore */ }
                }}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                title="Clear conversation"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setCalibrationOpen(true)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg
                bg-white/6 text-zinc-400 border border-white/10
                hover:bg-white/10 hover:text-white transition"
            >
              🎛 Calibrate
            </button>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </div>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {!hasMessages && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600
                flex items-center justify-center text-3xl mx-auto mb-4 shadow-xl shadow-indigo-500/30">
                🧠
              </div>
              <h2 className="text-lg font-semibold text-white">Your personal career coach</h2>
              <p className="text-sm text-zinc-400 mt-2 max-w-sm mx-auto">
                Ask anything about your career path, salary, skill gaps, or what moves to make next.
                I know your profile — no need to re-explain yourself.
              </p>
              {!isCalibrated && (
                <button
                  onClick={() => setCalibrationOpen(true)}
                  className="mt-4 text-xs text-indigo-400 hover:text-indigo-300 underline transition-colors"
                >
                  🎛 Calibrate my coach for better advice →
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-2">
              {STARTERS.map(s => (
                <StarterButton key={s} text={s} onClick={() => sendMessage(s)} />
              ))}
            </div>
          </div>
        )}

        {hasMessages && (
          <div className="max-w-3xl mx-auto">
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg as CoachMessage & { streaming?: boolean }} />
            ))}
            {streaming && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex justify-start mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600
                  flex items-center justify-center text-white text-sm mr-3 shrink-0 shadow-lg shadow-indigo-500/30">
                  🤖
                </div>
                <div className="bg-white/8 border border-white/10 rounded-2xl rounded-bl-sm backdrop-blur-sm">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="px-6 py-4 border-t border-white/7 bg-[#08081a]/80 backdrop-blur-sm shrink-0">
        <div className="max-w-3xl mx-auto flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your career… (Enter to send)"
            disabled={streaming}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-white/10 bg-white/6 px-4 py-3 text-sm
                       text-zinc-200 placeholder:text-zinc-600
                       focus:outline-none focus:ring-1 focus:ring-indigo-500/60 focus:border-indigo-500/40
                       disabled:opacity-50 leading-relaxed backdrop-blur-sm"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white
                       flex items-center justify-center shadow-lg shadow-indigo-500/30
                       hover:from-violet-500 hover:to-indigo-500
                       disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0"
          >
            {streaming ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-center text-xs text-zinc-600 mt-2 max-w-3xl mx-auto">
          Shift+Enter for newline · Advice is personalised to your profile
        </p>
      </div>
    </div>
  )
}

export default function CoachPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-white/20 border-t-indigo-400 rounded-full animate-spin" /></div>}>
      <CoachPageInner />
    </Suspense>
  )
}
