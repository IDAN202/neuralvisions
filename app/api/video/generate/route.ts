// AI Video Generation route — supports Veo2, Kling, Luma, Runway, Seedance
// POST /api/video/generate
// Body: { provider, prompt, imageUrl?, duration?, aspectRatio?, projectId?, sceneNumber? }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { veoGenerateVideo } from '@/lib/api/veo'
import { klingGenerateVideo } from '@/lib/api/kling'
import { lumaGenerateVideo } from '@/lib/api/luma'
import { runwayGenerateVideo } from '@/lib/api/runway'
import { seedanceGenerateVideo } from '@/lib/api/seedance'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { provider = 'kling', prompt, imageUrl, duration, aspectRatio, projectId, sceneNumber } = await req.json()
  if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 })

  try {
    let result: any

    switch (provider) {
      case 'veo':
        result = await veoGenerateVideo({ prompt, imageUrl, duration, aspectRatio })
        break
      case 'luma':
        result = await lumaGenerateVideo({ prompt, imageUrl, aspectRatio })
        break
      case 'runway':
        result = await runwayGenerateVideo({ promptText: prompt, promptImage: imageUrl, duration })
        break
      case 'seedance':
        result = await seedanceGenerateVideo({ prompt, imageUrl, duration: duration ? String(duration) as '5'|'10' : '5', aspectRatio })
        break
      case 'kling':
      default:
        result = await klingGenerateVideo({ prompt, imageUrl, duration: duration ? String(duration) as '5'|'10' : '5', aspectRatio })
        break
    }

    // If tied to a scene, update broll_url when video URL is available
    if (projectId && sceneNumber && result?.video?.url) {
      await supabase
        .from('scenes')
        .update({ broll_url: result.video.url })
        .eq('project_id', projectId)
        .eq('scene_number', sceneNumber)
    }

    return NextResponse.json({ result, provider })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
