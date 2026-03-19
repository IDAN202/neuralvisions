import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRenderStatus } from '@/lib/api/shotstack'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('jobId')
  const projectId = searchParams.get('projectId')

  if (!jobId || !projectId) {
    return NextResponse.json({ error: 'jobId and projectId required' }, { status: 400 })
  }

  const { status, url } = await getRenderStatus(jobId)

  if (status === 'done' && url) {
    await supabase
      .from('projects')
      .update({ render_url: url, render_status: 'done', status: 'done' })
      .eq('id', projectId)
  }

  return NextResponse.json({ status, ...(url ? { url } : {}) })
}
