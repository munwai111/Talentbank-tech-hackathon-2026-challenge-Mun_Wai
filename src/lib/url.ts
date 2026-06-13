// Normalizes a user-entered URL for use as an external href.
//
// Users routinely type "linkedin.com/in/me" or "instagram.com/me" without a
// scheme. Rendered straight into <a href>, the browser treats a scheme-less
// value as a RELATIVE path on the current site — so the link silently points
// back at our own app instead of the candidate's profile. Prepending https://
// fixes that. Returns null for empty input so callers can skip rendering.

export function toExternalHref(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  // Already has a scheme (http://, https://, mailto:, tel:, etc.) — leave it.
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed
  // Protocol-relative //example.com → assume https.
  if (trimmed.startsWith('//')) return `https:${trimmed}`
  return `https://${trimmed}`
}
