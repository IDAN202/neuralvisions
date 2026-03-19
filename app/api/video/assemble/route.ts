import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildExplainerTimeline } from '@/lib/utils/shotstack-builder'
import { submitRender } from '@/lib/api/shotstack'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId, mode } = await request.json()
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const { data: scenes, error: scenesError } = await supabase
    .from('scenes')
    .select('*')
    .eq('project_id', projectId)
    .order('scene_number')

  if (scenesError || !scenes?.length) {
    return NextResponse.json({ error: 'No scenes found for project' }, { status: 404 })
  }

  const timeline = mode === 'explainer'
    ? buildExplainerTimeline(scenes)
    : buildExplainerTimeline(scenes) // extend for 'clips' mode in future phases

  const jobId = await submitRender(timeline)

  const { error: updateError } = await supabase
    .from('projects')
    .update({ render_job_id: jobId, render_status: 'queued', status: 'rendering' })
    .eq('id', projectId)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ jobId })
}
