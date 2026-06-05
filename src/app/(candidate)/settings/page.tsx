'use client'

// /settings — Account & Privacy Settings
//
// Contains:
//   • Profile display name / visibility controls (static info for now)
//   • Danger Zone — Delete Account flow
//
// Delete Account flow (3 steps):
//   Step 1 — Reason selection (chips, multi-select) + optional detail textarea
//            "Other reason" always forces a textarea
//   Step 2 — Consequence summary + type-to-confirm ("DELETE")
//   Step 3 — Processing → done screen (redirects to sign-in)

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

// ── Deletion reasons ─────────────────────────────────────────────────────────

const DELETION_REASONS = [
  {
    value: 'got_job',
    emoji: '🎉',
    label: 'I got the job — mission accomplished!',
    promptDetail: false,
  },
  {
    value: 'not_right_fit',
    emoji: '🤔',
    label: "The platform wasn't what I expected",
    promptDetail: true,
  },
  {
    value: 'privacy',
    emoji: '🔒',
    label: 'Privacy concerns — I want my data removed',
    promptDetail: true,
  },
  {
    value: 'not_looking',
    emoji: '⏸️',
    label: "I'm not currently looking for work",
    promptDetail: false,
  },
  {
    value: 'notifications',
    emoji: '🔔',
    label: 'Too many notifications or emails',
    promptDetail: false,
  },
  {
    value: 'technical',
    emoji: '⚙️',
    label: 'Technical issues — things weren\'t working',
    promptDetail: true,
  },
  {
    value: 'other',
    emoji: '💬',
    label: 'Other reason',
    promptDetail: true,   // always triggers textarea
  },
]

// ── Step indicator ────────────────────────────────────────────────────────────

function StepDots({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {[1, 2, 3].map(s => (
        <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
          s < step ? 'bg-red-500' : s === step ? 'bg-red-400' : 'bg-white/15'
        }`} />
      ))}
    </div>
  )
}

// ── Reason chip ───────────────────────────────────────────────────────────────

function ReasonChip({
  reason,
  selected,
  onClick,
}: {
  reason: typeof DELETION_REASONS[0]
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm text-left w-full transition-all ${
        selected
          ? 'bg-red-500/10 border-red-500/40 text-red-300'
          : 'bg-white/4 border-white/10 text-zinc-300 hover:border-white/25 hover:bg-white/8'
      }`}
    >
      <span className="text-base flex-shrink-0">{reason.emoji}</span>
      <span className="flex-1">{reason.label}</span>
      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
        selected ? 'border-red-500 bg-red-500' : 'border-white/30'
      }`}>
        {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
      </div>
    </button>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

type DeleteStep = 1 | 2 | 3

export default function SettingsPage() {
  const { user } = useUser()
  const router = useRouter()

  // Delete flow state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteStep, setDeleteStep] = useState<DeleteStep>(1)
  const [selectedReasons, setSelectedReasons] = useState<string[]>([])
  const [feedback, setFeedback] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [purgeDate, setPurgeDate] = useState<string | null>(null)

  // Show the textarea if any selected reason prompts for detail, or "other" is selected
  const showTextarea = selectedReasons.some(r =>
    DELETION_REASONS.find(d => d.value === r)?.promptDetail
  )

  const toggleReason = useCallback((value: string) => {
    setSelectedReasons(prev =>
      prev.includes(value) ? prev.filter(r => r !== value) : [...prev, value]
    )
  }, [])

  const canProceedStep1 = selectedReasons.length > 0 &&
    (!showTextarea || feedback.trim().length >= 10 ||
      !selectedReasons.some(r => DELETION_REASONS.find(d => d.value === r && d.value === 'other'))
    )

  const canConfirm = confirmText.trim() === 'DELETE'

  async function handleDelete() {
    if (!canConfirm) return
    setDeleting(true)
    setError(null)

    try {
      const res = await fetch('/api/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reasons: selectedReasons, feedback }),
      })

      const data = await res.json() as { ok?: boolean; error?: string; purgeDate?: string }

      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Deletion failed')

      setPurgeDate(data.purgeDate ?? null)
      setDeleteStep(3)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setDeleting(false)
    }
  }

  function formatPurgeDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-MY', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  }

  return (
    <div className="p-8 max-w-2xl">
      {/* ── Page header ───────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-zinc-500 mt-1">Manage your account and privacy preferences.</p>
      </div>

      {/* ── Account info (read-only) ───────────────────────────────── */}
      <div className="bg-white/4 border border-white/8 rounded-2xl p-6 mb-6">
        <h2 className="font-semibold text-zinc-200 mb-4">Account</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-white/8">
            <span className="text-sm text-zinc-400">Name</span>
            <span className="text-sm text-zinc-200 font-medium">
              {user?.fullName ?? user?.firstName ?? '—'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-white/8">
            <span className="text-sm text-zinc-400">Email</span>
            <span className="text-sm text-zinc-300">
              {user?.primaryEmailAddress?.emailAddress ?? '—'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-zinc-400">Account type</span>
            <span className="text-xs bg-indigo-500/15 text-indigo-400 font-medium px-2.5 py-1 rounded-full">Candidate</span>
          </div>
        </div>
      </div>

      {/* ── Privacy ───────────────────────────────────────────────── */}
      <div className="bg-white/4 border border-white/8 rounded-2xl p-6 mb-6">
        <h2 className="font-semibold text-zinc-200 mb-2">Privacy</h2>
        <p className="text-sm text-zinc-500 mb-4">
          Your profile is only visible to employers when you apply to a role or activate matching.
          Your personal data — including name, DOB, and life context — is never shared with employers.
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            '✓ Name & DOB private',
            '✓ Life context not shown to employers',
            '✓ Salary preferences private',
            '✓ Character responses not shared',
          ].map(item => (
            <span key={item} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── Danger zone ───────────────────────────────────────────── */}
      <div className="border border-red-500/20 rounded-2xl overflow-hidden">
        <div className="bg-red-500/8 px-6 py-4 border-b border-red-500/20">
          <h2 className="font-semibold text-red-300">Danger Zone</h2>
          <p className="text-sm text-red-400/70 mt-0.5">
            Irreversible actions. Read carefully before proceeding.
          </p>
        </div>

        <div className="p-6 bg-white/3">
          {!deleteOpen ? (
            /* ── Collapsed trigger ─────────────────────────────── */
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-zinc-200 text-sm">Delete your account</p>
                <p className="text-zinc-400 text-sm mt-1">
                  Removes your account and anonymises your data immediately.
                  Personal information is permanently deleted after 6 months.
                  You can re-register with the same email at any time.
                </p>
              </div>
              <button
                onClick={() => { setDeleteOpen(true); setDeleteStep(1) }}
                className="shrink-0 px-4 py-2 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium hover:bg-red-500/8 transition-all"
              >
                Delete account
              </button>
            </div>
          ) : deleteStep === 1 ? (
            /* ── Step 1: Reason selection ──────────────────────── */
            <div>
              <StepDots step={1} />
              <h3 className="font-semibold text-zinc-200 mb-1">Before you go — why are you leaving?</h3>
              <p className="text-zinc-400 text-sm mb-5">
                Select everything that applies. This helps us improve for the people who stay.
              </p>

              <div className="space-y-2 mb-5">
                {DELETION_REASONS.map(reason => (
                  <ReasonChip
                    key={reason.value}
                    reason={reason}
                    selected={selectedReasons.includes(reason.value)}
                    onClick={() => toggleReason(reason.value)}
                  />
                ))}
              </div>

              {/* Conditional detail textarea */}
              {showTextarea && (
                <div className="mb-5">
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    {selectedReasons.includes('other')
                      ? 'Tell us more about your reason'
                      : 'Any additional context? (optional)'}
                    {selectedReasons.includes('other') && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  <textarea
                    className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-white/25 resize-none"
                    rows={4}
                    placeholder={
                      selectedReasons.includes('other')
                        ? 'Please describe your reason — your feedback directly shapes how we improve this platform...'
                        : 'What specifically didn\'t work for you? Even one sentence helps us improve...'
                    }
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                  />
                  <p className="text-xs text-zinc-400 mt-1">{feedback.length} characters</p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setDeleteOpen(false); setSelectedReasons([]); setFeedback('') }}
                  className="px-5 py-2.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setDeleteStep(2)}
                  disabled={!canProceedStep1}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    canProceedStep1
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-white/8 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  Continue →
                </button>
              </div>
            </div>
          ) : deleteStep === 2 ? (
            /* ── Step 2: Consequences + confirmation ───────────── */
            <div>
              <StepDots step={2} />
              <h3 className="font-semibold text-zinc-200 mb-1">Confirm account deletion</h3>
              <p className="text-zinc-400 text-sm mb-5">
                Please read what happens before you confirm.
              </p>

              {/* Consequences list */}
              <div className="bg-white/4 border border-white/8 rounded-xl p-4 mb-5 space-y-2">
                {[
                  {
                    icon: '🚫',
                    bold: 'Immediate',
                    text: 'Your profile disappears from employer searches and job matches instantly.',
                  },
                  {
                    icon: '🔐',
                    bold: 'Immediate',
                    text: 'Your personal information (name, DOB, life context) is cleared from our systems right away.',
                  },
                  {
                    icon: '🔄',
                    bold: 'Immediate',
                    text: 'You can re-register with the same email address at any time — you start completely fresh.',
                  },
                  {
                    icon: '🗑️',
                    bold: 'After 6 months',
                    text: 'All remaining data (skills, portfolio, work history) is permanently deleted. This cannot be reversed.',
                  },
                ].map(item => (
                  <div key={item.text} className="flex items-start gap-3 text-sm">
                    <span className="text-base flex-shrink-0">{item.icon}</span>
                    <p className="text-zinc-400">
                      <span className="font-semibold text-zinc-200">{item.bold}: </span>
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Type-to-confirm */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Type <span className="font-mono font-bold text-red-400">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  className={`w-full border rounded-xl px-4 py-3 text-sm font-mono focus:outline-none transition-all ${
                    confirmText === 'DELETE'
                      ? 'border-red-400 bg-red-500/10 text-red-300'
                      : 'border-white/10 bg-white/6 text-zinc-200 focus:border-white/25'
                  }`}
                  placeholder="Type DELETE"
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 bg-red-500/8 border border-red-500/20 rounded-xl text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setDeleteStep(1); setConfirmText('') }}
                  disabled={deleting}
                  className="px-5 py-2.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-40"
                >
                  ← Back
                </button>
                <button
                  onClick={handleDelete}
                  disabled={!canConfirm || deleting}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    canConfirm && !deleting
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-white/8 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  {deleting ? 'Deleting your account...' : 'Permanently delete my account'}
                </button>
              </div>

              <p className="text-xs text-zinc-400 text-center mt-3">
                This action is irreversible. Your data will be held for 6 months before final deletion.
              </p>
            </div>
          ) : (
            /* ── Step 3: Done ──────────────────────────────────── */
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 text-emerald-400">
                ✓
              </div>
              <h3 className="font-semibold text-zinc-200 text-lg mb-2">Account deleted</h3>
              <p className="text-zinc-400 text-sm mb-1">
                Your profile has been removed and your personal data cleared.
              </p>
              {purgeDate && (
                <p className="text-zinc-400 text-xs mb-6">
                  Remaining data will be permanently destroyed on{' '}
                  <span className="font-medium text-zinc-300">{formatPurgeDate(purgeDate)}</span>.
                </p>
              )}
              <p className="text-zinc-400 text-sm mb-6">
                Thank you for trying Career OS.
                If you ever want to come back, you can re-register with the same email — fresh start.
              </p>
              <button
                onClick={() => router.push('/sign-in')}
                className="px-8 py-3 bg-white/10 hover:bg-white/15 text-zinc-200 rounded-xl text-sm font-medium transition-all"
              >
                Back to sign-in
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Fine print ────────────────────────────────────────────── */}
      <p className="text-xs text-zinc-400 text-center mt-8">
        Career OS processes your data in accordance with our{' '}
        <a href="#" className="underline hover:text-zinc-600">Privacy Policy</a>.
        {' '}Data retention and deletion follow Malaysian PDPA requirements.
        {' '}© 2026 Career OS. All rights reserved.
      </p>
    </div>
  )
}
