export async function youtubeTrending(category: string): Promise<YoutubeResult[]> {
  const key = process.env.YOUTUBE_API_KEY
  if (!key) return []
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&maxResults=10&key=${key}`
  const res = await fetch(url, { next: { revalidate: 21600 } })
  if (!res.ok) return []
  const data = await res.json()
  return (data.items ?? []).map((v: any) => ({
    title: v.snippet.title,
    summary: v.snippet.description?.slice(0, 200),
    source_url: `https://www.youtube.com/watch?v=${v.id}`,
    source: 'youtube',
    thumbnail: v.snippet.thumbnails?.medium?.url ?? null,
    score: Math.min(100, Math.floor((parseInt(v.statistics?.viewCount ?? '0') / 1000000) * 10)),
  }))
}

export interface YoutubeResult {
  title: string
  summary: string
  source_url: string
  source: string
  thumbnail: string | null
  score: number
}
