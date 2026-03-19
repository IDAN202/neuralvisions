import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { pexelsSearchVideos } from '@/lib/api/pexels'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await request.json()
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const { data: scenes } = await supabase
    .from('scenes')
    .select('id, broll_suggestion')
    .eq('project_id', projectId)
    .order('scene_number')

  if (!scenes?.length) return NextResponse.json({ error: 'No scenes found' }, { status: 404 })

  const results = await Promise.allSettled(
    scenes.map(async (scene) => {
      const video = await pexelsSearchVideos(scene.broll_suggestion ?? 'nature landscape')
      if (video) {
        await supabase.from('scenes').update({
          broll_url: video.url,
          broll_pexels_id: video.id,
        }).eq('id', scene.id)
      }
      return { id: scene.id, broll_url: video?.url }
    })
  )

  return NextResponse.json({ updated: results.filter(r => r.status === 'fulfilled').length })
}
