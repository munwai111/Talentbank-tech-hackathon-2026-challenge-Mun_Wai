'use client'

// OnboardingGuide — a short, translated product tour.
//   • Auto-opens once for a newly-registered user (tracked in localStorage).
//   • Re-openable any time via the hotbar "?" button, which dispatches
//     OPEN_GUIDE_EVENT on window.
// All copy comes from the i18n dictionary (ob.* keys), so the tour appears
// in the user's selected language.

import { useEffect, useState, useCallback } from 'react'
import {
  Vault, Waypoints, Crosshair, ClipboardList, Bot,
  X, ArrowRight, ArrowLeft, type LucideIcon,
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { TranslationKey } from '@/lib/i18n/translations'

const STORAGE_KEY = 'career-os-onboarded'
export const OPEN_GUIDE_EVENT = 'career-os-open-guide'

type Step = { titleKey: TranslationKey; bodyKey: TranslationKey; Icon: LucideIcon }

const STEPS: Step[] = [
  { titleKey: 'ob.s1.title', bodyKey: 'ob.s1.body', Icon: Vault },
  { titleKey: 'ob.s2.title', bodyKey: 'ob.s2.body', Icon: Waypoints },
  { titleKey: 'ob.s3.title', bodyKey: 'ob.s3.body', Icon: Crosshair },
  { titleKey: 'ob.s4.title', bodyKey: 'ob.s4.body', Icon: ClipboardList },
  { titleKey: 'ob.s5.title', bodyKey: 'ob.s5.body', Icon: Bot },
]

export function OnboardingGuide() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    // Auto-open once for new users. rAF keeps the setState out of the effect
    // body (avoids set-state-in-effect) and runs after hydration.
    const raf = requestAnimationFrame(() => {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true)
    })
    const reopen = () => { setStep(0); setOpen(true) }
    window.addEventListener(OPEN_GUIDE_EVENT, reopen)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener(OPEN_GUIDE_EVENT, reopen)
    }
  }, [])

  const dismiss = useCallback(() => {
    try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* ignore */ }
    setOpen(false)
  }, [])

  if (!open) return null

  const isLast = step === STEPS.length - 1
  const { titleKey, bodyKey, Icon } = STEPS[step]

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-up"
      role="dialog"
      aria-modal="true"
      aria-label={t('ob.welcome')}
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-violet-400 to-indigo-500" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 pt-5">
          <div>
            <h2 className="text-lg font-bold text-foreground">{t('ob.welcome')}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{t('ob.welcomeSub')}</p>
          </div>
          <button
            onClick={dismiss}
            aria-label={t('ob.skip')}
            className="shrink-0 -mr-1 -mt-1 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Step body */}
        <div className="px-6 py-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-400/30 text-indigo-300">
              <Icon size={18} strokeWidth={1.75} />
            </span>
            <h3 className="text-base font-semibold text-foreground">{t(titleKey)}</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{t(bodyKey)}</p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 pb-4">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === step ? 'w-5 bg-indigo-400' : 'w-1.5 bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-border">
          <span className="text-xs text-muted-foreground">
            {t('ob.step')} {step + 1} {t('ob.of')} {STEPS.length}
          </span>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <ArrowLeft size={14} /> {t('ob.back')}
              </button>
            )}
            {!isLast && (
              <button
                onClick={dismiss}
                className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('ob.skip')}
              </button>
            )}
            <button
              onClick={() => (isLast ? dismiss() : setStep(s => s + 1))}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-indigo-600 hover:opacity-90 transition"
            >
              {isLast ? t('ob.done') : <>{t('ob.next')} <ArrowRight size={14} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
