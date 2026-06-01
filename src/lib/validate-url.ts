// SSRF guard — rejects non-public URLs before any outbound fetch.
// Used by extractTextFromUrl and the import route as defence-in-depth.

const PRIVATE_IPv4: RegExp[] = [
  /^127\./,                        // 127.0.0.0/8  loopback
  /^10\./,                         // 10.0.0.0/8   RFC 1918
  /^172\.(1[6-9]|2\d|3[01])\./,   // 172.16–31/12 RFC 1918
  /^192\.168\./,                   // 192.168.0.0/16 RFC 1918
  /^169\.254\./,                   // 169.254.0.0/16 link-local (AWS metadata etc.)
]

export type UrlValidation = { valid: true } | { valid: false; reason: string }

export function validateUrl(url: string): UrlValidation {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return { valid: false, reason: 'invalid_url' }
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, reason: 'ssrf_blocked' }
  }

  // URL API wraps IPv6 hosts in brackets: [::1] — strip them before matching.
  const hostname = parsed.hostname.toLowerCase()
  const host = hostname.startsWith('[') ? hostname.slice(1, -1) : hostname

  if (host === 'localhost' || host === '0.0.0.0' || host === '::') {
    return { valid: false, reason: 'ssrf_blocked' }
  }

  // IPv6 loopback (::1), ULA/private fc00::/7 (fc*/fd*), link-local fe80::/10 (fe8*–feb*)
  if (host === '::1' || /^f[cd]/i.test(host) || /^fe[89ab]/i.test(host)) {
    return { valid: false, reason: 'ssrf_blocked' }
  }

  if (PRIVATE_IPv4.some(re => re.test(host))) {
    return { valid: false, reason: 'ssrf_blocked' }
  }

  return { valid: true }
}
