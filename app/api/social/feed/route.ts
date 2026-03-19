// Social media content reading route
// GET /api/social/feed?platform=twitter|instagram|tiktok|facebook&query=...

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { twitterSearch, twitterTrending } from '@/lib/api/social-reader'
import { instagramGetHashtagPosts } from '@/lib/api/social-reader'
import { tiktokTrending, tiktokSearch } from '@/lib/api/social-reader'
import { facebookGetPagePosts } from '@/lib/api/social-reader'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const platform = req.nextUrl.searchParams.get('platform') ?? 'twitter'
  const query = req.nextUrl.searchParams.get('query') ?? ''
  const pageId = req.nextUrl.searchParams.get('pageId') ?? ''

  try {
    let data: any

    switch (platform) {
      case 'twitter':
        data = query ? await twitterSearch(query) : await twitterTrending()
        break
      case 'instagram':
        data = await instagramGetHashtagPosts(query || 'trending')
        break
      case 'tiktok':
        data = query ? await tiktokSearch(query) : await tiktokTrending()
        break
      case 'facebook':
        if (!pageId) return NextResponse.json({ error: 'pageId required for facebook' }, { status: 400 })
        data = await facebookGetPagePosts(pageId)
        break
      default:
        return NextResponse.json({ error: 'Unknown platform' }, { status: 400 })
    }

    return NextResponse.json({ platform, data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
