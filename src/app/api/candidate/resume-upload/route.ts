import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const ext = file.name.split('.').pop() ?? 'pdf'
  const path = `${userId}/${Date.now()}.${ext}`

  const bytes = await file.arrayBuffer()
  const { error } = await supabase.storage.from('resumes').upload(path, bytes, {
    contentType: file.type || 'application/octet-stream',
    upsert: true,
  })

  if (error) {
    console.error('[resume-upload] storage error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: publicUrl } = supabase.storage.from('resumes').getPublicUrl(path)
  return NextResponse.json({ url: publicUrl.publicUrl })
}
