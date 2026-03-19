import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ayrsharePost, AyrsharePlatform } from '@/lib/api/ayrshare'
import { bufferSchedulePost, bufferGetProfiles } from '@/lib/api/buffer'
import { triggerMakeScenario } from '@/lib/api/make'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { publishQueueId } = await req.json()
  if (!publishQueueId) return NextResponse.json({ error: 'publishQueueId is required' }, { status: 400 })

  const { data: item } = await supabase
    .from('publish_queue')
    .select('*')
    .eq('id', publishQueueId)
    .eq('user_id', user.id)
    .single()

  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

  const platforms: string[] = item.platforms ?? []
  const videoUrl: string = item.video_url ?? ''
  const caption: string = item.caption ?? ''
  const scheduledAt: string | undefined = item.scheduled_at ?? undefined
  const results: Record<string, any> = {}

  // 1. Ayrshare — posts to Instagram, Facebook, TikTok, Twitter, YouTube in one call
  if (process.env.AYRSHARE_API_KEY && platforms.length > 0) {
    try {
      results.ayrshare = await ayrsharePost({
        post: caption,
        platforms: platforms as AyrsharePlatform[],
        mediaUrls: videoUrl ? [videoUrl] : [],
        scheduleDate: scheduledAt,
      })
    } catch (e: any) {
      results.ayrshare_error = e.message
    }
  }

  // 2. Buffer — fallback scheduler for Instagram/Facebook/Twitter
  if (process.env.BUFFER_ACCESS_TOKEN && !process.env.AYRSHARE_API_KEY) {
    try {
      const profiles = await bufferGetProfiles()
      const profileIds = profiles.map((p: any) => p.id)
      if (profileIds.length > 0) {
        results.buffer = await bufferSchedulePost({
          profileIds,
          text: caption,
          mediaLink: videoUrl || undefined,
          scheduledAt: scheduledAt ? String(new Date(scheduledAt).getTime() / 1000) : undefined,
        })
      }
    } catch (e: any) {
      results.buffer_error = e.message
    }
  }

  // 3. Make.com — trigger automation scenario (runs in parallel with above)
  if (process.env.MAKE_WEBHOOK_URL) {
    try {
      results.make = await triggerMakeScenario({
        action: 'publish',
        videoUrl,
        caption,
        platforms,
        scheduledAt,
        metadata: { publishQueueId, userId: user.id },
      })
    } catch (e: any) {
      results.make_error = e.message
    }
  }

  // Mark as published
  await supabase
    .from('publish_queue')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', publishQueueId)

  return NextResponse.json({ success: true, results })
}
