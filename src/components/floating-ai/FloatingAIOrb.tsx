'use client'

import { useState, useRef, useEffect } from 'react'
import { BrainCircuit, MessageCircle, X, Minus } from 'lucide-react'
import { CoachChatPanel } from './CoachChatPanel'
import { MessagingPanel } from './MessagingPanel'

type Tab = 'coach' | 'messages'
type ChatPos = { right: number; bottom: number }

// ── Screen edge glow (Claude computer-use style) ──────────────────────────────

function ScreenEdgeGlow({ visible }: { visible: boolean }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[88] transition-opacity duration-700"
      style={{
        opacity: visible ? 1 : 0,
        boxShadow: [
          'inset 0 0 180px 40px rgba(99,102,241,0.28)',
          'inset 0 0 80px 8px rgba(139,92,246,0.18)',
          'inset 0 0 40px 0px rgba(167,139,250,0.08)',
        ].join(', '),
      }}
    />
  )
}

// ── Ripple on click ───────────────────────────────────────────────────────────

function Ripple({ active }: { active: boolean }) {
  if (!active) return null
  return (
    <span className="absolute inset-0 rounded-full animate-ping bg-indigo-500/25 pointer-events-none" />
  )
}

// ── Orb button ────────────────────────────────────────────────────────────────

function OrbButton({ hovered, clicked, onClick, onHoverChange }: {
  hovered: boolean
  clicked: boolean
  onClick: () => void
  onHoverChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      aria-label="Open AI assistant"
      className="relative w-14 h-14 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400
        transition-transform duration-300"
      style={{ transform: hovered ? 'scale(1.12)' : 'scale(1)' }}
    >
      <Ripple active={clicked} />

      {/* Rotating gradient ring — shader orb effect */}
      <span
        className="absolute inset-[-3px] rounded-full"
        style={{
          background: 'conic-gradient(from 0deg, transparent 0%, #818cf8 22%, #c4b5fd 33%, #818cf8 50%, transparent 68%, #818cf8 83%, transparent 100%)',
          animation: 'spin 7s linear infinite',
          opacity: hovered ? 1 : 0.6,
          transition: 'opacity 0.4s',
        }}
      />

      {/* Sphere body — dark glossy gradient */}
      <span
        className="absolute inset-[2px] rounded-full z-10"
        style={{ background: 'radial-gradient(circle at 33% 28%, #4338ca 0%, #1e1b4b 45%, #0d0c1a 100%)' }}
      />

      {/* Lens highlight */}
      <span
        className="absolute z-20 rounded-full pointer-events-none"
        style={{ top: '16%', left: '18%', width: '32%', height: '22%', background: 'radial-gradient(ellipse, rgba(255,255,255,0.18) 0%, transparent 100%)' }}
      />

      {/* Glow bloom */}
      <span
        className="absolute inset-[-6px] rounded-full z-0 transition-opacity duration-400"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)',
          opacity: hovered ? 1 : 0.35,
          filter: 'blur(8px)',
        }}
      />

      {/* Icon */}
      <BrainCircuit
        size={20}
        className="absolute z-30 text-indigo-200 transition-colors duration-300"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: hovered ? '#e0e7ff' : '#a5b4fc' }}
      />
    </button>
  )
}

// ── Chat window header ─────────────────────────────────────────────────────────

function ChatHeader({ tab, onTabChange, onMinimize, onClose, onDragStart }: {
  tab: Tab
  onTabChange: (t: Tab) => void
  onMinimize: () => void
  onClose: () => void
  onDragStart: (e: React.MouseEvent) => void
}) {
  return (
    <div
      onMouseDown={onDragStart}
      className="flex items-center justify-between px-3 py-2.5 border-b border-white/8 cursor-grab active:cursor-grabbing shrink-0 select-none bg-[#0f0f1f] rounded-t-2xl"
    >
      <div className="flex gap-0.5">
        {(['coach', 'messages'] as Tab[]).map(t => (
          <button
            key={t}
            onMouseDown={e => e.stopPropagation()}
            onClick={() => onTabChange(t)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              tab === t
                ? 'bg-indigo-500/20 text-indigo-300'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t === 'coach' ? '✦ AI Coach' : '✉ Messages'}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <button onMouseDown={e => e.stopPropagation()} onClick={onMinimize}
          className="p-1 rounded-lg text-zinc-600 hover:text-zinc-300 transition-colors">
          <Minus size={13} />
        </button>
        <button onMouseDown={e => e.stopPropagation()} onClick={onClose}
          className="p-1 rounded-lg text-zinc-600 hover:text-zinc-300 transition-colors">
          <X size={13} />
        </button>
      </div>
    </div>
  )
}

// ── Draggable chat window ─────────────────────────────────────────────────────

function FloatingChatWindow({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('coach')
  const [minimized, setMinimized] = useState(false)
  const [pos, setPos] = useState<ChatPos>({ right: 24, bottom: 92 })
  const [visible, setVisible] = useState(false)
  const dragRef = useRef<{ startX: number; startY: number; startRight: number; startBottom: number } | null>(null)

  // Pop-in animation
  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  // Drag tracking
  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragRef.current) return
      const { startX, startY, startRight, startBottom } = dragRef.current
      setPos({
        right: Math.max(0, startRight - (e.clientX - startX)),
        bottom: Math.max(0, startBottom - (e.clientY - startY)),
      })
    }
    function onUp() { dragRef.current = null }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
  }, [])

  function startDrag(e: React.MouseEvent) {
    e.preventDefault()
    dragRef.current = { startX: e.clientX, startY: e.clientY, startRight: pos.right, startBottom: pos.bottom }
  }

  return (
    <div
      className="fixed z-[90] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-white/10
        transition-all duration-200"
      style={{
        right: pos.right,
        bottom: pos.bottom,
        width: 400,
        height: minimized ? 44 : 520,
        background: '#0a0a14',
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1) translateY(0)' : 'scale(0.88) translateY(12px)',
        transformOrigin: 'bottom right',
        boxShadow: '0 0 0 1px rgba(99,102,241,0.2), 0 24px 48px rgba(0,0,0,0.6), 0 0 60px rgba(99,102,241,0.08)',
      }}
    >
      <ChatHeader
        tab={tab}
        onTabChange={setTab}
        onMinimize={() => setMinimized(v => !v)}
        onClose={onClose}
        onDragStart={startDrag}
      />
      {!minimized && (
        <div className="flex-1 overflow-hidden">
          {tab === 'coach' ? <CoachChatPanel /> : <MessagingPanel />}
        </div>
      )}
    </div>
  )
}

// ── Main exported component ───────────────────────────────────────────────────

export function FloatingAIOrb() {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [ripple, setRipple] = useState(false)

  function handleClick() {
    setRipple(true)
    setTimeout(() => { setRipple(false); setOpen(true) }, 220)
  }

  return (
    <>
      <ScreenEdgeGlow visible={hovered && !open} />

      <div className="fixed bottom-6 right-6 z-[90]">
        {!open && (
          <OrbButton
            hovered={hovered}
            clicked={ripple}
            onClick={handleClick}
            onHoverChange={setHovered}
          />
        )}

        {/* Collapsed pill when chat is open */}
        {open && (
          <button
            onClick={() => setOpen(false)}
            className="w-10 h-10 rounded-full bg-[#0d0c1a] border border-white/10 flex items-center justify-center
              text-zinc-500 hover:text-zinc-300 transition-colors shadow-lg"
            aria-label="Hide chat"
          >
            <MessageCircle size={16} />
          </button>
        )}
      </div>

      {open && <FloatingChatWindow onClose={() => setOpen(false)} />}
    </>
  )
}
