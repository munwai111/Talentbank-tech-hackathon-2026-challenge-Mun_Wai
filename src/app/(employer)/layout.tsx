// Employer shell layout — the Scout journey (teal identity)
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Settings2 } from 'lucide-react'
import { EmployerNav } from './EmployerNav'
import { YouLogo } from '@/components/brand/YouLogo'

export default async function EmployerLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  const supabase = createServerClient()
  const { data: dbUser } = await supabase
    .from('users').select('role').eq('clerk_id', user.id).single()

  if (!dbUser) redirect('/onboarding')
  if (dbUser.role !== 'employer') redirect('/dashboard')

  return (
    <div className="flex min-h-screen bg-background" data-journey="employer">
      <aside className="w-56 shrink-0 bg-sidebar border-r border-border flex flex-col relative overflow-hidden">
        {/* Scout glow — teal, dark mode only */}
        <div className="absolute -top-20 -left-10 w-48 h-48 rounded-full pointer-events-none
          opacity-0 dark:opacity-100 transition-opacity duration-500"
          style={{ background: 'radial-gradient(circle, rgba(45,212,191,0.10), transparent 70%)' }} aria-hidden />

        {/* Logo */}
        <div className="relative px-5 py-5 border-b border-border">
          <Link href="/employer/dashboard" className="flex items-center gap-3 group text-foreground" aria-label="Y.O.U Scout home">
            <YouLogo variant="adaptive" height={24} />
            <span className="text-[10px] text-violet-400/80 tracking-widest uppercase border-l border-border pl-3">Scout</span>
          </Link>
        </div>

        <EmployerNav />

        <nav className="relative px-2.5 pb-2 border-t border-border pt-2">
          <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground
            hover:bg-accent/60 hover:text-foreground transition duration-200 group">
            <Settings2 size={15} className="shrink-0 transition-colors" strokeWidth={1.75} />
            <span className="text-[13px]">Settings</span>
          </Link>
        </nav>

        <div className="relative px-4 py-4 border-t border-border flex items-center gap-3">
          <UserButton />
          <div className="min-w-0">
            <p className="text-xs font-medium truncate text-foreground">
              {user.firstName ?? user.emailAddresses[0]?.emailAddress}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Employer</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-background text-foreground">
        {children}
      </main>
    </div>
  )
}
