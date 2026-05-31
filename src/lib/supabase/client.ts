import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Browser-side Supabase client
// - Uses the public anon key (safe to expose)
// - Subject to Row Level Security (RLS) policies
// - Use inside "use client" components
export function createBrowserClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
