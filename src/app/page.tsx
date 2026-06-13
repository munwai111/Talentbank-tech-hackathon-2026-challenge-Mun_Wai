import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/landing/LandingPage";

export default async function Home() {
  const { userId } = await auth()
  if (userId) redirect('/dashboard')

  const supabase = createServerClient()
  const { count: openRoles } = await supabase
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'open')

  return <LandingPage openRoles={openRoles ?? 0} />
}
