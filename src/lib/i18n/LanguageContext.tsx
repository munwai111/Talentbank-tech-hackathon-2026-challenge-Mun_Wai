'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { translations, type Locale, type TranslationKey } from './translations'

type LanguageContextType = {
  language: Locale
  setLanguage: (lang: Locale) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | null>(null)

const STORAGE_KEY = 'career-os-lang'

function isValidLocale(v: unknown): v is Locale {
  return typeof v === 'string' && v in translations
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Locale>('en')

  useEffect(() => {
    // Instant hydration from localStorage
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isValidLocale(stored)) setLanguageState(stored)

    // Sync from API (authoritative — may override localStorage)
    fetch('/api/candidate/preferences')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        const lang = data?.preferences?.language
        if (isValidLocale(lang)) {
          setLanguageState(lang)
          localStorage.setItem(STORAGE_KEY, lang)
        }
      })
      .catch(() => {})
  }, [])

  const setLanguage = useCallback((lang: Locale) => {
    setLanguageState(lang)
    localStorage.setItem(STORAGE_KEY, lang)
    fetch('/api/candidate/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: lang }),
    }).catch(() => {})
  }, [])

  const t = useCallback(
    (key: TranslationKey) => translations[language]?.[key] ?? translations.en[key] ?? key,
    [language],
  )

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
