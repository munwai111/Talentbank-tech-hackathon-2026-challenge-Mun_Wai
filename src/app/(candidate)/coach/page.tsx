'use client'

// /coach — AI Career Coach
// Live streaming chat with a career advisor that knows your actual profile.
// Messages are session-local (no persistence needed for demo).

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import type { CoachMessage } from '@/lib/ai/coach'

// ── Starter prompts shown before first message ────────────────────────────────

const STARTERS = [
  'What should I focus on to get a Senior role in the next 12 months?',
  'Am I underpaid for my role and experience level in Malaysia?',
  'I want to switch from backend to product management — is that realistic?',
  'What skills are most in-demand right now in KL tech companies?',
  'How do I negotiate a raise without risking my job?',
]

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

function MessageBubble({ msg }: { msg: CoachMessage & { streaming?: boolean } }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600
          flex items-center justify-center text-white text-sm mr-3 shrink-0 mt-0.5
          shadow-lg shadow-indigo-500/30">
          🤖
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-indigo-600 text-white rounded-br-sm shadow-lg shadow-indigo-500/20'
            : 'bg-white/8 border border-white/10 text-zinc-200 rounded-bl-sm backdrop-blur-sm'
        }`}
      >
        {msg.content}
        {msg.streaming && (
          <span className="inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 animate-pulse align-middle" />
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
                 hover:border-indigo-500/40 hover:text-white hover:bg-indigo-500/10 transition-all backdrop-blur-sm"
    >
      {text} →
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CoachPage() {
  const searchParams = useSearchParams()
  const [messages, setMessages] = useState<CoachMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  // Track whether we've already fired the ?q= nudge so it doesn't re-fire
  const nudgeFiredRef = useRef(false)

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // sendMessage is defined below; we use a ref so the nudge effect can call it
  // without creating a circular dependency.
  const sendMessageRef = useRef<(text: string) => void>(() => undefined)

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return

    const userMsg: CoachMessage = { role: 'user', content: text.trim() }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    setStreaming(true)

    // Placeholder so the cursor appears immediately
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
          updated[updated.length - 1] = {
            role: 'assistant',
            content: accumulated,
            streaming: true,
          } as CoachMessage & { streaming: boolean }
          return updated
        })
      }

      // Finalise — remove streaming cursor
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

  // Keep the ref current so the nudge effect can call the latest version
  useEffect(() => { sendMessageRef.current = sendMessage }, [sendMessage])

  // If the user arrived via the proactive nudge (?q=...), auto-send the question
  useEffect(() => {
    if (nudgeFiredRef.current) return
    const q = searchParams.get('q')
    if (!q) return
    nudgeFiredRef.current = true
    // Small delay so the page paint completes before the first message fires
    const timer = setTimeout(() => sendMessageRef.current(q), 300)
    return () => clearTimeout(timer)
  }, [searchParams])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const hasMessages = messages.length > 0

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/7 bg-[#08081a]/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600
            flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            🤖
          </div>
          <div>
            <h1 className="font-semibold text-white">AI Career Coach</h1>
            <p className="text-xs text-zinc-500">Knows your skills · APAC market · Honest advice</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Online
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Welcome state */}
        {!hasMessages && (
          <div className="max-w-xl mx-auto">
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
            </div>
            <div className="grid grid-cols-1 gap-2">
              {STARTERS.map(s => (
                <StarterButton key={s} text={s} onClick={() => sendMessage(s)} />
              ))}
            </div>
          </div>
        )}

        {/* Conversation */}
        {hasMessages && (
          <div className="max-w-2xl mx-auto">
            {messages.map((msg, i) => (
              <MessageBubble
                key={i}
                msg={msg as CoachMessage & { streaming?: boolean }}
              />
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
        <div className="max-w-2xl mx-auto flex gap-3 items-end">
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
                       disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
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
        <p className="text-center text-xs text-zinc-600 mt-2 max-w-2xl mx-auto">
          Shift+Enter for newline · Advice is personalised to your profile
        </p>
      </div>
    </div>
  )
}
