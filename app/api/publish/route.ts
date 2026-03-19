import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { publishViaPostiz } from '@/lib/api/postiz'
import { postInstagramReel, postFacebookVideo } from '@/lib/api/meta'

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
  const results: Record<string, any> = {}

  // Post via Postiz (handles Twitter, TikTok, LinkedIn, etc.)
  const postizPlatforms = platforms.filter(p => !['instagram', 'facebook'].includes(p))
  if (postizPlatforms.length > 0 && process.env.POSTIZ_API_KEY) {
    try {
      results.postiz = await publishViaPostiz({
        content: caption,
        platforms: postizPlatforms,
        mediaUrls: videoUrl ? [videoUrl] : [],
        scheduledAt: item.scheduled_at,
      })
    } catch (e: any) {
      results.postiz_error = e.message
    }
  }

  // Post to Instagram via Meta Graph API
  if (platforms.includes('instagram') && process.env.META_ACCESS_TOKEN && videoUrl) {
    try {
      results.instagram = await postInstagramReel(videoUrl, caption)
    } catch (e: any) {
      results.instagram_error = e.message
    }
  }

  // Post to Facebook via Meta Graph API
  if (platforms.includes('facebook') && process.env.META_ACCESS_TOKEN && videoUrl) {
    try {
      results.facebook = await postFacebookVideo(videoUrl, caption)
    } catch (e: any) {
      results.facebook_error = e.message
    }
  }

  // Mark as published
  await supabase
    .from('publish_queue')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', publishQueueId)

  return NextResponse.json({ success: true, results })
}
