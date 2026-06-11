// Employer shell layout
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Zap, ClipboardList, PlusCircle, Users, Workflow, Building2, Settings2 } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/employer/dashboard',  label: 'Dashboard',       Icon: Zap },
  { href: '/employer/jobs',       label: 'My Jobs',         Icon: ClipboardList },
  { href: '/employer/jobs/new',   label: 'Post a Job',      Icon: PlusCircle },
  { href: '/employer/candidates', label: 'Talent Pool',     Icon: Users },
  { href: '/employer/culture',    label: 'Culture Profile', Icon: Workflow },
  { href: '/employer/company',    label: 'Company Profile', Icon: Building2 },
]

export default async function EmployerLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  const supabase = createServerClient()
  const { data: dbUser } = await supabase
    .from('users').select('role').eq('clerk_id', user.id).single()

  if (!dbUser) redirect('/onboarding')
  if (dbUser.role !== 'employer') redirect('/dashboard')

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-56 shrink-0 bg-sidebar border-r border-border flex flex-col relative overflow-hidden">
        {/* Aurora glow — dark mode only */}
        <div className="absolute -top-20 -left-10 w-48 h-48 rounded-full pointer-events-none
          opacity-0 dark:opacity-100 transition-opacity duration-500"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12), transparent 70%)' }} aria-hidden />

        {/* Logo */}
        <div className="relative px-5 py-5 border-b border-border">
          <Link href="/employer/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600
              flex items-center justify-center text-xs font-bold shadow-lg shadow-violet-500/25
              group-hover:shadow-violet-500/45 transition text-white">
              C
            </div>
            <div>
              <p className="font-bold text-sm tracking-tight text-foreground leading-none">Career OS</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 tracking-wide">Employer portal</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="relative flex-1 px-2.5 py-3 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground
                hover:bg-accent/60 hover:text-foreground transition duration-200 group"
            >
              <Icon size={15} className="shrink-0 transition-colors" strokeWidth={1.75} />
              <span className="text-[13px] font-medium">{label}</span>
            </Link>
          ))}
        </nav>

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
