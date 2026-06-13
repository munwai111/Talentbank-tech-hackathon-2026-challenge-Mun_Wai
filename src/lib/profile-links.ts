// Lightweight, NON-BLOCKING validation for linked-account / social URLs.
// Returns a human hint when an entered link looks wrong for its platform — e.g.
// a LinkedIn feed/settings page instead of a public /in/ profile, or a TikTok
// URL pasted into the Instagram field. The value is still saved either way;
// this only nudges the user so viewers get a working, public profile link.

import { toExternalHref } from './url'

export type ProfileLinkPlatform =
  | 'github' | 'linkedin' | 'website' | 'seek' | 'indeed'
  | 'instagram' | 'tiktok' | 'facebook'

type Rule = {
  label: string
  hosts: string[]        // accepted hostnames (www-insensitive, suffix match). [] = any host.
  example: string        // a good public-profile example
  badPath?: RegExp       // path that signals a non-public feed / settings / inbox page
  requirePath?: boolean  // true → a bare domain with no handle is flagged
}

const RULES: Record<ProfileLinkPlatform, Rule> = {
  github:    { label: 'GitHub',    hosts: ['github.com'],    example: 'github.com/username', requirePath: true },
  linkedin:  { label: 'LinkedIn',  hosts: ['linkedin.com'],  example: 'linkedin.com/in/username', requirePath: true,
               badPath: /^\/(feed|mynetwork|messaging|notifications|jobs|home)\b/i },
  website:   { label: 'website',   hosts: [],                example: 'yourname.dev' },
  seek:      { label: 'Seek',      hosts: ['seek.com', 'seek.com.au', 'seek.co.nz'], example: 'seek.com.au/profile/…' },
  indeed:    { label: 'Indeed',    hosts: ['indeed.com'],    example: 'indeed.com/r/…' },
  instagram: { label: 'Instagram', hosts: ['instagram.com'], example: 'instagram.com/username', requirePath: true,
               badPath: /^\/(accounts|direct|explore|reels\/?$)/i },
  tiktok:    { label: 'TikTok',    hosts: ['tiktok.com'],    example: 'tiktok.com/@username', requirePath: true,
               badPath: /^\/(foryou|following|messages|setting)\b/i },
  facebook:  { label: 'Facebook',  hosts: ['facebook.com', 'fb.com'], example: 'facebook.com/username', requirePath: true,
               badPath: /^\/(home\.php|messages|settings|notifications|friends)\b/i },
}

function hostMatches(host: string, accepted: string[]): boolean {
  if (accepted.length === 0) return true
  return accepted.some(h => host === h || host.endsWith('.' + h))
}

// Returns a warning string, or null when the link looks fine (or is empty).
export function checkProfileLink(value: string, platform: ProfileLinkPlatform): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const rule = RULES[platform]
  const href = toExternalHref(trimmed)
  let url: URL
  try {
    url = new URL(href ?? '')
  } catch {
    return `Enter a full link, e.g. ${rule.example}`
  }

  const host = url.hostname.replace(/^www\./i, '').toLowerCase()

  if (!hostMatches(host, rule.hosts)) {
    const article = /^[aeiou]/i.test(rule.label) ? 'an' : 'a'
    return `That doesn't look like ${article} ${rule.label} link — expected ${rule.example}`
  }
  if (rule.badPath?.test(url.pathname)) {
    return `Use your public profile link (${rule.example}), not a feed or settings page`
  }
  if (rule.requirePath && url.pathname.replace(/\/+$/, '') === '') {
    return `Add your profile handle, e.g. ${rule.example}`
  }
  return null
}
