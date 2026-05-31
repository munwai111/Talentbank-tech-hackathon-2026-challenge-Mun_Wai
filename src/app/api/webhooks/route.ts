// Clerk Webhook Handler
// ─────────────────────────────────────────────────────────────
// Clerk calls this endpoint whenever a user is created or updated.
// We use it to sync Clerk users into our own `users` table in Supabase.
//
// Setup in Clerk Dashboard:
//   Webhooks → Add Endpoint → https://your-domain.com/api/webhooks
//   Events to subscribe: user.created, user.updated
//   Copy the Signing Secret → add as CLERK_WEBHOOK_SECRET in .env.local

import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Tell Next.js this route reads the raw body (needed for signature verification)
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    console.error('Missing CLERK_WEBHOOK_SECRET')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  // Read Svix signature headers (Clerk uses Svix to sign webhooks)
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  // Verify the webhook is genuinely from Clerk (not a spoofed request)
  const payload = await req.json()
  const body = JSON.stringify(payload)
  const wh = new Webhook(WEBHOOK_SECRET)
  let event: WebhookEvent

  try {
    event = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServerClient()

  // Handle user.created — add to our users table
  if (event.type === 'user.created') {
    const { id: clerk_id, email_addresses } = event.data
    const email = email_addresses[0]?.email_address ?? ''

    // Default role: 'candidate'. User can change it during onboarding.
    // If they signed up via /?role=employer, we'd pass that via Clerk metadata.
    const role = (event.data.public_metadata?.role as string) ?? 'candidate'

    const { error } = await supabase.from('users').insert({
      clerk_id,
      email,
      role: role as 'candidate' | 'employer',
    })

    if (error) {
      console.error('Failed to create user:', error)
      return NextResponse.json({ error: 'DB insert failed' }, { status: 500 })
    }

    console.log(`✅ New user created: ${email} (${role})`)
  }

  // Handle user.updated — sync email changes
  if (event.type === 'user.updated') {
    const { id: clerk_id, email_addresses } = event.data
    const email = email_addresses[0]?.email_address ?? ''

    await supabase.from('users').update({ email }).eq('clerk_id', clerk_id)
  }

  return NextResponse.json({ received: true })
}
