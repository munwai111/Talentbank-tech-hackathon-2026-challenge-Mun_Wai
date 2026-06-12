// Repairs JSON that was truncated mid-stream (e.g. an AI response that hit its
// max_tokens cap). Walks the text with string/escape awareness, then closes any
// open strings, strips a dangling comma, and appends the missing brackets.
// Returns the input unchanged when it is already balanced.

export function repairTruncatedJson(raw: string): string {
  const start = raw.indexOf('{')
  if (start === -1) return raw
  let text = raw.slice(start)

  const stack: ('}' | ']')[] = []
  let inString = false
  let escaped = false

  for (const ch of text) {
    if (escaped) { escaped = false; continue }
    if (ch === '\\') { escaped = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === '{') stack.push('}')
    else if (ch === '[') stack.push(']')
    else if (ch === '}' || ch === ']') stack.pop()
  }

  if (stack.length === 0 && !inString) return text

  if (inString) text += '"'
  text = text.replace(/,\s*$/, '')
  // a dangling key like `"name":` cannot be completed — drop it
  text = text.replace(/,?\s*"[^"]*"\s*:\s*$/, '')
  while (stack.length) text += stack.pop()
  return text
}
