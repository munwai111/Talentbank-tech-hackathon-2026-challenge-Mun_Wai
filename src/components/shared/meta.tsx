// Shared metadata vocabulary — icons + labels for job/application chrome.
// One source of truth so every surface speaks the same visual language.
import {
  Globe, Home, Building2, MapPin, Banknote,
  Send, SearchCheck, MicVocal, Trophy, XCircle, Undo2,
  type LucideIcon,
} from 'lucide-react'

export const WORK_MODE: Record<'remote' | 'hybrid' | 'onsite', { label: string; Icon: LucideIcon }> = {
  remote: { label: 'Remote',  Icon: Globe },
  hybrid: { label: 'Hybrid',  Icon: Home },
  onsite: { label: 'On-site', Icon: Building2 },
}

export const APP_STATUS: Record<string, { label: string; Icon: LucideIcon; classes: string }> = {
  applied:   { label: 'Applied',   Icon: Send,        classes: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' },
  reviewing: { label: 'Reviewing', Icon: SearchCheck, classes: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  interview: { label: 'Interview', Icon: MicVocal,    classes: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
  offer:     { label: 'Offer',     Icon: Trophy,      classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  rejected:  { label: 'Rejected',  Icon: XCircle,     classes: 'bg-red-500/15 text-red-400 border-red-500/30' },
  withdrawn: { label: 'Withdrawn', Icon: Undo2,       classes: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30' },
}

/** Inline meta item: muted icon + text, used in job-card meta rows */
export function MetaItem({ Icon, children }: { Icon: LucideIcon; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon size={13} strokeWidth={1.75} className="shrink-0 opacity-60" />
      {children}
    </span>
  )
}

/** Work-mode chip (remote / hybrid / on-site) */
export function WorkModeMeta({ mode }: { mode: 'remote' | 'hybrid' | 'onsite' }) {
  const { label, Icon } = WORK_MODE[mode]
  return <MetaItem Icon={Icon}>{label}</MetaItem>
}

/** Location meta */
export function LocationMeta({ children }: { children: React.ReactNode }) {
  return <MetaItem Icon={MapPin}>{children}</MetaItem>
}

/** Salary meta — MYR monthly range */
export function SalaryMeta({ min, max }: { min: number; max: number | null }) {
  return (
    <MetaItem Icon={Banknote}>
      RM {min.toLocaleString()}{max ? ` – ${max.toLocaleString()}` : '+'}/mo
    </MetaItem>
  )
}

// StatusChip lives in ./StatusChip (a client component) so its label can be
// translated. APP_STATUS above stays here as the shared icon/colour config.
