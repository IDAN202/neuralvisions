import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { elevenLabsTTS } from '@/lib/api/elevenlabs'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sceneId, projectId } = await request.json()

  // Single scene mode
  if (sceneId) {
    const { data: scene } = await supabase.from('scenes').select('*').eq('id', sceneId).single()
    if (!scene?.narration_text) return NextResponse.json({ error: 'Scene not found' }, { status: 404 })
    return await processScene(supabase, scene, user.id)
  }

  // Batch mode — process all scenes for a project sequentially to respect rate limits
  if (projectId) {
    const { data: scenes } = await supabase
      .from('scenes')
      .select('*')
      .eq('project_id', projectId)
      .is('voiceover_url', null)
      .order('scene_number')

    if (!scenes?.length) return NextResponse.json({ message: 'All scenes already have voiceovers' })

    let processed = 0
    for (const scene of scenes) {
      try {
        await processScene(supabase, scene, user.id)
        processed++
      } catch {}
    }
    return NextResponse.json({ processed })
  }

  return NextResponse.json({ error: 'sceneId or projectId required' }, { status: 400 })
}

async function processScene(supabase: any, scene: any, userId: string) {
  const audio = await elevenLabsTTS(scene.narration_text)
  const buffer = Buffer.from(audio)
  const path = `${userId}/${scene.project_id}/${scene.id}.mp3`

  const { error: uploadError } = await supabase.storage
    .from('voiceovers')
    .upload(path, buffer, { contentType: 'audio/mpeg', upsert: true })

  if (uploadError) throw new Error(uploadError.message)

  const { data: { publicUrl } } = supabase.storage.from('voiceovers').getPublicUrl(path)
  await supabase.from('scenes').update({ voiceover_url: publicUrl }).eq('id', scene.id)

  return NextResponse.json({ voiceover_url: publicUrl })
}
