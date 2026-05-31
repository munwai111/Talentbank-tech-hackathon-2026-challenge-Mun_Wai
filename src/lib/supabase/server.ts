import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Server-side Supabase client
// - Uses the service role key (NEVER expose to browser)
// - Bypasses Row Level Security — full DB access
// - Use in: API routes, Server Components, Server Actions, webhooks
export function createServerClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
