export async function pexelsSearchVideos(query: string): Promise<PexelsVideo | null> {
  const key = process.env.PEXELS_API_KEY
  if (!key) return null
  const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`
  const res = await fetch(url, { headers: { Authorization: key } })
  if (!res.ok) return null
  const data = await res.json()
  const video = data.videos?.[0]
  if (!video) return null
  const file = video.video_files?.find((f: any) => f.quality === 'hd') ?? video.video_files?.[0]
  return {
    id: String(video.id),
    url: file?.link ?? null,
    thumbnail: video.image ?? null,
  }
}

export interface PexelsVideo {
  id: string
  url: string | null
  thumbnail: string | null
}
