'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { CoachMessage } from '@/lib/ai/coach'

const STARTERS = [
  'What should I focus on for a Senior role in 12 months?',
  'Am I underpaid for my role in Malaysia?',
  'How do I switch from backend to product?',
  'What skills are most in-demand in KL tech?',
]

// ── Sub-components ─────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  )
}

function MessageBubble({ msg }: { msg: CoachMessage }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex mb-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[86%] text-sm rounded-2xl px-3.5 py-2.5 leading-relaxed ${
        isUser
          ? 'bg-indigo-600 text-white rounded-br-sm'
          : 'bg-white/6 border border-white/8 text-zinc-200 rounded-bl-sm'
      }`}>
        {isUser ? (
          <p>{msg.content}</p>
        ) : (
          <div className="prose-invert prose-sm max-w-none [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:text-white [&_ul]:pl-4 [&_li]:mb-0.5">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}

function StarterPrompts({ onSelect }: { onSelect: (s: string) => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 px-3 text-center">
      <p className="text-xs text-zinc-500">Your AI career coach — ask anything about your path, salary, or next move.</p>
      <div className="flex flex-col gap-1.5 w-full">
        {STARTERS.map(s => (
          <button key={s} onClick={() => onSelect(s)}
            className="text-xs text-left px-3 py-2 rounded-xl bg-white/4 border border-white/8
              text-zinc-400 hover:text-zinc-200 hover:border-indigo-500/30 transition-colors">
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Hook ───────────────────────────────────────────────────────────────────────

function useCoachStream() {
  const [messages, setMessages] = useState<CoachMessage[]>([])
  const [streaming, setStreaming] = useState(false)

  const send = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return
    const userMsg: CoachMessage = { role: 'user', content: text.trim() }
    const thread = [...messages, userMsg]
    setMessages(thread)
    setStreaming(true)

    try {
      const res = await fetch('/api/candidate/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: thread }),
      })
      if (!res.ok || !res.body) throw new Error('Stream failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let text = ''

      setMessages(prev => [...prev, { role: 'assistant', content: '' }])
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: text }])
      }
    } catch (err) {
      console.error('[coach-panel]', err)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
    } finally {
      setStreaming(false)
    }
  }, [messages, streaming])

  return { messages, streaming, send }
}

// ── Main component ─────────────────────────────────────────────────────────────

export function CoachChatPanel() {
  const { messages, streaming, send } = useCoachStream()
  const [input, setInput] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); setInput('') }
  }

  function handleSend() { send(input); setInput('') }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {messages.length === 0 ? (
          <StarterPrompts onSelect={s => { send(s) }} />
        ) : (
          <>
            {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
            {streaming && messages.at(-1)?.role !== 'assistant' && <TypingDots />}
          </>
        )}
        <div ref={endRef} />
      </div>

      <div className="px-3 pb-3 pt-2 border-t border-white/8">
        <div className="flex gap-2 items-end">
          <textarea
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={streaming}
            placeholder="Ask your coach…"
            className="flex-1 bg-white/4 border border-white/10 rounded-xl px-3 py-2 text-sm text-white
              placeholder:text-zinc-600 focus:border-indigo-400/40 focus:outline-none resize-none transition-colors"
          />
          <button onClick={handleSend} disabled={!input.trim() || streaming}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0">
            {streaming
              ? <Loader2 size={16} className="animate-spin text-white" />
              : <Send size={16} className="text-white" />}
          </button>
        </div>
      </div>
    </div>
  )
}
