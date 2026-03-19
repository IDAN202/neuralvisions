import { NextRequest, NextResponse } from 'next/server'
import { braveSearch } from '@/lib/api/brave'
import { youtubeTrending } from '@/lib/api/youtube'
import { newsTopHeadlines } from '@/lib/api/newsapi'

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get('category') ?? 'ai'

  const queries: Record<string, string> = {
    football: 'football soccer trending news',
    ai: 'artificial intelligence trending 2025',
    news: 'breaking news trending today',
    gadgets: 'new gadgets tech trending',
  }
  const query = queries[category] ?? queries['ai']

  const [brave, youtube, news] = await Promise.allSettled([
    braveSearch(query),
    youtubeTrending(category),
    newsTopHeadlines(category),
  ])

  const results = [
    ...(brave.status === 'fulfilled' ? brave.value : []),
    ...(youtube.status === 'fulfilled' ? youtube.value : []),
    ...(news.status === 'fulfilled' ? news.value : []),
  ]

  // Deduplicate by URL
  const seen = new Set<string>()
  const unique = results.filter(r => {
    if (seen.has(r.source_url)) return false
    seen.add(r.source_url)
    return true
  })

  return NextResponse.json({ results: unique.slice(0, 20), category })
}
