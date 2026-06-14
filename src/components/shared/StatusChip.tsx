'use client'

// Application-status chip — client component so the label can be translated
// via the language context. Icon + colour config is shared from meta.ts;
// only the label is localised.

import { APP_STATUS } from './meta'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { TranslationKey } from '@/lib/i18n/translations'

const STATUS_KEY: Record<string, TranslationKey> = {
  applied:   'status.applied',
  reviewing: 'status.reviewing',
  interview: 'status.interview',
  offer:     'status.offer',
  rejected:  'status.rejected',
  withdrawn: 'status.withdrawn',
}

export function StatusChip({ status }: { status: string }) {
  const { t } = useLanguage()
  const cfg = APP_STATUS[status] ?? APP_STATUS.applied
  const { Icon } = cfg
  const label = STATUS_KEY[status] ? t(STATUS_KEY[status]) : cfg.label
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full border ${cfg.classes}`}>
      <Icon size={11} strokeWidth={2} />
      {label}
    </span>
  )
}
